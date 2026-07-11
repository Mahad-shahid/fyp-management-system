from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Deadline(Base):
    __tablename__ = "deadlines"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    description = Column(Text, nullable=True)
    doc_type = Column(String(20), nullable=True)  # NEW — SRS, SDS, final, or null
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())