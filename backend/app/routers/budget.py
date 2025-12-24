from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database import get_session
from app.models.preference import Preference
from app.schemas.budget import BudgetInput, BudgetOutput

router = APIRouter(prefix="/budget", tags=["budget"])

@router.post("/preferences")
def insert_preference(data: Preference, session: Session = Depends(get_session)):
    total_pct = data.needs_pct + data.wants_pct + data.savings_pct
    if not all(0 <= pct <= 100 for pct in [data.needs_pct, data.wants_pct, data.savings_pct]):
        return {"error": "Percentages must be between 0 and 100"}
    if total_pct != 100:
        return {"error": "The total split must equal 100%"}

    try:
        session.add(data)
        session.commit()
        session.refresh(data)
        return data
    except Exception as error:
        return {"error": str(error)}
    
@router.get("/preferences")
def get_preference(session: Session = Depends(get_session)):
    try:
        statement = select(Preference).limit(1)
        result = session.exec(statement)

        if not result:
            return {"error": "No preferences found"}
        return result
    except Exception as error:
        return {"error": str(error)}
  