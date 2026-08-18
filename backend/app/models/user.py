"""
User + Character models.

`User` holds auth/identity data (synced from Firebase). `CharacterProfile`
holds the RPG layer: level, XP, stats, streaks, and cosmetic identity. They
are split 1:1 so identity concerns never bleed into game-state concerns.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.quest import QuestInstance
    from app.models.inventory import UserInventoryItem
    from app.models.boss import BossParticipation
    from app.models.achievement import UserAchievement, UserTitle
    from app.models.story import StoryProgress
    from app.models.story import Notification


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    firebase_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(64))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_onboarded: Mapped[bool] = mapped_column(Boolean, default=False)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata")

    # Target-user classification informs AI quest weighting
    primary_track: Mapped[str] = mapped_column(
        String(32), default="hybrid"
    )  # "exam" | "fitness" | "discipline" | "hybrid"

    last_login_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    character: Mapped["CharacterProfile"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    quest_instances: Mapped[list["QuestInstance"]] = relationship(back_populates="user")
    inventory_items: Mapped[list["UserInventoryItem"]] = relationship(back_populates="user")
    boss_participations: Mapped[list["BossParticipation"]] = relationship(back_populates="user")
    achievements: Mapped[list["UserAchievement"]] = relationship(back_populates="user")
    titles: Mapped[list["UserTitle"]] = relationship(back_populates="user")
    story_progress: Mapped["StoryProgress"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")


class CharacterProfile(Base, UUIDMixin, TimestampMixin):
    """The RPG-layer representation of a user: level, XP, and 12-stat sheet."""

    __tablename__ = "character_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    user: Mapped["User"] = relationship(back_populates="character")

    level: Mapped[int] = mapped_column(Integer, default=1)
    current_xp: Mapped[int] = mapped_column(Integer, default=0)
    total_xp_earned: Mapped[int] = mapped_column(Integer, default=0)

    # --- 12 core stats ---
    knowledge: Mapped[int] = mapped_column(Integer, default=1)
    strength: Mapped[int] = mapped_column(Integer, default=1)
    stamina: Mapped[int] = mapped_column(Integer, default=1)
    recovery: Mapped[int] = mapped_column(Integer, default=1)
    focus: Mapped[int] = mapped_column(Integer, default=1)
    discipline: Mapped[int] = mapped_column(Integer, default=1)
    consistency: Mapped[int] = mapped_column(Integer, default=1)
    agility: Mapped[int] = mapped_column(Integer, default=1)
    speed: Mapped[int] = mapped_column(Integer, default=1)
    potential: Mapped[int] = mapped_column(Integer, default=1)
    luck: Mapped[int] = mapped_column(Integer, default=1)
    mental_fortitude: Mapped[int] = mapped_column(Integer, default=1)

    # --- Streaks & meta-progression ---
    current_streak_days: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak_days: Mapped[int] = mapped_column(Integer, default=0)
    last_quest_completed_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    active_title_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("titles.id", ondelete="SET NULL"), nullable=True
    )

    # --- AI-adaptive difficulty state ---
    difficulty_multiplier: Mapped[float] = mapped_column(Float, default=1.0)  # 0.5 - 2.0
    burnout_risk_score: Mapped[float] = mapped_column(Float, default=0.0)  # 0.0 - 1.0

    def __repr__(self) -> str:  # pragma: no cover
        return f"<CharacterProfile user_id={self.user_id} level={self.level}>"
