"""Direct bidirectional bridge between JARVIS and ASCEND Hunter data:
Reads and updates live Character status, Daily Quests, XP, Levels, and Statistics in SQLite.
"""
from __future__ import annotations

import logging
from datetime import date
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.quest import QuestCategory, QuestInstance, QuestTemplate, QuestType, QuestUnit
from app.models.user import User
from app.services import quest_service
from app.services.leveling import xp_required_for_level, xp_progress_percent

logger = logging.getLogger("ascend.jarvis.bridge")


def get_hunter_title(level: int) -> str:
    if level < 10:
        return "Novice Hunter"
    if level < 20:
        return "Hunter"
    if level < 30:
        return "Elite Hunter"
    if level < 40:
        return "Advanced Hunter"
    if level < 50:
        return "Shadow Hunter"
    if level < 60:
        return "Shadow Knight"
    if level < 70:
        return "Shadow Commander"
    if level < 80:
        return "Monarch"
    if level < 90:
        return "Shadow Monarch"
    if level < 100:
        return "Sovereign"
    return "Transcendent"


def get_hunter_rank(level: int) -> str:
    if level < 10:
        return "E"
    if level < 20:
        return "D"
    if level < 30:
        return "C"
    if level < 40:
        return "B"
    if level < 50:
        return "A"
    return "S"


def get_hunter_briefing(db: Session, user: User) -> Dict[str, Any]:
    """Retrieve full Hunter character briefing and live daily quest status."""
    char = user.character
    today = date.today()

    active_quests = (
        db.query(QuestInstance)
        .join(QuestTemplate)
        .filter(QuestInstance.user_id == user.id, QuestInstance.assigned_date == today)
        .all()
    )

    quest_list = []
    completed_count = 0
    total_xp_available = 0

    for q in active_quests:
        is_done = q.is_completed
        if is_done:
            completed_count += 1
        total_xp_available += q.xp_reward
        quest_list.append({
            "id": str(q.id),
            "name": q.template.name,
            "category": q.template.category.value if hasattr(q.template.category, "value") else str(q.template.category),
            "current": q.current_value,
            "target": q.target_value,
            "unit": q.template.unit.value if hasattr(q.template.unit, "value") else str(q.template.unit),
            "xp_reward": q.xp_reward,
            "is_completed": is_done,
        })

    next_req = xp_required_for_level(char.level + 1) if char else 1000
    cur_xp = (char.total_xp_earned if hasattr(char, "total_xp_earned") else getattr(char, "current_xp", 0)) if char else 0
    progress_pct = xp_progress_percent(char.level, cur_xp) if char else 0

    return {
        "hunter_name": user.display_name or "Hunter",
        "level": char.level if char else 1,
        "title": get_hunter_title(char.level if char else 1),
        "rank": get_hunter_rank(char.level if char else 1),
        "total_xp": cur_xp,
        "xp_for_next_level": next_req,
        "xp_progress_pct": round(progress_pct, 1),
        "streak_days": getattr(char, "current_streak_days", 0) if char else 0,
        "quests_total": len(quest_list),
        "quests_completed": completed_count,
        "quests": quest_list,
    }


def log_quest_progress(db: Session, user: User, quest_name_or_id: str, delta: int = 1) -> Dict[str, Any]:
    """Increment progress on a daily quest or mark it complete."""
    today = date.today()
    q_lower = quest_name_or_id.lower().strip()

    instances = (
        db.query(QuestInstance)
        .join(QuestTemplate)
        .filter(QuestInstance.user_id == user.id, QuestInstance.assigned_date == today)
        .all()
    )

    target_instance: Optional[QuestInstance] = None

    # First try exact ID
    for inst in instances:
        if str(inst.id) == quest_name_or_id:
            target_instance = inst
            break

    # Next try fuzzy name match
    if not target_instance:
        for inst in instances:
            if q_lower in inst.template.name.lower():
                target_instance = inst
                break

    if not target_instance and instances:
        # Fallback to first incomplete quest if generic
        if "quest" in q_lower or "daily" in q_lower or "running" in q_lower:
            for inst in instances:
                if not inst.is_completed:
                    target_instance = inst
                    break

    if not target_instance:
        return {"status": "not_found", "message": f"No active quest found matching '{quest_name_or_id}'."}

    # Apply progress
    result = quest_service.log_progress(
        db=db,
        user=user,
        instance_id=target_instance.id,
        delta=delta,
    )
    return {
        "status": "success",
        "quest_name": target_instance.template.name,
        "current": target_instance.current_value,
        "target": target_instance.target_value,
        "is_completed": target_instance.is_completed,
        "message": f"Updated '{target_instance.template.name}' to {target_instance.current_value}/{target_instance.target_value} {target_instance.template.unit.value}."
    }


def add_custom_quest(db: Session, user: User, title: str, target_value: int, category: str = "custom") -> Dict[str, Any]:
    """Create a new custom daily quest for today."""
    today = date.today()
    template = QuestTemplate(
        user_id=user.id,
        name=title.strip(),
        description="Custom quest created via JARVIS",
        category=QuestCategory.HABIT if hasattr(QuestCategory, "HABIT") else QuestCategory.DAILY,
        quest_type=QuestType.DAILY,
        target_value=target_value,
        unit=QuestUnit.MINUTES,
        xp_reward=min(100, max(15, target_value * 2)),
        is_system=False,
    )
    db.add(template)
    db.flush()

    instance = QuestInstance(
        template_id=template.id,
        user_id=user.id,
        date=today,
        target_value=target_value,
        current_value=0,
        xp_reward=template.xp_reward,
        is_completed=False,
    )
    db.add(instance)
    db.commit()

    return {
        "status": "success",
        "quest_title": template.name,
        "target": target_value,
        "xp_reward": template.xp_reward,
        "message": f"Created new custom quest '{template.name}' for today."
    }
