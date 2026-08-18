"""
AI Companion subsystem.

Handles the "personality" surface of ASCEND's AI: motivational messages,
progress narration, weak-subject detection, hidden-quest surfacing, and
now — chat-based subject/chapter question logging ("Physics Magnetism 20,
Chemistry Electrochemistry 30"). Every function degrades gracefully to a
deterministic fallback if the LLM call fails — the companion must never go
silent, and it must never invent a number it wasn't given.
"""
from __future__ import annotations

import logging
import random
import re
from dataclasses import dataclass

from app.ai.client import AIClientError, call_ai
from app.services.subject_log_service import SubjectLogEntry

logger = logging.getLogger("ascend.ai.companion")

COMPANION_SYSTEM_PROMPT = """You are ARC, the AI Companion embedded in ASCEND — an original
AI-operating-system-styled RPG productivity platform. Your personality: precise, warm but not
saccharine, treats the user's discipline like genuine character growth. You never mention being
an AI model, never break the ASCEND fiction, never reference other games or anime. Keep responses
under 3 sentences unless asked for analysis. Return plain text unless explicitly asked for JSON."""

FALLBACK_MOTIVATION = [
    "Momentum compounds quietly. Today's quests are today's proof.",
    "You don't need to feel ready. You need to log the first rep.",
    "Discipline stat doesn't rise from good days — it rises from the days you almost skipped.",
    "The boss doesn't care how you feel this morning. Neither should you.",
    "Small targets, hit consistently, outscale big targets hit rarely.",
]


@dataclass
class WeakSubjectReport:
    subject: str
    accuracy_estimate: float
    recommendation: str


async def generate_motivational_message(
    display_name: str, streak_days: int, burnout_risk_level: str, recent_win: str | None
) -> str:
    if burnout_risk_level in ("high", "critical"):
        prompt = (
            f"{display_name} is showing {burnout_risk_level} burnout risk with a {streak_days}-day streak. "
            "Write a short message that validates their effort and gently encourages recovery, not pushing harder."
        )
    else:
        context = f"Recent win: {recent_win}." if recent_win else "No specific recent win noted."
        prompt = (
            f"{display_name} has a {streak_days}-day streak, burnout risk is {burnout_risk_level}. {context} "
            "Write a short, motivating in-fiction message from ARC to open their dashboard."
        )

    try:
        text = await call_ai(COMPANION_SYSTEM_PROMPT, prompt, max_tokens=150)
        if isinstance(text, str) and text.strip():
            return text.strip()
    except AIClientError as exc:
        logger.warning("Motivational message generation failed: %s", exc)

    return random.choice(FALLBACK_MOTIVATION)


async def analyze_weak_subjects(subject_accuracy_map: dict[str, float]) -> list[WeakSubjectReport]:
    """
    `subject_accuracy_map` e.g. {"Physics - Mechanics": 0.58, "Chemistry - Organic": 0.71, ...}
    sourced from tagged JEE question quest logs. Returns the weakest subjects with
    AI-written recommendations, falling back to a templated recommendation.
    """
    weakest = sorted(subject_accuracy_map.items(), key=lambda kv: kv[1])[:3]
    reports = [
        WeakSubjectReport(
            subject=subject,
            accuracy_estimate=accuracy,
            recommendation=f"Accuracy at {accuracy:.0%} — schedule a focused block on {subject} this week.",
        )
        for subject, accuracy in weakest
    ]

    if not weakest:
        return reports

    prompt = (
        f"Subject accuracy data: {weakest}. For each, write ONE short actionable study "
        'recommendation. Return JSON: {"<subject>": "<recommendation>"}'
    )
    try:
        result = await call_ai(COMPANION_SYSTEM_PROMPT, prompt, max_tokens=400, expect_json=True)
        if isinstance(result, dict):
            for report in reports:
                if report.subject in result and isinstance(result[report.subject], str):
                    report.recommendation = result[report.subject]
    except AIClientError as exc:
        logger.warning("Weak subject analysis AI call failed, using fallback text: %s", exc)

    return reports


# ---------------------------------------------------------------------------
# Subject/chapter question-log extraction
#
# The AI is used ONLY to turn loose natural language into structured
# (subject, chapter, count) triples. It never computes totals, never
# recalls a number from earlier in the conversation, and never answers a
# "how many have I done" query itself — those always come from
# subject_log_service reading the real database. This keeps every number
# ARC ever shows you traceable to something you actually logged.
# ---------------------------------------------------------------------------

SUBJECT_LOG_EXTRACTION_PROMPT = """You extract study-log entries from a user's message for ASCEND, an
RPG productivity app. The user reports how many practice questions they solved, by subject and
chapter, e.g. "Physics magnetism 20 questions and chemistry electrochemistry 30". Extract EVERY
(subject, chapter, count) triple you find. Normalize subject to one of: Physics, Chemistry, Maths —
if the subject given doesn't clearly match one of those, keep it as given (title-cased). Return ONLY
a JSON array, no prose, no markdown fences, in this exact shape:
[{"subject": "Physics", "chapter": "Magnetism", "count": 20}, {"subject": "Chemistry", "chapter": "Electrochemistry", "count": 30}]
If you find no clear (subject, chapter, count) triples, return an empty array: []"""

