from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Achievement(BaseModel):
    id: str
    title: str
    description: str
    icon_url: str
    xp_reward: int
    condition_type: str = Field(description="'labs_completed', 'streak', 'path_completed', 'perfect_quiz'")
    condition_value: int
    created_at: datetime = Field(default_factory=utc_now)
    is_active: bool = True

class UserAchievement(BaseModel):
    user_id: str
    achievement_id: str
    unlocked_at: datetime = Field(default_factory=utc_now)
