"""
Achievement engine.

Each `AchievementDefinition.unlock_condition_key` maps to a check function
here. Keeping conditions in code (not data) means they can express arbitrary
logic over the user's full state while staying easy to unit test.
"""
from __future__ import annotations

from typing import Callable

from sqlalchemy.orm import Session

from app.models.achievement import AchievementDefinition, UserAchievement
from app.models.user import User

ConditionFn = Callable[[Session, User], bool]


def _cond_first_quest(db: Session, user: User) -> bool:
    return user.character.total_xp_earned > 0


def _cond_streak_7(db: Session, user: User) -> bool:
    return user.character.current_streak_days >= 7


def _cond_streak_30(db: Session, user: User) -> bool:
    return user.character.current_streak_days >= 30


def _cond_streak_100(db: Session, user: User) -> bool:
    return user.character.current_streak_days >= 100


def _cond_level_10(db: Session, user: User) -> bool:
    return user.character.level >= 10


def _cond_level_25(db: Session, user: User) -> bool:
    return user.character.level >= 25


def _cond_level_50(db: Session, user: User) -> bool:
    return user.character.level >= 50


def _cond_boss_slayer(db: Session, user: User) -> bool:
    from app.models.boss import BossParticipation

    return (
        db.query(BossParticipation)
        .join(BossParticipation.boss)
        .filter(BossParticipation.user_id == user.id)
        .filter(BossParticipation.boss.has(is_defeated=True))
        .count()
        > 0
    )


CONDITION_REGISTRY: dict[str, ConditionFn] = {
    "first_quest": _cond_first_quest,
    "streak_7": _cond_streak_7,
    "streak_30": _cond_streak_30,
    "streak_100": _cond_streak_100,
    "level_10": _cond_level_10,
    "level_25": _cond_level_25,
    "level_50": _cond_level_50,
    "boss_slayer": _cond_boss_slayer,
}


def check_and_unlock_achievements(db: Session, user: User) -> list[AchievementDefinition]:
    """Evaluates every registered condition and unlocks any newly-satisfied achievement."""
    already_unlocked_ids = {
        row.achievement_id
        for row in db.query(UserAchievement.achievement_id).filter(UserAchievement.user_id == user.id)
    }

    newly_unlocked: list[AchievementDefinition] = []
    definitions = db.query(AchievementDefinition).all()

    for definition in definitions:
        if definition.id in already_unlocked_ids:
            continue
        condition_fn = CONDITION_REGISTRY.get(definition.unlock_condition_key)
        if condition_fn is None:
            continue
        if condition_fn(db, user):
            db.add(UserAchievement(user_id=user.id, achievement_id=definition.id))
            user.character.total_xp_earned += definition.xp_reward
            user.character.current_xp += definition.xp_reward
            newly_unlocked.append(definition)

    if newly_unlocked:
        db.flush()

    return newly_unlocked
