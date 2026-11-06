"""
Authentication routes for ASCEND.

Handles:
- Email/Password and Username/Password registration and login.
- Firebase session synchronization (JIT provisioning).
- Session tracking across Website and Desktop clients.
- Session revocation and logout.
"""
from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_ascend_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.desktop import DesktopInstallation
from app.models.session import UserSession
from app.models.user import CharacterProfile, User
from app.schemas.user import (
    AuthTokenResponse,
    LoginRequest,
    RegisterRequest,
    SessionOut,
    UserOut,
)
from app.services.character_view import to_user_out

router = APIRouter(prefix="/auth", tags=["auth"])


def _record_session(
    db: Session,
    user: User,
    client_type: str,
    device_name: str,
    request: Request,
    device_id: Optional[str] = None,
) -> UserSession:
    """Helper to create and track a user session."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")[:500]

    session_token_seed = f"{user.id}-{datetime.utcnow().isoformat()}-{uuid.uuid4()}"
    token_hash = hashlib.sha256(session_token_seed.encode("utf-8")).hexdigest()

    expires_at = datetime.utcnow() + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)

    session = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        client_type=client_type,
        device_name=device_name,
        ip_address=client_ip,
        user_agent=user_agent,
        last_active_at=datetime.utcnow(),
        expires_at=expires_at,
    )
    db.add(session)

    # Track desktop machine if device_id is provided
    if client_type == "desktop" and device_id:
        installation = (
            db.query(DesktopInstallation)
            .filter(DesktopInstallation.device_id == device_id)
            .first()
        )
        if installation:
            installation.user_id = user.id
            installation.last_seen_at = datetime.utcnow()
        else:
            installation = DesktopInstallation(
                device_id=device_id,
                user_id=user.id,
                hostname=device_name,
                os_version="Windows Desktop",
                app_version="1.0.0",
                first_installed_at=datetime.utcnow(),
                last_seen_at=datetime.utcnow(),
            )
            db.add(installation)

    user.last_platform = client_type
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


@router.post("/register", response_model=AuthTokenResponse)
def register(
    payload: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> AuthTokenResponse:
    """Registers a new user with email or username and password."""
    email_clean = payload.email.lower().strip()
    existing_by_email = db.query(User).filter(User.email == email_clean).first()
    if existing_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    username_clean = payload.username.lower().strip() if payload.username else None
    if username_clean:
        existing_by_username = db.query(User).filter(User.username == username_clean).first()
        if existing_by_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already taken. Please choose another.",
            )

    display_name = payload.display_name or (username_clean or email_clean.split("@")[0]).capitalize()

    # Determine role
    is_owner = email_clean == settings.OWNER_EMAIL.lower().strip()
    role = "SUPER_ADMIN" if is_owner else "USER"

    user = User(
        email=email_clean,
        username=username_clean,
        password_hash=hash_password(payload.password),
        display_name=display_name,
        role=role,
        is_active=True,
        is_onboarded=False,
    )
    db.add(user)
    db.flush()

    character = CharacterProfile(user_id=user.id)
    db.add(character)
    db.commit()
    db.refresh(user)

    session = _record_session(
        db=db,
        user=user,
        client_type=payload.client_type,
        device_name=payload.device_name,
        request=request,
        device_id=payload.device_id,
    )

    access_token = create_access_token({"sub": str(user.id), "sid": str(session.id), "role": user.role})

    return AuthTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=to_user_out(user),
    )


@router.post("/login", response_model=AuthTokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> AuthTokenResponse:
    """Authenticates with either username or email and password."""
    identifier = payload.login.lower().strip()

    # Find user by email or username
    user = (
        db.query(User)
        .filter((User.email == identifier) | (User.username == identifier))
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email/username and password.",
        )

    if not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email/username and password.",
        )

    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account permanently banned: {user.ban_reason or 'Contact system administrator.'}",
        )

    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account suspended: {user.suspension_reason or 'Contact system administrator.'}",
        )

    # Ensure owner is SUPER_ADMIN
    if user.email and user.email.lower().strip() == settings.OWNER_EMAIL.lower().strip():
        user.role = "SUPER_ADMIN"

    session = _record_session(
        db=db,
        user=user,
        client_type=payload.client_type,
        device_name=payload.device_name,
        request=request,
        device_id=payload.device_id,
    )

    access_token = create_access_token({"sub": str(user.id), "sid": str(session.id), "role": user.role})

    return AuthTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=to_user_out(user),
    )


@router.post("/session", response_model=UserOut)
def establish_session(
    request: Request,
    client_type: str = "website",
    device_name: str = "Browser",
    device_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """
    Called after authentication (Firebase or ASCEND) to track the active session
    and return the updated profile.
    """
    _record_session(
        db=db,
        user=current_user,
        client_type=client_type,
        device_name=device_name,
        request=request,
        device_id=device_id,
    )
    return to_user_out(current_user)


@router.get("/sessions", response_model=List[SessionOut])
def get_user_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[SessionOut]:
    """Retrieves all active sessions for the current authenticated user."""
    sessions = (
        db.query(UserSession)
        .filter(UserSession.user_id == current_user.id, UserSession.is_revoked == False)
        .order_by(UserSession.last_active_at.desc())
        .all()
    )

    auth_header = request.headers.get("authorization", "")
    token = auth_header.replace("Bearer ", "").strip() if "Bearer " in auth_header else ""
    current_payload = decode_ascend_token(token) if token else None
    current_sid = current_payload.get("sid") if current_payload else None

    result = []
    for s in sessions:
        result.append(
            SessionOut(
                id=s.id,
                client_type=s.client_type,
                device_name=s.device_name,
                ip_address=s.ip_address,
                last_active_at=s.last_active_at,
                created_at=s.created_at,
                is_revoked=s.is_revoked,
                is_current=(str(s.id) == current_sid),
            )
        )
    return result


@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Revokes a specific session."""
    session = (
        db.query(UserSession)
        .filter(UserSession.id == session_id, UserSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.is_revoked = True
    db.commit()
    return {"status": "success", "message": "Session revoked"}


@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Logs out and revokes the active session."""
    auth_header = request.headers.get("authorization", "")
    token = auth_header.replace("Bearer ", "").strip() if "Bearer " in auth_header else ""
    payload = decode_ascend_token(token) if token else None
    if payload and "sid" in payload:
        try:
            sid = uuid.UUID(payload["sid"])
            session = db.query(UserSession).filter(UserSession.id == sid).first()
            if session:
                session.is_revoked = True
                db.commit()
        except ValueError:
            pass

    return {"status": "success", "message": "Logged out successfully"}
