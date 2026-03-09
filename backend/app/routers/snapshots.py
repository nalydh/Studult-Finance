from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from sqlmodel import Session, select, func
from app.database import get_session
from app.models.snapshot import NetWorthSnapshot
from app.models.account import Account
from app.models.asset import Asset

router = APIRouter(prefix="/snapshots", tags=["snapshots"])


@router.post("/")
def create_snapshot(session: Session = Depends(get_session)):
    try:
        now = datetime.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
        # Check if a snapshot already exists for this month
        existing_snapshot = session.exec(
            select(NetWorthSnapshot).where(NetWorthSnapshot.snapshot_date >= start_of_month)
        ).first()

        if existing_snapshot:
            raise HTTPException(
                status_code=400, 
                detail="You have already logged a snapshot this month. See you next month!"
        )
        
        # 1. Tally up the Accounts (Database handles the math)
        cash_stmt = select(func.coalesce(func.sum(Account.balance), 0)).where(Account.category == "Cash")
        total_cash = session.exec(cash_stmt).one()

        inv_stmt = select(func.coalesce(func.sum(Account.balance), 0)).where(Account.category == "Investment")
        total_investments = session.exec(inv_stmt).one()

        liab_stmt = select(func.coalesce(func.sum(Account.balance), 0)).where(Account.category == "Liability")
        total_liabilities = session.exec(liab_stmt).one()

        # 2. Tally up the Physical Assets
        # Use market_value if set, otherwise fall back to purchase_price
        asset_stmt = select(
            func.coalesce(func.sum(func.coalesce(Asset.market_value, Asset.purchase_price)), 0)
        ).where(Asset.is_sold == False)
        total_assets = session.exec(asset_stmt).one()

        # 3. Calculate the True Net Worth
        net_worth = (total_cash + total_investments + total_assets) - total_liabilities

        # 4. Create the frozen snapshot
        snapshot = NetWorthSnapshot(
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

    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/")
def get_snapshots(session: Session = Depends(get_session)):
    try:
        # Order by date ascending so the frontend chart draws left-to-right
        statement = select(NetWorthSnapshot).order_by(NetWorthSnapshot.snapshot_date.asc())
        return session.exec(statement).all()
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
