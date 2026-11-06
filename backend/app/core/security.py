"""
Authentication & Authorization Security Module for ASCEND.

Supports:
1. ASCEND Native Tokens (issued on Email/Password & Username/Password authentication)
2. Firebase ID Tokens (issued on Google / Firebase client authentication)
3. Password hashing (PBKDF2-HMAC-SHA256 with cryptographically secure salts)
4. Session verification and revocation checks
5. Owner / Super Admin RBAC enforcement
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Any, Dict, Optional

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.session import UserSession
from app.models.user import CharacterProfile, User

bearer_scheme = HTTPBearer(auto_error=False)

JWT_ALGORITHM = "HS256"


# --- Password Hashing (PBKDF2-HMAC-SHA256) ---

def hash_password(password: str) -> str:
    """Hashes a password with salt using PBKDF2-HMAC-SHA256."""
    salt = secrets.token_hex(16)
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${derived.hex()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verifies a plaintext password against a stored PBKDF2 hash."""
    try:
        parts = stored_hash.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = parts[2]
        expected_hash = parts[3]
        derived = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), iterations)
        return hmac.compare_digest(derived.hex(), expected_hash)
    except Exception:
        return False


# --- ASCEND Native JWT Tokens ---

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Encodes a payload into a signed JWT."""
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"iat": now, "exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_ascend_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes an ASCEND JWT token, returning the payload if valid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


# --- Firebase Admin ---

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


def verify_firebase_token(raw_token: str) -> dict:
    """Verifies a Firebase ID token and returns its decoded claims."""
    get_firebase_app()
    return firebase_auth.verify_id_token(raw_token)


# --- Current User Dependency ---

def get_current_user(
    credential: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Authenticates requests with either an ASCEND JWT or Firebase token.
    Enforces active state (blocks suspended or banned accounts).
    Automatically promotes owner account to SUPER_ADMIN.
    """
    if credential is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")

    token = credential.credentials
    user: Optional[User] = None

    # 1. Try ASCEND native JWT token
    payload = decode_ascend_token(token)
    if payload:
        user_id_str = payload.get("sub")
        session_id_str = payload.get("sid")
        if user_id_str:
            try:
                user_uuid = uuid.UUID(user_id_str)
                user = db.query(User).filter(User.id == user_uuid).first()
            except ValueError:
                pass

        # Validate session revocation if session id is present
        if user and session_id_str:
            try:
                session_uuid = uuid.UUID(session_id_str)
                session = db.query(UserSession).filter(UserSession.id == session_uuid).first()
                if session and session.is_revoked:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Session has been revoked. Please sign in again.",
                    )
                if session:
                    session.last_active_at = datetime.utcnow()
                    db.commit()
            except ValueError:
                pass

    # 2. If not an ASCEND token, try Firebase ID token
    if user is None:
        try:
            claims = verify_firebase_token(token)
            firebase_uid = claims["uid"]
            email = claims.get("email", "").lower().strip()
            name = claims.get("name") or (email.split("@")[0] if email else "Ascender")
            picture = claims.get("picture")

            user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
            if user is None and email:
                user = db.query(User).filter(User.email == email).first()
                if user is not None:
                    user.firebase_uid = firebase_uid
                    if picture and not user.avatar_url:
                        user.avatar_url = picture
                    if name and not user.display_name:
                        user.display_name = name
                    db.commit()
                    db.refresh(user)

            if user is None:
                user = User(
                    firebase_uid=firebase_uid,
                    email=email,
                    display_name=name,
                    avatar_url=picture,
                )
                db.add(user)
                db.flush()

                character = CharacterProfile(user_id=user.id)
                db.add(character)
                db.commit()
                db.refresh(user)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication credentials.",
            ) from exc

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # 3. Super Admin / Owner auto-promotion
    owner_email = settings.OWNER_EMAIL.lower().strip()
    if user.email and user.email.lower().strip() == owner_email:
        if user.role != "SUPER_ADMIN":
            user.role = "SUPER_ADMIN"
            db.commit()
            db.refresh(user)

    # 4. Check for Ban / Suspension
    if user.is_banned:
        reason = user.ban_reason or "Account permanently banned by system administrator."
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied (Account Banned): {reason}",
        )

    if user.is_suspended:
        reason = user.suspension_reason or "Account temporarily suspended by system administrator."
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied (Account Suspended): {reason}",
        )

    # Update last active timestamp
    user.last_login_at = datetime.utcnow()
    db.commit()

    return user


def require_owner(current_user: User = Depends(get_current_user)) -> User:
    """
    Strict authorization guard for the Owner Control Centre.
    Verifies user is the owner or holds SUPER_ADMIN role.
    """
    owner_email = settings.OWNER_EMAIL.lower().strip()
    user_email = (current_user.email or "").lower().strip()

    is_owner_email = user_email == owner_email
    is_super_admin = current_user.role == "SUPER_ADMIN"

    if not (is_owner_email or is_super_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Owner Control Centre is restricted exclusively to the system owner.",
        )
    return current_user
