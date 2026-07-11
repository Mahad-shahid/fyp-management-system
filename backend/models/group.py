from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String(100), nullable=False)
    advisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(30), default="forming")  # forming, active, completed
    rejected_advisor_ids = Column(Text, nullable=True)  # NEW — comma-separated, e.g. "3,7"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    advisor = relationship("User", back_populates="advised_groups")
    members = relationship("GroupMember", back_populates="group")
    proposal = relationship("Proposal", back_populates="group", uselist=False)
    documents = relationship("Document", back_populates="group")
    evaluations = relationship("Evaluation", back_populates="group")
    supervisor_requests = relationship("SupervisorRequest", back_populates="group")  # NEW


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    group = relationship("Group", back_populates="members")
    student = relationship("User", back_populates="group_memberships")