"""
Auth routes.

Actual authentication happens client-side against Firebase; this endpoint
exists purely to trigger JIT user provisioning and hand back the resolved
profile right after sign-in, so the frontend doesn't need a second call.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserOut
from app.services.character_view import to_character_profile_out

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/session", response_model=UserOut)
def establish_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """Called immediately after Firebase sign-in to sync/create the local profile."""
    from datetime import datetime

    current_user.last_login_at = datetime.utcnow()
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
