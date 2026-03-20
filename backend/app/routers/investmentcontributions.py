from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.investmentcontribution import InvestmentContribution, InvestmentContributionCreate
from app.models.account import Account
from app.auth.dependencies import get_current_user_id

router = APIRouter(prefix="/investment-contributions", tags=["investment-contributions"])


@router.get("/{account_id}")
def get_contributions(
    account_id: int,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    """Return contribution entries for an account — only if the account belongs to this user."""
    # Verify ownership of the account
    account = session.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    statement = (
        select(InvestmentContribution)
        .where(InvestmentContribution.account_id == account_id)
        .order_by(InvestmentContribution.date)
    )
    return session.exec(statement).all()


@router.post("/")
def add_contribution(
    data: InvestmentContributionCreate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    # Verify ownership before inserting
    account = session.get(Account, data.account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    entry = InvestmentContribution(**data.model_dump())
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


@router.delete("/{entry_id}")
def delete_contribution(
    entry_id: int,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    entry = session.get(InvestmentContribution, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    # Verify ownership via the parent account
    account = session.get(Account, entry.account_id)
    if not account or account.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    session.delete(entry)
    session.commit()
    return {"ok": True}
