"""Workspaces API router using Firestore."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from firebase_admin import firestore

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.common import MessageResponse

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


@router.get("", response_model=list[dict])
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: firestore.firestore.Client = Depends(get_db),
    include_archived: bool = False,
) -> list[dict]:
    """List all workspaces for the current user."""
    # Use a single-field query to avoid requiring a composite Firestore index.
    # Filter is_archived in Python after fetching.
    docs = db.collection("workspaces").where("owner_id", "==", current_user.id).stream()
    workspaces = [Workspace(**doc.to_dict()) for doc in docs]
    if not include_archived:
        workspaces = [w for w in workspaces if not w.is_archived]
    workspaces.sort(key=lambda w: (w.is_pinned, w.updated_at.isoformat()), reverse=True)

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
    db: firestore.firestore.Client = Depends(get_db),
) -> dict:
    """Create a new workspace."""
    workspace = Workspace(
        owner_id=current_user.id,
        name=data.name,
        description=data.description,
        color=data.color,
        icon=data.icon,
    )
    db.collection("workspaces").document(workspace.id).set(workspace.model_dump(mode="json"))

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
    db: firestore.firestore.Client = Depends(get_db),
) -> dict:
    """Get a workspace by ID. Validates ownership."""
    doc = db.collection("workspaces").document(workspace_id).get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    workspace = Workspace(**doc.to_dict())
    if workspace.owner_id != current_user.id:
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
    db: firestore.firestore.Client = Depends(get_db),
) -> dict:
    """Update a workspace. Validates ownership."""
    doc_ref = db.collection("workspaces").document(workspace_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    workspace = Workspace(**doc.to_dict())
    if workspace.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        from datetime import datetime, timezone
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        doc_ref.update(update_data)

    return {"id": workspace.id, "message": "Updated successfully"}


@router.delete("/{workspace_id}", response_model=MessageResponse)
async def delete_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: firestore.firestore.Client = Depends(get_db),
) -> MessageResponse:
    """Delete a workspace and all its projects/analyses."""
    doc_ref = db.collection("workspaces").document(workspace_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    workspace = Workspace(**doc.to_dict())
    if workspace.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    doc_ref.delete()
    return MessageResponse(message="Workspace deleted")
