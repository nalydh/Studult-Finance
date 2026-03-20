from sqlmodel import SQLModel, Field
from typing import Optional


class InvestmentContribution(SQLModel, table=True):
    """
    Each row is a snapshot for an investment account on a given date.
    - amount: how much was contributed on this date (0 for pure balance snapshots)
    - balance_at_date: the account balance recorded at the time of this entry

    This gives us a proper time-series for both the 'contributions' and 'value' lines.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int
    date: str     
    amount: float    
    balance_at_date: float
    note: Optional[str] = None


class InvestmentContributionCreate(SQLModel):
    account_id: int
    date: str
    amount: float
    balance_at_date: float
    note: Optional[str] = None
