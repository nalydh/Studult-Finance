from sqlmodel import Field, SQLModel

class Preference(SQLModel, table=True):
  id: int | None = Field(default=None, primary_key=True)
  strategy_name: str
  needs_pct: float
  wants_pct: float
  savings_pct: float
  