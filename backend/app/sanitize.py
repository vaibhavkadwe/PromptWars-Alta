"""Sanitization, scrubbing, grounding checks, and ComplaintDraft post-processing."""

import json
import re
from pathlib import Path

from backend.app.safety_lint import lint_safety
from backend.app.schemas import (
    AccountIdentifier,
    ActionSuggestionItem,
    ChronologyItem,
    ComplaintDraft,
    EvidenceChecklistItem,
    MoneyTransferred,
    ResourceId,
)

# Load allowed resource IDs from shared/resources.json
_RESOURCES_PATH = Path(__file__).resolve().parent.parent.parent / "shared" / "resources.json"
try:
    with open(_RESOURCES_PATH, encoding="utf-8") as f:
        _RESOURCES_DATA = json.load(f)
    ALLOWED_RESOURCE_IDS = {r["id"] for r in _RESOURCES_DATA}
except Exception:
    ALLOWED_RESOURCE_IDS = {
        "ERSS_112",
        "CHILDLINE_1098",
        "NCRP",
        "HELPLINE_1930",
        "STOPNCII",
        "TAKE_IT_DOWN",
        "META_NCII",
    }


class IllegalLanguageError(ValueError):
    """Raised when model output includes forbidden legal conclusions or guarantee language."""
    pass


class SafetyLintViolationError(ValueError):
    """Raised when core draft fields violate safety lint rules."""
    pass


# Guard 2 regex: legal-conclusion or guarantee language
_FORBIDDEN_LANGUAGE_REGEX = re.compile(
    r"\b(section\s+\d+[a-z]*|ipc\b|bns\b|pocso\b|it\s+act\b|dpdp\b|"
    r"guilty\b|criminal\b|accused\b|offender\b|perpetrator\b|blackmailer\b|extortionist\b|"
    r"guarantee[ds]?\b|will\s+be\s+(removed|deleted|arrested|prosecuted)\b|100%)",
    re.IGNORECASE,
)

# Guard 1 regexes: scrubbing URLs, emails, phone-like digit runs, and legal citations
_URL_REGEX = re.compile(r"https?://[^\s]+|www\.[^\s]+", re.IGNORECASE)
_EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", re.IGNORECASE)
_PHONE_REGEX = re.compile(r"(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|\b\d{10,12}\b")
_LEGAL_CITE_REGEX = re.compile(
    r"\b(section\s+\d+[a-z]*|ipc|bns|pocso|it\s+act|dpdp|indian\s+penal\s+code|bharatiya\s+nyaya\s+sanhita|information\s+technology\s+act)\b",
    re.IGNORECASE,
)


def scrub_string(text: str | None) -> str:
    """Remove URLs, emails, phone-like digit runs, and legal citations from text."""
    if not text:
        return ""

    cleaned = _URL_REGEX.sub("", text)
    cleaned = _EMAIL_REGEX.sub("", cleaned)
    cleaned = _PHONE_REGEX.sub("", cleaned)
    cleaned = _LEGAL_CITE_REGEX.sub("", cleaned)

    lines = cleaned.split("\n")
    cleaned_lines = [re.sub(r"[ \t]+", " ", line).strip() for line in lines]
    return "\n".join([line for line in cleaned_lines if line])


def check_forbidden_language(text: str) -> None:
    """Raise IllegalLanguageError if legal-conclusion or guarantee language is found."""
    match = _FORBIDDEN_LANGUAGE_REGEX.search(text)
    if match:
        raise IllegalLanguageError(f"Forbidden term detected in draft: '{match.group(0)}'")


def normalize_for_grounding(text: str) -> str:
    """Normalize text for substring and token search."""
    # Lowercase, remove non-alphanumeric except basic symbols, collapse spaces
    cleaned = re.sub(r"[^\w\s@.:/+-]", " ", text.lower())
    return " ".join(cleaned.split())


