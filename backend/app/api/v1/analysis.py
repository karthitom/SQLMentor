"""Analysis API router."""

from datetime import datetime, timezone
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.analysis import Analysis, AnalysisParameter, AnalysisResponse, ResponseComparison
from app.models.project import Project
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.analysis import AnalysisCreateRequest, RunTestRequest
from app.schemas.common import MessageResponse
from app.services.analysis_service import AnalysisService
from app.services.comparison_service import ComparisonService
from app.services.ai_service import AIService

router = APIRouter()
log = structlog.get_logger()


async def _check_project_ownership(
    project_id: str, user_id: str, db: AsyncSession
) -> Project:
    """Verify the project exists and belongs to the current user's workspace."""
    result = await db.execute(
        select(Project)
        .join(Workspace, Project.workspace_id == Workspace.id)
        .where(Project.id == project_id, Workspace.owner_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    data: AnalysisCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Create a new analysis session for a lab application.
    ⚠️ Educational use only — target URL must be an intentionally vulnerable lab.
    """
    project = await _check_project_ownership(data.project_id, str(current_user.id), db)

    analysis = Analysis(
        project_id=data.project_id,
        target_url=data.target_url,
        title=data.title or f"Analysis of {data.target_url[:50]}",
        description=data.description,
        status="pending",
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)

    return {
        "id": analysis.id,
        "project_id": analysis.project_id,
        "target_url": analysis.target_url,
        "title": analysis.title,
        "status": analysis.status,
        "created_at": analysis.created_at.isoformat(),
    }


@router.post("/{analysis_id}/discover", response_model=dict)
async def discover_parameters(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Discover input parameters in the target lab application."""
    analysis = await _get_user_analysis(analysis_id, str(current_user.id), db)

    # Update status
    analysis.status = "running"
    await db.flush()

    try:
        async with AnalysisService() as svc:
            discovered = await svc.discover_parameters(analysis.target_url)

        # Store discovered parameters
        for param_data in discovered.get("all_inputs", []):
            param = AnalysisParameter(
                analysis_id=analysis.id,
                name=param_data["name"][:256],
                location=param_data.get("location", "query"),
                value_sample=str(param_data.get("sample_value", ""))[:1024],
            )
            db.add(param)

        analysis.parameters_count = len(discovered.get("all_inputs", []))
        analysis.status = "completed"
        analysis.completed_at = datetime.now(timezone.utc)
        await db.flush()

        return {
            "analysis_id": analysis.id,
            "parameters_found": analysis.parameters_count,
            "parameters": discovered["all_inputs"],
            "status": "completed",
        }

    except ValueError as exc:
        analysis.status = "failed"
        analysis.error_message = str(exc)
        await db.flush()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))


