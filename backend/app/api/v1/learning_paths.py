from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user, get_db
from app.models.user import User

router = APIRouter()

@router.get("/")
async def list_learning_paths(current_user: User = Depends(get_current_user), db = Depends(get_db)):
    """List all learning paths."""
    paths_ref = db.collection("learning_paths").where("is_active", "==", True).stream()
    return {"learning_paths": [doc.to_dict() for doc in paths_ref]}

@router.get("/{path_id}")
async def get_learning_path(path_id: str, current_user: User = Depends(get_current_user), db = Depends(get_db)):
    """Get details of a specific learning path."""
    doc = db.collection("learning_paths").document(path_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return doc.to_dict()
