"""
Quest service — orchestrates the daily quest lifecycle.

Responsibilities:
  1. Assemble (or fetch) today's quest board for a user, generating instances
     from templates on first request of the day.
  2. Log progress against a quest instance (incremental or absolute).
  3. Resolve completion: award XP, cascade leveling, update streaks, update
     boss participation, check achievements, roll hidden quests.

This module intentionally contains the transactional logic — routers stay
thin and only handle HTTP concerns.
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import date, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.ai.companion import generate_motivational_message, roll_hidden_quest
from app.ai.difficulty_engine import adjust_difficulty, compute_completion_rate
from app.ai.quest_generator import (
    build_quest_target,
    compute_xp_reward,
    generate_rationale_batch,
)
from app.models.boss import Boss, BossParticipation
from app.models.quest import (
    QuestCategory,
    QuestInstance,
    QuestLog,
    QuestTemplate,
    QuestType,
)
from app.models.user import CharacterProfile, User
from app.services.achievement_service import check_and_unlock_achievements
from app.services.leveling import apply_xp_gain

# Every mandatory exercise/study quest, itemized to match the exact daily
# checklist, grouped by category for display (see QuestCategory on each
# template + CATEGORY_DISPLAY_ORDER below).
MANDATORY_TEMPLATE_KEYS = [
    # Study
    "jee_questions",
    "study_time",
    # Recovery
    "sleep",
    # Cardio
    "running",
    "walking",
    # Mobility & Posture
    "cobra_stretch",
    "tadasana",
    "toe_touch",
    "cat_cow",
    "dead_hang",
    # Strength
    "pushups",
    "incline_pushups",
    "squats",
    # Core
    "situps",
    "bicycle_crunches",
    "mountain_climbers",
    "plank",
    "side_plank",
]
OPTIONAL_TEMPLATE_KEYS = ["basketball", "badminton"]

# Category display order + labels for the grouped quest board UI.
CATEGORY_DISPLAY_ORDER: list[tuple[QuestCategory, str]] = [
    (QuestCategory.STUDY, "Study"),
    (QuestCategory.RECOVERY, "Recovery"),
    (QuestCategory.CARDIO, "Cardio"),
    (QuestCategory.MOBILITY, "Mobility & Posture"),
    (QuestCategory.STRENGTH, "Strength"),
    (QuestCategory.CORE, "Core"),
]

# Bonus XP per "extra unit" past 100% for allows_bonus quests, expressed as a
# fraction of the per-unit XP rate at the base target (bonus pays out at half
# the normal rate so overflow is rewarding but never out-earns the main target).
BONUS_XP_RATE = 0.5


def get_or_create_daily_board(db: Session, user: User, target_date: date) -> list[QuestInstance]:
    """Returns today's quest instances, generating them on first access."""
    existing = _fetch_board(db, user, target_date)
    if existing:
        return existing

    try:
        return _generate_daily_board_sync(db, user, target_date)
    except IntegrityError:
        # Another concurrent request generated the board first (the unique
        # constraint on (user_id, template_id, assigned_date) caught it) —
        # roll back our half-finished insert and just return what's there.
        db.rollback()
        return _fetch_board(db, user, target_date)


def _fetch_board(db: Session, user: User, target_date: date) -> list[QuestInstance]:
    return (
        db.query(QuestInstance)
        .filter(QuestInstance.user_id == user.id, QuestInstance.assigned_date == target_date)
        .all()
    )


def _generate_daily_board_sync(db: Session, user: User, target_date: date) -> list[QuestInstance]:
    character = user.character
    templates = db.query(QuestTemplate).filter(
        QuestTemplate.key.in_(MANDATORY_TEMPLATE_KEYS + OPTIONAL_TEMPLATE_KEYS),
        QuestTemplate.is_active.is_(True),
    ).all()
    template_map = {t.key: t for t in templates}

    instances: list[QuestInstance] = []
    summaries = []

    def _build(key: str, quest_type: QuestType) -> None:
        template = template_map.get(key)
        if not template:
            return
        target = build_quest_target(template, character.difficulty_multiplier)
        xp = compute_xp_reward(template, target)
        instance = QuestInstance(
            user_id=user.id,
            template_id=template.id,
            assigned_date=target_date,
            quest_type=quest_type,
            target_value=target,
            xp_reward=xp,
            difficulty_snapshot=character.difficulty_multiplier,
        )
        instances.append(instance)
        summaries.append({"template_key": key, "name": template.name, "target": target})

    for key in MANDATORY_TEMPLATE_KEYS:
        _build(key, QuestType.MANDATORY)
    for key in OPTIONAL_TEMPLATE_KEYS:
        _build(key, QuestType.OPTIONAL)

    db.add_all(instances)
    db.flush()  # surfaces IntegrityError here, before we spend an AI call

    # Rationale text (best-effort AI call, falls back internally)
    try:
        rationale_map = _run_async(
            generate_rationale_batch(summaries, user.display_name, character.difficulty_multiplier)
        )
        for instance, summary in zip(instances, summaries):
            instance.ai_rationale = rationale_map.get(summary["template_key"])
    except Exception:  # noqa: BLE001 — never block quest generation on AI failure
        pass

    db.commit()
    for instance in instances:
        db.refresh(instance)
    return instances


