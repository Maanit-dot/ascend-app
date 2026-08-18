"""
Leveling engine.

ASCEND uses an uncapped exponential XP curve so the level number never
plateaus and never becomes "beatable" — the game design intent is a visible
but asymptotically-slowing sense of progression, matching real-world
diminishing returns on discipline compounding.

XP required to go from level N -> N+1:

    xp_required(N) = floor(BASE * (GROWTH ** (N - 1)))

With BASE=100, GROWTH=1.12:
    L1->2   = 100
    L10->11 = ~312
    L25->26 = ~1,700
    L50->51 = ~28,900

Every level unlocks something (cosmetic, stat point, item, or story beat) —
resolved by `resolve_level_unlock`.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

BASE_XP = 100
GROWTH_RATE = 1.12
STAT_POINTS_PER_LEVEL = 2


def xp_required_for_level(level: int) -> int:
    """XP needed to advance FROM `level` to `level + 1`."""
    if level < 1:
        level = 1
    return math.floor(BASE_XP * (GROWTH_RATE ** (level - 1)))


@dataclass
class LevelUpResult:
    leveled_up: bool
    new_level: int
    new_current_xp: int
    levels_gained: int
    stat_points_awarded: int
    unlocks: list[str]


def apply_xp_gain(current_level: int, current_xp: int, xp_gained: int) -> LevelUpResult:
    """
    Applies an XP gain, cascading through as many level-ups as the gain
    covers (important for large boss-defeat rewards that can jump multiple
    levels at once).
    """
    level = current_level
    xp = current_xp + xp_gained
    levels_gained = 0
    unlocks: list[str] = []

    while xp >= xp_required_for_level(level):
        xp -= xp_required_for_level(level)
        level += 1
        levels_gained += 1
        unlocks.append(resolve_level_unlock(level))

    return LevelUpResult(
        leveled_up=levels_gained > 0,
        new_level=level,
        new_current_xp=xp,
        levels_gained=levels_gained,
        stat_points_awarded=levels_gained * STAT_POINTS_PER_LEVEL,
        unlocks=unlocks,
    )


def resolve_level_unlock(level: int) -> str:
    """
    Deterministically resolves what a given level unlocks. Milestone levels
    unlock major content; all other levels unlock a stat-point allocation +
    cosmetic aura tier, guaranteeing "every level unlocks something".
    """
    milestones = {
        5: "New AI Companion dialogue tier: Attentive",
        10: "Story Mode: Chapter 1 — The First Threshold",
        15: "Inventory slot expansion",
        20: "Weekly Boss difficulty tier: Elite",
        25: "Story Mode: Chapter 2 — The Hollow Hours",
        30: "New title unlocked: The Relentless",
        40: "Story Mode: Chapter 3 — Echoes of Momentum",
        50: "Monthly Raid tier: Apex",
        75: "Story Mode: Chapter 4 — The Long Ascent",
        100: "Title unlocked: Ascendant",
    }
    if level in milestones:
        return milestones[level]
    return f"Aura tier {level // 5 + 1} — +{STAT_POINTS_PER_LEVEL} stat points"


def xp_progress_percent(current_xp: int, level: int) -> float:
    """Percentage progress toward the next level, for progress-bar rendering."""
    required = xp_required_for_level(level)
    if required <= 0:
        return 0.0
    return round(min(current_xp / required, 1.0) * 100, 2)
