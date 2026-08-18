"""Story Mode routes — original narrative chapters unlocked by progression."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.story import StoryChapter, StoryProgress
from app.models.user import User
from app.schemas.common import StoryChapterOut

router = APIRouter(prefix="/story", tags=["story"])


@router.get("/chapters", response_model=list[StoryChapterOut])
def list_chapters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StoryChapterOut]:
    progress = current_user.story_progress
    unlocked_keys: set[str] = set(json.loads(progress.unlocked_chapter_keys)) if progress else set()

    chapters = db.query(StoryChapter).order_by(StoryChapter.order_index).all()
    character = current_user.character

    results = []
    for chapter in chapters:
        meets_level = chapter.unlock_level is None or character.level >= chapter.unlock_level
        meets_streak = (
            chapter.unlock_streak_days is None
            or character.current_streak_days >= chapter.unlock_streak_days
        )
        is_unlocked = chapter.key in unlocked_keys or (meets_level and meets_streak)

        results.append(
            StoryChapterOut(
                key=chapter.key,
                title=chapter.title,
                body_text=chapter.body_text if is_unlocked else None,
                is_unlocked=is_unlocked,
                cover_art_key=chapter.cover_art_key,
            )
        )
    return results
