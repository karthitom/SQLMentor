from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.education import LabExecutionRequest, LabExecutionResponse
from app.services.lab_service import LabService
from app.services.gamification_service import GamificationService

router = APIRouter()

@router.get("/")
async def list_labs(current_user: User = Depends(get_current_user), db = Depends(get_db)):
    """List all available labs."""
    labs_ref = db.collection("labs").where("is_active", "==", True).stream()
    return {"labs": [doc.to_dict() for doc in labs_ref]}

@router.get("/{lab_id}")
async def get_lab(lab_id: str, current_user: User = Depends(get_current_user), db = Depends(get_db)):
    """Get lab details."""
    lab = await LabService(db).get_lab(lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    return lab

@router.post("/execute", response_model=LabExecutionResponse)
async def execute_lab_query(
    req: LabExecutionRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Execute a query in the lab environment."""
    lab_service = LabService(db)
    lab = await lab_service.get_lab(req.lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
        
    result = lab_service.execute_query(lab.setup_sql, req.query)
    
    # In a real implementation, we would check if the result matches the task's expected output.
    # For MVP, we just return the result.
    return LabExecutionResponse(
        success=result["success"],
        results=result.get("results"),
        error=result.get("error"),
        execution_time_ms=0.0,
    )
