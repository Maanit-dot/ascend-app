"""
Unified AI client supporting both OpenRouter (sk-or-...) and direct Anthropic (sk-ant-...) keys.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx
from tenacity import retry, retry_if_not_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings

logger = logging.getLogger("ascend.ai")


class AIClientError(Exception):
    pass


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
    Sends a prompt to the configured AI model (OpenRouter or Anthropic).
    Returns text or a parsed JSON object when `expect_json=True`.
    """
    api_key = (settings.OPENROUTER_API_KEY or settings.ANTHROPIC_API_KEY or "").strip()

    if not api_key:
        logger.warning("No AI API key set — OPENROUTER_API_KEY or ANTHROPIC_API_KEY required.")
        raise AIClientError("No AI API key is configured")

    is_openrouter = api_key.startswith("sk-or-") or bool(settings.OPENROUTER_API_KEY.strip()) or "openrouter" in settings.AI_PROVIDER.lower()

    if is_openrouter:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://ascend-app-alpha.vercel.app",
            "X-Title": "ASCEND",
            "Content-Type": "application/json",
        }
        
        # Candidate models to try in order (starts with configured model, falls back to free models)
        configured_model = settings.AI_MODEL.strip()
        candidates = []
        if configured_model and configured_model != "auto" and configured_model != "openrouter/auto":
            candidates.append(configured_model)
        else:
            candidates.extend([
                "meta-llama/llama-3.3-70b-instruct:free",
                "google/gemini-2.0-flash-exp:free",
                "deepseek/deepseek-r1:free",
                "mistralai/mistral-7b-instruct:free",
                "openrouter/auto",
            ])

        last_error = None
        data = None

        async with httpx.AsyncClient(timeout=30.0) as client:
            for model_name in candidates:
                payload = {
                    "model": model_name,
                    "max_tokens": max_tokens,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                }
                try:
                    response = await client.post(url, headers=headers, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        break
                    elif response.status_code == 402:
                        logger.warning("OpenRouter model %s returned 402 (no credits), trying free model...", model_name)
                        last_error = f"Model {model_name} requires credits."
                        continue
                    else:
                        last_error = f"OpenRouter returned {response.status_code}: {response.text}"
                except Exception as exc:
                    last_error = str(exc)
                    continue

        if not data:
            raise AIClientError(last_error or "All OpenRouter models failed")

        choices = data.get("choices", [])
        if not choices:
            raise AIClientError("Empty response choice from OpenRouter")
        full_text = choices[0].get("message", {}).get("content", "").strip()

    else:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        model = settings.AI_MODEL
        if "/" in model:
            model = "claude-3-5-sonnet-20241022"

        payload = {
            "model": model,
            "max_tokens": max_tokens,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)

        if response.status_code != 200:
            logger.error("AI call failed [%s]: %s", response.status_code, response.text)
            raise AIClientError(f"AI provider returned status {response.status_code}: {response.text}")
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

