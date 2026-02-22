from sqlmodel import SQLModel, Field
from datetime import datetime

class Asset(SQLModel, table=True):
  id: int | None = Field(default=None, primary_key=True)
  # user_id: int = Field(foreign_key="user.id")
  name: str
  category: str
  purchase_price: float
  is_sold: bool = Field(default=False)
  sale_price: float | None = None
  date_acquired: datetime = Field(default_factory=datetime.now)
  date_sold: datetime | None = None

  @property
  def net_profit(self) -> float | None:
    if self.is_sold and self.sale_price is not None:
      return self.sale_price - self.purchase_price
    return None 