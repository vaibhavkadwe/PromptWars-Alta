"""Deterministic safety screening for immediate crisis, physical danger, and minors."""

import re

from backend.app.schemas import SafetyFlags

# Regex patterns for physical violence threats and location-based threats
PHYSICAL_DANGER_PATTERNS = [
    r"\bkill (me|you)\b",
    r"\bhurt me\b",
    r"\bbeat (me|you) up\b",
    r"\battack(ed)? me\b",
    r"\bcome to my (house|home|flat|place|college|school|office)\b",
    r"\bknow where you live\b",
    r"\bphysical(ly)? harm\b",
    r"\bfind you and\b",
    r"\bbreak into\b",
    r"\bwaiting outside\b",
    r"\bstalk(ing)? me outside\b",
    r"\bkidnap\b",
]

# Regex patterns for self-harm or suicide ideation
SELF_HARM_PATTERNS = [
    r"\bsuicid(e|al)\b",
    r"\bend my life\b",
    r"\bkill myself\b",
    r"\bdon'?t want to live\b",
    r"\btake my (own )?life\b",
    r"\bbetter off dead\b",
    r"\bhang myself\b",
    r"\bcut myself\b",
    r"\bharm myself\b",
    r"\bend it all\b",
]

# Heuristic regex patterns for minor indicators (server-side minor guard backstop)
MINOR_PATTERNS = [
    r"\b(i am|i'm|im|age is|aged?)\s+(1[0-7]|[7-9])\b",
    r"\b(minor|under 18|underage)\b",
    r"\b(school student|in school|high school|my school)\b",
    r"\b(class\s+([6-9]|1[0-2])|grade\s+([6-9]|1[0-2]))\b",
    r"\b1[0-7]\s*(years old|yrs old|y/o|yo)\b",
]

_PHYSICAL_REGEX = re.compile("|".join(PHYSICAL_DANGER_PATTERNS), re.IGNORECASE)
_SELF_HARM_REGEX = re.compile("|".join(SELF_HARM_PATTERNS), re.IGNORECASE)
_MINOR_REGEX = re.compile("|".join(MINOR_PATTERNS), re.IGNORECASE)


def check_minor_signal(description: str, evidence_text: str | None = None) -> bool:
    """
    Conservative heuristic backstop over description and evidence.
    Returns True if minor signals are detected.
    """
    corpus = description + " " + (evidence_text or "")
    return bool(_MINOR_REGEX.search(corpus))


def screen_safety(
    description: str,
    evidence_text: str | None = None,
) -> SafetyFlags:
    """
    Run deterministic regex screen over description and evidence.
    Works independently of Gemini and is always computed.
    """
    corpus = description + " " + (evidence_text or "")
    phys_flag = bool(_PHYSICAL_REGEX.search(corpus))
    self_harm_flag = bool(_SELF_HARM_REGEX.search(corpus))

    return SafetyFlags(
        physical_danger=phys_flag,
        self_harm=self_harm_flag,
    )
