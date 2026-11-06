"""
System Configuration & Feature Flags Model.
"""
from __future__ import annotations

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin, UUIDMixin


class SystemConfig(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "system_configs"

    config_key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    config_value: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(String(255), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
