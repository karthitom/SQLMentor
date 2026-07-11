"""User, Role, and Session models mapped to Firestore."""

from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid

class UserRole:
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    username: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "student"
    is_active: bool = True
    is_email_verified: bool = False
    learning_streak_days: int = 0
    xp: int = 0
    level: int = 1
    badges: list[str] = Field(default_factory=list)
    completed_modules: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login_at: Optional[datetime] = None

class UserSession(BaseModel):
    """Tracks active sessions if needed."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    refresh_token_hash: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    last_used_at: Optional[datetime] = None
