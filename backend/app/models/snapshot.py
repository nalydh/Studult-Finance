from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class NetWorthSnapshot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    snapshot_date: datetime = Field(default_factory=datetime.now)

    # Completely calculated by the backend
    total_cash: float
    total_investments: float
    total_liabilities: float
    total_assets: float
    net_worth: float
