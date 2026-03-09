from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.account import Account, AccountCreate, AccountUpdate

router = APIRouter(prefix="/accounts", tags=["accounts"])

# The strict buckets for the Monthly Check-In math
VALID_CATEGORIES = ["Cash", "Investment", "Liability"]


@router.post("/")
def create_account(data: AccountCreate, session: Session = Depends(get_session)):
    # 1. Validate Category
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be one of: {VALID_CATEGORIES}")

    try:
        account = Account(
            name=data.name,
            category=data.category,
            balance=data.balance,
        )
        session.add(account)
        session.commit()
        session.refresh(account)
        return account
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/")
def get_accounts(session: Session = Depends(get_session)):
    try:
        statement = select(Account).order_by(Account.category, Account.name)
        results = session.exec(statement).all()
        return results
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.put("/{id}")
def update_account(id: int, data: AccountUpdate, session: Session = Depends(get_session)):
    try:
        account = session.get(Account, id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        update_data = data.model_dump(exclude_unset=True)

        # Validate Category if they are trying to change it
        if "category" in update_data and update_data["category"] not in VALID_CATEGORIES:
            raise HTTPException(status_code=400, detail=f"Category must be one of: {VALID_CATEGORIES}")

        for key, value in update_data.items():
            setattr(account, key, value)

        session.add(account)
        session.commit()
        session.refresh(account)
        return account
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.delete("/{id}")
def delete_account(id: int, session: Session = Depends(get_session)):
    try:
        account = session.get(Account, id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        session.delete(account)
        session.commit()
        return {"ok": True, "deleted_id": id}
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
