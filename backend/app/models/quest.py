"""
Quest system models.

- `QuestTemplate`: catalog of every quest type ASCEND knows how to generate
  (JEE Questions, Running, Pushups, Sleep, Mobility drills, etc).
- `QuestInstance`: a concrete quest assigned to a user on a given date, with
  an AI-scaled target derived from the template + user difficulty state.
- `QuestLog`: immutable history entries written on completion, used for AI
  analysis and the Quest History screen.
- `SubjectQuestionLog`: immutable subject/chapter-tagged question counts —
  the source of truth for "how many questions have I done, by chapter"
  queries. Written either from the JEE Questions quest card or by telling
  ARC directly in chat. Never estimated, never overwritten — always additive.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDMixin
import enum

if TYPE_CHECKING:
    from app.models.user import User


class QuestCategory(str, enum.Enum):
    STUDY = "study"
    STRENGTH = "strength"
    CARDIO = "cardio"
    MOBILITY = "mobility"
    CORE = "core"
    RECOVERY = "recovery"
    SPORT = "sport"
    HIDDEN = "hidden"


class QuestType(str, enum.Enum):
    MANDATORY = "mandatory"
    OPTIONAL = "optional"
    HIDDEN = "hidden"
    BOSS_CONTRIBUTION = "boss_contribution"


class QuestUnit(str, enum.Enum):
    QUESTIONS = "questions"
    KM = "km"
    ROUNDS = "rounds"
    STEPS = "steps"
    REPS = "reps"
    SECONDS = "seconds"
    MINUTES = "minutes"
    HOURS = "hours"
    SETS = "sets"


class QuestTemplate(Base, UUIDMixin, TimestampMixin):
    """Static catalog entry — the 'recipe' for generating a quest instance."""

    __tablename__ = "quest_templates"

    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)  # e.g. "jee_questions"
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[QuestCategory] = mapped_column(Enum(QuestCategory))
    quest_type: Mapped[QuestType] = mapped_column(Enum(QuestType), default=QuestType.MANDATORY)
    unit: Mapped[QuestUnit] = mapped_column(Enum(QuestUnit))

    # Display order within its category section on the quest board (lower = earlier)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    base_target: Mapped[float] = mapped_column(Float)  # e.g. 200 for JEE questions
    min_target: Mapped[float] = mapped_column(Float)  # e.g. 150
    max_target: Mapped[float] = mapped_column(Float)  # e.g. 300

    # Sets-based quests store structured detail, e.g. "5x25 sec" -> sets=5, reps_per_set=25
    default_sets: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    default_reps_per_set: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # If true, progress can exceed target_value and earns reduced-rate bonus XP
    # per extra unit instead of being clamped at 100% (e.g. Study Time, JEE Questions).
    allows_bonus: Mapped[bool] = mapped_column(Boolean, default=False)

    base_xp_reward: Mapped[int] = mapped_column(Integer, default=50)
    primary_stat: Mapped[str] = mapped_column(String(32))  # stat key boosted on completion
    secondary_stat: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    icon_key: Mapped[str] = mapped_column(String(64), default="default")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class QuestInstance(Base, UUIDMixin, TimestampMixin):
    """A quest assigned to a specific user for a specific day."""

    __tablename__ = "quest_instances"
    __table_args__ = (
        # Prevents the same template from ever being assigned twice to the same
        # user on the same day — closes the race condition where two near-
        # simultaneous board-generation requests both insert a full quest set.
        UniqueConstraint(
            "user_id", "template_id", "assigned_date", name="uq_quest_instance_user_template_date"
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    user: Mapped["User"] = relationship(back_populates="quest_instances")

    template_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("quest_templates.id"))
    template: Mapped["QuestTemplate"] = relationship()

    assigned_date: Mapped[date] = mapped_column(Date, index=True)
    quest_type: Mapped[QuestType] = mapped_column(Enum(QuestType), default=QuestType.MANDATORY)

    target_value: Mapped[float] = mapped_column(Float)  # AI-scaled target for this instance
    current_value: Mapped[float] = mapped_column(Float, default=0.0)

    xp_reward: Mapped[int] = mapped_column(Integer)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # AI metadata: why this target was chosen, for transparency in UI
    ai_rationale: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    difficulty_snapshot: Mapped[float] = mapped_column(Float, default=1.0)

    boss_participation_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("boss_participations.id", ondelete="SET NULL"), nullable=True
    )


class QuestLog(Base, UUIDMixin, TimestampMixin):
    """Immutable append-only log of quest progress events, used for AI + history."""

    __tablename__ = "quest_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    quest_instance_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("quest_instances.id", ondelete="CASCADE"))

    delta_value: Mapped[float] = mapped_column(Float)  # amount logged in this event
    resulting_value: Mapped[float] = mapped_column(Float)
    note: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class SubjectQuestionLog(Base, UUIDMixin, TimestampMixin):
    """
    Immutable record of subject/chapter-tagged question counts.

    Written either from the JEE Questions quest card (source="quest_log") or
    by telling ARC directly in chat, e.g. "Physics Magnetism 20, Chemistry
    Electrochemistry 30" (source="chat"). This table is the ONLY source of
    truth for "how many questions have I done" queries — ARC reads totals
    from here, it never estimates or recalls them from conversation memory.
    """

    __tablename__ = "subject_question_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    subject: Mapped[str] = mapped_column(String(64), index=True)  # e.g. "Physics"
    chapter: Mapped[str] = mapped_column(String(128), index=True)  # e.g. "Magnetism"
    question_count: Mapped[int] = mapped_column(Integer)

    source: Mapped[str] = mapped_column(String(16), default="chat")  # "chat" | "quest_log"
    logged_date: Mapped[date] = mapped_column(Date, index=True, default=date.today)
