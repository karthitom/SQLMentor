from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Module(BaseModel):
    id: str
    title: str
    description: str
    type: str = Field(description="'lab', 'quiz', 'article'")
    target_id: str = Field(description="ID of the lab, quiz, or article")
    order: int

class LearningPath(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str = Field(description="'beginner', 'intermediate', 'advanced'")
    estimated_minutes: int
    prerequisites: List[str] = []
    modules: List[Module] = []
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    is_active: bool = True
