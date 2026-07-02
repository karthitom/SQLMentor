"""Workspaces API router."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceTag
from app.schemas.common import MessageResponse, PaginatedResponse

router = APIRouter()


class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = Field(None, max_length=32)


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = Field(None, max_length=32)
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None


class WorkspaceResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    name: str
    description: Optional[str]
    color: Optional[str]
    icon: Optional[str]
    is_pinned: bool
    is_archived: bool
    owner_id: str
    from app.models.workspace import WorkspaceTag as WTag
    from datetime import datetime
    created_at: datetime
    updated_at: datetime


@router.get("", response_model=list[dict])
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    include_archived: bool = False,
) -> list[dict]:
    """List all workspaces for the current user."""
    query = select(Workspace).where(Workspace.owner_id == current_user.id)
    if not include_archived:
        query = query.where(Workspace.is_archived == False)
    query = query.order_by(Workspace.is_pinned.desc(), Workspace.updated_at.desc())

    result = await db.execute(query)
    workspaces = result.scalars().all()

    return [
        {
            "id": w.id,
            "name": w.name,
            "description": w.description,
            "color": w.color,
            "icon": w.icon,
            "is_pinned": w.is_pinned,
            "is_archived": w.is_archived,
            "created_at": w.created_at.isoformat(),
            "updated_at": w.updated_at.isoformat(),
        }
        for w in workspaces
    ]


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a new workspace."""
    workspace = Workspace(
        owner_id=current_user.id,
        name=data.name,
        description=data.description,
        color=data.color,
        icon=data.icon,
    )
    db.add(workspace)
    await db.flush()
    await db.refresh(workspace)

    return {
        "id": workspace.id,
        "name": workspace.name,
        "description": workspace.description,
        "color": workspace.color,
        "icon": workspace.icon,
        "is_pinned": workspace.is_pinned,
        "is_archived": workspace.is_archived,
        "created_at": workspace.created_at.isoformat(),
    }


@router.get("/{workspace_id}", response_model=dict)
async def get_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get a workspace by ID. Validates ownership."""
    result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.owner_id == current_user.id,  # Ownership check — users only see their own
        )
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    return {
        "id": workspace.id,
        "name": workspace.name,
        "description": workspace.description,
        "color": workspace.color,
        "icon": workspace.icon,
        "is_pinned": workspace.is_pinned,
        "is_archived": workspace.is_archived,
        "owner_id": workspace.owner_id,
        "created_at": workspace.created_at.isoformat(),
        "updated_at": workspace.updated_at.isoformat(),
    }


@router.patch("/{workspace_id}", response_model=dict)
async def update_workspace(
    workspace_id: str,
    data: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Update a workspace. Validates ownership."""
    result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.owner_id == current_user.id,
        )
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(workspace, key, value)

    await db.flush()
    return {"id": workspace.id, "message": "Updated successfully"}


@router.delete("/{workspace_id}", response_model=MessageResponse)
async def delete_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Delete a workspace and all its projects/analyses."""
    result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.owner_id == current_user.id,
        )
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    await db.delete(workspace)
    return MessageResponse(message="Workspace deleted")
