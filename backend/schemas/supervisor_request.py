from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SupervisorRequestCreate(BaseModel):
    advisor_id: int

class SupervisorRequestOut(BaseModel):
    id: int
    group_id: int
    advisor_id: int
    status: str
    requested_at: datetime
    responded_at: Optional[datetime]

    class Config:
        from_attributes = True

class SupervisorRequestRespond(BaseModel):
    status: str  # "accepted" or "rejected"