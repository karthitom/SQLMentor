"""Report and export models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    analysis_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("analyses.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    executive_summary: Mapped[str] = mapped_column(Text, nullable=True)
    learning_notes: Mapped[str] = mapped_column(Text, nullable=True)
    ai_recommendations: Mapped[dict] = mapped_column(JSON, nullable=True)
    secure_coding_examples: Mapped[dict] = mapped_column(JSON, nullable=True)
    report_data: Mapped[dict] = mapped_column(JSON, nullable=True)  # Full report JSON
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    project: Mapped["Project"] = relationship("Project", back_populates="reports")
    exports: Mapped[list["ReportExport"]] = relationship(
        "ReportExport", back_populates="report", cascade="all, delete-orphan"
    )


class ReportExport(Base):
    __tablename__ = "report_exports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False
    )
    format: Mapped[str] = mapped_column(String(16), nullable=False)  # pdf, html, markdown, json
    file_path: Mapped[str] = mapped_column(String(512), nullable=True)  # Server-side path (not URL)
    file_size: Mapped[int] = mapped_column(nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    report: Mapped["Report"] = relationship("Report", back_populates="exports")
