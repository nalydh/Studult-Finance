from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.account import Account, AccountCreate, AccountUpdate
from app.auth.dependencies import get_current_user_id

router = APIRouter(prefix="/accounts", tags=["accounts"])

VALID_CATEGORIES = ["Cash", "Investment", "Liability"]


@router.post("/")
def create_account(
    data: AccountCreate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be one of: {VALID_CATEGORIES}")

    try:
        account = Account(
            user_id=user_id,
            name=data.name,
            category=data.category,
            balance=data.balance,
            total_contributions=data.total_contributions,
        )
        session.add(account)
        session.commit()
        session.refresh(account)
        return account
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")


@router.get("/")
def get_accounts(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        statement = (
            select(Account)
            .where(Account.user_id == user_id)
            .order_by(Account.category, Account.name)
        )
        return session.exec(statement).all()
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")


@router.put("/{id}")
def update_account(
    id: int,
    data: AccountUpdate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        account = session.get(Account, id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        if account.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        update_data = data.model_dump(exclude_unset=True)

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
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")


@router.delete("/{id}")
def delete_account(
    id: int,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        account = session.get(Account, id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        if account.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        session.delete(account)
        session.commit()
        return {"ok": True, "deleted_id": id}
    except HTTPException:
        raise
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")
