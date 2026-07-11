from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class ProjectArchive(Base):
    __tablename__ = "project_archive"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    abstract = Column(Text, nullable=False)
    year = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())