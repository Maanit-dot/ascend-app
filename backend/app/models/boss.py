"""
Boss system models.

Bosses are personifications of obstacles (Procrastination, Fatigue,
Distraction, Chaos). Each boss has a HP pool that drains as linked quests
are completed across all participants for that cycle (weekly or monthly).
"""
from __future__ import annotations

import uuid
import enum
from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class BossCycle(str, enum.Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class BossArchetype(str, enum.Enum):
    PROCRASTINATION = "procrastination"
    FATIGUE = "fatigue"
    DISTRACTION = "distraction"
    CHAOS = "chaos"
    STAGNATION = "stagnation"
    DOUBT = "doubt"


class Boss(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "bosses"

    name: Mapped[str] = mapped_column(String(128))
    archetype: Mapped[BossArchetype] = mapped_column(Enum(BossArchetype))
    cycle: Mapped[BossCycle] = mapped_column(Enum(BossCycle))
    lore_text: Mapped[str] = mapped_column(Text)
    icon_key: Mapped[str] = mapped_column(String(64), default="default_boss")

    cycle_start: Mapped[date] = mapped_column(Date, index=True)
    cycle_end: Mapped[date] = mapped_column(Date, index=True)

    max_hp: Mapped[float] = mapped_column(Float)
    current_hp: Mapped[float] = mapped_column(Float)

    is_defeated: Mapped[bool] = mapped_column(Boolean, default=False)
    defeated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    reward_xp: Mapped[int] = mapped_column(Integer, default=500)
    reward_item_key: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)


class BossParticipation(Base, UUIDMixin, TimestampMixin):
    """Tracks an individual user's contribution to a boss's HP depletion."""

    __tablename__ = "boss_participations"

    boss_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bosses.id", ondelete="CASCADE"), index=True)
    boss: Mapped["Boss"] = relationship()

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    user: Mapped["User"] = relationship(back_populates="boss_participations")

    damage_dealt: Mapped[float] = mapped_column(Float, default=0.0)
    quests_contributed: Mapped[int] = mapped_column(Integer, default=0)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    reward_claimed: Mapped[bool] = mapped_column(Boolean, default=False)
