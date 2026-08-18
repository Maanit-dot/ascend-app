"""
Scheduled jobs.

ASCEND's only time-based background work: creating weekly/monthly bosses at
the start of each cycle, and recomputing every user's difficulty multiplier
once per day ahead of their next quest board generation.

Runs via a lightweight in-process scheduler (`apscheduler`-free, stdlib
`sched`-free) triggered by an external cron (Railway cron job / GitHub
Actions scheduled workflow) hitting `run_daily_jobs()` through the
`scripts/run_scheduler.py` entrypoint — kept dependency-light and
infra-agnostic rather than baking a scheduler process into the API service.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.boss import Boss, BossCycle
from app.models.story import Notification, NotificationType
from app.models.user import User
from app.services import quest_service
from app.services.boss_service import create_monthly_boss, create_weekly_boss

logger = logging.getLogger("ascend.scheduler")


def ensure_weekly_boss(db: Session, today: date) -> Boss | None:
    """Creates this week's boss if one doesn't already exist for the current Mon-Sun cycle."""
    week_start = today - timedelta(days=today.weekday())  # Monday
    existing = (
        db.query(Boss)
        .filter(Boss.cycle == BossCycle.WEEKLY, Boss.cycle_start == week_start)
        .first()
    )
    if existing:
        return None

    active_user_count = db.query(User).filter(User.is_active.is_(True)).count()
    boss = create_weekly_boss(db, week_start, expected_participants=max(1, active_user_count))
    logger.info("Created weekly boss: %s (HP=%s)", boss.name, boss.max_hp)
    return boss


def ensure_monthly_boss(db: Session, today: date) -> Boss | None:
    """Creates this month's raid boss if one doesn't already exist."""
    month_start = today.replace(day=1)
    existing = (
        db.query(Boss)
        .filter(Boss.cycle == BossCycle.MONTHLY, Boss.cycle_start == month_start)
        .first()
    )
    if existing:
        return None

    active_user_count = db.query(User).filter(User.is_active.is_(True)).count()
    boss = create_monthly_boss(db, month_start, expected_participants=max(1, active_user_count))
    logger.info("Created monthly raid: %s (HP=%s)", boss.name, boss.max_hp)
    return boss


def notify_new_boss(db: Session, boss: Boss) -> None:
    """Fans out a boss-update notification to every active user."""
    users = db.query(User).filter(User.is_active.is_(True)).all()
    cycle_label = "Weekly Boss" if boss.cycle == BossCycle.WEEKLY else "Monthly Raid"
    for user in users:
        db.add(
            Notification(
                user_id=user.id,
                type=NotificationType.BOSS_UPDATE,
                title=f"New {cycle_label}: {boss.name}",
                body=boss.lore_text,
            )
        )
    db.commit()


def recompute_all_difficulties(db: Session) -> int:
    """Runs the difficulty adaptation pass for every active user. Returns count processed."""
    users = db.query(User).filter(User.is_active.is_(True)).all()
    for user in users:
        try:
            quest_service.recompute_difficulty(db, user)
        except Exception:  # noqa: BLE001 — one user's failure shouldn't halt the batch
            logger.exception("Failed to recompute difficulty for user %s", user.id)
    return len(users)


def run_daily_jobs() -> None:
    """Entrypoint invoked once per day by an external cron trigger."""
    db = SessionLocal()
    today = date.today()
    try:
        weekly_boss = ensure_weekly_boss(db, today)
        if weekly_boss:
            notify_new_boss(db, weekly_boss)

        monthly_boss = ensure_monthly_boss(db, today)
        if monthly_boss:
            notify_new_boss(db, monthly_boss)

        processed = recompute_all_difficulties(db)
        logger.info("Daily jobs complete. Difficulty recomputed for %s users.", processed)
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_daily_jobs()
