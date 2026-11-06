"""
Desktop Installation Model - tracks physical Windows machines running ASCEND.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class DesktopInstallation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "desktop_installations"

    device_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    hostname: Mapped[str] = mapped_column(String(128), default="Windows PC")
    os_version: Mapped[str] = mapped_column(String(128), default="Windows 10/11")
    app_version: Mapped[str] = mapped_column(String(32), default="1.0.0")
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)
    blocked_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    first_installed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[Optional["User"]] = relationship(back_populates="installations")
