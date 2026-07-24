import secrets
import re
from datetime import datetime, timedelta

import requests as http_requests
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session, select, func
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

from app.database import get_session
from app.models.user import User
from app.models.emailtoken import EmailVerificationToken, PasswordResetToken
from app.auth.utils import (
    MAX_SESSION_AGE_DAYS,
    create_access_token,
    decode_token,
    hash_password,
    hash_token,
    verify_google_id_token,
    verify_password,
)
from app.auth.dependencies import get_current_user_id
from app.auth.email_service import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)
_bearer = HTTPBearer(auto_error=True)

# Constant-cost comparison target so login takes the same time whether or
# not the email exists (prevents user enumeration via response timing).
_TIMING_DUMMY_HASH = hash_password(secrets.token_urlsafe(16))


# ── Request schemas ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    marketing_emails_enabled: bool = False

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class LoginRequest(BaseModel):
    # Deliberately plain str: legacy accounts may predate format validation
    # and must still be able to sign in.
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class GoogleLoginRequest(BaseModel):
    # Identity comes exclusively from the verified Google ID token —
    # never from client-supplied email/name/google_id fields.
    id_token: str
    marketing_emails_enabled: bool = False


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ── Helpers ──────────────────────────────────────────────────────

def user_response(user: User) -> dict:
    """Returns a dict with user info + a fresh access token."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "email_verified": user.email_verified,
        "created_at": user.created_at.isoformat(),
        "access_token": create_access_token(user.id, user.email),
    }


def _get_user_by_email(session: Session, email: str) -> Optional[User]:
    """Case-insensitive email lookup (covers legacy mixed-case rows)."""
    return session.exec(
        select(User).where(func.lower(User.email) == email.strip().lower())
    ).first()


def _create_verification_token(user_id: int, session: Session) -> str:
    """
    Generate an email verification token (24 h TTL). Only its SHA-256 hash
    is persisted; the raw token goes into the emailed link and is returned.
    """
    token = secrets.token_urlsafe(32)
    db_token = EmailVerificationToken(
        user_id=user_id,
        token=hash_token(token),
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    session.add(db_token)
    session.commit()
    return token


def _create_reset_token(user_id: int, session: Session) -> str:
    """
    Generate a password reset token (15 min TTL). Only its SHA-256 hash
    is persisted; the raw token goes into the emailed link and is returned.
    """
    token = secrets.token_urlsafe(32)
    db_token = PasswordResetToken(
        user_id=user_id,
        token=hash_token(token),
        expires_at=datetime.utcnow() + timedelta(minutes=15),
    )
    session.add(db_token)
    session.commit()
    return token


def _find_email_token(model, raw_token: str, session: Session):
    """
    Look up a verification/reset token row by the hash of the presented token.
    Falls back to a plaintext match so links emailed before hashing shipped
    keep working until they expire (≤ 24 h) — safe to remove after that.
    """
    row = session.exec(select(model).where(model.token == hash_token(raw_token))).first()
    if not row:
        row = session.exec(select(model).where(model.token == raw_token)).first()
    return row


def _validate_password(password: str) -> str | None:
    """
    Returns an error message string if invalid, or None if the password is fine.
    Requirements match the frontend strength indicator.
    """
    if len(password) < 8:
        return "Password must be at least 8 characters."
    if len(password) > 128:
        return "Password cannot exceed 128 characters."
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter."
    if not re.search(r"[0-9]", password):
        return "Password must contain at least one number."
    return None


# ── Endpoints ────────────────────────────────────────────────────

@router.post("/register")
@limiter.limit("5/minute")
def register(request: Request, req: RegisterRequest, session: Session = Depends(get_session)):
    """Create a new email/password account and send a verification email."""
    existing = _get_user_by_email(session, req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    error = _validate_password(req.password)
    if error:
        raise HTTPException(status_code=400, detail=error)

    user = User(
        email=req.email,
        name=req.name,
        hashed_password=hash_password(req.password),
        email_verified=False,
        marketing_emails_enabled=req.marketing_emails_enabled,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = _create_verification_token(user.id, session)
    send_verification_email(user.email, token)

    # No access token here: the account can't sign in until the email is
    # verified, so registration must not hand out API credentials.
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "email_verified": user.email_verified,
        "created_at": user.created_at.isoformat(),
    }


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, req: LoginRequest, session: Session = Depends(get_session)):
    """Sign in with email + password. Rate-limited to 10 attempts/minute per IP."""
    user = _get_user_by_email(session, req.email)
    if not user or not user.hashed_password:
        verify_password(req.password, _TIMING_DUMMY_HASH)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email address to log in.")
    return user_response(user)


@router.post("/google")
def google_signin(req: GoogleLoginRequest, session: Session = Depends(get_session)):
    """
    Called by the NextAuth server after a successful Google OAuth flow.
    The Google-signed ID token is verified here (signature, audience,
    issuer, expiry); its claims are the only trusted source of identity.
    """
    try:
        claims = verify_google_id_token(req.id_token)
    except RuntimeError:
        raise HTTPException(status_code=500, detail="Google sign-in is not configured on the server")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid Google credential")
    except http_requests.RequestException:
        raise HTTPException(status_code=503, detail="Could not verify Google credential. Please try again.")

    google_id = claims["sub"]
    email = (claims.get("email") or "").strip().lower()
    name = claims.get("name")
    email_is_verified = claims.get("email_verified") in (True, "true")

    if not email:
        raise HTTPException(status_code=401, detail="Google account has no email address")

    user = session.exec(select(User).where(User.google_id == google_id)).first()

    if not user:
        user = _get_user_by_email(session, email)
        if user:
            # Linking to an existing account requires Google to attest the
            # email is verified — otherwise this is an account-takeover vector.
            if not email_is_verified:
                raise HTTPException(status_code=403, detail="Google account email is not verified")
            user.google_id = google_id
            if not user.name:
                user.name = name
            user.email_verified = True
        else:
            user = User(
                email=email,
                name=name,
                google_id=google_id,
                email_verified=email_is_verified,
                marketing_emails_enabled=req.marketing_emails_enabled,
            )
            session.add(user)

    session.commit()
    session.refresh(user)
    return user_response(user)


@router.post("/refresh")
def refresh(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    session: Session = Depends(get_session),
):
    """
    Exchange a valid (unexpired) access token for a fresh one.
    The original sign-in time is preserved, capping total session
    lifetime at MAX_SESSION_AGE_DAYS before re-authentication is required.
    """
    try:
        payload = decode_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token.")

    auth_time = payload.get("auth_time")
    if not isinstance(auth_time, int) or (
        datetime.utcnow() - datetime.utcfromtimestamp(auth_time)
        > timedelta(days=MAX_SESSION_AGE_DAYS)
    ):
        raise HTTPException(status_code=401, detail="Session has expired. Please sign in again.")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")

    return {"access_token": create_access_token(user.id, user.email, auth_time=auth_time)}


@router.get("/verify-email")
def verify_email(token: str, session: Session = Depends(get_session)):
    """Confirm ownership of an email address via the link sent after registration."""
    db_token = _find_email_token(EmailVerificationToken, token, session)

    if not db_token:
        raise HTTPException(status_code=400, detail="Invalid verification link")

    user = session.get(User, db_token.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Invalid verification link")

    # Idempotent: re-visiting a link (page refresh, double request) after the
    # email is already verified should not surface an error.
    if user.email_verified:
        return {"message": "Email verified successfully"}

    if db_token.used:
        raise HTTPException(status_code=400, detail="This link has already been used")
    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification link has expired")

    user.email_verified = True
    db_token.used = True
    session.commit()
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
@limiter.limit("3/minute")
def resend_verification(
    request: Request,
    req: ForgotPasswordRequest,
    session: Session = Depends(get_session),
):
    """Resend the email verification link. Response never reveals whether the account exists."""
    generic = {"message": "If that account exists, a new verification link has been sent."}

    user = _get_user_by_email(session, req.email)
    if not user or user.email_verified:
        return generic

    # Strict 30-second per-user cooldown — skipped silently so the response
    # doesn't leak that the account exists.
    last_token = session.exec(
        select(EmailVerificationToken)
        .where(EmailVerificationToken.user_id == user.id)
        .order_by(EmailVerificationToken.created_at.desc())
    ).first()
    if last_token and (datetime.utcnow() - last_token.created_at).total_seconds() < 30:
        return generic

    token = _create_verification_token(user.id, session)
    send_verification_email(user.email, token)
    return generic


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    req: ForgotPasswordRequest,
    session: Session = Depends(get_session),
):
    """
    Send a password reset link. Always returns the same 200 response so the
    endpoint can't be used to probe which emails are registered.
    """
    user = _get_user_by_email(session, req.email)
    if user and user.hashed_password:  # Only email/password accounts can reset
        # Strict 30-second per-user cooldown — skipped silently (a 429 here
        # would reveal that the account exists).
        last_token = session.exec(
            select(PasswordResetToken)
            .where(PasswordResetToken.user_id == user.id)
            .order_by(PasswordResetToken.created_at.desc())
        ).first()
        if not (last_token and (datetime.utcnow() - last_token.created_at).total_seconds() < 30):
            token = _create_reset_token(user.id, session)
            send_password_reset_email(user.email, token)
    return {"message": "If that email is registered, a reset link has been sent"}


@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, req: ResetPasswordRequest, session: Session = Depends(get_session)):
    """Set a new password using a valid reset token."""
    error = _validate_password(req.new_password)
    if error:
        raise HTTPException(status_code=400, detail=error)

    db_token = _find_email_token(PasswordResetToken, req.token, session)

    if not db_token:
        raise HTTPException(status_code=400, detail="Invalid reset link")
    if db_token.used:
        raise HTTPException(status_code=400, detail="This reset link has already been used")
    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset link has expired")

    user = session.get(User, db_token.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Invalid reset link")

    user.hashed_password = hash_password(req.new_password)
    # Completing a reset proves control of the email inbox.
    user.email_verified = True
    db_token.used = True

    # Invalidate every other outstanding reset token for this user.
    other_tokens = session.exec(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,  # noqa: E712
        )
    ).all()
    for t in other_tokens:
        t.used = True

    session.commit()
    return {"message": "Password updated successfully"}


@router.get("/unsubscribe")
def unsubscribe(token: str, session: Session = Depends(get_session)):
    """Unsubscribe from marketing/reminder emails using a secure token."""
    from app.auth.utils import verify_unsubscribe_token
    user_id = verify_unsubscribe_token(token)

    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired unsubscribe link")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.marketing_emails_enabled = False
    session.commit()
    return {"message": "Successfully unsubscribed from weekly reminders."}


@router.get("/me")
def get_me(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    """Return the authenticated user's profile."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Invalid session")
    return {
        "id":             user.id,
        "email":          user.email,
        "name":           user.name,
        "email_verified": user.email_verified,
        "created_at":     user.created_at.isoformat(),
    }
