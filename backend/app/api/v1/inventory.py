"""Inventory routes — list owned items, use/consume an item."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.inventory import UserInventoryItem
from app.models.user import User
from app.schemas.common import InventoryItemOut, UseItemRequest
from app.services.inventory_service import use_item

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=list[InventoryItemOut])
def list_inventory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[InventoryItemOut]:
    items = (
        db.query(UserInventoryItem)
        .filter(UserInventoryItem.user_id == current_user.id, UserInventoryItem.quantity > 0)
        .all()
    )
    return [InventoryItemOut.model_validate(i) for i in items]


@router.post("/use")
def use_inventory_item(
    payload: UseItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    try:
        result = use_item(db, current_user, payload.inventory_item_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return result
