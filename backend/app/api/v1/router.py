"""Aggregates every v1 route module under a single APIRouter."""
from fastapi import APIRouter

from app.api.v1 import achievements, ai, auth, bosses, inventory, jarvis, notifications, quests, social, story, users

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(quests.router)
api_router.include_router(bosses.router)
api_router.include_router(inventory.router)
api_router.include_router(achievements.router)
api_router.include_router(story.router)
api_router.include_router(notifications.router)
api_router.include_router(ai.router)
api_router.include_router(jarvis.router)
api_router.include_router(social.router, prefix="/social", tags=["social"])
