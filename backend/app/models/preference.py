from sqlmodel import Field, SQLModel
from datetime import datetime

class Preference(SQLModel, table=True):
  id: int | None = Field(default=None, primary_key=True)
  user_id: int = Field(foreign_key="user.id", unique=True, index=True)
  strategy_name: str
  needs_pct: float
  wants_pct: float
  savings_pct: float
  week_starts_on: str = Field(default="Monday")
  income_type: str = Field(default="Salary")
  salary_amount: float | None = None
  salary_frequency: str | None = None
  tutorial_completed: bool = Field(default=False)
  current_streak: int = Field(default=0)
  last_submission_date: datetime | None = None
  ai_tokens: int = Field(default=0)
  