from sqlmodel import SQLModel, Field

class Category(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    color_index: int = Field(default=0)
    sort_order: int = Field(default=0)

class CategoryCreate(SQLModel):
    name: str
    color_index: int = 0

class CategoryUpdate(SQLModel):
    name: str | None = None
    color_index: int | None = None
