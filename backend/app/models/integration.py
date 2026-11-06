"""
Application Integration Model - tracks connected external applications per user.
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


class AppIntegration(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "app_integrations"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    module_id: Mapped[str] = mapped_column(String(64), index=True)  # "spotify", "notion", "google_calendar", etc.
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    account_identifier: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    credentials_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    settings_json: Mapped[Optional[str]] = mapped_column(Text, default="{}")
    last_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="app_integrations")
