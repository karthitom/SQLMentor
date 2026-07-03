"""Projects API router using Firestore."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from firebase_admin import firestore

from app.api.deps import get_current_user, get_db
from app.models.project import Project
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.common import MessageResponse

router = APIRouter()

class ProjectCreate(BaseModel):
    workspace_id: str
    name: str = Field(..., min_length=1, max_length=128)
    description: Optional[str] = Field(None, max_length=500)
    lab_url: Optional[str] = Field(None, max_length=2048)
    lab_type: Optional[str] = Field(None, max_length=64)
    difficulty_level: Optional[str] = Field(None, pattern=r"^(beginner|intermediate|advanced)$")

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    description: Optional[str] = Field(None, max_length=500)
    lab_url: Optional[str] = Field(None, max_length=2048)
    lab_type: Optional[str] = Field(None, max_length=64)
    learning_notes: Optional[str] = Field(None, max_length=10000)
    difficulty_level: Optional[str] = Field(None, pattern=r"^(beginner|intermediate|advanced)$")
    status: Optional[str] = Field(None, pattern=r"^(active|completed|archived)$")
    is_pinned: Optional[bool] = None

async def _get_workspace_for_user(workspace_id: str, user_id: str, db: firestore.firestore.Client) -> Workspace:
    doc = db.collection("workspaces").document(workspace_id).get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    workspace = Workspace(**doc.to_dict())
    if workspace.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return workspace

async def _get_project_for_user(project_id: str, user_id: str, db: firestore.firestore.Client) -> Project:
    doc = db.collection("projects").document(project_id).get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project = Project(**doc.to_dict())
    await _get_workspace_for_user(project.workspace_id, user_id, db)
    return project

@router.get("", response_model=list)
async def list_projects(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: firestore.firestore.Client = Depends(get_db),
) -> list:
    """List all projects in a workspace owned by the current user."""
    await _get_workspace_for_user(workspace_id, str(current_user.id), db)
    docs = (
        db.collection("projects")
        .where("workspace_id", "==", workspace_id)
        .stream()
    )
    results = []
    for doc in docs:
        data = doc.to_dict()
        results.append({
            "id": data.get("id"),
            "workspace_id": data.get("workspace_id"),
            "name": data.get("name"),
            "description": data.get("description"),
            "lab_url": data.get("lab_url"),
            "status": data.get("status"),
            "difficulty_level": data.get("difficulty_level"),
            "is_pinned": data.get("is_pinned"),
            "created_at": data.get("created_at"),
        })
    return results


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: firestore.firestore.Client = Depends(get_db),
) -> dict:
    await _get_workspace_for_user(data.workspace_id, str(current_user.id), db)

    project = Project(
        workspace_id=data.workspace_id,
        name=data.name,
        description=data.description,
        lab_url=data.lab_url,
        lab_type=data.lab_type,
        difficulty_level=data.difficulty_level,
    )
    db.collection("projects").document(project.id).set(project.model_dump(mode="json"))

    return {
        "id": project.id,
        "workspace_id": project.workspace_id,
        "name": project.name,
        "description": project.description,
        "lab_url": project.lab_url,
        "lab_type": project.lab_type,
        "status": project.status,
        "difficulty_level": project.difficulty_level,
        "created_at": project.created_at.isoformat(),
    }

@router.get("/{project_id}", response_model=dict)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: firestore.firestore.Client = Depends(get_db),
) -> dict:
    project = await _get_project_for_user(project_id, str(current_user.id), db)
    return {
        "id": project.id,
        "workspace_id": project.workspace_id,
        "name": project.name,
        "description": project.description,
        "lab_url": project.lab_url,
        "lab_type": project.lab_type,
        "status": project.status,
        "difficulty_level": project.difficulty_level,
        "learning_notes": project.learning_notes,
        "total_analyses": project.total_analyses,
        "is_pinned": project.is_pinned,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
    }

@router.patch("/{project_id}", response_model=dict)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: firestore.firestore.Client = Depends(get_db),
) -> dict:
    project = await _get_project_for_user(project_id, str(current_user.id), db)
    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        from datetime import datetime, timezone
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        db.collection("projects").document(project_id).update(update_data)
    return {"id": project.id, "message": "Updated successfully"}

@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: firestore.firestore.Client = Depends(get_db),
) -> MessageResponse:
    await _get_project_for_user(project_id, str(current_user.id), db)
    db.collection("projects").document(project_id).delete()
    return MessageResponse(message="Project deleted")
