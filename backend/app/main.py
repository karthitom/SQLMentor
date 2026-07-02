"""
SQLMentor FastAPI Application
Educational AI-Powered SQL Injection Learning Platform

⚠️  EDUCATIONAL USE ONLY — This platform is strictly designed for cybersecurity
    education and authorized testing on intentionally vulnerable lab environments.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db
from app.core.redis_client import init_redis, close_redis
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.request_id import RequestIDMiddleware
from app.api.v1 import auth, users, workspaces, projects, analysis, ai, reports, knowledge, admin, health

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifecycle: startup → yield → shutdown."""
    log.info("Starting SQLMentor backend", environment=settings.APP_ENV)

    # Initialize database
    await init_db()

    # Initialize Redis
    await init_redis()

    log.info("SQLMentor backend ready")
    yield

    # Cleanup
    await close_redis()
    log.info("SQLMentor backend shut down cleanly")


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title="SQLMentor API",
        description=(
            "AI-Powered SQL Injection Learning & Analysis Platform. "
            "⚠️ Educational use only — for intentionally vulnerable lab environments."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware (order matters — outermost applied last) ──────────────────
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)

    # CORS — strict allow-list, no wildcards
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,  # Required for cookie-based auth
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-CSRF-Token", "X-Request-ID", "Authorization"],
        expose_headers=["X-Request-ID"],
        max_age=600,
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    prefix = "/api/v1"
    app.include_router(health.router, tags=["Health"])
    app.include_router(auth.router,       prefix=f"{prefix}/auth",       tags=["Authentication"])
    app.include_router(users.router,      prefix=f"{prefix}/users",      tags=["Users"])
    app.include_router(workspaces.router, prefix=f"{prefix}/workspaces", tags=["Workspaces"])
    app.include_router(projects.router,   prefix=f"{prefix}/projects",   tags=["Projects"])
    app.include_router(analysis.router,   prefix=f"{prefix}/analysis",   tags=["Analysis"])
    app.include_router(ai.router,         prefix=f"{prefix}/ai",         tags=["AI Engine"])
    app.include_router(reports.router,    prefix=f"{prefix}/reports",    tags=["Reports"])
    app.include_router(knowledge.router,  prefix=f"{prefix}/knowledge",  tags=["Knowledge Base"])
    app.include_router(admin.router,      prefix=f"{prefix}/admin",      tags=["Admin"])

    # ── Global Exception Handlers ─────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Never leak internal errors to clients."""
        log.error(
            "Unhandled exception",
            path=request.url.path,
            method=request.method,
            error=str(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal error occurred. Please try again later."},
        )

    return app


app = create_app()
