from sqlmodel import SQLModel, Field
from typing import Optional


class Account(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    name: str
    category: str 
    balance: float = Field(default=0.0)
    total_contributions: float = Field(default=0.0)


class AccountCreate(SQLModel):
    name: str
    category: str
    balance: float
    total_contributions: float = 0.0


class AccountUpdate(SQLModel):
    name: str | None = None
    category: str | None = None
    balance: float | None = None
    total_contributions: float | None = None
