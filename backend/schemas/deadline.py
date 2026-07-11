from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DeadlineCreate(BaseModel):
    title: str
    due_date: datetime
    description: Optional[str] = None
    doc_type: Optional[str] = None   

class DeadlineOut(BaseModel):
    id: int
    title: str
    due_date: datetime
    description: Optional[str]
    doc_type: Optional[str]          

    class Config:
        from_attributes = True