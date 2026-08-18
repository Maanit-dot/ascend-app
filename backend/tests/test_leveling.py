"""Unit tests for the leveling engine — pure functions, no DB dependency."""
from app.services.leveling import (
    apply_xp_gain,
    resolve_level_unlock,
    xp_progress_percent,
    xp_required_for_level,
)


def test_xp_required_grows_exponentially():
    l1 = xp_required_for_level(1)
    l10 = xp_required_for_level(10)
    l25 = xp_required_for_level(25)
    assert l1 == 100
    assert l10 > l1
    assert l25 > l10


def test_apply_xp_gain_no_level_up():
    result = apply_xp_gain(current_level=1, current_xp=0, xp_gained=50)
    assert result.leveled_up is False
    assert result.new_level == 1
    assert result.new_current_xp == 50


def test_apply_xp_gain_single_level_up():
    required = xp_required_for_level(1)
    result = apply_xp_gain(current_level=1, current_xp=0, xp_gained=required + 10)
    assert result.leveled_up is True
    assert result.new_level == 2
    assert result.new_current_xp == 10
    assert result.levels_gained == 1
    assert result.stat_points_awarded == 2


def test_apply_xp_gain_cascading_multi_level_up():
    huge_xp = 100_000
    result = apply_xp_gain(current_level=1, current_xp=0, xp_gained=huge_xp)
    assert result.leveled_up is True
    assert result.levels_gained > 1
    assert result.new_level > 1


def test_resolve_level_unlock_milestone():
    assert "Story Mode" in resolve_level_unlock(10)


def test_resolve_level_unlock_generic():
    text = resolve_level_unlock(7)
    assert "stat points" in text


def test_xp_progress_percent_bounds():
    assert xp_progress_percent(0, 1) == 0.0
    required = xp_required_for_level(1)
    assert xp_progress_percent(required, 1) == 100.0
    assert xp_progress_percent(required * 2, 1) == 100.0  # capped
