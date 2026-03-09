from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
from app.database import get_session
from app.models.preference import Preference
from app.models.incomeevent import IncomeEvent
from app.models.budgetitem import BudgetItem


class BudgetItemUpdate(BaseModel):
    name: str | None = None
    amount: float | None = None

router = APIRouter(prefix="/budget", tags=["budget"])

# Preferences Endpoints
@router.post("/preferences")
def insert_preference(data: Preference, session: Session = Depends(get_session)):
    total_pct = data.needs_pct + data.wants_pct + data.savings_pct
    if not all(0 <= pct <= 100 for pct in [data.needs_pct, data.wants_pct, data.savings_pct]):
        raise HTTPException(status_code=400, detail="Percentages must be between 0 and 100")
    if total_pct != 100:
        raise HTTPException(status_code=400, detail="The total split must equal 100%")

    try:
        session.add(data)
        session.commit()
        session.refresh(data)
        return data
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
    
@router.get("/preferences")
def get_preference(session: Session = Depends(get_session)):
    try:
        statement = select(Preference).limit(1)
        result = session.exec(statement).first()

        if not result:
            return {"error": "No preferences found"}
        return result
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
    
# Budget Items Endpoints
@router.post("/items")
def insert_budget_item(data: BudgetItem, session: Session = Depends(get_session)):
    try:
        session.add(data)
        session.commit()
        session.refresh(data)
        return data
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
    
@router.delete("/items/{item_id}")
def delete_budget_item(item_id: int, session: Session = Depends(get_session)):
    try:
        statement = select(BudgetItem).where(BudgetItem.id == item_id)
        item = session.exec(statement).first()
        if item:
            session.delete(item)
            session.commit()
            return {"message": "Item deleted successfully"}
        else:
            raise HTTPException(status_code=400, detail="Item not found")
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
    
@router.put("/items/{item_id}")
def update_budget_item(item_id: int, data: BudgetItemUpdate, session: Session = Depends(get_session)):
    statement = select(BudgetItem).where(BudgetItem.id == item_id)
    item = session.exec(statement).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if data.name is not None:
        item.name = data.name
    if data.amount is not None:
        item.amount = data.amount

    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.get("/items")
def get_budget_items(session: Session = Depends(get_session)):
    try:
        statement = select(BudgetItem)
        results = session.exec(statement).all()
        return results
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))

@router.get("/current-week-split")
def get_current_week_split(session: Session = Depends(get_session)):
    """Return the IncomeEvent for this Mon–Sun week, or null if none exists."""
    now = datetime.now()
    start_of_week = now - timedelta(days=now.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

    existing = session.exec(
        select(IncomeEvent).where(IncomeEvent.date >= start_of_week)
    ).first()

    if existing:
        return existing
    return None

@router.post("/calculate")
def calculate_and_insert_budget(income_event: IncomeEvent, session: Session = Depends(get_session)):
    try:
        # ── Weekly Time Fence: block duplicate splits in the same Mon→Sun week ──
        now = datetime.now()
        start_of_week = now - timedelta(days=now.weekday())          # Monday
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

        existing_split = session.exec(
            select(IncomeEvent).where(IncomeEvent.date >= start_of_week)
        ).first()

        if existing_split:
            raise HTTPException(
                status_code=400,
                detail="You have already logged a split this week. Please edit your accounts manually if you need to make corrections."
            )
        # ─────────────────────────────────────────────────────────────────────────

        pref_statement = select(Preference).limit(1)
        preferences = session.exec(pref_statement).first()
        if not preferences:
            raise HTTPException(status_code=400, detail="No preferences found")

        # Calculate allocations
        needs_amount = (preferences.needs_pct / 100) * income_event.amount
        wants_amount = (preferences.wants_pct / 100) * income_event.amount
        savings_amount = (preferences.savings_pct / 100) * income_event.amount

        # Update income event with allocations
        income_event.needs_allocated = needs_amount
        income_event.wants_allocated = wants_amount
        income_event.savings_allocated = savings_amount
        income_event.strategy_name = preferences.strategy_name
        income_event.source = "Income"


        session.add(income_event)
        session.commit()
        session.refresh(income_event)

        return income_event
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
