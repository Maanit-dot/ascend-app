"""
System Audit Log Model - records all administrative and owner operations.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin, UUIDMixin


class SystemAuditLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "system_audit_logs"

    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    actor_email: Mapped[str] = mapped_column(String(255), index=True)
    action: Mapped[str] = mapped_column(String(64), index=True)
    target_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # "user", "installation", "flag", etc.
    target_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
