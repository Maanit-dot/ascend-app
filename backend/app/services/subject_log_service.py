"""
Subject/chapter question-log service.

This is the deterministic source of truth for "how many questions have I
done, by subject and chapter." The AI companion is only ever allowed to
(a) extract structured entries out of a free-text message the user typed,
and (b) narrate totals that THIS module already computed from the database.
It never invents, estimates, or recalls a number from conversation context.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.quest import SubjectQuestionLog
from app.models.user import User


@dataclass
class SubjectLogEntry:
    """A single parsed (subject, chapter, count) triple awaiting insertion."""

    subject: str
    chapter: str
    count: int


@dataclass
class SubjectBreakdownRow:
    subject: str
    chapter: str
    total_questions: int


def record_subject_questions(
    db: Session, user: User, entries: list[SubjectLogEntry], source: str = "chat"
) -> list[SubjectQuestionLog]:
    """
    Writes one immutable log row per entry. Always additive — logging
    "Physics Magnetism 20" twice results in 40 total, by design, matching
    how the rest of ASCEND's quest logging works.
    """
    rows: list[SubjectQuestionLog] = []
    for entry in entries:
        if entry.count <= 0:
            continue
        row = SubjectQuestionLog(
            user_id=user.id,
            subject=_normalize_subject(entry.subject),
            chapter=entry.chapter.strip().title(),
            question_count=entry.count,
            source=source,
            logged_date=date.today(),
        )
        db.add(row)
        rows.append(row)

    db.commit()
    for row in rows:
        db.refresh(row)
    return rows


def get_subject_breakdown(
    db: Session, user: User, since: date | None = None
) -> list[SubjectBreakdownRow]:
    """Totals question_count grouped by (subject, chapter), optionally since a date."""
    query = db.query(
        SubjectQuestionLog.subject,
        SubjectQuestionLog.chapter,
        func.sum(SubjectQuestionLog.question_count).label("total"),
    ).filter(SubjectQuestionLog.user_id == user.id)

    if since is not None:
        query = query.filter(SubjectQuestionLog.logged_date >= since)

    rows = query.group_by(SubjectQuestionLog.subject, SubjectQuestionLog.chapter).all()

    return sorted(
        [
            SubjectBreakdownRow(subject=r.subject, chapter=r.chapter, total_questions=int(r.total))
            for r in rows
        ],
        key=lambda r: (r.subject, -r.total_questions),
    )


def format_breakdown_text(breakdown: list[SubjectBreakdownRow]) -> str:
    """
    Deterministic, guaranteed-accurate plain-text rendering of a breakdown —
    used directly as ARC's chat reply for totals queries, so the numbers
    shown are never at risk of AI paraphrase drift.
    """
    if not breakdown:
        return (
            'No subject-tagged questions logged yet. Tell me things like '
            '"Physics Magnetism 20, Chemistry Electrochemistry 30" after a study session '
            "and I'll start tracking it."
        )

    subject_totals: dict[str, int] = {}
    for row in breakdown:
        subject_totals[row.subject] = subject_totals.get(row.subject, 0) + row.total_questions
    grand_total = sum(subject_totals.values())
    summary = ", ".join(f"{subj}: {total} Q" for subj, total in subject_totals.items())

    lines = [f"Total logged: {grand_total} Q ({summary})", ""]
    current_subject = None
    for row in breakdown:
        if row.subject != current_subject:
            current_subject = row.subject
            lines.append(f"{row.subject}:")
        lines.append(f"  • {row.chapter} — {row.total_questions} Q")

    return "\n".join(lines)


def _normalize_subject(raw: str) -> str:
    """Collapses loose spellings ('phy', 'chem.', 'maths') onto canonical labels."""
    key = raw.strip().lower()
    if key.startswith("phy"):
        return "Physics"
    if key.startswith("chem"):
        return "Chemistry"
    if key.startswith("math"):
        return "Maths"
    return raw.strip().title()
