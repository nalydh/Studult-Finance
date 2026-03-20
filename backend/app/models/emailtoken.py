from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class EmailVerificationToken(SQLModel, table=True):
    """One-time token emailed after registration to verify email ownership."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    token: str = Field(index=True, unique=True)
    expires_at: datetime
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PasswordResetToken(SQLModel, table=True):
    """One-time token emailed when a user requests a password reset."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    token: str = Field(index=True, unique=True)
    expires_at: datetime
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
