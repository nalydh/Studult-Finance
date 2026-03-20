from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from sqlmodel import Session, select, func
from app.database import get_session
from app.models.snapshot import NetWorthSnapshot
from app.models.account import Account
from app.models.asset import Asset
from app.auth.dependencies import get_current_user_id

router = APIRouter(prefix="/snapshots", tags=["snapshots"])


@router.get("/streak")
def get_streak(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    """
    Returns the number of consecutive months (including the current month
    if checked in) that the authenticated user has completed a check-in.
    """
    snapshots = session.exec(
        select(NetWorthSnapshot)
        .where(NetWorthSnapshot.user_id == user_id)
        .order_by(NetWorthSnapshot.snapshot_date.desc())
    ).all()

    if not snapshots:
        return {"streak": 0}

    checked_months = set()
    for s in snapshots:
        d = s.snapshot_date
        checked_months.add((d.year, d.month))

    latest = snapshots[0].snapshot_date
    year, month = latest.year, latest.month
    streak = 0

    while (year, month) in checked_months:
        streak += 1
        if month == 1:
            month = 12
            year -= 1
        else:
            month -= 1

    return {"streak": streak}


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
