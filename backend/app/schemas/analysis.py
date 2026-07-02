"""Pydantic schemas for analysis."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, HttpUrl, field_validator


class AnalysisCreateRequest(BaseModel):
    project_id: str
    target_url: str = Field(..., max_length=2048)
    title: Optional[str] = Field(None, max_length=256)
    description: Optional[str] = Field(None, max_length=1000)

    @field_validator("target_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Only allow http/https — no file://, javascript:, etc."""
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must use http or https scheme")
        if len(v) > 2048:
            raise ValueError("URL too long")
        return v


class ParameterResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    location: str
    value_sample: Optional[str]
    is_interesting: bool
    notes: Optional[str]


class CapturedResponseSchema(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    request_url: str
    request_method: str
    response_status: Optional[int]
    response_size: Optional[int]
    response_time_ms: Optional[float]
    response_type: Optional[str]
    label: Optional[str]
    captured_at: datetime


class ComparisonResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    similarity_score: Optional[float]
    size_difference: Optional[int]
    time_difference_ms: Optional[float]
    status_changed: bool
    observable_changes: Optional[list]
    ai_analysis: Optional[dict]
    created_at: datetime


class AnalysisResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    project_id: str
    target_url: str
    title: Optional[str]
    description: Optional[str]
    status: str
    parameters_count: int
    ai_explanation: Optional[dict]
    concepts_demonstrated: Optional[list]
    difficulty_level: Optional[str]
    learning_notes: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    parameters: list[ParameterResponse] = []
    responses: list[CapturedResponseSchema] = []


class RunTestRequest(BaseModel):
    """Request to run an educational behavioral test."""
    parameter_name: str = Field(..., max_length=256)
    parameter_location: str = Field(..., pattern=r"^(query|form|header|cookie|json_body)$")
    baseline_value: str = Field(..., max_length=1024)
    test_value: str = Field(..., max_length=1024)
    request_method: str = Field("GET", pattern=r"^(GET|POST)$")
