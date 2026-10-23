"""Sanitization, scrubbing, grounding checks, and report post-processing."""

import re

from backend.app.schemas import (
    Basis,
    DetailKind,
    IncidentReport,
    ResourceId,
    Source,
)


class GuaranteeLanguageError(ValueError):
    """Raised when model output includes forbidden guarantee language."""
    pass


# Guarantee language patterns forbidden in model responses
GUARANTEE_PATTERNS = [
    r"(?<!cannot\s)(?<!cannot\sbe\s)(?<!no\s)(?<!not\s)\bguarantee(d)?\b",
    r"\bwill be prosecuted\b",
    r"\bwill be removed\b",
    r"\b100%\s*safe\b",
    r"\b100%\s*guaranteed\b",
    r"(?<!cannot\s)(?<!cannot\sbe\s)(?<!no\s)(?<!not\s)\bpromise(d)?\b",
]
_GUARANTEE_REGEX = re.compile("|".join(GUARANTEE_PATTERNS), re.IGNORECASE)

# Scrubbing regexes for URLs, emails, phone numbers, and legal citations
_URL_REGEX = re.compile(r"https?://[^\s]+|www\.[^\s]+", re.IGNORECASE)
_EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", re.IGNORECASE)
_PHONE_REGEX = re.compile(r"(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|\b\d{10,12}\b")
_LEGAL_CITE_REGEX = re.compile(
    r"\b(section\s+\d+[a-z]*|ipc|bns|it\s+act|indian\s+penal\s+code|bharatiya\s+nyaya\s+sanhita|information\s+technology\s+act)\b",
    re.IGNORECASE,
)


def scrub_string(text: str, is_username_or_platform: bool = False) -> str:
    """
    Remove URLs, email addresses, phone-like digit runs, and legal citations from text.
    Preserves clean spacing.
    """
    if not text:
        return text

    # Apply scrubbing
    cleaned = _URL_REGEX.sub("", text)
    cleaned = _EMAIL_REGEX.sub("", cleaned)
    if not is_username_or_platform:
        cleaned = _PHONE_REGEX.sub("", cleaned)
    cleaned = _LEGAL_CITE_REGEX.sub("", cleaned)

    # Collapse multiple spaces while preserving newlines
    lines = cleaned.split("\n")
    cleaned_lines = [re.sub(r"[ \t]+", " ", line).strip() for line in lines]
    return "\n".join([line for line in cleaned_lines if line])


def check_for_guarantees(text: str) -> None:
    """Raise GuaranteeLanguageError if forbidden guarantee language is found."""
    match = _GUARANTEE_REGEX.search(text)
    if match:
        raise GuaranteeLanguageError(f"Report contained forbidden guarantee phrase: '{match.group(0)}'")


def sanitize_and_validate_report(
    report: IncidentReport,
    user_description: str,
    evidence_text: str | None = None,
) -> IncidentReport:
    """
    Apply full post-processing to IncidentReport:
    1. Check for guarantee language across all text fields (reject if found).
    2. Scrub URLs, emails, phone-like digit runs, legal citations from all text fields.
    3. Drop unknown resource IDs in actions.
    4. Perform grounding check on extracted details with basis='stated'.
    5. Ensure actions are sorted with unique priorities 1..N.
    """
    # 1. Check all text fields for guarantee language
    all_texts: list[str] = [report.summary]
    for cat in report.categories:
        all_texts.append(cat.rationale)
    for detail in report.extracted_details:
        all_texts.extend([detail.label, detail.value])
    for item in report.timeline:
        if item.when_text:
            all_texts.append(item.when_text)
        all_texts.append(item.event)
    for mi in report.missing_information:
        all_texts.extend([mi.question, mi.why_it_matters])
    all_texts.extend(report.risk.factors)
    for act in report.actions:
        all_texts.extend([act.title, act.why])
    for ev in report.evidence_items:
        all_texts.extend([ev.item, ev.how_to_preserve])
        if ev.suggested_filename:
            all_texts.append(ev.suggested_filename)
    all_texts.extend(report.limitations)

    for txt in all_texts:
        check_for_guarantees(txt)

    # 2. Scrub strings
    report.summary = scrub_string(report.summary)
    for cat in report.categories:
        cat.rationale = scrub_string(cat.rationale)

    for detail in report.extracted_details:
        is_identifier = detail.kind in (DetailKind.username, DetailKind.platform)
        detail.label = scrub_string(detail.label)
        detail.value = scrub_string(detail.value, is_username_or_platform=is_identifier)

    for item in report.timeline:
        if item.when_text:
            item.when_text = scrub_string(item.when_text)
        item.event = scrub_string(item.event)

    for mi in report.missing_information:
        mi.question = scrub_string(mi.question)
        mi.why_it_matters = scrub_string(mi.why_it_matters)

    report.risk.factors = [scrub_string(f) for f in report.risk.factors if scrub_string(f)]

    for act in report.actions:
        act.title = scrub_string(act.title)
        act.why = scrub_string(act.why)
        # 3. Drop unknown resource IDs
        valid_res_ids: list[ResourceId] = []
        for rid in act.resource_ids:
            try:
                valid_res_ids.append(ResourceId(rid))
            except ValueError:
                pass
        act.resource_ids = valid_res_ids

    for ev in report.evidence_items:
        ev.item = scrub_string(ev.item)
        ev.how_to_preserve = scrub_string(ev.how_to_preserve)
        if ev.suggested_filename:
            ev.suggested_filename = scrub_string(ev.suggested_filename)

    report.limitations = [scrub_string(lim) for lim in report.limitations if scrub_string(lim)]

    # 4. Grounding check on extracted details
    norm_desc = " ".join(user_description.lower().split())
    norm_ev = " ".join((evidence_text or "").lower().split())

    for detail in report.extracted_details:
        if detail.basis == Basis.stated:
            norm_val = " ".join(detail.value.lower().split())
            source_text = norm_desc if detail.source == Source.user_description else norm_ev
            if not norm_val or norm_val not in source_text:
                # Value does not appear in source text; downgrade to inferred
                detail.basis = Basis.inferred

    # 5. Sort actions by priority and ensure unique sequential priorities (1..N)
    report.actions.sort(key=lambda a: a.priority)
    for idx, act in enumerate(report.actions, start=1):
        act.priority = idx

    return report