def sanitize_and_guard_draft(
    draft: ComplaintDraft,
    user_description: str,
    evidence_text: str | None = None,
    platform: str | None = None,
    incident_when: str | None = None,
    money_status: str | None = None,
) -> tuple[ComplaintDraft, list[str], list[str]]:
    """
    Apply full server-side guards to ComplaintDraft:
    1. Check forbidden language (Guard 2) -> raise IllegalLanguageError.
    2. Scrub strings (Guard 1).
    3. Grounding checks (Guard 3) -> drop ungrounded details/items.
    4. Safety lint (Guard 4) -> drop violating advice items, raise SafetyLintViolationError on core violations.
    5. Allowlist resource_ids and enforce 1930 rules (Guard 5).

    Returns:
        (sanitized_draft, notices, allowed_resource_ids)
    """
    notices: list[str] = []
    dropped_grounding_count = 0
    dropped_safety_item_count = 0

    # 1. Check all text fields for forbidden legal/guarantee language
    all_texts: list[str] = [
        draft.what_happened,
        draft.threat_and_demand,
        draft.platform_or_service or "",
        draft.when_it_happened or "",
        draft.demand_amount_or_deadline or "",
    ]
    for ident in draft.account_identifiers:
        all_texts.append(ident.value)
    for c in draft.chronology:
        all_texts.extend([c.when_text or "", c.event])
    for s in draft.supporting_material_user_has:
        all_texts.append(s)
    for mi in draft.missing_information:
        all_texts.extend([mi.item, mi.why])
    for ev in draft.evidence_checklist:
        all_texts.extend([ev.item, ev.how_to_preserve])
    for act in draft.action_suggestions:
        all_texts.extend([act.title, act.why])
    all_texts.extend(draft.limitations)

    for txt in all_texts:
        if txt:
            check_forbidden_language(txt)

    # 2. Safety lint on core narrative fields (what_happened & chronology)
    narrative_lint = lint_safety(draft.what_happened)
    if not narrative_lint.passed:
        raise SafetyLintViolationError(f"what_happened failed safety lint: {narrative_lint.rule_id}")

    for c in draft.chronology:
        c_lint = lint_safety(c.event)
        if not c_lint.passed:
            raise SafetyLintViolationError(f"chronology event failed safety lint: {c_lint.rule_id}")

    # Build input corpus for grounding
    raw_input_corpus = f"{user_description} {evidence_text or ''} {platform or ''} {incident_when or ''}"
    norm_corpus = normalize_for_grounding(raw_input_corpus)

    # 3. Grounding check on account identifiers
    grounded_identifiers: list[AccountIdentifier] = []
    for ident in draft.account_identifiers:
        norm_val = normalize_for_grounding(ident.value)
        # Concrete token must appear in input
        if norm_val and norm_val in norm_corpus:
            grounded_identifiers.append(ident)
        else:
            dropped_grounding_count += 1
    draft.account_identifiers = grounded_identifiers

    # Grounding check on demand_amount_or_deadline
    if draft.demand_amount_or_deadline:
        norm_demand = normalize_for_grounding(draft.demand_amount_or_deadline)
        # Check if numbers or tokens in demand exist in corpus
        demand_tokens = [tok for tok in norm_demand.split() if any(c.isdigit() for c in tok) or len(tok) >= 4]
        if demand_tokens and not any(tok in norm_corpus for tok in demand_tokens):
            draft.demand_amount_or_deadline = None
            dropped_grounding_count += 1

    # Grounding check on money_transferred
    # money_transferred of sent/not_sent requires an explicit signal in input or money_status
    has_money_sent_signal = (
        money_status == "sent"
        or bool(re.search(r"\b(paid|transferred|sent money|sent the money|already paid)\b", norm_corpus))
    )
    has_money_not_sent_signal = (
        money_status == "not_sent"
        or bool(re.search(r"\b(have not paid|haven't paid|did not pay|didn't pay|not sent|not transferred)\b", norm_corpus))
    )

    if draft.money_transferred == MoneyTransferred.sent and not has_money_sent_signal:
        draft.money_transferred = MoneyTransferred.not_stated
        dropped_grounding_count += 1
    elif draft.money_transferred == MoneyTransferred.not_sent and not has_money_not_sent_signal:
        draft.money_transferred = MoneyTransferred.not_stated
        dropped_grounding_count += 1

    # Grounding check on supporting_material_user_has
    grounded_materials: list[str] = []
    for mat in draft.supporting_material_user_has:
        mat_scrubbed = scrub_string(mat)
        if mat_scrubbed:
            grounded_materials.append(mat_scrubbed)
    draft.supporting_material_user_has = grounded_materials

    # 4. Scrubbing and Safety Lint on evidence checklist items
    safe_evidence: list[EvidenceChecklistItem] = []
    for ev in draft.evidence_checklist:
        ev_item = scrub_string(ev.item)
        ev_how = scrub_string(ev.how_to_preserve)
        ev_lint = lint_safety(f"{ev_item} {ev_how}")
        if ev_lint.passed:
            safe_evidence.append(EvidenceChecklistItem(item=ev_item, how_to_preserve=ev_how))
        else:
            dropped_safety_item_count += 1
    draft.evidence_checklist = safe_evidence

    # 4. Scrubbing, Safety Lint and Allowlisting on action suggestions
    safe_actions: list[ActionSuggestionItem] = []
    money_is_sent = (money_status == "sent") or (draft.money_transferred == MoneyTransferred.sent)

    for act in draft.action_suggestions:
        act_title = scrub_string(act.title)
        act_why = scrub_string(act.why)
        act_lint = lint_safety(f"{act_title} {act_why}")
        if not act_lint.passed:
            dropped_safety_item_count += 1
            continue

        # Allowlist resource IDs
        valid_res: list[ResourceId] = []
        for rid in act.resource_ids:
            rid_str = str(rid.value if hasattr(rid, "value") else rid)
            if rid_str in ALLOWED_RESOURCE_IDS:
                # 1930 only allowed if money is sent
                if rid_str == "HELPLINE_1930" and not money_is_sent:
                    continue
                try:
                    valid_res.append(ResourceId(rid_str))
                except ValueError:
                    pass

        safe_actions.append(ActionSuggestionItem(
            title=act_title,
            why=act_why,
            resource_ids=valid_res,
        ))

    draft.action_suggestions = safe_actions

    # Scrub remaining narrative fields
    draft.what_happened = scrub_string(draft.what_happened)
    draft.threat_and_demand = scrub_string(draft.threat_and_demand)
    if draft.platform_or_service:
        draft.platform_or_service = scrub_string(draft.platform_or_service)
    if draft.when_it_happened:
        draft.when_it_happened = scrub_string(draft.when_it_happened)
    if draft.demand_amount_or_deadline:
        draft.demand_amount_or_deadline = scrub_string(draft.demand_amount_or_deadline)

    safe_chronology: list[ChronologyItem] = []
    for c in draft.chronology:
        safe_chronology.append(ChronologyItem(
            when_text=scrub_string(c.when_text) if c.when_text else None,
            event=scrub_string(c.event),
            source=c.source,
            certainty=c.certainty,
        ))
    draft.chronology = safe_chronology

    safe_missing: list[dict] = []
    for mi in draft.missing_information:
        safe_missing.append(mi)
    draft.missing_information = safe_missing

    draft.limitations = [scrub_string(lim) for lim in draft.limitations if scrub_string(lim)]
    if not draft.limitations:
        draft.limitations = [
            "This draft uses only what you provided, may contain mistakes, cannot verify any account, message or image, is not legal advice, and must be reviewed and corrected by you before use."
        ]

    # Generate notices
    if dropped_grounding_count > 0:
        notices.append(f"{dropped_grounding_count} suggested details were removed because they didn't match your text.")
    if dropped_safety_item_count > 0:
        notices.append(f"{dropped_safety_item_count} suggested items were removed for safety policy reasons.")

    # Collect unique resource IDs from actions
    top_resource_ids: list[str] = []
    res_seen = set()
    for act in draft.action_suggestions:
        for rid in act.resource_ids:
            rid_val = rid.value if hasattr(rid, "value") else str(rid)
            if rid_val not in res_seen:
                res_seen.add(rid_val)
                top_resource_ids.append(rid_val)

    # Always ensure NCRP is present in reporting catalog if not already
    if "NCRP" not in res_seen:
        top_resource_ids.append("NCRP")

    return draft, notices, top_resource_ids
