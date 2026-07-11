from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class UserProgress(BaseModel):
    user_id: str
    xp: int = 0
    level: int = 1
    current_streak: int = 0
    longest_streak: int = 0
    last_active_date: Optional[str] = None
    completed_labs: List[str] = []
    completed_paths: List[str] = []
    quiz_scores: Dict[str, float] = {}
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
