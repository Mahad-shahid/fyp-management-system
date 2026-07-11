from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Proposal, Group, GroupMember, User
from schemas.proposal import ProposalCreate, ProposalOut, ProposalReview
from utils.auth import get_current_user, require_role
from typing import List

router = APIRouter(prefix="/proposals", tags=["Proposals"])

@router.post("/", response_model=ProposalOut)
def submit_proposal(
    data: ProposalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    membership = db.query(GroupMember).filter(
        GroupMember.student_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=400, detail="You are not in any group")

    existing = db.query(Proposal).filter(
        Proposal.group_id == membership.group_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Your group already has a proposal."
        )

    # ── Run AI duplicate check automatically on submit ──
    from ai.duplicate_check import check_duplicate
    ai_result = check_duplicate(data.abstract, db)

    proposal = Proposal(
        group_id=membership.group_id,
        title=data.title,
        abstract=data.abstract,
        similarity_score=ai_result["similarity_score"],
        similar_to_project=ai_result["similar_to_project"],
        # Auto-flag if similarity is too high, else pending
        status="flagged" if ai_result["is_duplicate"] else "pending"
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return proposal

@router.get("/", response_model=List[ProposalOut])
def get_proposals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(Proposal).all()
    elif current_user.role == "advisor":
        groups = db.query(Group).filter(
            Group.advisor_id == current_user.id
        ).all()
        group_ids = [g.id for g in groups]
        return db.query(Proposal).filter(
            Proposal.group_id.in_(group_ids)
        ).all()
    else:
        membership = db.query(GroupMember).filter(
            GroupMember.student_id == current_user.id
        ).first()
        if not membership:
            return []
        return db.query(Proposal).filter(
            Proposal.group_id == membership.group_id
        ).all()

@router.get("/{proposal_id}", response_model=ProposalOut)
def get_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal

@router.patch("/{proposal_id}/review", response_model=ProposalOut)
def review_proposal(
    proposal_id: int,
    data: ProposalReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    if data.status not in ["approved", "rejected", "flagged"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    proposal.status = data.status
    proposal.admin_feedback = data.admin_feedback
    db.commit()
    db.refresh(proposal)
    return proposal

@router.put("/resubmit", response_model=ProposalOut)
def resubmit_proposal(
    data: ProposalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    membership = db.query(GroupMember).filter(
        GroupMember.student_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=400, detail="You are not in any group")

    proposal = db.query(Proposal).filter(
        Proposal.group_id == membership.group_id
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="No proposal found to resubmit")
    if proposal.status != "rejected":
        raise HTTPException(
            status_code=400,
            detail="Only rejected proposals can be resubmitted"
        )

    # Run AI check on the new abstract
    from ai.duplicate_check import check_duplicate
    ai_result = check_duplicate(data.abstract, db)

    proposal.title = data.title
    proposal.abstract = data.abstract
    proposal.similarity_score = ai_result["similarity_score"]
    proposal.similar_to_project = ai_result["similar_to_project"]
    proposal.status = "flagged" if ai_result["is_duplicate"] else "pending"
    proposal.admin_feedback = None  # clear old feedback
    proposal.resubmission_count = (proposal.resubmission_count or 0) + 1

    db.commit()
    db.refresh(proposal)
    return proposal