def _run_async(coro):
    """Runs a coroutine to completion from sync code, tolerating nested-loop environments."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Fallback: skip AI enrichment rather than deadlock (rare under ASGI sync-route calls)
            return {}
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


def group_by_category(
    instances: list[QuestInstance],
) -> list[tuple[str, list[QuestInstance]]]:
    """
    Groups mandatory quest instances by category in the fixed display order
    (Study, Recovery, Cardio, Mobility & Posture, Strength, Core), each
    internally sorted by the template's `sort_order`. Used by the API layer
    to hand the frontend pre-grouped sections instead of a flat list.
    """
    buckets: dict[QuestCategory, list[QuestInstance]] = {cat: [] for cat, _ in CATEGORY_DISPLAY_ORDER}
    for instance in instances:
        cat = instance.template.category
        buckets.setdefault(cat, []).append(instance)

    result: list[tuple[str, list[QuestInstance]]] = []
    for category, label in CATEGORY_DISPLAY_ORDER:
        items = sorted(buckets.get(category, []), key=lambda i: i.template.sort_order)
        if items:
            result.append((label, items))
    return result


def log_quest_progress(
    db: Session, user: User, quest_instance: QuestInstance, delta_value: float, note: str | None
) -> QuestInstance:
    """
    Increments a quest's progress and writes an audit log entry.

    For quests with `template.allows_bonus` (Study Time, JEE Questions),
    progress is allowed to exceed target_value — every unit logged past the
    target pays reduced-rate bonus XP instead of being clamped and discarded.
    """
    template = quest_instance.template
    was_completed_before = quest_instance.is_completed
    previous_value = quest_instance.current_value

    if template.allows_bonus:
        quest_instance.current_value = previous_value + delta_value
    else:
        quest_instance.current_value = min(previous_value + delta_value, quest_instance.target_value)

    db.add(
        QuestLog(
            user_id=user.id,
            quest_instance_id=quest_instance.id,
            delta_value=delta_value,
            resulting_value=quest_instance.current_value,
            note=note,
        )
    )

    if quest_instance.current_value >= quest_instance.target_value and not quest_instance.is_completed:
        _complete_quest(db, user, quest_instance)
    elif was_completed_before and template.allows_bonus:
        # Already completed today, this is pure overflow — pay bonus XP for
        # just the newly-logged amount rather than re-running completion.
        _award_bonus_xp(db, user, quest_instance, delta_value)

    db.commit()
    db.refresh(quest_instance)
    return quest_instance


def _award_bonus_xp(db: Session, user: User, quest_instance: QuestInstance, overflow_amount: float) -> None:
    template = quest_instance.template
    if template.base_target <= 0:
        return
    per_unit_xp = template.base_xp_reward / template.base_target
    bonus_xp = max(1, round(per_unit_xp * overflow_amount * BONUS_XP_RATE))

    character = user.character
    result = apply_xp_gain(character.level, character.current_xp, bonus_xp)
    character.level = result.new_level
    character.current_xp = result.new_current_xp
    character.total_xp_earned += bonus_xp


def recompute_xp_for_target(template: QuestTemplate, new_target: float) -> int:
    """
    Returns the XP reward that a quest instance should have after its
    target has been changed (e.g. by a JARVIS command), keeping XP
    proportional to the template's base target/XP ratio:

        new_xp = template.base_xp_reward * (new_target / template.base_target)

    This is always derived from the template's immutable base_target /
    base_xp_reward — never from the instance's current xp_reward — so
    repeatedly changing the target never compounds (50 -> 100 -> 100 stays
    at 100 XP, it does not become 200).
    """
    if template.base_target <= 0:
        return template.base_xp_reward
    per_unit_xp = template.base_xp_reward / template.base_target
    return max(1, round(per_unit_xp * new_target))


def set_quest_progress(
    db: Session, user: User, quest_instance: QuestInstance, value: float, note: str | None
) -> QuestInstance:
    """Sets a quest's progress to an absolute value (used for sleep hours, step count sync, etc)."""
    delta = value - quest_instance.current_value
    return log_quest_progress(db, user, quest_instance, delta, note) if delta > 0 else quest_instance


