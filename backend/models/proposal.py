from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    abstract = Column(Text, nullable=False)
    similarity_score = Column(Float, nullable=True)
    similar_to_project = Column(String(255), nullable=True)
    status = Column(String(30), default="pending")  # pending, approved, flagged, rejected
    admin_feedback = Column(Text, nullable=True)
    resubmission_count = Column(Integer, default=0)  # NEW
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    group = relationship("Group", back_populates="proposal")