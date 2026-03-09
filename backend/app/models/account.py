from sqlmodel import SQLModel, Field
from typing import Optional


class Account(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    category: str  # Strictly enforced: "Cash", "Investment", or "Liability"
    balance: float = Field(default=0.0)


class AccountCreate(SQLModel):
    name: str
    category: str
    balance: float


class AccountUpdate(SQLModel):
    name: str | None = None
    category: str | None = None
    balance: float | None = None
