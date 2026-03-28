from sqlmodel import Field, SQLModel

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
  