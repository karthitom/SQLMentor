"""Project model mapped to Firestore."""

from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid

class ProjectBookmark(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    title: str
    url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    name: str
    description: Optional[str] = None
    lab_url: Optional[str] = None
    lab_type: Optional[str] = None
    learning_notes: Optional[str] = None
    status: str = "active"
    difficulty_level: Optional[str] = None
    total_analyses: int = 0
    is_pinned: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
