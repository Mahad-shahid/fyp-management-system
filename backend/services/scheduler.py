from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Deadline, GroupMember, User
from services.email_service import send_deadline_reminder
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

async def check_and_send_reminders():
    """
    Runs daily. Finds all deadlines that are exactly 3 days away
    and sends email reminders to all active students.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        deadlines = db.query(Deadline).all()

        for deadline in deadlines:
            due = deadline.due_date
            if due.tzinfo is None:
                from datetime import timezone as tz
                due = due.replace(tzinfo=tz.utc)

            days_left = (due - now).days

            # Send reminder at exactly 3 days before
            if days_left == 3:
                logger.info(f"Sending reminders for deadline: {deadline.title}")

                # Get all active students
                students = db.query(User).filter(
                    User.role == "student",
                    User.is_active == True
                ).all()

                due_str = due.strftime("%A, %d %B %Y at %I:%M %p")

                for student in students:
                    try:
                        await send_deadline_reminder(
                            recipient_email=student.email,
                            recipient_name=student.full_name,
                            deadline_title=deadline.title,
                            days_left=days_left,
                            due_date=due_str
                        )
                        logger.info(f"Email sent to {student.email}")
                    except Exception as e:
                        logger.error(f"Failed to send email to {student.email}: {e}")

    except Exception as e:
        logger.error(f"Scheduler error: {e}")
    finally:
        db.close()


def create_scheduler():
    scheduler = AsyncIOScheduler()
    # Runs every day at 8:00 AM
    scheduler.add_job(
        check_and_send_reminders,
        CronTrigger(hour=8, minute=0),
        id="deadline_reminder",
        name="Daily deadline reminder check",
        replace_existing=True,
    )
    return scheduler