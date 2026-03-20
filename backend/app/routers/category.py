from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from app.database import get_session
from app.models.category import Category, CategoryCreate, CategoryUpdate
from app.models.asset import Asset
from app.auth.dependencies import get_current_user_id
from pydantic import BaseModel

router = APIRouter(prefix="/categories", tags=["categories"])

MAX_CATEGORIES = 5


@router.get("/")
def get_categories(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    statement = (
        select(Category)
        .where(Category.user_id == user_id)
        .order_by(Category.sort_order)
    )
    return session.exec(statement).all()


@router.post("/")
def create_category(
    data: CategoryCreate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    trimmed = data.name.strip()
    if not trimmed:
        raise HTTPException(status_code=400, detail="Category name cannot be empty")

    existing = session.exec(
        select(Category).where(
            Category.user_id == user_id,
            Category.name == trimmed,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    all_cats = session.exec(
        select(Category).where(Category.user_id == user_id)
    ).all()
    if len(all_cats) >= MAX_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Maximum of {MAX_CATEGORIES} categories allowed")

    max_order = max((c.sort_order for c in all_cats), default=-1)

    category = Category(
        user_id=user_id,
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
def reorder_categories(
    request: ReorderRequest,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    for sort_order, cat_id in enumerate(request.category_ids):
        category = session.get(Category, cat_id)
        if category and category.user_id == user_id:
            category.sort_order = sort_order
            session.add(category)
    session.commit()
    return {"ok": True}


@router.put("/{id}")
def update_category(
    id: int,
    data: CategoryUpdate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = data.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] is not None:
        new_name = update_data["name"].strip()
        if not new_name:
            raise HTTPException(status_code=400, detail="Category name cannot be empty")
        if new_name != category.name:
            existing = session.exec(
                select(Category).where(
                    Category.user_id == user_id,
                    Category.name == new_name,
                )
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Category name already exists")
            # Rename category across all of this user's assets
            assets = session.exec(
                select(Asset).where(
                    Asset.user_id == user_id,
                    Asset.category == category.name,
                )
            ).all()
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
def delete_category(
    id: int,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    category = session.get(Category, id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    session.delete(category)
    session.commit()
    return {"ok": True, "deleted_id": id}
