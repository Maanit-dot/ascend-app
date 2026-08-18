"""Achievement and title routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.achievement import AchievementDefinition, Title, UserAchievement, UserTitle
from app.models.user import User
from app.schemas.common import AchievementOut, TitleOut

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("", response_model=list[AchievementOut])
def list_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AchievementOut]:
    unlocked = {
        row.achievement_id: row.unlocked_at
        for row in db.query(UserAchievement).filter(UserAchievement.user_id == current_user.id)
    }
    definitions = db.query(AchievementDefinition).all()

    results = []
    for d in definitions:
        is_unlocked = d.id in unlocked
        if d.is_hidden and not is_unlocked:
            continue  # secret achievements stay hidden until earned
        results.append(
            AchievementOut(
                key=d.key,
                name=d.name,
                description=d.description,
                icon_key=d.icon_key,
                xp_reward=d.xp_reward,
                is_hidden=d.is_hidden,
                unlocked_at=unlocked.get(d.id),
            )
        )
    return results


@router.get("/titles", response_model=list[TitleOut])
def list_titles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TitleOut]:
    unlocked = {
        row.title_id: row.unlocked_at
        for row in db.query(UserTitle).filter(UserTitle.user_id == current_user.id)
    }
    titles = db.query(Title).all()
    return [
        TitleOut(
            id=t.id,
            key=t.key,
            display_text=t.display_text,
            description=t.description,
            unlocked_at=unlocked.get(t.id),
        )
        for t in titles
        if t.id in unlocked
    ]