@router.post("/{analysis_id}/test", response_model=dict)
async def run_test(
    analysis_id: str,
    data: RunTestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Run an educational behavioral test by comparing baseline vs. modified responses.
    """
    analysis = await _get_user_analysis(analysis_id, str(current_user.id), db)

    try:
        async with AnalysisService() as svc:
            # Fetch baseline response
            baseline_params = {data.parameter_name: data.baseline_value}
            baseline = await svc.fetch_response(
                url=analysis.target_url,
                method=data.request_method,
                params=baseline_params if data.request_method == "GET" else None,
                data=baseline_params if data.request_method == "POST" else None,
                label="Baseline (Normal Input)",
            )

            # Fetch modified response
            modified_params = {data.parameter_name: data.test_value}
            modified = await svc.fetch_response(
                url=analysis.target_url,
                method=data.request_method,
                params=modified_params if data.request_method == "GET" else None,
                data=modified_params if data.request_method == "POST" else None,
                label="Modified Input",
            )

        # Store responses
        baseline_response = AnalysisResponse(
            analysis_id=analysis.id,
            request_url=analysis.target_url,
            request_method=data.request_method,
            request_params={data.parameter_name: data.baseline_value},
            response_status=baseline["status_code"],
            response_size=baseline["content_length"],
            response_time_ms=baseline["response_time_ms"],
            response_headers=baseline["headers"],
            response_body_excerpt=baseline["body_excerpt"][:10_000],
            response_type="baseline",
            label=baseline["label"],
        )
        modified_response = AnalysisResponse(
            analysis_id=analysis.id,
            request_url=analysis.target_url,
            request_method=data.request_method,
            request_params={data.parameter_name: data.test_value},
            response_status=modified["status_code"],
            response_size=modified["content_length"],
            response_time_ms=modified["response_time_ms"],
            response_headers=modified["headers"],
            response_body_excerpt=modified["body_excerpt"][:10_000],
            response_type="test",
            label=modified["label"],
        )
        db.add(baseline_response)
        db.add(modified_response)
        await db.flush()

        # Compute comparison
        comparison_svc = ComparisonService()
        comparison_result = comparison_svc.compare(baseline, modified)

        # AI explanation
        ai_svc = AIService()
        ai_explanation = await ai_svc.explain_comparison(
            baseline=baseline,
            modified=modified,
            similarity_score=comparison_result["similarity_score"],
        )

        # Store comparison
        comparison = ResponseComparison(
            analysis_id=analysis.id,
            baseline_response_id=baseline_response.id,
            modified_response_id=modified_response.id,
            similarity_score=comparison_result["similarity_score"],
            size_difference=comparison_result["size_difference"],
            time_difference_ms=comparison_result["time_difference_ms"],
            status_changed=comparison_result["status_changed"],
            diff_data={"blocks": comparison_result["diff_blocks"][:50]},  # Limit stored diff
            observable_changes=comparison_result["observable_changes"],
            ai_analysis=ai_explanation,
        )
        db.add(comparison)

        # Update analysis with AI explanation
        analysis.ai_explanation = ai_explanation
        analysis.ai_model_used = ai_svc._get_model()
        await db.flush()

        return {
            "comparison_id": comparison.id,
            "baseline": {
                "id": baseline_response.id,
                "status": baseline["status_code"],
                "size": baseline["content_length"],
                "time_ms": baseline["response_time_ms"],
            },
            "modified": {
                "id": modified_response.id,
                "status": modified["status_code"],
                "size": modified["content_length"],
                "time_ms": modified["response_time_ms"],
            },
            "comparison": {
                "similarity_score": comparison_result["similarity_score"],
                "size_difference": comparison_result["size_difference"],
                "time_difference_ms": comparison_result["time_difference_ms"],
                "status_changed": comparison_result["status_changed"],
                "observable_changes": comparison_result["observable_changes"],
            },
            "ai_explanation": ai_explanation,
            "educational_disclaimer": (
                "⚠️ This analysis is for educational purposes only. "
                "Only test against systems you own or have explicit authorization to test."
            ),
        }

    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))


@router.get("/{analysis_id}", response_model=dict)
async def get_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get analysis details with ownership check."""
    analysis = await _get_user_analysis(analysis_id, str(current_user.id), db)

    return {
        "id": analysis.id,
        "project_id": analysis.project_id,
        "target_url": analysis.target_url,
        "title": analysis.title,
        "description": analysis.description,
        "status": analysis.status,
        "parameters_count": analysis.parameters_count,
        "ai_explanation": analysis.ai_explanation,
        "concepts_demonstrated": analysis.concepts_demonstrated,
        "difficulty_level": analysis.difficulty_level,
        "learning_notes": analysis.learning_notes,
        "created_at": analysis.created_at.isoformat(),
        "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
    }


async def _get_user_analysis(
    analysis_id: str, user_id: str, db: AsyncSession
) -> Analysis:
    """Fetch analysis with ownership validation."""
    result = await db.execute(
        select(Analysis)
        .join(Project, Analysis.project_id == Project.id)
        .join(Workspace, Project.workspace_id == Workspace.id)
        .where(Analysis.id == analysis_id, Workspace.owner_id == user_id)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return analysis
