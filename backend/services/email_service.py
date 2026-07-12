from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv
import os

load_dotenv()

MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM")
MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")

# Only configure mail if all required env vars are present
# This prevents the app from crashing on startup when mail is not configured
if MAIL_USERNAME and MAIL_PASSWORD and MAIL_FROM:
    conf = ConnectionConfig(
        MAIL_USERNAME=MAIL_USERNAME,
        MAIL_PASSWORD=MAIL_PASSWORD,
        MAIL_FROM=MAIL_FROM,
        MAIL_PORT=MAIL_PORT,
        MAIL_SERVER=MAIL_SERVER,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
    )
else:
    conf = None


async def send_deadline_reminder(
    recipient_email: str,
    recipient_name: str,
    deadline_title: str,
    days_left: int,
    due_date: str
):
    # Silently skip if mail is not configured
    if conf is None:
        print(f"[EMAIL SKIPPED] Mail not configured. Would have sent to {recipient_email}: {deadline_title}")
        return

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #7B1D1D; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">FYPMS — Deadline Reminder</h1>
            <p style="color: #F3D9D9; margin: 4px 0 0; font-size: 13px;">IoBM · CS Department</p>
        </div>
        <div style="background: #F9F0F0; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #F3D9D9;">
            <p style="font-size: 15px; color: #1A1A2E;">Dear <strong>{recipient_name}</strong>,</p>
            <p style="font-size: 14px; color: #475569;">
                This is a reminder that the following deadline is approaching:
            </p>
            <div style="background: white; border-left: 4px solid #7B1D1D; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p style="font-size: 16px; font-weight: bold; color: #1A1A2E; margin: 0 0 6px;">{deadline_title}</p>
                <p style="font-size: 14px; color: #475569; margin: 0 0 4px;">Due: <strong>{due_date}</strong></p>
                <p style="font-size: 14px; color: #7B1D1D; font-weight: bold; margin: 0;">
                    ⏰ {days_left} day{"s" if days_left != 1 else ""} remaining
                </p>
            </div>
            <p style="font-size: 13px; color: #64748B;">
                Please log in to FYPMS to submit your work before the deadline.
            </p>
            <p style="font-size: 12px; color: #94A3B8; margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 12px;">
                This is an automated message from the Final Year Project Management System.<br>
                Institute of Business Management · CS Department · Session 2025-2026
            </p>
        </div>
    </div>
    """

    message = MessageSchema(
        subject=f"⏰ FYPMS Reminder: {deadline_title} — {days_left} day{'s' if days_left != 1 else ''} left",
        recipients=[recipient_email],
        body=html_body,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)