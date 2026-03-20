from sqlmodel import SQLModel, Field
from datetime import datetime

class IncomeEvent(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    date: datetime = Field(default_factory=datetime.utcnow)
    amount: float
    source: str
    strategy_name: str 
    needs_allocated: float
    wants_allocated: float
    savings_allocated: float