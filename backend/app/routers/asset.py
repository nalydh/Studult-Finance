from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.asset import Asset
from app.models.incomeevent import IncomeEvent
from datetime import datetime

router = APIRouter(prefix="/assets", tags=["assets"])

@router.post("/")
def insert_asset(data: Asset, session: Session = Depends(get_session)):
    try:
        session.add(data)
        session.commit()
        session.refresh(data)
        return data
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
    
@router.get("/")
def get_assets(session: Session = Depends(get_session)):
    try:
        statement = select(Asset)
        results = session.exec(statement).all()
        return results
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
    
@router.put("/{id}/sell")
def sell_asset(id: int, sale_price: float, destination_wallet: str, session: Session = Depends(get_session)):
    # Validate destination_wallet
    valid_wallets = ["needs", "wants", "savings"]
    if destination_wallet.lower() not in valid_wallets:
        raise HTTPException(status_code=400, detail=f"destination_wallet must be one of: {valid_wallets}")
    
    wallet_lower = destination_wallet.lower()

    try:
        statement = select(Asset).where(Asset.id == id)
        asset = session.exec(statement).first()
        if not asset:
            raise HTTPException(status_code=400, detail="Asset not found")
        if asset.is_sold:
            raise HTTPException(status_code=400, detail="Asset is already sold")

        asset.is_sold = True
        asset.sale_price = sale_price
        asset.date_sold = datetime.now()

        income_event = IncomeEvent(
            amount=sale_price,
            source=f"Asset Sale: {asset.name} ({asset.category})",
            strategy_name="Direct Allocation",
            needs_allocated=sale_price if wallet_lower == "needs" else 0,
            wants_allocated=sale_price if wallet_lower == "wants" else 0,
            savings_allocated=sale_price if wallet_lower == "savings" else 0,
        )        

        session.add(asset)
        session.add(income_event)
        session.commit()
        session.refresh(asset)
        session.refresh(income_event)
        return {"asset": asset, "income_event": income_event}
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))