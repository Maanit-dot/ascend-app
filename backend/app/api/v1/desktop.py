"""
Desktop Application API - Registration, heartbeats, version checking, and installer downloads.
"""
from __future__ import annotations

import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.desktop import DesktopInstallation
from app.models.user import User

router = APIRouter(prefix="/desktop", tags=["desktop"])

CURRENT_DESKTOP_VERSION = "1.0.0"
RELEASE_NOTES = [
    "Native Windows 10 & 11 64-bit support with dedicated taskbar integration",
    "Hardware telemetry streaming (CPU, GPU, RAM, Storage)",
    "Holographic JARVIS AI Companion with local tools execution",
    "Expandable App Hub supporting Spotify, Google Calendar, Notion, YouTube, and GitHub",
    "Encrypted local session cache and auto-sync with ASCEND Cloud",
]


class DesktopHeartbeatRequest(BaseModel):
    device_id: str = Field(min_length=8, max_length=128)
    hostname: Optional[str] = "Windows PC"
    os_version: Optional[str] = "Windows 10/11"
    app_version: Optional[str] = CURRENT_DESKTOP_VERSION
    user_email: Optional[str] = None


@router.post("/register")
def register_desktop(
    payload: DesktopHeartbeatRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Registers or updates a desktop installation and returns authorization status."""
    installation = (
        db.query(DesktopInstallation)
        .filter(DesktopInstallation.device_id == payload.device_id)
        .first()
    )

    user = None
    if payload.user_email:
        user = db.query(User).filter(User.email == payload.user_email.lower().strip()).first()

    if not installation:
        installation = DesktopInstallation(
            device_id=payload.device_id,
            user_id=user.id if user else None,
            hostname=payload.hostname or "Windows PC",
            os_version=payload.os_version or "Windows",
            app_version=payload.app_version or CURRENT_DESKTOP_VERSION,
            first_installed_at=datetime.utcnow(),
            last_seen_at=datetime.utcnow(),
        )
        db.add(installation)
    else:
        if user:
            installation.user_id = user.id
        installation.hostname = payload.hostname or installation.hostname
        installation.os_version = payload.os_version or installation.os_version
        installation.app_version = payload.app_version or installation.app_version
        installation.last_seen_at = datetime.utcnow()

    db.commit()

    return {
        "status": "registered",
        "device_id": installation.device_id,
        "is_blocked": installation.is_blocked,
        "blocked_reason": installation.blocked_reason,
        "latest_version": CURRENT_DESKTOP_VERSION,
    }


@router.post("/heartbeat")
def desktop_heartbeat(
    payload: DesktopHeartbeatRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Periodic health ping from the desktop app."""
    installation = (
        db.query(DesktopInstallation)
        .filter(DesktopInstallation.device_id == payload.device_id)
        .first()
    )

    if not installation:
        return register_desktop(payload, db)

    installation.last_seen_at = datetime.utcnow()
    db.commit()

    return {
        "status": "ok",
        "is_blocked": installation.is_blocked,
        "blocked_reason": installation.blocked_reason,
        "latest_version": CURRENT_DESKTOP_VERSION,
    }


@router.get("/version")
def get_desktop_version() -> dict:
    """Returns the latest desktop version, release notes, and download links."""
    return {
        "version": CURRENT_DESKTOP_VERSION,
        "platform": "win32",
        "arch": "x64",
        "release_date": "2026-10-15",
        "min_os_version": "Windows 10 (Build 19041+)",
        "download_url": "/api/v1/desktop/download",
        "installer_name": "ASCENDSetup.exe",
        "release_notes": RELEASE_NOTES,
    }


@router.get("/download")
def download_desktop_installer():
    """Streams the Windows installer (.exe) if built, or returns installer metadata."""
    possible_paths = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/dist/ASCENDSetup.exe")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/dist/ASCEND Setup 1.0.0.exe")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../dist/ASCENDSetup.exe")),
    ]

    for p in possible_paths:
        if os.path.exists(p):
            return FileResponse(
                path=p,
                filename="ASCENDSetup.exe",
                media_type="application/vnd.microsoft.portable-executable",
            )

    # If physical .exe is not compiled yet, redirect to GitHub release or provide direct notification
    return JSONResponse(
        status_code=200,
        content={
            "status": "ready",
            "filename": "ASCENDSetup.exe",
            "version": CURRENT_DESKTOP_VERSION,
            "message": "Desktop installer is available. Build can be generated via npm run build:desktop or downloaded from the official release page.",
            "download_url": "https://github.com/Maanit-dot/ascend-app/releases/latest/download/ASCENDSetup.exe",
        },
    )
