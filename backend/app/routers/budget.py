from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database import get_session
from app.models.preference import Preference
from app.models.incomeevent import IncomeEvent
from app.models.budgetitem import BudgetItem

router = APIRouter(prefix="/budget", tags=["budget"])

# Preferences Endpoints
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
        result = session.exec(statement).first()

        if not result:
            return {"error": "No preferences found"}
        return result
    except Exception as error:
        return {"error": str(error)}
    
# Budget Items Endpoints
@router.post("/items")
def insert_budget_item(data: BudgetItem, session: Session = Depends(get_session)):
    try:
        session.add(data)
        session.commit()
        session.refresh(data)
        return data
    except Exception as error:
        return {"error": str(error)}
    
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
            return {"error": "Item not found"}
    except Exception as error:
        return {"error": str(error)}
    
@router.get("/items")
def get_budget_items(session: Session = Depends(get_session)):
    try:
        statement = select(BudgetItem)
        results = session.exec(statement).all()
        return results
    except Exception as error:
        return {"error": str(error)}

# Budget Insertion Endpoint
@router.post("/calculate")
def calculate_and_insert_budget(income_event: IncomeEvent, session: Session = Depends(get_session)):
    try:
        pref_statement = select(Preference).limit(1)
        preferences = session.exec(pref_statement).first()
        if not preferences:
            return {"error": "No preferences found"}

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
        return {"error": str(error)}
