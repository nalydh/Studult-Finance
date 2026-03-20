"""
FastAPI dependency that enforces JWT authentication on every route.

Usage in a router:
    @router.get("/")
    def my_endpoint(user_id: int = Depends(get_current_user_id), ...):
        ...

The dependency reads the Bearer token from the Authorization header,
decodes it using the same secret/algorithm as create_access_token,
and returns the authenticated user's integer ID.

If the token is missing, expired, or invalid a 401 is raised immediately —
the endpoint body never executes.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from app.auth.utils import decode_token

# This tells FastAPI to expect: Authorization: Bearer <token>
_bearer = HTTPBearer(auto_error=True)


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> int:
    """
    Decode the JWT Bearer token and return the authenticated user's ID.
    Raises HTTP 401 if the token is missing, expired, or tampered with.
    """
    try:
        payload = decode_token(credentials.credentials)
        user_id = int(payload["sub"])
        return user_id
    except (JWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
