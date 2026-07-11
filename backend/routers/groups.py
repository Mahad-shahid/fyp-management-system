from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Group, GroupMember, User
from schemas.group import GroupCreate, GroupOut, AssignAdvisor
from utils.auth import get_current_user, require_role
from typing import List

router = APIRouter(prefix="/groups", tags=["Groups"])

@router.post("/", response_model=GroupOut)
def create_group(
    data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student", "admin"))
):
    group = Group(group_name=data.group_name)
    db.add(group)
    db.commit()
    db.refresh(group)

    for student_id in data.member_ids:
        student = db.query(User).filter(
            User.id == student_id, User.role == "student"
        ).first()
        if not student:
            raise HTTPException(
                status_code=404,
                detail=f"Student with id {student_id} not found"
            )
        db.add(GroupMember(group_id=group.id, student_id=student_id))

    db.commit()
    return group

@router.get("/", response_model=List[GroupOut])
def get_all_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(Group).all()
    elif current_user.role == "advisor":
        return db.query(Group).filter(
            Group.advisor_id == current_user.id
        ).all()
    else:
        memberships = db.query(GroupMember).filter(
            GroupMember.student_id == current_user.id
        ).all()
        group_ids = [m.group_id for m in memberships]
        return db.query(Group).filter(Group.id.in_(group_ids)).all()

@router.get("/{group_id}", response_model=GroupOut)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@router.get("/{group_id}/members")
def get_group_members(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    members = db.query(GroupMember).filter(
        GroupMember.group_id == group_id
    ).all()
    if not members:
        raise HTTPException(status_code=404, detail="No members found")

    result = []
    for m in members:
        student = db.query(User).filter(User.id == m.student_id).first()
        if student:
            result.append({
                "user_id": student.id,
                "full_name": student.full_name,
                "email": student.email,
                "student_id": student.student_id,
                "joined_at": m.joined_at
            })
    return result

@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    from models import GroupMember, Proposal, Document, Evaluation, SupervisorRequest

    # Delete related records first (no cascade configured at DB level)
    db.query(GroupMember).filter(GroupMember.group_id == group_id).delete()
    db.query(Proposal).filter(Proposal.group_id == group_id).delete()
    db.query(Document).filter(Document.group_id == group_id).delete()
    db.query(Evaluation).filter(Evaluation.group_id == group_id).delete()
    db.query(SupervisorRequest).filter(SupervisorRequest.group_id == group_id).delete()

    db.delete(group)
    db.commit()
    return {"message": f"Group '{group.group_name}' and all related data deleted"}