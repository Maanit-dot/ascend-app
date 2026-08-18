"""
Achievement + Title models.

Achievements are one-time unlockable milestones (badges). Titles are
equippable display names earned through achievements or level thresholds,
one of which can be set as `active_title_id` on the character profile.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class AchievementDefinition(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "achievement_definitions"

    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text)
    icon_key: Mapped[str] = mapped_column(String(64), default="default_achievement")
    xp_reward: Mapped[int] = mapped_column(Integer, default=100)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)  # secret until unlocked
    unlock_condition_key: Mapped[str] = mapped_column(String(64))  # matched by achievement engine


class UserAchievement(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_achievements"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    user: Mapped["User"] = relationship(back_populates="achievements")

    achievement_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("achievement_definitions.id"))
    achievement: Mapped["AchievementDefinition"] = relationship()

    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class Title(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "titles"

    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    display_text: Mapped[str] = mapped_column(String(64))  # e.g. "The Relentless"
    description: Mapped[str] = mapped_column(Text)
    required_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    required_achievement_key: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)


class UserTitle(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_titles"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    user: Mapped["User"] = relationship(back_populates="titles")

    title_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("titles.id"))
    title: Mapped["Title"] = relationship()

    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
