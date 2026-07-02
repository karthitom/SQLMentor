"""Workspace model mapped to Firestore."""

from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid

class WorkspaceTag(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    name: str
    color: Optional[str] = None

class Workspace(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    name: str
    description: Optional[str] = None
    is_pinned: bool = False
    is_archived: bool = False
    color: Optional[str] = None
    icon: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
