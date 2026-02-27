from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from app.database import get_session
from app.models.category import Category, CategoryCreate, CategoryUpdate
from app.models.asset import Asset

router = APIRouter(prefix="/categories", tags=["categories"])

MAX_CATEGORIES = 5

@router.get("/")
def get_categories(session: Session = Depends(get_session)):
    """List all categories ordered by sort_order."""
    statement = select(Category).order_by(Category.sort_order)
    return session.exec(statement).all()

@router.post("/")
def create_category(data: CategoryCreate, session: Session = Depends(get_session)):
    trimmed = data.name.strip()
    if not trimmed:
        raise HTTPException(status_code=400, detail="Category name cannot be empty")

    existing = session.exec(select(Category).where(Category.name == trimmed)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    all_cats = session.exec(select(Category)).all()
    if len(all_cats) >= MAX_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Maximum of {MAX_CATEGORIES} categories allowed")

    max_order = max((c.sort_order for c in all_cats), default=-1)

    category = Category(
        name=trimmed,
        color_index=data.color_index,
        sort_order=max_order + 1,
    )
    session.add(category)
    session.commit()
    session.refresh(category)
    return category

class ReorderRequest(BaseModel):
    category_ids: list[int]

@router.put("/reorder")
def reorder_categories(request: ReorderRequest, session: Session = Depends(get_session)):
    """Reorder categories. Expects a list of category IDs in the desired order."""
    for sort_order, cat_id in enumerate(request.category_ids):
        category = session.get(Category, cat_id)
        if category:
            category.sort_order = sort_order
            session.add(category)
    session.commit()
    return {"ok": True}

@router.put("/{id}")
def update_category(id: int, data: CategoryUpdate, session: Session = Depends(get_session)):
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = data.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] is not None:
        new_name = update_data["name"].strip()
        if not new_name:
            raise HTTPException(status_code=400, detail="Category name cannot be empty")
        if new_name != category.name:
            existing = session.exec(select(Category).where(Category.name == new_name)).first()
            if existing:
                raise HTTPException(status_code=400, detail="Category name already exists")
            # Rename category across all assets
            assets = session.exec(select(Asset).where(Asset.category == category.name)).all()
            for asset in assets:
                asset.category = new_name
                session.add(asset)
            category.name = new_name

    if "color_index" in update_data and update_data["color_index"] is not None:
        category.color_index = update_data["color_index"]

    session.add(category)
    session.commit()
    session.refresh(category)
    return category

@router.delete("/{id}")
def delete_category(id: int, session: Session = Depends(get_session)):
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    session.delete(category)
    session.commit()
    return {"ok": True, "deleted_id": id}
