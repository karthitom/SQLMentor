"""
Firebase Admin SDK setup.
Provides dependency functions for Firestore and Storage.
"""

import base64
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage
from typing import Generator
import structlog

from app.core.config import settings

log = structlog.get_logger()

_firebase_app = None

def init_firebase() -> None:
    """Initialize the Firebase Admin SDK."""
    global _firebase_app
    if _firebase_app is not None:
        return

    try:
        if settings.FIREBASE_SERVICE_ACCOUNT_BASE64:
            try:
                # Decode the base64 encoded JSON service account key
                decoded = base64.b64decode(settings.FIREBASE_SERVICE_ACCOUNT_BASE64).decode("utf-8")
                cert_dict = json.loads(decoded)
            except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as e:
                log.error("Failed to decode FIREBASE_SERVICE_ACCOUNT_BASE64. Ensure it is a valid base64-encoded JSON string.", error=str(e))
                raise ValueError("Invalid FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable.") from e
            
            cred = credentials.Certificate(cert_dict)
            _firebase_app = firebase_admin.initialize_app(cred, {
                'storageBucket': settings.FIREBASE_STORAGE_BUCKET
            })
            log.info("Firebase Admin initialized via Base64 credentials.")
        else:
            # Fallback to Application Default Credentials (e.g. on GCP)
            _firebase_app = firebase_admin.initialize_app(options={
                'storageBucket': settings.FIREBASE_STORAGE_BUCKET
            })
            log.info("Firebase Admin initialized via Application Default Credentials.")
    except Exception as e:
        log.error("Failed to initialize Firebase Admin", error=str(e))
        raise


def get_firestore() -> firestore.firestore.Client:
    """Get a Firestore client."""
    if _firebase_app is None:
        init_firebase()
    return firestore.client()


def get_storage_bucket():
    """Get the default Storage bucket."""
    if _firebase_app is None:
        init_firebase()
    return storage.bucket()
