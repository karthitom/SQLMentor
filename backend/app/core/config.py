"""
Application configuration via pydantic-settings.
All secrets MUST come from environment variables — no hardcoded defaults for production.
"""

import logging
from functools import lru_cache
from typing import Literal

import structlog
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    APP_NAME: str = "SQLMentor"
    APP_ENV: Literal["development", "staging", "production"] = "development"
    APP_DEBUG: bool = False
    APP_URL: str = "http://localhost:3000"
    API_URL: str = "http://localhost:8000"

    # ── Firebase ──────────────────────────────────────────────────────────────
    FIREBASE_SERVICE_ACCOUNT_BASE64: str = ""  # Base64 encoded JSON
    FIREBASE_STORAGE_BUCKET: str = ""

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── AI Provider ───────────────────────────────────────────────────────────
    AI_PROVIDER: Literal["openai", "azure", "ollama", "openai-compatible"] = "openai"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_DEPLOYMENT: str = ""
    AZURE_OPENAI_API_VERSION: str = "2024-02-01"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_AUTH_PER_MINUTE: int = 5
    RATE_LIMIT_API_PER_MINUTE: int = 60
    RATE_LIMIT_AI_PER_MINUTE: int = 10
    RATE_LIMIT_ANALYSIS_PER_MINUTE: int = 5

    # ── Analysis ──────────────────────────────────────────────────────────────
    ANALYSIS_REQUEST_TIMEOUT: int = 30
    ANALYSIS_MAX_RESPONSE_SIZE: int = 1_048_576  # 1MB
    ANALYSIS_ALLOWED_SCHEMES: str = "http,https"

    # ── Exports / Uploads ─────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 10

    # ── Logging ───────────────────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"

    # ── Features ──────────────────────────────────────────────────────────────
    FEATURE_REGISTRATION_ENABLED: bool = True
    FEATURE_AI_CHAT_ENABLED: bool = True
    FEATURE_KNOWLEDGE_BASE_ENABLED: bool = True
    FEATURE_REPORTS_ENABLED: bool = True

    # ── Computed Properties ───────────────────────────────────────────────────
    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def analysis_allowed_schemes_list(self) -> list[str]:
        return [s.strip() for s in self.ANALYSIS_ALLOWED_SCHEMES.split(",") if s.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()


def configure_logging() -> None:
    """Configure structured JSON logging."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


configure_logging()
