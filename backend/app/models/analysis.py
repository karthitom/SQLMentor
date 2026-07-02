"""Analysis models — captures URL analysis sessions, parameters, and responses."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Analysis(Base):
    """An educational analysis session of a lab application."""

    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    title: Mapped[str] = mapped_column(String(256), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default="pending", nullable=False
    )  # pending, running, completed, failed
    error_message: Mapped[str] = mapped_column(Text, nullable=True)

    # Discovered parameters
    parameters_count: Mapped[int] = mapped_column(Integer, default=0)

    # AI explanation
    ai_explanation: Mapped[dict] = mapped_column(JSON, nullable=True)
    ai_model_used: Mapped[str] = mapped_column(String(64), nullable=True)

    # Observations
    observations: Mapped[dict] = mapped_column(JSON, nullable=True)

    # Learning metadata
    concepts_demonstrated: Mapped[list] = mapped_column(JSON, nullable=True)
    difficulty_level: Mapped[str] = mapped_column(String(16), nullable=True)
    learning_notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="analyses")
    parameters: Mapped[list["AnalysisParameter"]] = relationship(
        "AnalysisParameter", back_populates="analysis", cascade="all, delete-orphan"
    )
    responses: Mapped[list["AnalysisResponse"]] = relationship(
        "AnalysisResponse", back_populates="analysis", cascade="all, delete-orphan"
    )
    comparisons: Mapped[list["ResponseComparison"]] = relationship(
        "ResponseComparison", back_populates="analysis", cascade="all, delete-orphan"
    )


class AnalysisParameter(Base):
    """A discovered input parameter in the target lab application."""

    __tablename__ = "analysis_parameters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    location: Mapped[str] = mapped_column(
        String(32), nullable=False
    )  # query, form, header, cookie, json_body
    value_sample: Mapped[str] = mapped_column(String(1024), nullable=True)
    is_interesting: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="parameters")


class AnalysisResponse(Base):
    """A captured HTTP response from a lab application."""

    __tablename__ = "analysis_responses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False
    )
    request_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    request_method: Mapped[str] = mapped_column(String(10), nullable=False)
    request_params: Mapped[dict] = mapped_column(JSON, nullable=True)
    request_headers: Mapped[dict] = mapped_column(JSON, nullable=True)
    response_status: Mapped[int] = mapped_column(Integer, nullable=True)
    response_size: Mapped[int] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[float] = mapped_column(Float, nullable=True)
    response_headers: Mapped[dict] = mapped_column(JSON, nullable=True)
    response_body_excerpt: Mapped[str] = mapped_column(Text, nullable=True)  # First 10KB
    response_type: Mapped[str] = mapped_column(String(32), nullable=True)  # baseline, test
    label: Mapped[str] = mapped_column(String(128), nullable=True)  # "Normal", "Modified Input"
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="responses")


class ResponseComparison(Base):
    """Comparison between two analysis responses."""

    __tablename__ = "response_comparisons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False
    )
    baseline_response_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("analysis_responses.id"), nullable=False
    )
    modified_response_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("analysis_responses.id"), nullable=False
    )
    similarity_score: Mapped[float] = mapped_column(Float, nullable=True)  # 0.0 - 1.0
    size_difference: Mapped[int] = mapped_column(Integer, nullable=True)
    time_difference_ms: Mapped[float] = mapped_column(Float, nullable=True)
    status_changed: Mapped[bool] = mapped_column(Boolean, default=False)
    diff_data: Mapped[dict] = mapped_column(JSON, nullable=True)  # Structured diff
    observable_changes: Mapped[list] = mapped_column(JSON, nullable=True)
    ai_analysis: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="comparisons")
