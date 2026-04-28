import secrets
import re
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional

from app.database import get_session
from app.models.user import User
from app.models.emailtoken import EmailVerificationToken, PasswordResetToken
from app.auth.utils import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user_id
from app.auth.email_service import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


# ── Request schemas ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    marketing_emails_enabled: bool = False


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    email: str
    name: Optional[str] = None
    google_id: str
    marketing_emails_enabled: bool = False


class ForgotPasswordRequest(BaseModel):
    email: str


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


def _create_verification_token(user_id: int, session: Session) -> str:
    """Generate and persist an email verification token (24 h TTL)."""
    token = secrets.token_urlsafe(32)
    db_token = EmailVerificationToken(
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    session.add(db_token)
    session.commit()
    return token


def _create_reset_token(user_id: int, session: Session) -> str:
    """Generate and persist a password reset token (1 h TTL)."""
    token = secrets.token_urlsafe(32)
    db_token = PasswordResetToken(
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(minutes=15),
    )
    session.add(db_token)
    session.commit()
    return token


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
def register(req: RegisterRequest, session: Session = Depends(get_session)):
    """Create a new email/password account and send a verification email."""
    existing = session.exec(select(User).where(User.email == req.email)).first()
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

    # Send verification email (non-blocking — errors are logged, not raised)
    token = _create_verification_token(user.id, session)
    send_verification_email(user.email, token)

    return user_response(user)


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, req: LoginRequest, session: Session = Depends(get_session)):
    """Sign in with email + password. Rate-limited to 10 attempts/minute per IP."""
    user = session.exec(select(User).where(User.email == req.email)).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email address to log in.")
    return user_response(user)


@router.post("/google")
def google_signin(req: GoogleLoginRequest, session: Session = Depends(get_session)):
    """
    Called by NextAuth after a successful Google OAuth flow.
    Finds or creates the user, linking Google ID to existing email accounts.
    Google-authenticated users are considered verified.
    """
    user = session.exec(select(User).where(User.google_id == req.google_id)).first()

    if not user:
        user = session.exec(select(User).where(User.email == req.email)).first()
        if user:
            user.google_id = req.google_id
            if not user.name:
                user.name = req.name
            user.email_verified = True  # Google verifies emails
        else:
            user = User(
                email=req.email,
                name=req.name,
                google_id=req.google_id,
                email_verified=True,
                marketing_emails_enabled=req.marketing_emails_enabled,
            )
            session.add(user)

    session.commit()
    session.refresh(user)
    return user_response(user)


@router.get("/verify-email")
def verify_email(token: str, session: Session = Depends(get_session)):
    """Confirm ownership of an email address via the link sent after registration."""
    db_token = session.exec(
        select(EmailVerificationToken).where(EmailVerificationToken.token == token)
    ).first()

    if not db_token:
        raise HTTPException(status_code=400, detail="Invalid verification link")
    if db_token.used:
        raise HTTPException(status_code=400, detail="This link has already been used")
    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification link has expired")

    user = session.get(User, db_token.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Invalid verification link")

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
    """Resend the email verification link."""
    user = session.exec(select(User).where(User.email == req.email)).first()
    if not user:
        return {"message": "If that account exists, a new verification link has been sent."}
    if user.email_verified:
        return {"message": "Email already verified"}

    # Enforce a strict 30-second cooldown per user
    last_token = session.exec(
        select(EmailVerificationToken)
        .where(EmailVerificationToken.user_id == user.id)
        .order_by(EmailVerificationToken.created_at.desc())
    ).first()

    if last_token and (datetime.utcnow() - last_token.created_at).total_seconds() < 30:
        raise HTTPException(status_code=429, detail="Please wait at least 30 seconds before requesting a new link.")

    token = _create_verification_token(user.id, session)
    send_verification_email(user.email, token)
    return {"message": "If that account exists, a new verification link has been sent."}


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    req: ForgotPasswordRequest,
    session: Session = Depends(get_session),
):
    """
    Send a password reset link. Always returns 200 to avoid user enumeration.
    """
    user = session.exec(select(User).where(User.email == req.email)).first()
    if user and user.hashed_password:  # Only email/password accounts can reset
        # Enforce a strict 30-second cooldown per user
        last_token = session.exec(
            select(PasswordResetToken)
            .where(PasswordResetToken.user_id == user.id)
            .order_by(PasswordResetToken.created_at.desc())
        ).first()

        if last_token and (datetime.utcnow() - last_token.created_at).total_seconds() < 30:
            raise HTTPException(status_code=429, detail="Please wait at least 30 seconds before requesting a new link.")

        token = _create_reset_token(user.id, session)
        send_password_reset_email(user.email, token)
    return {"message": "If that email is registered, a reset link has been sent"}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, session: Session = Depends(get_session)):
    """Set a new password using a valid reset token."""
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    db_token = session.exec(
        select(PasswordResetToken).where(PasswordResetToken.token == req.token)
    ).first()

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
    db_token.used = True
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
