from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    evaluated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    defense_type = Column(String(20), nullable=False)  # mid, final
    presentation_marks = Column(Float, default=0)   # out of 30
    implementation_marks = Column(Float, default=0) # out of 40
    qa_marks = Column(Float, default=0)             # out of 30
    total_marks = Column(Float, default=0)          # auto-calculated
    grade = Column(String(5), nullable=True)        # A, B+, B, C+, C, F
    comments = Column(Text, nullable=True)
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    group = relationship("Group", back_populates="evaluations")
    evaluator = relationship("User", back_populates="evaluations_given")