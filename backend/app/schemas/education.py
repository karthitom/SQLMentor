from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.models.learning_path import LearningPath, Module
from app.models.lab import Lab, LabTask
from app.models.progress import UserProgress
from app.models.achievement import Achievement, UserAchievement

class LabExecutionRequest(BaseModel):
    lab_id: str
    query: str

class LabExecutionResponse(BaseModel):
    success: bool
    results: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    execution_time_ms: float
    task_completed: Optional[str] = None

class XPUpdateResponse(BaseModel):
    new_xp: int
    new_level: int
    leveled_up: bool
    unlocked_achievements: List[Achievement]
