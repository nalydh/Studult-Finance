from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class NetWorthSnapshot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    snapshot_date: datetime = Field(default_factory=datetime.now)

    # Completely calculated by the backend
    total_cash: float
    total_investments: float
    total_liabilities: float
    total_assets: float
    net_worth: float

    # One line from the user on what happened this month. Because StuFin never
    # records transactions, this is the only thing that can ever explain a
    # movement in net worth after the fact.
    note: Optional[str] = Field(default=None, max_length=280)
