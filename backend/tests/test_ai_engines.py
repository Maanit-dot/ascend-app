"""Unit tests for the difficulty adaptation and burnout prediction engines."""
from app.ai.burnout_predictor import BurnoutSignals, predict_burnout
from app.ai.difficulty_engine import adjust_difficulty, scale_target


def test_difficulty_increases_on_high_completion():
    result = adjust_difficulty(current_multiplier=1.0, trailing_completion_rate=0.95, burnout_risk_score=0.1)
    assert result.direction == "increase"
    assert result.new_multiplier > 1.0


def test_difficulty_decreases_on_low_completion():
    result = adjust_difficulty(current_multiplier=1.0, trailing_completion_rate=0.3, burnout_risk_score=0.1)
    assert result.direction == "decrease"
    assert result.new_multiplier < 1.0


def test_difficulty_holds_in_middle_band():
    result = adjust_difficulty(current_multiplier=1.0, trailing_completion_rate=0.7, burnout_risk_score=0.1)
    assert result.direction == "hold"
    assert result.new_multiplier == 1.0


def test_difficulty_burnout_override():
    result = adjust_difficulty(current_multiplier=1.5, trailing_completion_rate=0.95, burnout_risk_score=0.8)
    assert result.direction == "decrease"


def test_difficulty_respects_bounds():
    result = adjust_difficulty(current_multiplier=1.98, trailing_completion_rate=0.95, burnout_risk_score=0.0)
    assert result.new_multiplier <= 2.0
    result2 = adjust_difficulty(current_multiplier=0.52, trailing_completion_rate=0.1, burnout_risk_score=0.0)
    assert result2.new_multiplier >= 0.5


def test_scale_target_at_baseline():
    assert scale_target(base_target=200, min_target=150, max_target=300, multiplier=1.0) == 200


def test_scale_target_scales_up_toward_max():
    value = scale_target(base_target=200, min_target=150, max_target=300, multiplier=2.0)
    assert value == 300


def test_scale_target_scales_down_toward_min():
    value = scale_target(base_target=200, min_target=150, max_target=300, multiplier=0.5)
    assert value == 150


def test_burnout_low_risk_when_signals_healthy():
    signals = BurnoutSignals(
        completion_rate_7d=0.9,
        completion_rate_prev_7d=0.9,
        sleep_quest_compliance_7d=0.95,
        current_streak_days=5,
        missed_days_in_last_14=0,
        recovery_stat=8,
        avg_daily_quest_load=1.0,
    )
    result = predict_burnout(signals)
    assert result.risk_level == "low"
    assert result.score < 0.2


def test_burnout_critical_when_signals_poor():
    signals = BurnoutSignals(
        completion_rate_7d=0.3,
        completion_rate_prev_7d=0.8,
        sleep_quest_compliance_7d=0.2,
        current_streak_days=25,
        missed_days_in_last_14=6,
        recovery_stat=2,
        avg_daily_quest_load=1.5,
    )
    result = predict_burnout(signals)
    assert result.risk_level in ("high", "critical")
    assert result.score >= 0.45
