"""
Difficulty adaptation engine.

This is the deterministic, non-LLM half of the AI system: a rules-based
controller that raises or lowers a user's `difficulty_multiplier` based on
recent completion-rate signals. It runs on every quest-generation cycle and
is intentionally explainable (no black box) so the UI can show *why*
difficulty changed.

The LLM-based subsystems (quest_generator, companion) then read this
multiplier rather than re-deriving it, keeping difficulty math consistent
and auditable.
"""
from __future__ import annotations

from dataclasses import dataclass

MIN_MULTIPLIER = 0.5
MAX_MULTIPLIER = 2.0

# Completion-rate thresholds over the trailing 7-day window
RATE_INCREASE_THRESHOLD = 0.90  # completed >=90% of quests -> harder
RATE_DECREASE_THRESHOLD = 0.50  # completed <50% of quests -> easier

STEP_UP = 0.08
STEP_DOWN = 0.12  # ease off faster than we ramp up — protects against burnout


@dataclass
class DifficultyAdjustment:
    previous_multiplier: float
    new_multiplier: float
    direction: str  # "increase" | "decrease" | "hold"
    reason: str


def compute_completion_rate(completed: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return completed / total


def adjust_difficulty(
    current_multiplier: float,
    trailing_completion_rate: float,
    burnout_risk_score: float,
) -> DifficultyAdjustment:
    """
    Core adaptive rule:

    - High completion rate + low burnout risk -> ramp difficulty up.
    - Low completion rate OR elevated burnout risk -> ease off.
    - Otherwise -> hold steady.
    """
    # Burnout risk overrides everything — protect the user first.
    if burnout_risk_score >= 0.7:
        new_mult = max(MIN_MULTIPLIER, round(current_multiplier - STEP_DOWN, 3))
        return DifficultyAdjustment(
            previous_multiplier=current_multiplier,
            new_multiplier=new_mult,
            direction="decrease",
            reason="Elevated burnout risk detected — easing quest load to protect recovery.",
        )

    if trailing_completion_rate >= RATE_INCREASE_THRESHOLD:
        new_mult = min(MAX_MULTIPLIER, round(current_multiplier + STEP_UP, 3))
        return DifficultyAdjustment(
            previous_multiplier=current_multiplier,
            new_multiplier=new_mult,
            direction="increase",
            reason=f"Completion rate {trailing_completion_rate:.0%} over the last 7 days — raising the bar.",
        )

    if trailing_completion_rate <= RATE_DECREASE_THRESHOLD:
        new_mult = max(MIN_MULTIPLIER, round(current_multiplier - STEP_DOWN, 3))
        return DifficultyAdjustment(
            previous_multiplier=current_multiplier,
            new_multiplier=new_mult,
            direction="decrease",
            reason=f"Completion rate {trailing_completion_rate:.0%} over the last 7 days — scaling back to rebuild momentum.",
        )

    return DifficultyAdjustment(
        previous_multiplier=current_multiplier,
        new_multiplier=current_multiplier,
        direction="hold",
        reason="Performance is steady — holding current difficulty.",
    )


def scale_target(base_target: float, min_target: float, max_target: float, multiplier: float) -> float:
    """
    Maps a difficulty multiplier (0.5 - 2.0) onto a template's [min, max]
    target range, centered on `base_target` at multiplier == 1.0.
    """
    if multiplier >= 1.0:
        # Interpolate from base -> max as multiplier goes 1.0 -> 2.0
        span = max_target - base_target
        fraction = min((multiplier - 1.0) / 1.0, 1.0)
        return round(base_target + span * fraction)
    else:
        # Interpolate from min -> base as multiplier goes 0.5 -> 1.0
        span = base_target - min_target
        fraction = (multiplier - MIN_MULTIPLIER) / (1.0 - MIN_MULTIPLIER)
        return round(min_target + span * fraction)
