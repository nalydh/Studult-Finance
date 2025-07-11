from typing import Union
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class BudgetInput(BaseModel):
  income: float
  needs_pct: float
  wants_pct: float
  savings_pct: float

class BudgetOutput(BaseModel):
  needs: float
  wants: float
  savings: float

@app.post("/budget")
def calculate_split(data: BudgetInput) -> BudgetOutput:
  total_pct = data.needs_pct + data.wants_pct + data.savings_pct

  if total_pct != 100:
    return {"error": "The total split must equal 100%"}

  return {
    "needs": round((data.income / 100 * data.needs_pct), 2),
    "wants": round((data.income / 100 * data.wants_pct), 2),
    "savings": round((data.income / 100 * data.savings_pct), 2),
  }
