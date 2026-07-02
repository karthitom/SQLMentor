"""Projects API router."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
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


async def _get_workspace_for_user(workspace_id: str, user_id: str, db: AsyncSession) -> Workspace:
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.owner_id == user_id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return workspace


async def _get_project_for_user(project_id: str, user_id: str, db: AsyncSession) -> Project:
    result = await db.execute(
        select(Project)
        .join(Workspace, Project.workspace_id == Workspace.id)
        .where(Project.id == project_id, Workspace.owner_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
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
    db.add(project)
    await db.flush()
    await db.refresh(project)

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
    db: AsyncSession = Depends(get_db),
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
    db: AsyncSession = Depends(get_db),
) -> dict:
    project = await _get_project_for_user(project_id, str(current_user.id), db)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    await db.flush()
    return {"id": project.id, "message": "Updated successfully"}


@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    project = await _get_project_for_user(project_id, str(current_user.id), db)
    await db.delete(project)
    return MessageResponse(message="Project deleted")
