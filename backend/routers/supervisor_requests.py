from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SupervisorRequest, Group, GroupMember, User, Proposal
from schemas.supervisor_request import SupervisorRequestCreate, SupervisorRequestOut, SupervisorRequestRespond
from utils.auth import get_current_user, require_role
from ai.advisor_match import suggest_advisors
from typing import List

router = APIRouter(prefix="/supervisor-requests", tags=["Supervisor Requests"])


def _get_my_group(db: Session, student: User) -> Group:
    membership = db.query(GroupMember).filter(
        GroupMember.student_id == student.id
    ).first()
    if not membership:
        raise HTTPException(status_code=400, detail="You are not in any group")
    group = db.query(Group).filter(Group.id == membership.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


def _rejected_ids(group: Group) -> List[int]:
    if not group.rejected_advisor_ids:
        return []
    return [int(x) for x in group.rejected_advisor_ids.split(",") if x.strip()]


@router.get("/suggestions")
def get_supervisor_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    group = _get_my_group(db, current_user)

    proposal = db.query(Proposal).filter(Proposal.group_id == group.id).first()
    if not proposal:
        raise HTTPException(status_code=400, detail="No proposal submitted yet")
    if proposal.status != "approved":
        raise HTTPException(
            status_code=400,
            detail=f"Proposal must be approved before selecting a supervisor. Current status: {proposal.status}"
        )

    if group.advisor_id:
        raise HTTPException(status_code=400, detail="A supervisor is already assigned to this group")

    pending = db.query(SupervisorRequest).filter(
        SupervisorRequest.group_id == group.id,
        SupervisorRequest.status == "pending"
    ).first()
    if pending:
        raise HTTPException(status_code=400, detail="You already have a pending request. Wait for a response.")

    suggestions = suggest_advisors(proposal.abstract, db)

    # Filter out rejected advisors
    excluded = set(_rejected_ids(group))

    # Filter out advisors who already supervise 2 or more groups
    from models import Group as GroupModel
    def get_group_count(advisor_id):
        return db.query(GroupModel).filter(
            GroupModel.advisor_id == advisor_id
        ).count()

    filtered = [
        s for s in suggestions
        if s["advisor_id"] not in excluded
        and get_group_count(s["advisor_id"]) < 2
    ]

    # Add group count info to each suggestion
    for s in filtered:
        count = get_group_count(s["advisor_id"])
        s["current_groups"] = count
        s["slots_remaining"] = 2 - count

    return {"group_id": group.id, "suggestions": filtered}


@router.post("/", response_model=SupervisorRequestOut)
def send_supervisor_request(
    data: SupervisorRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    group = _get_my_group(db, current_user)

    proposal = db.query(Proposal).filter(Proposal.group_id == group.id).first()
    if not proposal or proposal.status != "approved":
        raise HTTPException(status_code=400, detail="Proposal must be approved first")

    if group.advisor_id:
        raise HTTPException(status_code=400, detail="Supervisor already assigned")

    pending = db.query(SupervisorRequest).filter(
        SupervisorRequest.group_id == group.id,
        SupervisorRequest.status == "pending"
    ).first()
    if pending:
        raise HTTPException(status_code=400, detail="A request is already pending")

    if data.advisor_id in _rejected_ids(group):
        raise HTTPException(status_code=400, detail="This advisor already rejected your group")

    advisor = db.query(User).filter(
        User.id == data.advisor_id, User.role == "advisor", User.is_active == True
    ).first()
    if not advisor:
        raise HTTPException(status_code=404, detail="Advisor not found")

    req = SupervisorRequest(group_id=group.id, advisor_id=data.advisor_id, status="pending")
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/my-status", response_model=List[SupervisorRequestOut])
def get_my_request_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    group = _get_my_group(db, current_user)
    return db.query(SupervisorRequest).filter(
        SupervisorRequest.group_id == group.id
    ).order_by(SupervisorRequest.requested_at.desc()).all()


@router.get("/pending", response_model=List[SupervisorRequestOut])
def get_pending_requests_for_advisor(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("advisor"))
):
    return db.query(SupervisorRequest).filter(
        SupervisorRequest.advisor_id == current_user.id,
        SupervisorRequest.status == "pending"
    ).all()


@router.patch("/{request_id}/respond", response_model=SupervisorRequestOut)
def respond_to_request(
    request_id: int,
    data: SupervisorRequestRespond,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("advisor"))
):
    req = db.query(SupervisorRequest).filter(SupervisorRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.advisor_id != current_user.id:
        raise HTTPException(status_code=403, detail="This request is not addressed to you")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="This request has already been responded to")

    if data.status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="status must be 'accepted' or 'rejected'")

    from datetime import datetime
    req.status = data.status
    req.responded_at = datetime.utcnow()

    group = db.query(Group).filter(Group.id == req.group_id).first()

    if data.status == "accepted":
        # Check advisor hasn't hit the 2 group limit
        current_count = db.query(Group).filter(
            Group.advisor_id == req.advisor_id
        ).count()
        if current_count >= 2:
            raise HTTPException(
                status_code=400,
                detail="This advisor has reached the maximum of 2 supervised groups and cannot accept more requests."
            )
        group.advisor_id = req.advisor_id
        group.status = "active"
    else:
        # Add this advisor to the group's rejected list so they don't reappear
        existing = _rejected_ids(group)
        if req.advisor_id not in existing:
            existing.append(req.advisor_id)
        group.rejected_advisor_ids = ",".join(str(i) for i in existing)

    db.commit()
    db.refresh(req)
    return req