def _complete_quest(db: Session, user: User, quest_instance: QuestInstance) -> None:
    quest_instance.is_completed = True
    quest_instance.completed_at = datetime.utcnow()

    character: CharacterProfile = user.character
    result = apply_xp_gain(character.level, character.current_xp, quest_instance.xp_reward)
    character.level = result.new_level
    character.current_xp = result.new_current_xp
    character.total_xp_earned += quest_instance.xp_reward

    # Bump the primary stat tied to this quest's template
    template: QuestTemplate = quest_instance.template
    _increment_stat(character, template.primary_stat, 1)
    if template.secondary_stat:
        _increment_stat(character, template.secondary_stat, 1)

    _update_streak(character, quest_instance.assigned_date)

    # Feed active boss(es) for this cycle if the quest maps to boss-relevant categories
    _apply_boss_damage(db, user, quest_instance)

    check_and_unlock_achievements(db, user)


def _increment_stat(character: CharacterProfile, stat_key: str, amount: int) -> None:
    if hasattr(character, stat_key):
        setattr(character, stat_key, getattr(character, stat_key) + amount)


def _update_streak(character: CharacterProfile, completed_date: date) -> None:
    last = character.last_quest_completed_date
    if last == completed_date:
        return  # already counted today
    if last == completed_date - timedelta(days=1):
        character.current_streak_days += 1
    else:
        character.current_streak_days = 1
    character.longest_streak_days = max(character.longest_streak_days, character.current_streak_days)
    character.last_quest_completed_date = completed_date


def _apply_boss_damage(db: Session, user: User, quest_instance: QuestInstance) -> None:
    today = quest_instance.assigned_date

    active_bosses = (
        db.query(Boss)
        .filter(
            Boss.cycle_start <= today,
            Boss.cycle_end >= today,
            Boss.is_defeated.is_(False),
        )
        .all()
    )

    if not active_bosses:
        return

    damage = max(1.0, quest_instance.xp_reward * 0.5)

    for boss in active_bosses:
        participation = (
            db.query(BossParticipation)
            .filter(
                BossParticipation.boss_id == boss.id,
                BossParticipation.user_id == user.id,
            )
            .first()
        )

        if participation is None:
            participation = BossParticipation(
                boss_id=boss.id,
                user_id=user.id,
                damage_dealt=0.0,
                quests_contributed=0,
            )
            db.add(participation)

        # Prevent None values
        if participation.damage_dealt is None:
            participation.damage_dealt = 0.0

        if participation.quests_contributed is None:
            participation.quests_contributed = 0

        if boss.current_hp is None:
            boss.current_hp = 0.0

        participation.damage_dealt += damage
        participation.quests_contributed += 1

        boss.current_hp = max(0.0, boss.current_hp - damage)

        if boss.current_hp <= 0 and not boss.is_defeated:
            boss.is_defeated = True
            boss.defeated_at = datetime.utcnow()


def recompute_difficulty(db: Session, user: User) -> None:
    """
    Recomputes the user's difficulty multiplier based on trailing 7-day
    completion rate and current burnout risk. Intended to run once per day
    (e.g. via a scheduled job) before the next day's board is generated.
    """
    character = user.character
    since = date.today() - timedelta(days=7)

    total = (
        db.query(func.count(QuestInstance.id))
        .filter(
            QuestInstance.user_id == user.id,
            QuestInstance.assigned_date >= since,
            QuestInstance.quest_type == QuestType.MANDATORY,
        )
        .scalar()
        or 0
    )
    completed = (
        db.query(func.count(QuestInstance.id))
        .filter(
            QuestInstance.user_id == user.id,
            QuestInstance.assigned_date >= since,
            QuestInstance.quest_type == QuestType.MANDATORY,
            QuestInstance.is_completed.is_(True),
        )
        .scalar()
        or 0
    )
    rate = compute_completion_rate(completed, total)
    adjustment = adjust_difficulty(character.difficulty_multiplier, rate, character.burnout_risk_score)
    character.difficulty_multiplier = adjustment.new_multiplier
    db.commit()
