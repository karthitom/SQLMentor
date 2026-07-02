"""Analysis API router using Firestore."""

from datetime import datetime, timezone
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from firebase_admin import firestore

from app.api.deps import get_current_user, get_db
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
    project_id: str, user_id: str, db: firestore.firestore.Client
) -> Project:
    doc = db.collection("projects").document(project_id).get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project = Project(**doc.to_dict())
    
    ws_doc = db.collection("workspaces").document(project.workspace_id).get()
    if not ws_doc.exists or ws_doc.to_dict().get("owner_id") != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project

async def _get_user_analysis(
    analysis_id: str, user_id: str, db: firestore.firestore.Client
) -> Analysis:
    doc = db.collection("analyses").document(analysis_id).get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    analysis = Analysis(**doc.to_dict())
    await _check_project_ownership(analysis.project_id, user_id, db)
    return analysis

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    data: AnalysisCreateRequest,
    current_user: User = Depends(get_current_user),
    db: firestore.firestore.Client = Depends(get_db),
) -> dict:
    project = await _check_project_ownership(data.project_id, str(current_user.id), db)
    analysis = Analysis(
        project_id=data.project_id,
        target_url=data.target_url,
        title=data.title or f"Analysis of {data.target_url[:50]}",
        description=data.description,
        status="pending",
    )
    db.collection("analyses").document(analysis.id).set(analysis.model_dump(mode="json"))
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
    db: firestore.firestore.Client = Depends(get_db),
) -> dict:
    analysis = await _get_user_analysis(analysis_id, str(current_user.id), db)
    analysis.status = "running"
    db.collection("analyses").document(analysis.id).update({"status": "running"})

    try:
        async with AnalysisService() as svc:
            discovered = await svc.discover_parameters(analysis.target_url)

        for param_data in discovered.get("all_inputs", []):
            param = AnalysisParameter(
                analysis_id=analysis.id,
                name=param_data["name"][:256],
                location=param_data.get("location", "query"),
                value_sample=str(param_data.get("sample_value", ""))[:1024],
            )
            db.collection("analysis_parameters").document(param.id).set(param.model_dump(mode="json"))

        analysis.parameters_count = len(discovered.get("all_inputs", []))
        analysis.status = "completed"
        analysis.completed_at = datetime.now(timezone.utc)
        db.collection("analyses").document(analysis.id).update({
            "parameters_count": analysis.parameters_count,
            "status": analysis.status,
            "completed_at": analysis.completed_at.isoformat(),
        })

        return {
            "analysis_id": analysis.id,
            "parameters_found": analysis.parameters_count,
            "parameters": discovered["all_inputs"],
            "status": "completed",
        }

    except ValueError as exc:
        db.collection("analyses").document(analysis.id).update({
            "status": "failed",
            "error_message": str(exc),
        })
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

@router.post("/{analysis_id}/test", response_model=dict)
async def run_test(
    analysis_id: str,
    data: RunTestRequest,
    current_user: User = Depends(get_current_user),
    db: firestore.firestore.Client = Depends(get_db),
) -> dict:
    analysis = await _get_user_analysis(analysis_id, str(current_user.id), db)

    try:
        async with AnalysisService() as svc:
            baseline_params = {data.parameter_name: data.baseline_value}
            baseline = await svc.fetch_response(
                url=analysis.target_url,
                method=data.request_method,
                params=baseline_params if data.request_method == "GET" else None,
                data=baseline_params if data.request_method == "POST" else None,
                label="Baseline (Normal Input)",
            )
            modified_params = {data.parameter_name: data.test_value}
            modified = await svc.fetch_response(
                url=analysis.target_url,
                method=data.request_method,
                params=modified_params if data.request_method == "GET" else None,
                data=modified_params if data.request_method == "POST" else None,
                label="Modified Input",
            )

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
        db.collection("analysis_responses").document(baseline_response.id).set(baseline_response.model_dump(mode="json"))
        db.collection("analysis_responses").document(modified_response.id).set(modified_response.model_dump(mode="json"))

        comparison_svc = ComparisonService()
        comparison_result = comparison_svc.compare(baseline, modified)

        ai_svc = AIService()
        ai_explanation = await ai_svc.explain_comparison(
            baseline=baseline,
            modified=modified,
            similarity_score=comparison_result["similarity_score"],
        )

        comparison = ResponseComparison(
            analysis_id=analysis.id,
            baseline_response_id=baseline_response.id,
            modified_response_id=modified_response.id,
            similarity_score=comparison_result["similarity_score"],
            size_difference=comparison_result["size_difference"],
            time_difference_ms=comparison_result["time_difference_ms"],
            status_changed=comparison_result["status_changed"],
            diff_data={"blocks": comparison_result["diff_blocks"][:50]},
            observable_changes=comparison_result["observable_changes"],
            ai_analysis=ai_explanation,
        )
        db.collection("response_comparisons").document(comparison.id).set(comparison.model_dump(mode="json"))

        db.collection("analyses").document(analysis.id).update({
            "ai_explanation": ai_explanation,
            "ai_model_used": ai_svc._get_model(),
        })

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
    db: firestore.firestore.Client = Depends(get_db),
) -> dict:
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
