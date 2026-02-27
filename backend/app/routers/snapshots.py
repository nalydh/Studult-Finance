from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from app.database import get_session
from app.models.asset import Asset
from app.models.snapshot import NetWorthSnapshot, SnapshotCreate

router = APIRouter(prefix="/snapshots", tags=["snapshots"])


@router.post("/")
def create_snapshot(data: SnapshotCreate, session: Session = Depends(get_session)):
    try:
        # Sum market_value of all unsold assets (treat NULL market_value as 0)
        statement = select(func.coalesce(func.sum(func.coalesce(Asset.market_value, 0)), 0)).where(
            Asset.is_sold == False
        )
        ledger_assets_value: float = session.exec(statement).one()

        total_net_worth = (data.liquid_cash + data.investments + ledger_assets_value) - data.liabilities

        snapshot = NetWorthSnapshot(
            liquid_cash=data.liquid_cash,
            investments=data.investments,
            liabilities=data.liabilities,
            ledger_assets_value=ledger_assets_value,
            total_net_worth=total_net_worth,
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
        statement = select(NetWorthSnapshot).order_by(NetWorthSnapshot.snapshot_date.asc())
        results = session.exec(statement).all()
        return results
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
