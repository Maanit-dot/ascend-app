"""
Maps the `CharacterProfile` ORM model to its API schema, computing the
derived leveling fields (xp required for next level, progress percent) so
routers never duplicate that math.
"""
from __future__ import annotations

from app.models.user import CharacterProfile
from app.schemas.user import CharacterProfileOut, CharacterStatsSchema
from app.services.leveling import xp_progress_percent, xp_required_for_level


def to_character_profile_out(character: CharacterProfile) -> CharacterProfileOut:
    stats = CharacterStatsSchema(
        knowledge=character.knowledge,
        strength=character.strength,
        stamina=character.stamina,
        recovery=character.recovery,
        focus=character.focus,
        discipline=character.discipline,
        consistency=character.consistency,
        agility=character.agility,
        speed=character.speed,
        potential=character.potential,
        luck=character.luck,
        mental_fortitude=character.mental_fortitude,
    )
    return CharacterProfileOut(
        id=character.id,
        level=character.level,
        current_xp=character.current_xp,
        total_xp_earned=character.total_xp_earned,
        xp_required_for_next_level=xp_required_for_level(character.level),
        xp_progress_percent=xp_progress_percent(character.current_xp, character.level),
        stats=stats,
        current_streak_days=character.current_streak_days,
        longest_streak_days=character.longest_streak_days,
        last_quest_completed_date=character.last_quest_completed_date,
        active_title_id=character.active_title_id,
        difficulty_multiplier=character.difficulty_multiplier,
        burnout_risk_score=character.burnout_risk_score,
    )
