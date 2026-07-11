from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import Document, Group, GroupMember, User
from utils.auth import get_current_user, require_role
from typing import List
import os, shutil, uuid

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
def upload_document(
    group_id: int = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if not doc_type or len(doc_type.strip()) == 0:
        raise HTTPException(status_code=400, detail="doc_type is required")
    doc_type = doc_type.strip()
    
        

    # Save file to disk with unique name
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = Document(
        group_id=group_id,
        doc_type=doc_type,
        file_path=file_path,
        file_name=file.filename,
        uploaded_by=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"message": "Upload successful", "file_name": file.filename, "doc_type": doc_type}

@router.get("/group/{group_id}")
def get_group_documents(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = db.query(Document).filter(Document.group_id == group_id).all()
    return [
        {
            "id": d.id,
            "file_name": d.file_name,
            "doc_type": d.doc_type,
            "uploaded_at": d.uploaded_at,
            "uploaded_by": d.uploaded_by
        }
        for d in docs
    ]

from fastapi.responses import FileResponse
import os

@router.get("/download/{document_id}")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    return FileResponse(
        path=doc.file_path,
        filename=doc.file_name,
        media_type="application/octet-stream"
    )