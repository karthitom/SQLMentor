from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class LabTask(BaseModel):
    id: str
    description: str
    expected_result_type: str = Field(description="'success', 'error', 'data_match'")
    expected_data: Optional[Any] = None

class Lab(BaseModel):
    id: str
    title: str
    scenario: str
    objectives: List[str]
    learning_goals: List[str]
    difficulty: str
    estimated_minutes: int
    setup_sql: str = Field(description="SQL script to initialize the mock database for this lab")
    tasks: List[LabTask]
    hints: List[str]
    walkthrough: str
    secure_coding_example: str
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    is_active: bool = True
