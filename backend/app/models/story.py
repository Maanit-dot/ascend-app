"""
Story Mode + Notification models.

Story Mode is ASCEND's original narrative layer — chapters unlock as the
user sustains discipline (streaks, level thresholds, boss defeats). It is
entirely original IP: no references to existing anime/game franchises.
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


class StoryChapter(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "story_chapters"

    order_index: Mapped[int] = mapped_column(Integer, unique=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(128))
    body_text: Mapped[str] = mapped_column(Text)
    unlock_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    unlock_streak_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cover_art_key: Mapped[str] = mapped_column(String(64), default="default_chapter")


class StoryProgress(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "story_progress"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    user: Mapped["User"] = relationship(back_populates="story_progress")

    current_chapter_index: Mapped[int] = mapped_column(Integer, default=0)
    unlocked_chapter_keys: Mapped[str] = mapped_column(Text, default="[]")  # JSON-encoded list


class NotificationType(str, enum.Enum):
    QUEST_REMINDER = "quest_reminder"
    LEVEL_UP = "level_up"
    BOSS_UPDATE = "boss_update"
    ACHIEVEMENT_UNLOCK = "achievement_unlock"
    AI_MESSAGE = "ai_message"
    BURNOUT_WARNING = "burnout_warning"
    SYSTEM = "system"


class Notification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    user: Mapped["User"] = relationship(back_populates="notifications")

    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType))
    title: Mapped[str] = mapped_column(String(128))
    body: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
