from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Proposal, GroupMember, User
from ai.duplicate_check import check_duplicate
from ai.advisor_match import suggest_advisors
from utils.auth import get_current_user, require_role
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["AI Features"])

class TextInput(BaseModel):
    abstract: str

# ── Duplicate check (standalone — for testing any text) ──
@router.post("/check-duplicate")
def check_duplicate_endpoint(
    data: TextInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = check_duplicate(data.abstract, db)
    return result

# ── Suggest advisors for a group's proposal ──
@router.get("/suggest-advisors/{group_id}")
def suggest_advisors_endpoint(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    proposal = db.query(Proposal).filter(
        Proposal.group_id == group_id
    ).first()

    if not proposal:
        raise HTTPException(
            status_code=404,
            detail="No proposal found for this group"
        )

    suggestions = suggest_advisors(proposal.abstract, db)
    return {
        "group_id": group_id,
        "proposal_title": proposal.title,
        "suggestions": suggestions
    }

@router.post("/preview-duplicate")
def preview_duplicate(
    data: TextInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Runs the AI duplicate check WITHOUT saving anything.
    Students use this to check their abstract before final submission.
    """
    if len(data.abstract.split()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Abstract too short — write at least 20 words for an accurate check"
        )
    result = check_duplicate(data.abstract, db)
    return {
        "similarity_score": result["similarity_score"],
        "similar_to_project": result["similar_to_project"],
        "is_duplicate": result["is_duplicate"],
        "preview": True  # flag so frontend knows this wasn't saved
    }