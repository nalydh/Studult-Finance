from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint

class Category(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_category_user_name"),)

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    name: str = Field(index=True)
    color_index: int = Field(default=0)
    sort_order: int = Field(default=0)

class CategoryCreate(SQLModel):
    name: str
    color_index: int = 0

class CategoryUpdate(SQLModel):
    name: str | None = None
    color_index: int | None = None
