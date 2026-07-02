"""Knowledge base models: articles, quizzes, and user progress."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=True)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)  # sql-basics, owasp, etc.
    tags: Mapped[list] = mapped_column(JSON, nullable=True)
    difficulty_level: Mapped[str] = mapped_column(String(16), nullable=True)
    estimated_read_minutes: Mapped[int] = mapped_column(Integer, nullable=True)
    owasp_reference: Mapped[str] = mapped_column(String(64), nullable=True)
    cwe_reference: Mapped[str] = mapped_column(String(64), nullable=True)
    related_articles: Mapped[list] = mapped_column(JSON, nullable=True)  # List of slugs
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    quizzes: Mapped[list["Quiz"]] = relationship(
        "Quiz", back_populates="article", cascade="all, delete-orphan"
    )


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    article_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("knowledge_articles.id", ondelete="CASCADE"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    difficulty_level: Mapped[str] = mapped_column(String(16), nullable=True)
    pass_score: Mapped[int] = mapped_column(Integer, default=70)  # Percentage

    article: Mapped["KnowledgeArticle"] = relationship("KnowledgeArticle", back_populates="quizzes")
    questions: Mapped[list["QuizQuestion"]] = relationship(
        "QuizQuestion", back_populates="quiz", cascade="all, delete-orphan"
    )


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(32), nullable=False)  # multiple_choice, true_false
    options: Mapped[list] = mapped_column(JSON, nullable=False)
    correct_answer_index: Mapped[int] = mapped_column(Integer, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)

    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="questions")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    article_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("knowledge_articles.id", ondelete="CASCADE"), nullable=True
    )
    quiz_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=True
    )
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    score: Mapped[float] = mapped_column(Float, nullable=True)  # Quiz score 0-100
    time_spent_seconds: Mapped[int] = mapped_column(Integer, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
