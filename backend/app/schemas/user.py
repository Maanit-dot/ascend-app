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
    username: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None
    role: str = "USER"
    is_owner: bool = False
    is_suspended: bool = False
    is_banned: bool = False
    is_onboarded: bool
    timezone: str
    primary_track: str
    created_at: datetime
    character: CharacterProfileOut


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    username: Optional[str] = Field(default=None, min_length=3, max_length=32)
    display_name: Optional[str] = Field(default=None, max_length=64)
    client_type: str = "website"
    device_name: str = "Browser"
    device_id: Optional[str] = None


class LoginRequest(BaseModel):
    login: str = Field(description="Email or ASCEND username")
    password: str = Field(min_length=1)
    client_type: str = "website"
    device_name: str = "Browser"
    device_id: Optional[str] = None


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SessionOut(BaseModel):
    id: uuid.UUID
    client_type: str
    device_name: str
    ip_address: Optional[str] = None
    last_active_at: datetime
    created_at: datetime
    is_revoked: bool
    is_current: bool = False


class OnboardingRequest(BaseModel):
    display_name: str = Field(min_length=2, max_length=64)
    timezone: str = Field(default="Asia/Kolkata")
    primary_track: str = Field(default="hybrid", pattern="^(exam|fitness|discipline|hybrid)$")


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=2, max_length=64)
    timezone: Optional[str] = None
    avatar_url: Optional[str] = None
    active_title_id: Optional[uuid.UUID] = None
