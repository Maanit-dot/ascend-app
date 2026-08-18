"""User profile, onboarding, and settings routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import OnboardingRequest, UpdateProfileRequest, UserOut
from app.services.character_view import to_character_profile_out

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        avatar_url=current_user.avatar_url,
        is_onboarded=current_user.is_onboarded,
        timezone=current_user.timezone,
        primary_track=current_user.primary_track,
        created_at=current_user.created_at,
        character=to_character_profile_out(current_user.character),
    )


@router.post("/onboard", response_model=UserOut)
def complete_onboarding(
    payload: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    current_user.display_name = payload.display_name
    current_user.timezone = payload.timezone
    current_user.primary_track = payload.primary_track
    current_user.is_onboarded = True
    db.commit()
    db.refresh(current_user)

    return UserOut(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        avatar_url=current_user.avatar_url,
        is_onboarded=current_user.is_onboarded,
        timezone=current_user.timezone,
        primary_track=current_user.primary_track,
        created_at=current_user.created_at,
        character=to_character_profile_out(current_user.character),
    )


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    if payload.display_name is not None:
        current_user.display_name = payload.display_name
    if payload.timezone is not None:
        current_user.timezone = payload.timezone
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.active_title_id is not None:
        owned = {t.title_id for t in current_user.titles}
        if payload.active_title_id not in owned:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Title not unlocked")
        current_user.character.active_title_id = payload.active_title_id

    db.commit()
    db.refresh(current_user)

    return UserOut(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        avatar_url=current_user.avatar_url,
        is_onboarded=current_user.is_onboarded,
        timezone=current_user.timezone,
        primary_track=current_user.primary_track,
        created_at=current_user.created_at,
        character=to_character_profile_out(current_user.character),
    )
