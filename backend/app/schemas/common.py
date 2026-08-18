"""Pydantic schemas — bosses, inventory, achievements, story, notifications, AI."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.boss import BossArchetype, BossCycle
from app.models.inventory import ItemEffectType, ItemRarity
from app.models.story import NotificationType


# --- Boss ---
class BossOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    archetype: BossArchetype
    cycle: BossCycle
    lore_text: str
    icon_key: str
    cycle_start: date
    cycle_end: date
    max_hp: float
    current_hp: float
    hp_percent: float
    is_defeated: bool
    reward_xp: int


class BossParticipationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    boss: BossOut
    damage_dealt: float
    quests_contributed: int
    reward_claimed: bool


# --- Inventory ---
class ItemDefinitionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    key: str
    name: str
    description: str
    rarity: ItemRarity
    effect_type: ItemEffectType
    effect_value: float
    icon_key: str


class InventoryItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    item: ItemDefinitionOut
    quantity: int
    is_active_buff: bool
    buff_expires_at: Optional[datetime]


class UseItemRequest(BaseModel):
    inventory_item_id: uuid.UUID


# --- Achievements ---
class AchievementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    name: str
    description: str
    icon_key: str
    xp_reward: int
    is_hidden: bool
    unlocked_at: Optional[datetime] = None


class TitleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    key: str
    display_text: str
    description: str
    unlocked_at: Optional[datetime] = None


# --- Story ---
class StoryChapterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    title: str
    body_text: Optional[str] = None
    is_unlocked: bool
    cover_art_key: str


# --- Notifications ---
class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: NotificationType
    title: str
    body: str
    is_read: bool
    created_at: datetime


# --- AI ---
class BurnoutInsightOut(BaseModel):
    score: float
    risk_level: str
    contributing_factors: list[str]
    recommendation: str


class WeakSubjectOut(BaseModel):
    subject: str
    accuracy_estimate: float
    recommendation: str


class CompanionMessageOut(BaseModel):
    message: str
    generated_at: datetime
