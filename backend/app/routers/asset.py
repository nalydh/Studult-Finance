from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.asset import Asset, AssetUpdate
from app.models.incomeevent import IncomeEvent
from app.auth.dependencies import get_current_user_id
from datetime import datetime

router = APIRouter(prefix="/assets", tags=["assets"])


@router.post("/")
def insert_asset(
    data: Asset,
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


@router.get("/")
def get_assets(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        statement = (
            select(Asset)
            .where(Asset.user_id == user_id)
            .order_by(Asset.id)
        )
        return session.exec(statement).all()
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")


@router.put("/{id}/sell")
def sell_asset(
    id: int,
    sale_price: float,
    destination_wallet: str,
    date_sold: str,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    valid_wallets = ["needs", "wants", "savings"]
    if destination_wallet.lower() not in valid_wallets:
        raise HTTPException(status_code=400, detail=f"destination_wallet must be one of: {valid_wallets}")

    wallet_lower = destination_wallet.lower()

    try:
        asset = session.get(Asset, id)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        if asset.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        if asset.is_sold:
            raise HTTPException(status_code=400, detail="Asset is already sold")

        asset.is_sold = True
        asset.sale_price = sale_price
        asset.date_sold = datetime.fromisoformat(date_sold) if date_sold else datetime.now()

        income_event = IncomeEvent(
            user_id=user_id,
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
    except HTTPException:
        raise
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")


@router.put("/{id}")
def update_asset(
    id: int,
    data: AssetUpdate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        asset = session.get(Asset, id)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        if asset.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        if asset.is_sold:
            raise HTTPException(status_code=400, detail="Cannot edit a sold asset")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(asset, key, value)

        session.add(asset)
        session.commit()
        session.refresh(asset)
        return asset
    except HTTPException:
        raise
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")


@router.delete("/{id}")
def delete_asset(
    id: int,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        asset = session.get(Asset, id)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        if asset.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        session.delete(asset)
        session.commit()
        return {"ok": True, "deleted_id": id}
    except HTTPException:
        raise
    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=400, detail="An unexpected error occurred. Please try again later.")