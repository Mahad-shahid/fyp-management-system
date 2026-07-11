from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Evaluation, Group, User
from schemas.evaluation import EvaluationCreate, EvaluationOut
from utils.auth import get_current_user, require_role
from typing import List

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])

def calculate_grade(total: float) -> str:
    if total >= 90: return "A"
    elif total >= 85: return "A-"
    elif total >= 80: return "B+"
    elif total >= 75: return "B"
    elif total >= 70: return "B-"
    elif total >= 65: return "C+"
    elif total >= 60: return "C"
    elif total >= 55: return "C-"
    else: return "F"

@router.post("/", response_model=EvaluationOut)
def submit_evaluation(
    data: EvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("advisor", "admin"))
):
    group = db.query(Group).filter(Group.id == data.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    total = data.presentation_marks + data.implementation_marks + data.qa_marks
    grade = calculate_grade(total)

    evaluation = Evaluation(
        group_id=data.group_id,
        evaluated_by=current_user.id,
        defense_type=data.defense_type,
        presentation_marks=data.presentation_marks,
        implementation_marks=data.implementation_marks,
        qa_marks=data.qa_marks,
        total_marks=round(total, 2),
        grade=grade,
        comments=data.comments
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    return evaluation

@router.get("/group/{group_id}", response_model=List[EvaluationOut])
def get_group_evaluations(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Evaluation).filter(Evaluation.group_id == group_id).all()