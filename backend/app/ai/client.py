"""
Thin wrapper around the Anthropic Messages API.

Every AI subsystem (quest generation, motivational messages, weak-subject
analysis) goes through this single client so retries, timeouts, and prompt
logging are consistent and easy to swap providers later.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings

logger = logging.getLogger("ascend.ai")

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/messages"

class AIClientError(Exception):
    pass

from tenacity import retry_if_not_exception_type
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_not_exception_type(AIClientError),
)
async def call_ai(
    system_prompt: str,
    user_prompt: str,
    *,
    max_tokens: int = 1024,
    expect_json: bool = False,
) -> str | dict[str, Any]:
    """
    Sends a single-turn prompt to the configured AI model and returns either
    raw text or a parsed JSON object (when `expect_json=True`, the system
    prompt must instruct the model to return JSON only).
    """
    if not settings.ANTHROPIC_API_KEY:
        logger.warning(
            "ANTHROPIC_API_KEY is not set — AI features will fall back to templated text. "
            "Set it in backend/.env to enable ARC and adaptive quest rationale."
        )
        raise AIClientError("ANTHROPIC_API_KEY is not configured")

    headers = {
    "Authorization": f"Bearer {settings.ANTHROPIC_API_KEY}",
    "Content-Type": "application/json",
}
    payload = {
        "model": settings.AI_MODEL,
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
    if response.status_code != 200:
        logger.error("AI call failed: %s %s", response.status_code, response.text)
        raise AIClientError(f"AI provider returned {response.status_code}")

    data = response.json()
    text_blocks = [block["text"] for block in data.get("content", []) if block.get("type") == "text"]
    full_text = "\n".join(text_blocks).strip()

    if not expect_json:
        return full_text

    cleaned = full_text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("AI JSON parse failure: %s | raw=%s", exc, full_text)
        raise AIClientError("AI response was not valid JSON") from exc
