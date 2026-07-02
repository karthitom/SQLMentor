"""Knowledge base models mapped to Firestore."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid

class QuizQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quiz_id: str
    question_text: str
    question_type: str
    options: List[Any]
    correct_answer_index: int
    explanation: Optional[str] = None
    order: int = 0

class Quiz(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    article_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    difficulty_level: Optional[str] = None
    pass_score: int = 70

class KnowledgeArticle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    title: str
    summary: Optional[str] = None
    content_markdown: str
    category: str
    tags: Optional[List[Any]] = None
    difficulty_level: Optional[str] = None
    estimated_read_minutes: Optional[int] = None
    owasp_reference: Optional[str] = None
    cwe_reference: Optional[str] = None
    related_articles: Optional[List[str]] = None
    is_published: bool = True
    view_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    article_id: Optional[str] = None
    quiz_id: Optional[str] = None
    is_completed: bool = False
    score: Optional[float] = None
    time_spent_seconds: Optional[int] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
