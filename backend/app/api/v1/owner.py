"""
Owner Control Centre API - Administrative Dashboard exclusively for SUPER_ADMIN.

All endpoints strictly enforced via `require_owner` dependency.
Unauthorized access returns 403 Forbidden.
"""
from __future__ import annotations

import json
import os
import time
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import psutil
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import require_owner
from app.db.session import get_db
from app.models.audit import SystemAuditLog
from app.models.desktop import DesktopInstallation
from app.models.integration import AppIntegration
from app.models.session import UserSession
from app.models.system import SystemConfig
from app.models.user import CharacterProfile, User
from app.schemas.user import UserOut
from app.services.character_view import to_user_out

router = APIRouter(prefix="/owner", tags=["owner"])

_SERVER_START_TIME = time.time()


# --- Pydantic Request/Response Models ---

class SuspendUserRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=255)


class BanUserRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=255)


class BlockDeviceRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=255)


class AnnouncementRequest(BaseModel):
    title: str = Field(min_length=1, max_length=128)
    message: str = Field(min_length=1, max_length=1000)
    variant: str = Field(default="info")  # "info" | "warning" | "alert"
    is_active: bool = True


class MaintenanceRequest(BaseModel):
    is_maintenance: bool
    message: str = Field(default="ASCEND System Maintenance in progress. Services will resume shortly.")


class FeatureFlagRequest(BaseModel):
    flag_key: str = Field(min_length=1, max_length=64)
    flag_value: str
    description: str = ""
    is_active: bool = True


