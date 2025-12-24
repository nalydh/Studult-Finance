from sqlmodel import SQLModel

class BudgetInput(SQLModel):
  income: float
  needs_pct: float
  wants_pct: float
  savings_pct: float

class BudgetOutput(SQLModel):
  needs: float
  wants: float
  savings: float