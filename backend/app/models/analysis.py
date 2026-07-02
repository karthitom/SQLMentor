"""Analysis models mapped to Firestore."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid

class AnalysisParameter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    analysis_id: str
    name: str
    location: str
    value_sample: Optional[str] = None
    is_interesting: bool = False
    notes: Optional[str] = None

class AnalysisResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    analysis_id: str
    request_url: str
    request_method: str
    request_params: Optional[Dict[str, Any]] = None
    request_headers: Optional[Dict[str, Any]] = None
    response_status: Optional[int] = None
    response_size: Optional[int] = None
    response_time_ms: Optional[float] = None
    response_headers: Optional[Dict[str, Any]] = None
    response_body_excerpt: Optional[str] = None
    response_type: Optional[str] = None
    label: Optional[str] = None
    captured_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResponseComparison(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    analysis_id: str
    baseline_response_id: str
    modified_response_id: str
    similarity_score: Optional[float] = None
    size_difference: Optional[int] = None
    time_difference_ms: Optional[float] = None
    status_changed: bool = False
    diff_data: Optional[Dict[str, Any]] = None
    observable_changes: Optional[List[Any]] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Analysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    target_url: str
    title: Optional[str] = None
    description: Optional[str] = None
    status: str = "pending"
    error_message: Optional[str] = None
    parameters_count: int = 0
    ai_explanation: Optional[Dict[str, Any]] = None
    ai_model_used: Optional[str] = None
    observations: Optional[Dict[str, Any]] = None
    concepts_demonstrated: Optional[List[Any]] = None
    difficulty_level: Optional[str] = None
    learning_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
