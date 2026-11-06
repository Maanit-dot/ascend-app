"""
User Session Model ?" tracks active website and desktop sessions.
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


class UserSession(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(128), index=True)
    client_type: Mapped[str] = mapped_column(String(32), default="website")  # "website" | "desktop"
    device_name: Mapped[str] = mapped_column(String(128), default="Browser")
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    last_active_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)

    user: Mapped["User"] = relationship(back_populates="sessions")