def _log_audit_action(
    db: Session,
    actor: User,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
):
    """Records an administrative action in the audit log."""
    log_entry = SystemAuditLog(
        actor_id=actor.id,
        actor_email=actor.email,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(log_entry)
    db.commit()


# --- 1. OVERVIEW & METRICS ---

@router.get("/metrics")
def get_owner_metrics(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Provides high-level system analytics for the owner dashboard."""
    fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)

    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users_total = (
        db.query(func.count(User.id))
        .filter(User.last_login_at >= fifteen_mins_ago)
        .scalar()
        or 0
    )

    active_web_users = (
        db.query(func.count(func.distinct(UserSession.user_id)))
        .filter(
            UserSession.client_type == "website",
            UserSession.last_active_at >= fifteen_mins_ago,
            UserSession.is_revoked == False,
        )
        .scalar()
        or 0
    )

    active_desktop_users = (
        db.query(func.count(func.distinct(UserSession.user_id)))
        .filter(
            UserSession.client_type == "desktop",
            UserSession.last_active_at >= fifteen_mins_ago,
            UserSession.is_revoked == False,
        )
        .scalar()
        or 0
    )

    total_desktop_installations = db.query(func.count(DesktopInstallation.id)).scalar() or 0
    blocked_installations = (
        db.query(func.count(DesktopInstallation.id))
        .filter(DesktopInstallation.is_blocked == True)
        .scalar()
        or 0
    )

    suspended_users = (
        db.query(func.count(User.id))
        .filter((User.is_suspended == True) | (User.is_banned == True))
        .scalar()
        or 0
    )

    return {
        "total_registered_users": total_users,
        "active_users_15m": active_users_total,
        "active_website_users": active_web_users,
        "active_desktop_users": active_desktop_users,
        "total_desktop_installations": total_desktop_installations,
        "blocked_installations": blocked_installations,
        "suspended_or_banned_users": suspended_users,
        "server_uptime_seconds": int(time.time() - _SERVER_START_TIME),
        "timestamp": datetime.utcnow().isoformat(),
    }


# --- 2. USER MANAGEMENT ---

@router.get("/users")
def list_users(
    query: Optional[str] = Query(None, description="Search by email, username, or display name"),
    status_filter: Optional[str] = Query(None, description="all | active | suspended | banned"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Lists users with filtering, search, and pagination."""
    q = db.query(User)

    if query:
        search = f"%{query.strip().lower()}%"
        q = q.filter(
            func.lower(User.email).like(search)
            | func.lower(User.username).like(search)
            | func.lower(User.display_name).like(search)
        )

    if status_filter == "suspended":
        q = q.filter(User.is_suspended == True)
    elif status_filter == "banned":
        q = q.filter(User.is_banned == True)
    elif status_filter == "active":
        q = q.filter(User.is_suspended == False, User.is_banned == True == False)

    total = q.count()
    users = (
        q.order_by(User.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []
    for u in users:
        items.append({
            "id": str(u.id),
            "email": u.email,
            "username": u.username,
            "display_name": u.display_name,
            "role": u.role,
            "is_suspended": u.is_suspended,
            "suspension_reason": u.suspension_reason,
            "is_banned": u.is_banned,
            "ban_reason": u.ban_reason,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            "last_platform": u.last_platform,
            "created_at": u.created_at.isoformat(),
            "level": u.character.level if u.character else 1,
            "total_xp": u.character.total_xp_earned if u.character else 0,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.get("/users/{user_id}")
def get_user_detail(
    user_id: uuid.UUID,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Provides deep inspection of a specific user account, sessions, and activity."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    sessions = (
        db.query(UserSession)
        .filter(UserSession.user_id == user_id)
        .order_by(UserSession.last_active_at.desc())
        .limit(20)
        .all()
    )

    installations = (
        db.query(DesktopInstallation)
        .filter(DesktopInstallation.user_id == user_id)
        .all()
    )

    return {
        "profile": to_user_out(target_user),
        "sessions": [
            {
                "id": str(s.id),
                "client_type": s.client_type,
                "device_name": s.device_name,
                "ip_address": s.ip_address,
                "is_revoked": s.is_revoked,
                "last_active_at": s.last_active_at.isoformat(),
                "created_at": s.created_at.isoformat(),
            }
            for s in sessions
        ],
        "installations": [
            {
                "id": str(inst.id),
                "device_id": inst.device_id,
                "hostname": inst.hostname,
                "os_version": inst.os_version,
                "app_version": inst.app_version,
                "is_blocked": inst.is_blocked,
                "blocked_reason": inst.blocked_reason,
                "last_seen_at": inst.last_seen_at.isoformat(),
            }
            for inst in installations
        ],
    }


@router.post("/users/{user_id}/suspend")
def suspend_user(
    user_id: uuid.UUID,
    payload: SuspendUserRequest,
    request: Request,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Suspends a user account and revokes active sessions."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot suspend the owner account.")

    target_user.is_suspended = True
    target_user.suspension_reason = payload.reason

    # Revoke all sessions
    db.query(UserSession).filter(UserSession.user_id == user_id).update({"is_revoked": True})
    db.commit()

    _log_audit_action(
        db=db,
        actor=current_user,
        action="SUSPEND_USER",
        target_type="user",
        target_id=str(user_id),
        details=f"Suspended user {target_user.email}. Reason: {payload.reason}",
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "message": f"User {target_user.email} has been suspended."}


@router.post("/users/{user_id}/ban")
def ban_user(
    user_id: uuid.UUID,
    payload: BanUserRequest,
    request: Request,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Permanently bans a user account and revokes all sessions."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot ban the owner account.")

    target_user.is_banned = True
    target_user.ban_reason = payload.reason
    target_user.banned_at = datetime.utcnow()

    # Revoke all sessions
    db.query(UserSession).filter(UserSession.user_id == user_id).update({"is_revoked": True})
    db.commit()

    _log_audit_action(
        db=db,
        actor=current_user,
        action="BAN_USER",
        target_type="user",
        target_id=str(user_id),
        details=f"Permanently banned user {target_user.email}. Reason: {payload.reason}",
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "message": f"User {target_user.email} permanently banned."}


@router.post("/users/{user_id}/restore")
def restore_user(
    user_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Restores a suspended or banned user account."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.is_suspended = False
    target_user.suspension_reason = None
    target_user.is_banned = False
    target_user.ban_reason = None
    target_user.banned_at = None
    db.commit()

    _log_audit_action(
        db=db,
        actor=current_user,
        action="RESTORE_USER",
        target_type="user",
        target_id=str(user_id),
        details=f"Restored account for user {target_user.email}",
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "message": f"User {target_user.email} has been restored."}


@router.post("/users/{user_id}/revoke-sessions")
def revoke_user_sessions(
    user_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Forces immediate revocation of all sessions for a user."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    count = (
        db.query(UserSession)
        .filter(UserSession.user_id == user_id, UserSession.is_revoked == False)
        .update({"is_revoked": True})
    )
    db.commit()

    _log_audit_action(
        db=db,
        actor=current_user,
        action="REVOKE_SESSIONS",
        target_type="user",
        target_id=str(user_id),
        details=f"Revoked {count} sessions for user {target_user.email}",
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "revoked_count": count}


# --- 3. DESKTOP INSTALLATIONS & DEVICE BLOCKING ---

@router.get("/installations")
def list_installations(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> List[dict]:
    """Lists all registered desktop installations."""
    installations = (
        db.query(DesktopInstallation)
        .order_by(DesktopInstallation.last_seen_at.desc())
        .all()
    )
    result = []
    for inst in installations:
        result.append({
            "id": str(inst.id),
            "device_id": inst.device_id,
            "user_id": str(inst.user_id) if inst.user_id else None,
            "user_email": inst.user.email if inst.user else None,
            "hostname": inst.hostname,
            "os_version": inst.os_version,
            "app_version": inst.app_version,
            "is_blocked": inst.is_blocked,
            "blocked_reason": inst.blocked_reason,
            "first_installed_at": inst.first_installed_at.isoformat(),
            "last_seen_at": inst.last_seen_at.isoformat(),
        })
    return result


@router.post("/installations/{device_id}/block")
def block_desktop_installation(
    device_id: str,
    payload: BlockDeviceRequest,
    request: Request,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Blocks a desktop installation from connecting to the ASCEND backend."""
    inst = db.query(DesktopInstallation).filter(DesktopInstallation.device_id == device_id).first()
    if not inst:
        inst = DesktopInstallation(
            device_id=device_id,
            hostname="Unknown PC",
            is_blocked=True,
            blocked_reason=payload.reason,
        )
        db.add(inst)
    else:
        inst.is_blocked = True
        inst.blocked_reason = payload.reason
    db.commit()

    _log_audit_action(
        db=db,
        actor=current_user,
        action="BLOCK_DEVICE",
        target_type="installation",
        target_id=device_id,
        details=f"Blocked desktop device {device_id}. Reason: {payload.reason}",
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "message": f"Device {device_id} has been blocked."}


@router.post("/installations/{device_id}/unblock")
def unblock_desktop_installation(
    device_id: str,
    request: Request,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Unblocks a desktop installation."""
    inst = db.query(DesktopInstallation).filter(DesktopInstallation.device_id == device_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Installation not found")

    inst.is_blocked = False
    inst.blocked_reason = None
    db.commit()

    _log_audit_action(
        db=db,
        actor=current_user,
        action="UNBLOCK_DEVICE",
        target_type="installation",
        target_id=device_id,
        details=f"Unblocked desktop device {device_id}",
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "message": f"Device {device_id} unblocked."}


# --- 4. FEATURE FLAGS & MODULE MANAGEMENT ---

@router.get("/features")
def get_features_and_modules(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Returns global feature flags and modular application states."""
    configs = db.query(SystemConfig).all()
    config_map = {c.config_key: {"value": c.config_value, "active": c.is_active, "desc": c.description} for c in configs}

    # Defaults if not present in DB
    defaults = {
        "registration_enabled": {"value": "true", "active": True, "desc": "Allow public user registration"},
        "desktop_telemetry": {"value": "true", "active": True, "desc": "Allow native hardware monitoring on desktop"},
        "module_spotify": {"value": "true", "active": True, "desc": "Spotify Music Module integration"},
        "module_calendar": {"value": "true", "active": True, "desc": "Google Calendar Module integration"},
        "module_notion": {"value": "true", "active": True, "desc": "Notion Notes Module integration"},
        "module_youtube": {"value": "true", "active": True, "desc": "YouTube Focus Stream Player integration"},
        "module_github": {"value": "true", "active": True, "desc": "GitHub Developer Workspace integration"},
        "arc_voice": {"value": "true", "active": True, "desc": "ARC/JARVIS voice synthesis and mic input"},
    }

    for k, v in defaults.items():
        if k not in config_map:
            config_map[k] = v

    return config_map


@router.post("/features")
def update_feature_flag(
    payload: FeatureFlagRequest,
    request: Request,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Updates or creates a feature flag / module state."""
    config = db.query(SystemConfig).filter(SystemConfig.config_key == payload.flag_key).first()
    if not config:
        config = SystemConfig(
            config_key=payload.flag_key,
            config_value=payload.flag_value,
            description=payload.description,
            is_active=payload.is_active,
        )
        db.add(config)
    else:
        config.config_value = payload.flag_value
        config.description = payload.description or config.description
        config.is_active = payload.is_active

    db.commit()

    _log_audit_action(
        db=db,
        actor=current_user,
        action="UPDATE_FEATURE_FLAG",
        target_type="system_config",
        target_id=payload.flag_key,
        details=f"Updated flag {payload.flag_key} = {payload.flag_value} (active={payload.is_active})",
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "message": f"Flag {payload.flag_key} updated."}


# --- 5. SYSTEM HEALTH MONITORING ---

@router.get("/system-health")
def get_system_health(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Collects real-time hardware telemetry and backend health metrics."""
    cpu_percent = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage(".")

    # Database file size if SQLite
    db_size_mb = 0.0
    if os.path.exists("ascend.db"):
        db_size_mb = round(os.path.getsize("ascend.db") / (1024 * 1024), 2)

    return {
        "status": "healthy",
        "cpu_usage_percent": cpu_percent,
        "memory_total_gb": round(memory.total / (1024**3), 2),
        "memory_used_gb": round(memory.used / (1024**3), 2),
        "memory_percent": memory.percent,
        "disk_free_gb": round(disk.free / (1024**3), 2),
        "disk_percent": disk.percent,
        "database_size_mb": db_size_mb,
        "uptime_seconds": int(time.time() - _SERVER_START_TIME),
        "timestamp": datetime.utcnow().isoformat(),
    }


# --- 6. ANNOUNCEMENTS & MAINTENANCE MODE ---

@router.get("/announcements")
def get_announcements_and_maintenance(db: Session = Depends(get_db)) -> dict:
    """Public endpoint consumed by clients to display maintenance banners or system alerts."""
    announcement_cfg = db.query(SystemConfig).filter(SystemConfig.config_key == "system_announcement").first()
    maintenance_cfg = db.query(SystemConfig).filter(SystemConfig.config_key == "maintenance_mode").first()

    announcement = None
    if announcement_cfg and announcement_cfg.is_active:
        try:
            announcement = json.loads(announcement_cfg.config_value)
        except Exception:
            announcement = {"title": "Announcement", "message": announcement_cfg.config_value, "variant": "info"}

    is_maintenance = False
    maintenance_msg = "ASCEND is undergoing maintenance."
    if maintenance_cfg and maintenance_cfg.is_active:
        is_maintenance = maintenance_cfg.config_value.lower() == "true"
        maintenance_msg = maintenance_cfg.description or maintenance_msg

    return {
        "maintenance": {
            "active": is_maintenance,
            "message": maintenance_msg,
        },
        "announcement": announcement,
    }


@router.post("/announcements")
def set_announcement(
    payload: AnnouncementRequest,
    request: Request,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Publishes a system-wide announcement."""
    data = json.dumps({
        "title": payload.title,
        "message": payload.message,
        "variant": payload.variant,
        "updated_at": datetime.utcnow().isoformat(),
    })

    cfg = db.query(SystemConfig).filter(SystemConfig.config_key == "system_announcement").first()
    if not cfg:
        cfg = SystemConfig(
            config_key="system_announcement",
            config_value=data,
            description="System-wide announcement banner",
            is_active=payload.is_active,
        )
        db.add(cfg)
    else:
        cfg.config_value = data
        cfg.is_active = payload.is_active

    db.commit()

    _log_audit_action(
        db=db,
        actor=current_user,
        action="UPDATE_ANNOUNCEMENT",
        target_type="announcement",
        details=f"Set announcement: {payload.title}",
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "message": "Announcement published."}


@router.post("/maintenance")
def toggle_maintenance(
    payload: MaintenanceRequest,
    request: Request,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Toggles maintenance mode across the platform."""
    cfg = db.query(SystemConfig).filter(SystemConfig.config_key == "maintenance_mode").first()
    if not cfg:
        cfg = SystemConfig(
            config_key="maintenance_mode",
            config_value=str(payload.is_maintenance).lower(),
            description=payload.message,
            is_active=payload.is_maintenance,
        )
        db.add(cfg)
    else:
        cfg.config_value = str(payload.is_maintenance).lower()
        cfg.description = payload.message
        cfg.is_active = payload.is_maintenance

    db.commit()

    _log_audit_action(
        db=db,
        actor=current_user,
        action="TOGGLE_MAINTENANCE",
        target_type="system",
        details=f"Maintenance mode set to {payload.is_maintenance}: {payload.message}",
        ip_address=request.client.host if request.client else None,
    )

    return {"status": "success", "maintenance_active": payload.is_maintenance}


# --- 7. ADMINISTRATIVE AUDIT LOG ---

@router.get("/audit-logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db),
) -> dict:
    """Returns paginated administrative audit logs."""
    q = db.query(SystemAuditLog)
    total = q.count()
    logs = (
        q.order_by(SystemAuditLog.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []
    for l in logs:
        items.append({
            "id": str(l.id),
            "actor_email": l.actor_email,
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat(),
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }
