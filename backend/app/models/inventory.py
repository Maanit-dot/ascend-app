"""
Inventory system models.

`ItemDefinition` is the static catalog (XP Boost, Focus Crystal, Recovery
Token, Quest Voucher, Mystery Chest, Legendary Chest, ...). `UserInventoryItem`
tracks owned quantities and consumption state per user.
"""
from __future__ import annotations

import uuid
import enum
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class ItemRarity(str, enum.Enum):
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class ItemEffectType(str, enum.Enum):
    XP_MULTIPLIER = "xp_multiplier"
    FOCUS_BOOST = "focus_boost"
    RECOVERY_RESTORE = "recovery_restore"
    QUEST_SKIP = "quest_skip"
    CHEST_MYSTERY = "chest_mystery"
    CHEST_LEGENDARY = "chest_legendary"


class ItemDefinition(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "item_definitions"

    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text)
    rarity: Mapped[ItemRarity] = mapped_column(Enum(ItemRarity), default=ItemRarity.COMMON)
    effect_type: Mapped[ItemEffectType] = mapped_column(Enum(ItemEffectType))
    effect_value: Mapped[float] = mapped_column(default=1.0)  # e.g. 1.25 = +25% XP
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # for buffs
    icon_key: Mapped[str] = mapped_column(String(64), default="default_item")
    is_stackable: Mapped[bool] = mapped_column(Boolean, default=True)
    is_tradeable: Mapped[bool] = mapped_column(Boolean, default=False)


class UserInventoryItem(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_inventory_items"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    user: Mapped["User"] = relationship(back_populates="inventory_items")

    item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("item_definitions.id"))
    item: Mapped["ItemDefinition"] = relationship()

    quantity: Mapped[int] = mapped_column(Integer, default=1)
    is_active_buff: Mapped[bool] = mapped_column(Boolean, default=False)
    buff_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    acquired_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
