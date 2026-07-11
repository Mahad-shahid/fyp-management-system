from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class GroupCreate(BaseModel):
    group_name: str
    member_ids: List[int]  # list of student user IDs to add

class GroupOut(BaseModel):
    id: int
    group_name: str
    advisor_id: Optional[int]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AssignAdvisor(BaseModel):
    advisor_id: int