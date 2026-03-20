from sqlmodel import SQLModel, Field

class BudgetItem(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    name: str
    amount: float
    category: str
    frequency: str = Field(default="weekly")