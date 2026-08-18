"""
Inventory service — item granting, consumption, and effect resolution.
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.inventory import ItemDefinition, ItemEffectType, UserInventoryItem
from app.models.user import User

MYSTERY_CHEST_POOL = [
    ("xp_boost", 0.35),
    ("focus_crystal", 0.25),
    ("recovery_token", 0.20),
    ("quest_voucher", 0.15),
    ("legendary_chest", 0.05),
]


def grant_item(db: Session, user: User, item_key: str, quantity: int = 1) -> UserInventoryItem:
    item = db.query(ItemDefinition).filter(ItemDefinition.key == item_key).first()
    if item is None:
        raise ValueError(f"Unknown item key: {item_key}")

    existing = (
        db.query(UserInventoryItem)
        .filter(UserInventoryItem.user_id == user.id, UserInventoryItem.item_id == item.id)
        .first()
    )
    if existing and item.is_stackable:
        existing.quantity += quantity
        db.commit()
        db.refresh(existing)
        return existing

    inventory_item = UserInventoryItem(user_id=user.id, item_id=item.id, quantity=quantity)
    db.add(inventory_item)
    db.commit()
    db.refresh(inventory_item)
    return inventory_item


def use_item(db: Session, user: User, inventory_item_id: uuid.UUID) -> dict:
    inventory_item = (
        db.query(UserInventoryItem)
        .filter(UserInventoryItem.id == inventory_item_id, UserInventoryItem.user_id == user.id)
        .first()
    )
    if inventory_item is None:
        raise ValueError("Item not found in inventory")
    if inventory_item.quantity <= 0:
        raise ValueError("No quantity remaining")

    item = inventory_item.item
    result = {"effect": item.effect_type.value, "detail": ""}
    character = user.character

    if item.effect_type == ItemEffectType.XP_MULTIPLIER:
        inventory_item.is_active_buff = True
        inventory_item.buff_expires_at = datetime.utcnow() + timedelta(
            minutes=item.duration_minutes or 60
        )
        result["detail"] = f"+{int((item.effect_value - 1) * 100)}% XP for {item.duration_minutes} minutes"

    elif item.effect_type == ItemEffectType.FOCUS_BOOST:
        character.focus += int(item.effect_value)
        result["detail"] = f"Focus +{int(item.effect_value)}"

    elif item.effect_type == ItemEffectType.RECOVERY_RESTORE:
        character.recovery += int(item.effect_value)
        character.burnout_risk_score = max(0.0, character.burnout_risk_score - 0.15)
        result["detail"] = f"Recovery +{int(item.effect_value)}, burnout risk reduced"

    elif item.effect_type == ItemEffectType.QUEST_SKIP:
        result["detail"] = "Quest voucher ready — apply to any mandatory quest to auto-complete it"

    elif item.effect_type == ItemEffectType.CHEST_MYSTERY:
        rolled_key = _roll_weighted(MYSTERY_CHEST_POOL)
        grant_item(db, user, rolled_key, 1)
        result["detail"] = f"Mystery Chest opened: {rolled_key.replace('_', ' ').title()}"

    elif item.effect_type == ItemEffectType.CHEST_LEGENDARY:
        rolled_key = _roll_weighted(
            [("xp_boost", 0.2), ("focus_crystal", 0.2), ("recovery_token", 0.2), ("mystery_chest", 0.4)]
        )
        grant_item(db, user, rolled_key, 2)
        character.luck += 1
        result["detail"] = f"Legendary Chest opened: 2x {rolled_key.replace('_', ' ').title()}, Luck +1"

    inventory_item.quantity -= 1
    db.commit()
    return result


def _roll_weighted(pool: list[tuple[str, float]]) -> str:
    keys = [k for k, _ in pool]
    weights = [w for _, w in pool]
    return random.choices(keys, weights=weights, k=1)[0]
