"""
Burnout prediction engine.

Deterministic signal-based scoring (0.0 - 1.0) combining streak volatility,
completion-rate trend, sleep-quest compliance, and self-reported recovery
stat. Kept rules-based (not LLM) so it runs cheaply on every dashboard load
and stays explainable — the companion then narrates the result in natural
language.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class BurnoutSignals:
    completion_rate_7d: float  # 0.0 - 1.0
    completion_rate_prev_7d: float  # 0.0 - 1.0, the week before
    sleep_quest_compliance_7d: float  # 0.0 - 1.0
    current_streak_days: int
    missed_days_in_last_14: int
    recovery_stat: int  # character's recovery stat, 1+
    avg_daily_quest_load: float  # relative to baseline of 1.0


@dataclass
class BurnoutResult:
    score: float  # 0.0 (fine) - 1.0 (critical)
    risk_level: str  # "low" | "moderate" | "high" | "critical"
    contributing_factors: list[str] = field(default_factory=list)
    recommendation: str = ""


def predict_burnout(signals: BurnoutSignals) -> BurnoutResult:
    score = 0.0
    factors: list[str] = []

    # 1. Declining completion trend
    trend_delta = signals.completion_rate_prev_7d - signals.completion_rate_7d
    if trend_delta > 0.25:
        score += 0.30
        factors.append("Completion rate dropped sharply versus last week")
    elif trend_delta > 0.10:
        score += 0.15
        factors.append("Completion rate trending downward")

    # 2. Sleep compliance — the single strongest burnout predictor
    if signals.sleep_quest_compliance_7d < 0.4:
        score += 0.30
        factors.append("Sleep target missed on most days this week")
    elif signals.sleep_quest_compliance_7d < 0.7:
        score += 0.15
        factors.append("Sleep consistency below target")

    # 3. Missed days despite an active streak (grinding without recovery)
    if signals.missed_days_in_last_14 >= 4:
        score += 0.15
        factors.append("Frequent missed days in the last two weeks")

    # 4. Low recovery stat relative to quest load
    if signals.recovery_stat < 5 and signals.avg_daily_quest_load > 1.2:
        score += 0.15
        factors.append("High quest load against a low Recovery stat")

    # 5. Long unbroken streak with no rest — overtraining risk
    if signals.current_streak_days >= 21 and signals.sleep_quest_compliance_7d < 0.8:
        score += 0.10
        factors.append("Long streak sustained without adequate rest")

    score = round(min(score, 1.0), 3)

    if score >= 0.7:
        risk_level = "critical"
        recommendation = (
            "Take a structured recovery day: reduce mandatory quest targets by 50%, "
            "prioritize the Sleep quest, and skip optional sports today."
        )
    elif score >= 0.45:
        risk_level = "high"
        recommendation = (
            "Ease off intensity for 2-3 days. Keep the streak alive with lighter targets "
            "rather than pushing through at full load."
        )
    elif score >= 0.2:
        risk_level = "moderate"
        recommendation = "Keep an eye on sleep and recovery quests this week — trending toward fatigue."
    else:
        risk_level = "low"
        recommendation = "No burnout indicators detected. Current pace is sustainable."

    return BurnoutResult(
        score=score,
        risk_level=risk_level,
        contributing_factors=factors,
        recommendation=recommendation,
    )
