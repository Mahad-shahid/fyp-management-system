from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)
    student_id = Column(String(20), nullable=True)
    research_interests = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    group_memberships = relationship("GroupMember", back_populates="student")
    advised_groups = relationship("Group", back_populates="advisor")
    uploaded_documents = relationship("Document", back_populates="uploader")
    evaluations_given = relationship("Evaluation", back_populates="evaluator")
    supervisor_requests_received = relationship("SupervisorRequest", back_populates="advisor")  # NEW