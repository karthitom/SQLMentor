"""
FastAPI dependencies for current user authentication via Firebase Auth.
Reads ID token from the Authorization header (Bearer token).
"""

from typing import Annotated

import structlog
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, firestore

from app.core.firebase import get_firestore, init_firebase
from app.models.user import User

log = structlog.get_logger()
security = HTTPBearer()

def get_db() -> firestore.firestore.Client:
    """Dependency that returns a Firestore client."""
    return get_firestore()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: firestore.firestore.Client = Depends(get_db)
) -> User:
    """
    Extract and validate Firebase ID token from Bearer header.
    Raises 401 if token is missing, invalid, or expired.
    """
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        if not uid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception as e:
        log.warning("Invalid Firebase token", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Fetch user from Firestore
    user_doc = db.collection("users").document(uid).get()
    
    if not user_doc.exists:
        # Create user document implicitly if they logged in via Firebase Auth but don't exist in Firestore
        email = decoded_token.get("email", "")
        name = decoded_token.get("name", "")
        picture = decoded_token.get("picture", "")
        
        new_user = User(
            id=uid,
            email=email,
            username=email.split("@")[0] if email else uid,
            full_name=name,
            avatar_url=picture
        )
        db.collection("users").document(uid).set(new_user.model_dump(mode="json"))
        return new_user
        
    user_data = user_doc.to_dict()
    user = User(**user_data)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or inactive",
        )

    return user

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
    return current_user

async def require_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

async def require_instructor_or_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or admin access required",
        )
    return current_user
