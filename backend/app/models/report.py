"""Report and export models mapped to Firestore."""

from typing import Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid

class ReportExport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    report_id: str
    format: str
    file_path: Optional[str] = None  # Firebase Storage path
    file_size: Optional[int] = None
    is_available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Report(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    analysis_id: Optional[str] = None
    title: str
    executive_summary: Optional[str] = None
    learning_notes: Optional[str] = None
    ai_recommendations: Optional[Dict[str, Any]] = None
    secure_coding_examples: Optional[Dict[str, Any]] = None
    report_data: Optional[Dict[str, Any]] = None
    status: str = "draft"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
