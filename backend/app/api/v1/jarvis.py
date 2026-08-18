"""JARVIS AI System Assistant API Router."""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.jarvis_service import parse_and_execute_jarvis_command

router = APIRouter(prefix="/jarvis", tags=["jarvis"])


class JarvisCommandRequest(BaseModel):
    command: str = Field(min_length=1, max_length=1000)
    history: Optional[List[Dict[str, str]]] = Field(default=None)


class JarvisCommandResponse(BaseModel):
    reply: str
    action: Optional[Dict[str, Any]] = None


@router.post("/command", response_model=JarvisCommandResponse)
def process_jarvis_command(
    payload: JarvisCommandRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JarvisCommandResponse:
    """Process natural language command or query for JARVIS system companion."""
    result = parse_and_execute_jarvis_command(
        db=db,
        user=current_user,
        command=payload.command,
        context_history=payload.history,
    )
    return JarvisCommandResponse(reply=result["reply"], action=result.get("action"))
