from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProposalCreate(BaseModel):
    title: str
    abstract: str

class ProposalOut(BaseModel):
    id: int
    group_id: int
    title: str
    abstract: str
    similarity_score: Optional[float]
    similar_to_project: Optional[str]
    status: str
    admin_feedback: Optional[str]
    submitted_at: datetime

    class Config:
        from_attributes = True

class ProposalReview(BaseModel):
    status: str        # approved, rejected, flagged
    admin_feedback: Optional[str] = None