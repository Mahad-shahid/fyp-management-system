from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EvaluationCreate(BaseModel):
    group_id: int
    defense_type: str   # mid, final
    presentation_marks: float
    implementation_marks: float
    qa_marks: float
    comments: Optional[str] = None

class EvaluationOut(BaseModel):
    id: int
    group_id: int
    evaluated_by: int
    defense_type: str
    presentation_marks: float
    implementation_marks: float
    qa_marks: float
    total_marks: float
    grade: Optional[str]
    comments: Optional[str]
    evaluated_at: datetime

    class Config:
        from_attributes = True