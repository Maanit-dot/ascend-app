"""
Firebase-backed authentication.

The frontend authenticates users against Firebase Auth directly, then sends
the resulting ID token as a Bearer token on every API request. This module
verifies that token server-side and resolves it to a local `User` row,
creating one on first sign-in (JIT provisioning).
"""
from __future__ import annotations

import json
from functools import lru_cache

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import CharacterProfile, User

bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def get_firebase_app() -> firebase_admin.App:
    """Lazily initialize the Firebase Admin SDK from env-provided service account fields."""
    if firebase_admin._apps:
        return firebase_admin.get_app()

    service_account_info = {
        "type": "service_account",
        "project_id": settings.FIREBASE_PROJECT_ID,
        "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
        "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
        "client_email": settings.FIREBASE_CLIENT_EMAIL,
        "client_id": settings.FIREBASE_CLIENT_ID,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": settings.FIREBASE_CLIENT_CERT_URL,
    }
    cred = credentials.Certificate(service_account_info)
    return firebase_admin.initialize_app(cred)


def verify_firebase_token(credential: HTTPAuthorizationCredentials) -> dict:
    """Verifies a Firebase ID token and returns its decoded claims."""
    get_firebase_app()
    try:
        decoded = firebase_auth.verify_id_token(credential.credentials)
    except Exception as exc:  # noqa: BLE001 — surfaced as a clean 401
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {exc}",
        ) from exc
    return decoded


def get_current_user(
    credential: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolves the authenticated `User` for the current request.

    Performs just-in-time provisioning: if this is the Firebase user's first
    request, a `User` + starter `CharacterProfile` are created automatically.
    """
    if credential is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    claims = verify_firebase_token(credential)
    firebase_uid = claims["uid"]
    email = claims.get("email", "")
    name = claims.get("name") or (email.split("@")[0] if email else "Ascender")
    picture = claims.get("picture")

    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if user is None:
        user = User(
            firebase_uid=firebase_uid,
            email=email,
            display_name=name,
            avatar_url=picture,
        )
        db.add(user)
        db.flush()  # get user.id without committing yet

        character = CharacterProfile(user_id=user.id)
        db.add(character)
        db.commit()
        db.refresh(user)

    return user
