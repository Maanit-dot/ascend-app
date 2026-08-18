"""Quest routes — daily board, progress logging, and history."""
from __future__ import annotations

import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Integer, func
from sqlalchemy.orm import Session

from app.ai.companion import generate_motivational_message
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.quest import QuestInstance, QuestType
from app.models.user import User
from app.schemas.quest import (
    DailyQuestBoardOut,
    LogQuestProgressRequest,
    QuestCategorySectionOut,
    QuestCompletionResult,
    QuestHistoryEntryOut,
    QuestInstanceOut,
    SetQuestProgressRequest,
)
from app.services import quest_service

router = APIRouter(prefix="/quests", tags=["quests"])


def _run_async(coro):
    import asyncio

    try:
        return asyncio.run(coro)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()


@router.get("/today", response_model=DailyQuestBoardOut)
def get_today_board(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DailyQuestBoardOut:
    today = date.today()
    instances = quest_service.get_or_create_daily_board(db, current_user, today)

    mandatory = [i for i in instances if i.quest_type == QuestType.MANDATORY]
    optional = [i for i in instances if i.quest_type == QuestType.OPTIONAL]
    hidden = [i for i in instances if i.quest_type == QuestType.HIDDEN]

    total = len(mandatory)
    completed = sum(1 for i in mandatory if i.is_completed)
    completion_percent = round((completed / total) * 100, 1) if total else 0.0

    categories = [
        QuestCategorySectionOut(
            label=label, quests=[QuestInstanceOut.model_validate(q) for q in quests]
        )
        for label, quests in quest_service.group_by_category(mandatory)
    ]

    character = current_user.character
    burnout_level = (
        "critical"
        if character.burnout_risk_score >= 0.7
        else "high"
        if character.burnout_risk_score >= 0.45
        else "moderate"
        if character.burnout_risk_score >= 0.2
        else "low"
    )
    message = _run_async(
        generate_motivational_message(
            current_user.display_name,
            character.current_streak_days,
            burnout_level,
            recent_win=None,
        )
    )

    return DailyQuestBoardOut(
        date=today,
        categories=categories,
        optional=[QuestInstanceOut.model_validate(i) for i in optional],
        hidden=[QuestInstanceOut.model_validate(i) for i in hidden],
        companion_message=message,
        difficulty_multiplier=character.difficulty_multiplier,
        completion_percent=completion_percent,
    )


def _get_owned_quest(db: Session, user: User, quest_instance_id: uuid.UUID) -> QuestInstance:
    instance = (
        db.query(QuestInstance)
        .filter(QuestInstance.id == quest_instance_id, QuestInstance.user_id == user.id)
        .first()
    )
    if instance is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Quest not found")
    return instance


@router.post("/{quest_instance_id}/log", response_model=QuestCompletionResult)
def log_progress(
    quest_instance_id: uuid.UUID,
    payload: LogQuestProgressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuestCompletionResult:
    instance = _get_owned_quest(db, current_user, quest_instance_id)

    # Bonus-eligible quests (Study Time, JEE Questions) can still be logged
    # against after completion — only block re-logging for quests that don't
    # allow overflow.
    if instance.is_completed and not instance.template.allows_bonus:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Quest already completed")

    level_before = current_user.character.level
    was_completed_before = instance.is_completed

    instance = quest_service.log_quest_progress(db, current_user, instance, payload.delta_value, payload.note)

    leveled_up = current_user.character.level > level_before
    unlocks: list[str] = []
    if leveled_up:
        from app.services.leveling import resolve_level_unlock

        unlocks = [
            resolve_level_unlock(lvl)
            for lvl in range(level_before + 1, current_user.character.level + 1)
        ]

    return QuestCompletionResult(
        quest=QuestInstanceOut.model_validate(instance),
        xp_awarded=instance.xp_reward if (instance.is_completed and not was_completed_before) else 0,
        leveled_up=leveled_up,
        new_level=current_user.character.level,
        unlocks=unlocks,
        achievement_unlocks=[],
    )


@router.post("/{quest_instance_id}/set", response_model=QuestCompletionResult)
def set_progress(
    quest_instance_id: uuid.UUID,
    payload: SetQuestProgressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuestCompletionResult:
    instance = _get_owned_quest(db, current_user, quest_instance_id)
    if instance.is_completed and not instance.template.allows_bonus:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Quest already completed")

    level_before = current_user.character.level
    instance = quest_service.set_quest_progress(db, current_user, instance, payload.value, payload.note)
    leveled_up = current_user.character.level > level_before

    unlocks: list[str] = []
    if leveled_up:
        from app.services.leveling import resolve_level_unlock

        unlocks = [
            resolve_level_unlock(lvl)
            for lvl in range(level_before + 1, current_user.character.level + 1)
        ]

    return QuestCompletionResult(
        quest=QuestInstanceOut.model_validate(instance),
        xp_awarded=instance.xp_reward if instance.is_completed else 0,
        leveled_up=leveled_up,
        new_level=current_user.character.level,
        unlocks=unlocks,
        achievement_unlocks=[],
    )


@router.get("/history", response_model=list[QuestHistoryEntryOut])
def get_quest_history(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[QuestHistoryEntryOut]:
    since = date.today() - timedelta(days=days)
    rows = (
        db.query(
            QuestInstance.assigned_date,
            func.count(QuestInstance.id).label("total"),
            func.sum(func.cast(QuestInstance.is_completed, Integer)).label("completed"),
            func.sum(
                func.coalesce(
                    func.cast(QuestInstance.is_completed, Integer) * QuestInstance.xp_reward, 0
                )
            ).label("xp"),
        )
        .filter(QuestInstance.user_id == current_user.id, QuestInstance.assigned_date >= since)
        .group_by(QuestInstance.assigned_date)
        .order_by(QuestInstance.assigned_date.desc())
        .all()
    )

    return [
        QuestHistoryEntryOut(
            date=row.assigned_date,
            total_quests=row.total,
            completed_quests=row.completed or 0,
            completion_percent=round(((row.completed or 0) / row.total) * 100, 1) if row.total else 0.0,
            xp_earned=row.xp or 0,
        )
        for row in rows
    ]
