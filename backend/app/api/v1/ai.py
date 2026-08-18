"""AI insight routes — burnout prediction, weak-subject analysis, companion chat."""
from __future__ import annotations

import asyncio
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.ai.burnout_predictor import BurnoutSignals, predict_burnout
from app.ai.client import AIClientError, call_ai
from app.ai.companion import (
    COMPANION_SYSTEM_PROMPT,
    analyze_weak_subjects,
    detect_subject_intent,
    extract_subject_logs,
)
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.quest import QuestInstance, QuestType
from app.models.user import User
from app.schemas.common import BurnoutInsightOut, WeakSubjectOut
from app.services.subject_log_service import (
    format_breakdown_text,
    get_subject_breakdown,
    record_subject_questions,
)

router = APIRouter(prefix="/ai", tags=["ai"])


def _run_async(coro):
    try:
        return asyncio.run(coro)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()


@router.get("/burnout", response_model=BurnoutInsightOut)
def get_burnout_insight(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BurnoutInsightOut:
    character = current_user.character
    today = date.today()
    window_start = today - timedelta(days=7)
    prev_window_start = today - timedelta(days=14)

    def completion_rate(start, end) -> float:
        total = (
            db.query(QuestInstance)
            .filter(
                QuestInstance.user_id == current_user.id,
                QuestInstance.assigned_date >= start,
                QuestInstance.assigned_date < end,
                QuestInstance.quest_type == QuestType.MANDATORY,
            )
            .count()
        )
        completed = (
            db.query(QuestInstance)
            .filter(
                QuestInstance.user_id == current_user.id,
                QuestInstance.assigned_date >= start,
                QuestInstance.assigned_date < end,
                QuestInstance.quest_type == QuestType.MANDATORY,
                QuestInstance.is_completed.is_(True),
            )
            .count()
        )
        return completed / total if total else 1.0

    rate_7d = completion_rate(window_start, today)
    rate_prev_7d = completion_rate(prev_window_start, window_start)

    sleep_instances = (
        db.query(QuestInstance)
        .join(QuestInstance.template)
        .filter(
            QuestInstance.user_id == current_user.id,
            QuestInstance.assigned_date >= window_start,
        )
        .all()
    )
    sleep_relevant = [i for i in sleep_instances if i.template.key == "sleep"]
    sleep_compliance = (
        sum(1 for i in sleep_relevant if i.is_completed) / len(sleep_relevant)
        if sleep_relevant
        else 1.0
    )

    missed_days = sum(
        1
        for i in db.query(QuestInstance)
        .filter(
            QuestInstance.user_id == current_user.id,
            QuestInstance.assigned_date >= today - timedelta(days=14),
            QuestInstance.quest_type == QuestType.MANDATORY,
        )
        .all()
        if not i.is_completed
    )

    signals = BurnoutSignals(
        completion_rate_7d=rate_7d,
        completion_rate_prev_7d=rate_prev_7d,
        sleep_quest_compliance_7d=sleep_compliance,
        current_streak_days=character.current_streak_days,
        missed_days_in_last_14=missed_days,
        recovery_stat=character.recovery,
        avg_daily_quest_load=character.difficulty_multiplier,
    )
    result = predict_burnout(signals)

    character.burnout_risk_score = result.score
    db.commit()

    return BurnoutInsightOut(
        score=result.score,
        risk_level=result.risk_level,
        contributing_factors=result.contributing_factors,
        recommendation=result.recommendation,
    )


class WeakSubjectRequest(BaseModel):
    subject_accuracy: dict[str, float] = Field(
        description="Map of subject label to accuracy (0.0-1.0), e.g. from tagged JEE quest logs"
    )


@router.post("/weak-subjects", response_model=list[WeakSubjectOut])
def get_weak_subjects(
    payload: WeakSubjectRequest,
    current_user: User = Depends(get_current_user),
) -> list[WeakSubjectOut]:
    reports = _run_async(analyze_weak_subjects(payload.subject_accuracy))
    return [
        WeakSubjectOut(
            subject=r.subject, accuracy_estimate=r.accuracy_estimate, recommendation=r.recommendation
        )
        for r in reports
    ]


class SubjectBreakdownRowOut(BaseModel):
    subject: str
    chapter: str
    total_questions: int


@router.get("/subject-breakdown", response_model=list[SubjectBreakdownRowOut])
def get_subject_breakdown_route(
    days: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SubjectBreakdownRowOut]:
    """Real, DB-backed totals — powers the Statistics page breakdown panel."""
    since = date.today() - timedelta(days=days) if days else None
    rows = get_subject_breakdown(db, current_user, since=since)
    return [
        SubjectBreakdownRowOut(subject=r.subject, chapter=r.chapter, total_questions=r.total_questions)
        for r in rows
    ]


class CompanionChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)


class CompanionChatResponse(BaseModel):
    reply: str


@router.post("/companion/chat", response_model=CompanionChatResponse)
def companion_chat(
    payload: CompanionChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompanionChatResponse:
    intent = detect_subject_intent(payload.message)

    # --- "show me my totals" -> always answered from the real database,
    # never from AI-generated text, so the numbers are guaranteed accurate.
    if intent == "query":
        breakdown = get_subject_breakdown(db, current_user)
        return CompanionChatResponse(reply=format_breakdown_text(breakdown))

    # --- "Physics Magnetism 20, Chemistry Electrochemistry 30" -> parse and
    # permanently record, then confirm back exactly what was recorded.
    if intent == "log":
        entries = _run_async(extract_subject_logs(payload.message))
        if not entries:
            return CompanionChatResponse(
                reply=(
                    "I couldn't pick out a subject, chapter, and question count from that — "
                    'try something like "Physics Magnetism 20, Chemistry Electrochemistry 30".'
                )
            )
        record_subject_questions(db, current_user, entries, source="chat")
        confirmation = ", ".join(f"{e.subject} – {e.chapter}: {e.count} Q" for e in entries)
        return CompanionChatResponse(reply=f"Logged — {confirmation}. ✅")

    # --- ordinary conversation ---
    character = current_user.character
    context = (
        f"User {current_user.display_name}, level {character.level}, "
        f"streak {character.current_streak_days} days, burnout score {character.burnout_risk_score:.2f}. "
        f"User says: {payload.message}"
    )
    try:
        reply = _run_async(call_ai(COMPANION_SYSTEM_PROMPT, context, max_tokens=300))
        if not isinstance(reply, str) or not reply.strip():
            raise AIClientError("empty reply")
    except AIClientError:
        reply = "ARC is recalibrating — try that again in a moment."

    return CompanionChatResponse(reply=reply)
