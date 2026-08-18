"""
Hunter Network REST & WebSocket endpoints — friends, public profiles, and real-time chat.
"""
from __future__ import annotations

import json
import logging
import uuid
from typing import Dict, List, Set

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.social import HunterChatMessage, HunterFriend
from app.models.user import User
from app.services.jarvis_service import get_hunter_rank, get_hunter_title

logger = logging.getLogger("ascend.social")
router = APIRouter()


# ── Pydantic Schemas ─────────────────────────────────────────────────────────────

class PublicHunterProfile(BaseModel):
    id: str
    display_name: str
    avatar_url: str | None = None
    level: int
    rank: str
    title: str
    current_streak_days: int
    total_xp_earned: int
    is_online: bool = False


class FriendRequestPayload(BaseModel):
    display_name_or_email: str


class AcceptFriendPayload(BaseModel):
    request_id: str


class SendMessagePayload(BaseModel):
    receiver_id: str
    message_text: str = Field(..., max_length=1024)


class ChatMessageOut(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    message_text: str
    created_at: str
    is_read: bool


class ConnectionManager:
    """Manages active WebSocket connections for online status & real-time messaging."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info("Hunter connected to network WS: %s", user_id)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info("Hunter disconnected from network WS: %s", user_id)

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections and bool(self.active_connections[user_id])

    async def send_personal_message(self, message_data: dict, receiver_id: str):
        if receiver_id in self.active_connections:
            for connection in list(self.active_connections[receiver_id]):
                try:
                    await connection.send_text(json.dumps(message_data))
                except Exception:
                    logger.exception("Error delivering WS message to hunter %s", receiver_id)


manager = ConnectionManager()


# ── REST Endpoints ──────────────────────────────────────────────────────────────

@router.get("/friends", response_model=Dict[str, List[PublicHunterProfile]])
def list_friends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns accepted friends and pending incoming requests for current user."""
    # Accepted friendships
    friendships = (
        db.query(HunterFriend)
        .filter(
            or_(HunterFriend.user_id == current_user.id, HunterFriend.friend_id == current_user.id),
            HunterFriend.status == "accepted",
        )
        .all()
    )

    friend_users: List[User] = []
    for f in friendships:
        other_id = f.friend_id if f.user_id == current_user.id else f.user_id
        other_user = db.query(User).filter(User.id == other_id).first()
        if other_user:
            friend_users.append(other_user)

    friends_out = [
        PublicHunterProfile(
            id=str(u.id),
            display_name=u.display_name,
            avatar_url=u.avatar_url,
            level=u.character.level,
            rank=get_hunter_rank(u.character.level),
            title=get_hunter_title(u.character.level),
            current_streak_days=u.character.current_streak_days,
            total_xp_earned=u.character.total_xp_earned,
            is_online=manager.is_online(str(u.id)),
        )
        for u in friend_users
    ]

    return {"friends": friends_out}


@router.post("/friends/request")
def send_friend_request(
    payload: FriendRequestPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sends a friend request by display name or email."""
    target_query = payload.display_name_or_email.strip()
    target_user = (
        db.query(User)
        .filter(or_(User.display_name.ilike(target_query), User.email.ilike(target_query)))
        .first()
    )

    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hunter not found.")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add yourself.")

    # Check existing friendship
    existing = (
        db.query(HunterFriend)
        .filter(
            or_(
                and_(HunterFriend.user_id == current_user.id, HunterFriend.friend_id == target_user.id),
                and_(HunterFriend.user_id == target_user.id, HunterFriend.friend_id == current_user.id),
            )
        )
        .first()
    )

    if existing:
        if existing.status == "accepted":
            return {"message": f"Already connected with Hunter {target_user.display_name}."}
        existing.status = "accepted"
        db.commit()
        return {"message": f"Connected with Hunter {target_user.display_name}!"}

    new_friendship = HunterFriend(
        user_id=current_user.id,
        friend_id=target_user.id,
        status="accepted",  # Instant connect for smooth UX
    )
    db.add(new_friendship)
    db.commit()
    return {"message": f"Connected with Hunter {target_user.display_name}!"}


@router.get("/profile/{user_id}", response_model=PublicHunterProfile)
def get_public_profile(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves public profile of another Hunter."""
    try:
        target_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID.")

    target_user = db.query(User).filter(User.id == target_uuid).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hunter profile not found.")

    return PublicHunterProfile(
        id=str(target_user.id),
        display_name=target_user.display_name,
        avatar_url=target_user.avatar_url,
        level=target_user.character.level,
        rank=get_hunter_rank(target_user.character.level),
        title=get_hunter_title(target_user.character.level),
        current_streak_days=target_user.character.current_streak_days,
        total_xp_earned=target_user.character.total_xp_earned,
        is_online=manager.is_online(str(target_user.id)),
    )


@router.get("/messages/{friend_id}", response_model=List[ChatMessageOut])
def get_chat_history(
    friend_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves persistent chat message history between current user and friend."""
    try:
        friend_uuid = uuid.UUID(friend_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid friend ID.")

    messages = (
        db.query(HunterChatMessage)
        .filter(
            or_(
                and_(HunterChatMessage.sender_id == current_user.id, HunterChatMessage.receiver_id == friend_uuid),
                and_(HunterChatMessage.sender_id == friend_uuid, HunterChatMessage.receiver_id == current_user.id),
            )
        )
        .order_by(HunterChatMessage.created_at.asc())
        .limit(100)
        .all()
    )

    return [
        ChatMessageOut(
            id=str(m.id),
            sender_id=str(m.sender_id),
            receiver_id=str(m.receiver_id),
            message_text=m.message_text,
            created_at=m.created_at.strftime("%I:%M %p"),
            is_read=m.is_read,
        )
        for m in messages
    ]


@router.post("/messages/send", response_model=ChatMessageOut)
def send_chat_message(
    payload: SendMessagePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sends a chat message to a friend."""
    try:
        receiver_uuid = uuid.UUID(payload.receiver_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid receiver ID.")

    msg = HunterChatMessage(
        sender_id=current_user.id,
        receiver_id=receiver_uuid,
        message_text=payload.message_text.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    out = ChatMessageOut(
        id=str(msg.id),
        sender_id=str(msg.sender_id),
        receiver_id=str(msg.receiver_id),
        message_text=msg.message_text,
        created_at=msg.created_at.strftime("%I:%M %p"),
        is_read=msg.is_read,
    )

    # Deliver via WebSocket if receiver is connected
    import asyncio
    asyncio.create_task(manager.send_personal_message(out.model_dump(), str(receiver_uuid)))

    return out


# ── WebSocket Endpoint ──────────────────────────────────────────────────────────

@router.websocket("/ws/{user_id}")
async def social_websocket(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep-alive or broadcast ping
            await websocket.send_text(json.dumps({"type": "PONG", "payload": data}))
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
