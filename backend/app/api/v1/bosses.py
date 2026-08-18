"""Boss routes — active weekly/monthly bosses and claiming rewards."""
from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.boss import Boss, BossParticipation
from app.models.user import User
from app.schemas.common import BossOut, BossParticipationOut
from app.services.boss_service import hp_percent
from app.services.inventory_service import grant_item
from app.services.leveling import apply_xp_gain

router = APIRouter(prefix="/bosses", tags=["bosses"])


def _boss_out(boss: Boss) -> BossOut:
    return BossOut(
        id=boss.id,
        name=boss.name,
        archetype=boss.archetype,
        cycle=boss.cycle,
        lore_text=boss.lore_text,
        icon_key=boss.icon_key,
        cycle_start=boss.cycle_start,
        cycle_end=boss.cycle_end,
        max_hp=boss.max_hp,
        current_hp=boss.current_hp,
        hp_percent=hp_percent(boss),
        is_defeated=boss.is_defeated,
        reward_xp=boss.reward_xp,
    )


@router.get("/active", response_model=list[BossOut])
def list_active_bosses(db: Session = Depends(get_db)) -> list[BossOut]:
    today = date.today()
    bosses = db.query(Boss).filter(Boss.cycle_start <= today, Boss.cycle_end >= today).all()
    return [_boss_out(b) for b in bosses]


@router.get("/my-participations", response_model=list[BossParticipationOut])
def my_participations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[BossParticipationOut]:
    rows = (
        db.query(BossParticipation)
        .filter(BossParticipation.user_id == current_user.id)
        .order_by(BossParticipation.created_at.desc())
        .all()
    )
    return [
        BossParticipationOut(
            boss=_boss_out(row.boss),
            damage_dealt=row.damage_dealt,
            quests_contributed=row.quests_contributed,
            reward_claimed=row.reward_claimed,
        )
        for row in rows
    ]


@router.post("/{boss_id}/claim-reward")
def claim_boss_reward(
    boss_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    participation = (
        db.query(BossParticipation)
        .filter(BossParticipation.boss_id == boss_id, BossParticipation.user_id == current_user.id)
        .first()
    )
    if participation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No participation record for this boss")
    if not participation.boss.is_defeated:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Boss has not been defeated yet")
    if participation.reward_claimed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Reward already claimed")

    character = current_user.character
    result = apply_xp_gain(character.level, character.current_xp, participation.boss.reward_xp)
    character.level = result.new_level
    character.current_xp = result.new_current_xp
    character.total_xp_earned += participation.boss.reward_xp

    if participation.boss.reward_item_key:
        grant_item(db, current_user, participation.boss.reward_item_key, 1)

    participation.reward_claimed = True
    db.commit()

    return {
        "xp_awarded": participation.boss.reward_xp,
        "leveled_up": result.leveled_up,
        "new_level": character.level,
        "item_granted": participation.boss.reward_item_key,
    }
