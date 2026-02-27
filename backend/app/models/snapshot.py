from sqlmodel import SQLModel, Field
from datetime import datetime


class NetWorthSnapshot(SQLModel, table=True):
  id: int | None = Field(default=None, primary_key=True)
  snapshot_date: datetime = Field(default_factory=datetime.now)
  liquid_cash: float
  investments: float
  liabilities: float
  ledger_assets_value: float
  total_net_worth: float


class SnapshotCreate(SQLModel):
  liquid_cash: float
  investments: float
  liabilities: float
