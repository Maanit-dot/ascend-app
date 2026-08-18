"""Pydantic schemas — quest API contracts."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.quest import QuestCategory, QuestType, QuestUnit


class QuestTemplateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    key: str
    name: str
    description: str
    category: QuestCategory
    unit: QuestUnit
    icon_key: str
    default_sets: Optional[int] = None
    default_reps_per_set: Optional[int] = None
    allows_bonus: bool = False


class QuestInstanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    assigned_date: date
    quest_type: QuestType
    target_value: float
    current_value: float
    xp_reward: int
    is_completed: bool
    completed_at: Optional[datetime]
    ai_rationale: Optional[str]
    difficulty_snapshot: float
    template: QuestTemplateOut


class QuestCategorySectionOut(BaseModel):
    """A labeled group of quests for the board UI, e.g. 'Cardio', 'Core'."""

    label: str
    quests: list[QuestInstanceOut]


class DailyQuestBoardOut(BaseModel):
    date: date
    categories: list[QuestCategorySectionOut]
    optional: list[QuestInstanceOut]
    hidden: list[QuestInstanceOut]
    companion_message: str
    difficulty_multiplier: float
    completion_percent: float


class LogQuestProgressRequest(BaseModel):
    delta_value: float = Field(gt=0)
    note: Optional[str] = Field(default=None, max_length=256)


class SetQuestProgressRequest(BaseModel):
    value: float = Field(ge=0)
    note: Optional[str] = Field(default=None, max_length=256)


class QuestCompletionResult(BaseModel):
    quest: QuestInstanceOut
    xp_awarded: int
    leveled_up: bool
    new_level: int
    unlocks: list[str]
    achievement_unlocks: list[str]


class QuestHistoryEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    total_quests: int
    completed_quests: int
    completion_percent: float
    xp_earned: int