_QUERY_KEYWORDS = (
    "how many", "how much", "total", "show me", "breakdown", "so far",
    "progress on", "have i done", "have i solved", "have i completed",
    "give me the", "list my",
)

_SUBJECT_HINT_WORDS = ("physics", "chem", "math", "chapter", " ch ", "ch.", "ch-")


def detect_subject_intent(message: str) -> str:
    """
    Cheap, deterministic intent classification done BEFORE any AI call — no
    risk of an LLM misreading "log 20 questions" as a query or vice versa,
    and no latency/cost spent when the message is just ordinary chat.

    Returns "query" | "log" | "chat".
    """
    lowered = f" {message.lower()} "

    mentions_subject_topic = any(
        word in lowered for word in ("question", "subject", "chapter")
    ) or bool(re.search(r"\bq\b", lowered))

    if any(kw in lowered for kw in _QUERY_KEYWORDS) and mentions_subject_topic:
        return "query"

    has_number = bool(re.search(r"\d", lowered))
    has_subject_hint = any(word in lowered for word in _SUBJECT_HINT_WORDS)
    if has_number and has_subject_hint:
        return "log"

    return "chat"


async def extract_subject_logs(message: str) -> list[SubjectLogEntry]:
    """
    Uses the AI purely for lenient natural-language-to-structure extraction.
    The AI never invents totals — it only parses what's already in the
    message. Falls back to a regex parser if the AI call itself fails, so
    logging still works even without an AI provider configured.
    """
    try:
        result = await call_ai(
            SUBJECT_LOG_EXTRACTION_PROMPT, message, max_tokens=300, expect_json=True
        )
    except AIClientError as exc:
        logger.warning("Subject log extraction failed, falling back to regex parser: %s", exc)
        return _regex_fallback_extract(message)

    if not isinstance(result, list):
        return _regex_fallback_extract(message)

    entries: list[SubjectLogEntry] = []
    for item in result:
        if not isinstance(item, dict):
            continue
        subject = item.get("subject")
        chapter = item.get("chapter")
        count = item.get("count")
        if (
            isinstance(subject, str)
            and subject.strip()
            and isinstance(chapter, str)
            and chapter.strip()
            and isinstance(count, (int, float))
            and count > 0
        ):
            entries.append(SubjectLogEntry(subject=subject, chapter=chapter, count=int(count)))

    return entries if entries else _regex_fallback_extract(message)


def _regex_fallback_extract(message: str) -> list[SubjectLogEntry]:
    """
    Deterministic backup parser used if the AI call fails (missing/invalid
    API key, network error) — covers the common
    "<subject> ... <chapter> ... <number>" pattern so logging never
    silently no-ops just because the AI provider is briefly unavailable.
    """
    pattern = re.compile(
        r"(physics|chemistry|chem|maths?|math)\s*[-:]?\s*"
        r"([a-zA-Z][a-zA-Z ]*?)\s*[-:]?\s*(\d+)\s*q(?:uestions?)?\b",
        re.IGNORECASE,
    )
    entries: list[SubjectLogEntry] = []
    for match in pattern.finditer(message):
        subject_raw, chapter_raw, count_raw = match.groups()
        chapter_clean = chapter_raw.strip()
        if not chapter_clean:
            continue
        entries.append(
            SubjectLogEntry(subject=subject_raw, chapter=chapter_clean, count=int(count_raw))
        )
    return entries


HIDDEN_QUEST_POOL = [
    {
        "key": "hidden_silent_hour",
        "name": "The Silent Hour",
        "description": "Complete any 60-minute study block with your phone in another room.",
        "xp_reward": 120,
        "trigger": "random_low_probability",
    },
    {
        "key": "hidden_double_dawn",
        "name": "Double Dawn",
        "description": "Complete your first mandatory quest before 7 AM two days running.",
        "xp_reward": 150,
        "trigger": "early_completion_streak",
    },
    {
        "key": "hidden_unbroken_line",
        "name": "The Unbroken Line",
        "description": "Hit 100% of mandatory quests for 5 consecutive days.",
        "xp_reward": 300,
        "trigger": "perfect_streak_5",
    },
]


def roll_hidden_quest(trigger_context: set[str]) -> dict | None:
    """Deterministic hidden-quest surfacing based on behavior triggers already detected upstream."""
    eligible = [q for q in HIDDEN_QUEST_POOL if q["trigger"] in trigger_context]
    if not eligible:
        # Small random chance for the pure-surprise hidden quest
        if "random_low_probability" in trigger_context or random.random() < 0.05:
            return HIDDEN_QUEST_POOL[0]
        return None
    return random.choice(eligible)
