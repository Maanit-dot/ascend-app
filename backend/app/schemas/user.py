"""Pydantic schemas — user & character API contracts."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CharacterStatsSchema(BaseModel):
    knowledge: int
    strength: int
    stamina: int
    recovery: int
    focus: int
    discipline: int
    consistency: int
    agility: int
    speed: int
    potential: int
    luck: int
    mental_fortitude: int


class CharacterProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    level: int
    current_xp: int
    total_xp_earned: int
    xp_required_for_next_level: int
    xp_progress_percent: float
    stats: CharacterStatsSchema
    current_streak_days: int
    longest_streak_days: int
    last_quest_completed_date: Optional[date]
    active_title_id: Optional[uuid.UUID]
    difficulty_multiplier: float
    burnout_risk_score: float


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    display_name: str
    avatar_url: Optional[str]
    is_onboarded: bool
    timezone: str
    primary_track: str
    created_at: datetime
    character: CharacterProfileOut


class OnboardingRequest(BaseModel):
    display_name: str = Field(min_length=2, max_length=64)
    timezone: str = Field(default="Asia/Kolkata")
    primary_track: str = Field(default="hybrid", pattern="^(exam|fitness|discipline|hybrid)$")


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=2, max_length=64)
    timezone: Optional[str] = None
    avatar_url: Optional[str] = None
    active_title_id: Optional[uuid.UUID] = None
