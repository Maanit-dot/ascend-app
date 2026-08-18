"""
Boss service — weekly/monthly boss cycle management.

Bosses are created by a scheduled job (see `app/services/scheduler.py`) at
the start of each week/month. This module holds the creation logic and
query helpers used by the API layer.
"""
from __future__ import annotations

import random
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.boss import Boss, BossArchetype, BossCycle

BOSS_LORE = {
    BossArchetype.PROCRASTINATION: (
        "A creeping static that convinces you tomorrow is safer than today. "
        "It feeds on delayed starts."
    ),
    BossArchetype.FATIGUE: (
        "A dense gravity that settles into your limbs by mid-afternoon. "
        "It grows stronger when Recovery is ignored."
    ),
    BossArchetype.DISTRACTION: (
        "A fracture in attention that splits one task into twelve half-finished ones. "
        "It thrives in unstructured hours."
    ),
    BossArchetype.CHAOS: (
        "An entropy field that unravels routine the moment structure slips. "
        "It is strongest on your least-planned days."
    ),
    BossArchetype.STAGNATION: (
        "A stillness disguised as comfort. It wins when effort plateaus unnoticed."
    ),
    BossArchetype.DOUBT: (
        "A quiet voice that recalculates your worth after every setback. "
        "It weakens with every logged quest."
    ),
}

BOSS_NAMES = {
    BossArchetype.PROCRASTINATION: "Nullveil, the Waiting Static",
    BossArchetype.FATIGUE: "Graveweight",
    BossArchetype.DISTRACTION: "The Fractured Signal",
    BossArchetype.CHAOS: "Entropia",
    BossArchetype.STAGNATION: "The Standing Hour",
    BossArchetype.DOUBT: "The Recalculator",
}


def create_weekly_boss(db: Session, week_start: date, expected_participants: int = 1) -> Boss:
    week_end = week_start + timedelta(days=6)
    archetype = random.choice(list(BossArchetype))
    max_hp = 4000.0 * max(1, expected_participants)
    boss = Boss(
        name=BOSS_NAMES[archetype],
        archetype=archetype,
        cycle=BossCycle.WEEKLY,
        lore_text=BOSS_LORE[archetype],
        cycle_start=week_start,
        cycle_end=week_end,
        max_hp=max_hp,
        current_hp=max_hp,
        reward_xp=750,
    )
    db.add(boss)
    db.commit()
    db.refresh(boss)
    return boss


def create_monthly_boss(db: Session, month_start: date, expected_participants: int = 1) -> Boss:
    if month_start.month == 12:
        next_month = month_start.replace(year=month_start.year + 1, month=1)
    else:
        next_month = month_start.replace(month=month_start.month + 1)
    month_end = next_month - timedelta(days=1)

    archetype = random.choice(list(BossArchetype))
    max_hp = 18000.0 * max(1, expected_participants)
    boss = Boss(
        name=f"{BOSS_NAMES[archetype]} (Raid Tier)",
        archetype=archetype,
        cycle=BossCycle.MONTHLY,
        lore_text=BOSS_LORE[archetype],
        cycle_start=month_start,
        cycle_end=month_end,
        max_hp=max_hp,
        current_hp=max_hp,
        reward_xp=3000,
        reward_item_key="legendary_chest",
    )
    db.add(boss)
    db.commit()
    db.refresh(boss)
    return boss


def hp_percent(boss: Boss) -> float:
    if boss.max_hp <= 0:
        return 0.0
    return round(max(0.0, boss.current_hp / boss.max_hp) * 100, 2)
