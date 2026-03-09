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

class PreferenceUpdate(BaseModel):
    needs_pct: float | None = None
    wants_pct: float | None = None
    savings_pct: float | None = None
    week_starts_on: str | None = None
    income_type: str | None = None

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

@router.put("/preferences")
def update_preference(data: PreferenceUpdate, session: Session = Depends(get_session)):
    try:
        statement = select(Preference).limit(1)
        pref = session.exec(statement).first()
        if not pref:
            raise HTTPException(status_code=404, detail="No preferences found to update")

        if data.needs_pct is not None:
            pref.needs_pct = data.needs_pct
        if data.wants_pct is not None:
            pref.wants_pct = data.wants_pct
        if data.savings_pct is not None:
            pref.savings_pct = data.savings_pct
        if data.week_starts_on is not None:
            pref.week_starts_on = data.week_starts_on
        if data.income_type is not None:
            pref.income_type = data.income_type

        # Validate split totals if any percentage was updated
        if any(x is not None for x in [data.needs_pct, data.wants_pct, data.savings_pct]):
            total = pref.needs_pct + pref.wants_pct + pref.savings_pct
            if total != 100:
                raise HTTPException(status_code=400, detail="The total split must equal 100%")

        session.add(pref)
        session.commit()
        session.refresh(pref)
        return pref
    except HTTPException:
        raise
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
    """Return the IncomeEvent for the current week based on the user's week_starts_on preference."""
    pref = session.exec(select(Preference).limit(1)).first()
    week_start_day = _weekday_from_name(pref.week_starts_on if pref else "Monday")

    now = datetime.now()
    days_since_start = (now.weekday() - week_start_day) % 7
    start_of_week = (now - timedelta(days=days_since_start)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    existing = session.exec(
        select(IncomeEvent).where(IncomeEvent.date >= start_of_week)
    ).first()

    if existing:
        return existing
    return None


def _weekday_from_name(name: str) -> int:
    """Map a day name to Python's weekday int (Monday=0 … Sunday=6)."""
    mapping = {
        "monday": 0, "tuesday": 1, "wednesday": 2,
        "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6,
    }
    return mapping.get(name.lower(), 0)


@router.post("/calculate")
def calculate_and_insert_budget(income_event: IncomeEvent, session: Session = Depends(get_session)):
    try:
        # ── Fetch user preference for week start day ──
        pref = session.exec(select(Preference).limit(1)).first()
        week_start_day = _weekday_from_name(pref.week_starts_on if pref else "Monday")

        # ── Weekly Time Fence: block duplicate splits in the same week ──
        now = datetime.now()
        days_since_start = (now.weekday() - week_start_day) % 7
        start_of_week = (now - timedelta(days=days_since_start)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        existing_split = session.exec(
            select(IncomeEvent).where(IncomeEvent.date >= start_of_week)
        ).first()

        if existing_split:
            raise HTTPException(
                status_code=400,
                detail="You have already logged a split this week. Please edit your accounts manually if you need to make corrections."
            )
        # ─────────────────────────────────────────────────────────────────────────

        preferences = pref
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
