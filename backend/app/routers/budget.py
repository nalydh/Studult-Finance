from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
from app.database import get_session
from app.models.preference import Preference
from app.models.incomeevent import IncomeEvent
from app.models.budgetitem import BudgetItem
from app.auth.dependencies import get_current_user_id


class BudgetItemUpdate(BaseModel):
    name: str | None = None
    amount: float | None = None
    frequency: str | None = None


class PreferenceUpdate(BaseModel):
    strategy_name: str | None = None
    needs_pct: float | None = None
    wants_pct: float | None = None
    savings_pct: float | None = None
    week_starts_on: str | None = None
    income_type: str | None = None
    salary_amount: float | None = None
    salary_frequency: str | None = None
    tutorial_completed: bool | None = None


router = APIRouter(prefix="/budget", tags=["budget"])


# ── Preferences ───────────────────────────────────────────────────

@router.post("/preferences")
def insert_preference(
    data: Preference,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    total_pct = data.needs_pct + data.wants_pct + data.savings_pct
    if not all(0 <= pct <= 100 for pct in [data.needs_pct, data.wants_pct, data.savings_pct]):
        raise HTTPException(status_code=400, detail="Percentages must be between 0 and 100")
    if total_pct != 100:
        raise HTTPException(status_code=400, detail="The total split must equal 100%")

    try:
        data.user_id = user_id
        session.add(data)
        session.commit()
        session.refresh(data)
        return data
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")


@router.get("/preferences")
def get_preference(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        result = session.exec(
            select(Preference).where(Preference.user_id == user_id).limit(1)
        ).first()
        if not result:
            return {"error": "No preferences found"}
            
        data = result.model_dump()
        expected_weekly = None
        
        if data.get("income_type") and data["income_type"].lower() == "salary" and data.get("salary_amount"):
            amount = float(data["salary_amount"])
            freq = str(data.get("salary_frequency") or "monthly").lower()
            
            if freq == "yearly":
                expected_weekly = amount / 52
            elif freq == "monthly":
                expected_weekly = (amount * 12) / 52
            elif freq == "fortnightly":
                expected_weekly = amount / 2
            else:  # weekly
                expected_weekly = amount
                
            expected_weekly = round(expected_weekly, 2)
            
        data["expected_weekly_income"] = expected_weekly
        return data
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")


@router.put("/preferences")
def update_preference(
    data: PreferenceUpdate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        pref = session.exec(
            select(Preference).where(Preference.user_id == user_id).limit(1)
        ).first()
        if not pref:
            raise HTTPException(status_code=404, detail="No preferences found to update")

        if data.strategy_name is not None:
            pref.strategy_name = data.strategy_name
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
        if data.salary_amount is not None:
            pref.salary_amount = data.salary_amount
        if data.salary_frequency is not None:
            pref.salary_frequency = data.salary_frequency
        if data.tutorial_completed is not None:
            pref.tutorial_completed = data.tutorial_completed

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
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")


# ── Budget Items ──────────────────────────────────────────────────

@router.post("/items")
def insert_budget_item(
    data: BudgetItem,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        data.user_id = user_id
        session.add(data)
        session.commit()
        session.refresh(data)
        return data
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")


@router.get("/items")
def get_budget_items(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        statement = select(BudgetItem).where(BudgetItem.user_id == user_id)
        return session.exec(statement).all()
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")


@router.put("/items/{item_id}")
def update_budget_item(
    item_id: int,
    data: BudgetItemUpdate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    item = session.get(BudgetItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if data.name is not None:
        item.name = data.name
    if data.amount is not None:
        item.amount = data.amount
    if data.frequency is not None:
        item.frequency = data.frequency

    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.delete("/items/{item_id}")
def delete_budget_item(
    item_id: int,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        item = session.get(BudgetItem, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        if item.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        session.delete(item)
        session.commit()
        return {"message": "Item deleted successfully"}
    except HTTPException:
        raise
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")


# ── Weekly Split + Calculate ──────────────────────────────────────

@router.get("/current-week-split")
def get_current_week_split(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    pref = session.exec(
        select(Preference).where(Preference.user_id == user_id).limit(1)
    ).first()
    week_start_day = _weekday_from_name(pref.week_starts_on if pref else "Monday")

    now = datetime.now()
    days_since_start = (now.weekday() - week_start_day) % 7
    start_of_week = (now - timedelta(days=days_since_start)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    existing = session.exec(
        select(IncomeEvent).where(
            IncomeEvent.user_id == user_id,
            IncomeEvent.date >= start_of_week,
        )
    ).first()

    return existing if existing else None


def _weekday_from_name(name: str) -> int:
    mapping = {
        "monday": 0, "tuesday": 1, "wednesday": 2,
        "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6,
    }
    return mapping.get(name.lower(), 0)


@router.post("/calculate")
def calculate_and_insert_budget(
    income_event: IncomeEvent,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        pref = session.exec(
            select(Preference).where(Preference.user_id == user_id).limit(1)
        ).first()
        week_start_day = _weekday_from_name(pref.week_starts_on if pref else "Monday")

        now = datetime.now()
        days_since_start = (now.weekday() - week_start_day) % 7
        start_of_week = (now - timedelta(days=days_since_start)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        existing_split = session.exec(
            select(IncomeEvent).where(
                IncomeEvent.user_id == user_id,
                IncomeEvent.date >= start_of_week,
            )
        ).first()

        if existing_split:
            raise HTTPException(
                status_code=400,
                detail="You have already logged a split this week. Please edit your accounts manually if you need to make corrections.",
            )

        if not pref:
            raise HTTPException(status_code=400, detail="No preferences found")

        # ── Streak Logic ── #
        if pref.last_submission_date:
            days_since_last = (now - pref.last_submission_date).days
            if days_since_last < 8:
                pref.current_streak += 1
            else:
                pref.current_streak = 1 # Broken streak resetting to 1
        else:
            pref.current_streak = 1
            
        pref.last_submission_date = now

        # Add AI tokens if they hit a modulo of 5 (e.g. 5, 10, 15 weeks)
        if pref.current_streak > 0 and pref.current_streak % 5 == 0:
            pref.ai_tokens += 3

        needs_amount   = (pref.needs_pct   / 100) * income_event.amount
        wants_amount   = (pref.wants_pct   / 100) * income_event.amount
        savings_amount = (pref.savings_pct / 100) * income_event.amount

        income_event.user_id           = user_id
        income_event.needs_allocated   = needs_amount
        income_event.wants_allocated   = wants_amount
        income_event.savings_allocated = savings_amount
        income_event.strategy_name     = pref.strategy_name
        income_event.source            = "Income"

        session.add(pref)
        session.add(income_event)
        session.commit()
        session.refresh(income_event)
        
        return {
            "income_event": income_event,
            "streak": pref.current_streak,
            "ai_tokens": pref.ai_tokens
        }
    except HTTPException:
        raise
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")
