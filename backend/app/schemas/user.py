"""Pydantic schemas for users."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    full_name: Optional[str] = Field(None, max_length=128)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=128)
    bio: Optional[str] = Field(None, max_length=500)
    username: Optional[str] = Field(None, min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    email: EmailStr
    username: str
    full_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    role: str
    is_active: bool
    is_email_verified: bool
    learning_streak_days: int
    total_analyses: int
    total_reports: int
    created_at: datetime
    last_login_at: Optional[datetime]


class UserPublic(BaseModel):
    """Minimal public user info."""
    model_config = {"from_attributes": True}

    id: str
    username: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: str


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
