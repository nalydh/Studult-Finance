from sqlmodel import SQLModel, Field

class BudgetItem(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    # user_id: int = Field(foreign_key="user.id")
    name: str
    amount: float
    category: str