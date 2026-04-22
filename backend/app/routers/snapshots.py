from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from sqlmodel import Session, select, func
from app.database import get_session
from app.models.snapshot import NetWorthSnapshot
from app.models.preference import Preference
from app.models.account import Account
from app.models.asset import Asset
from app.auth.dependencies import get_current_user_id

router = APIRouter(prefix="/snapshots", tags=["snapshots"])


@router.get("/streak")
def get_streak(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
  pref = session.exec(
      select(Preference).where(Preference.user_id == user_id).limit(1)
  ).first()

  if not pref:
      return {"streak": 0, "ai_tokens": 0}

  return {
      "streak": pref.current_streak,
      "ai_tokens": pref.ai_tokens
  }


@router.post("/")
def create_snapshot(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        now = datetime.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        existing_snapshot = session.exec(
            select(NetWorthSnapshot).where(
                NetWorthSnapshot.user_id == user_id,
                NetWorthSnapshot.snapshot_date >= start_of_month,
            )
        ).first()

        if existing_snapshot:
            raise HTTPException(
                status_code=400,
                detail="You have already logged a snapshot this month. See you next month!",
            )

        # Tally up this user's accounts only
        cash_stmt = select(func.coalesce(func.sum(Account.balance), 0)).where(
            Account.user_id == user_id, Account.category == "Cash"
        )
        total_cash = session.exec(cash_stmt).one()

        inv_stmt = select(func.coalesce(func.sum(Account.balance), 0)).where(
            Account.user_id == user_id, Account.category == "Investment"
        )
        total_investments = session.exec(inv_stmt).one()

        liab_stmt = select(func.coalesce(func.sum(Account.balance), 0)).where(
            Account.user_id == user_id, Account.category == "Liability"
        )
        total_liabilities = session.exec(liab_stmt).one()

        asset_stmt = select(
            func.coalesce(func.sum(func.coalesce(Asset.market_value, Asset.purchase_price)), 0)
        ).where(Asset.user_id == user_id, Asset.is_sold == False)
        total_assets = session.exec(asset_stmt).one()

        net_worth = (total_cash + total_investments + total_assets) - total_liabilities

        snapshot = NetWorthSnapshot(
            user_id=user_id,
            total_cash=total_cash,
            total_investments=total_investments,
            total_liabilities=total_liabilities,
            total_assets=total_assets,
            net_worth=net_worth,
        )

        session.add(snapshot)
        session.commit()
        session.refresh(snapshot)
        return snapshot

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/")
def get_snapshots(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        statement = (
            select(NetWorthSnapshot)
            .where(NetWorthSnapshot.user_id == user_id)
            .order_by(NetWorthSnapshot.snapshot_date.asc())
        )
        return session.exec(statement).all()
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
