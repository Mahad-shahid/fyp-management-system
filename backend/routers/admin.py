from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, Group, Proposal, Evaluation, Deadline
from schemas.user import UserOut, UserUpdate
from schemas.deadline import DeadlineCreate, DeadlineOut
from utils.auth import require_role
from typing import List

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users", response_model=List[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return db.query(User).all()

@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.full_name: user.full_name = data.full_name
    if data.research_interests: user.research_interests = data.research_interests

    # Handle deactivation cascades
    if data.is_active is not None:
        was_active = user.is_active
        user.is_active = data.is_active

        # If deactivating a student who is a member of a group
        if not data.is_active and user.role == "student" and was_active:
            from models import GroupMember
            membership = db.query(GroupMember).filter(
                GroupMember.student_id == user_id
            ).first()
            if membership:
                db.delete(membership)

        # If deactivating an advisor who is supervising groups
        if not data.is_active and user.role == "advisor" and was_active:
            supervised_groups = db.query(Group).filter(
                Group.advisor_id == user_id
            ).all()
            for group in supervised_groups:
                group.advisor_id = None
                group.status = "forming"
                # Clear any pending requests to this advisor for this group
                from models import SupervisorRequest
                pending_reqs = db.query(SupervisorRequest).filter(
                    SupervisorRequest.group_id == group.id,
                    SupervisorRequest.advisor_id == user_id
                ).all()
                for req in pending_reqs:
                    db.delete(req)

    db.commit()
    db.refresh(user)
    return user

@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    total_groups = db.query(Group).count()
    total_proposals = db.query(Proposal).count()
    approved = db.query(Proposal).filter(Proposal.status == "approved").count()
    flagged = db.query(Proposal).filter(Proposal.status == "flagged").count()
    pending = db.query(Proposal).filter(Proposal.status == "pending").count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_advisors = db.query(User).filter(User.role == "advisor").count()

    return {
        "total_groups": total_groups,
        "total_proposals": total_proposals,
        "proposals_approved": approved,
        "proposals_flagged": flagged,
        "proposals_pending": pending,
        "total_students": total_students,
        "total_advisors": total_advisors
    }

@router.post("/deadlines", response_model=DeadlineOut)
def create_deadline( 
    data: DeadlineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    deadline = Deadline(
        title=data.title,
        due_date=data.due_date,
        description=data.description,
        doc_type=data.doc_type,
        created_by=current_user.id
    )
    db.add(deadline)
    db.commit()
    db.refresh(deadline)
    return deadline

@router.get("/deadlines", response_model=List[DeadlineOut])
def get_deadlines(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "student", "advisor"))
):
    return db.query(Deadline).order_by(Deadline.due_date).all()

@router.get("/ungrouped-students")
def get_ungrouped_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    from models import GroupMember
    # Get all student IDs that already have a group
    grouped_ids = db.query(GroupMember.student_id).distinct().all()
    grouped_ids = [g[0] for g in grouped_ids]

    # Return only students NOT in that list
    ungrouped = db.query(User).filter(
        User.role == "student",
        User.is_active == True,
        ~User.id.in_(grouped_ids)
    ).all()
    return ungrouped

@router.patch("/deadlines/{deadline_id}", response_model=DeadlineOut)
def update_deadline(
    deadline_id: int,
    data: DeadlineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
    if not deadline:
        raise HTTPException(status_code=404, detail="Deadline not found")

    deadline.title = data.title
    deadline.due_date = data.due_date
    deadline.description = data.description
    deadline.doc_type = data.doc_type
    db.commit()
    db.refresh(deadline)
    return deadline

@router.delete("/deadlines/{deadline_id}")
def delete_deadline(
    deadline_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
    if not deadline:
        raise HTTPException(status_code=404, detail="Deadline not found")
    db.delete(deadline)
    db.commit()
    return {"message": "Deadline deleted"}

@router.post("/trigger-reminders")
async def trigger_reminders(
    current_user: User = Depends(require_role("admin"))
):
    """Manually trigger deadline reminder emails — for testing only."""
    from services.scheduler import check_and_send_reminders
    await check_and_send_reminders()
    return {"message": "Reminder check completed"}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    from models import GroupMember, SupervisorRequest

    # If student, remove group membership
    if user.role == "student":
        db.query(GroupMember).filter(GroupMember.student_id == user_id).delete()

    # If advisor, unassign from any groups and clear their requests
    if user.role == "advisor":
        groups = db.query(Group).filter(Group.advisor_id == user_id).all()
        for group in groups:
            group.advisor_id = None
            group.status = "forming"
        db.query(SupervisorRequest).filter(SupervisorRequest.advisor_id == user_id).delete()

    db.delete(user)
    db.commit()
    return {"message": f"User '{user.full_name}' deleted"}