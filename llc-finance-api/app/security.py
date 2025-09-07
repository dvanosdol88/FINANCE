import os
from fastapi import Header, HTTPException, status
from typing import Optional
from cryptography.fernet import Fernet


def require_api_key(x_api_key: Optional[str] = Header(None)):
    expected = os.environ.get("API_KEY")
    if not expected:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="API_KEY not configured")
    if x_api_key != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


def get_fernet() -> Fernet:
    key = os.environ.get("FERNET_KEY")
    if not key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="FERNET_KEY not configured")
    try:
        return Fernet(key)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Invalid FERNET_KEY: {e}")

