"""Pydantic schemas and enums for SafeSignal (ComplaintDraft architecture)."""

import re
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AccountIdentifierKind(StrEnum):
    username = "username"
    phone = "phone"
    email = "email"
    upi_id = "upi_id"
    url = "url"
    other = "other"


class Source(StrEnum):
    user_description = "user_description"
    evidence_text = "evidence_text"


class Certainty(StrEnum):
    stated = "stated"
    approximate = "approximate"
    unknown = "unknown"
    conflicting = "conflicting"


class MoneyTransferred(StrEnum):
    sent = "sent"
    not_sent = "not_sent"
    not_stated = "not_stated"


class ResourceId(StrEnum):
    ERSS_112 = "ERSS_112"
    CHILDLINE_1098 = "CHILDLINE_1098"
    NCRP = "NCRP"
    HELPLINE_1930 = "HELPLINE_1930"
    STOPNCII = "STOPNCII"
    TAKE_IT_DOWN = "TAKE_IT_DOWN"
    META_NCII = "META_NCII"


def clean_untrusted_text(val: str | None) -> str | None:
    """Strip control characters, NUL bytes, and normalise newlines."""
    if val is None:
        return None
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", val)
    cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
    return cleaned.strip()


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    description: str
    evidence_text: str | None = None
    platform: str | None = Field(default=None, max_length=80)
    incident_when: str | None = Field(default=None, max_length=100)
    money_status: Literal["sent", "not_sent", "unsure"] | None = None
    adult_confirmed: bool = False
    consent_ai_processing: bool = False

    @field_validator("description", mode="before")
    @classmethod
    def validate_and_clean_description(cls, v: str) -> str:
        cleaned = clean_untrusted_text(v)
        if not cleaned:
            raise ValueError("Description must not be empty or whitespace-only.")
        if len(cleaned) < 10:
            raise ValueError("Description must be at least 10 characters.")
        if len(cleaned) > 4000:
            raise ValueError("Description cannot exceed 4000 characters.")
        return cleaned

    @field_validator("evidence_text", mode="before")
    @classmethod
    def clean_evidence(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = clean_untrusted_text(v)
        if not cleaned:
            return None
        if len(cleaned) > 20000:
            raise ValueError("Evidence text cannot exceed 20000 characters.")
        return cleaned

    @field_validator("platform", "incident_when", mode="before")
    @classmethod
    def clean_strings(cls, v: str | None) -> str | None:
        cleaned = clean_untrusted_text(v)
        return cleaned if cleaned else None


# Gemini response schema components (clean, shallow, standard JSON schema compatibility)
class AccountIdentifier(BaseModel):
    model_config = ConfigDict(extra="ignore")
    kind: AccountIdentifierKind
    value: str = Field(max_length=120)
    source: Source = Source.user_description


class ChronologyItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    when_text: str | None = Field(default=None, max_length=80)
    event: str = Field(max_length=200)
    source: Source = Source.user_description
    certainty: Certainty = Certainty.stated


class MissingInformationItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item: str = Field(max_length=120)
    why: str = Field(max_length=160)


class EvidenceChecklistItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item: str = Field(max_length=100)
    how_to_preserve: str = Field(max_length=220)


class ActionSuggestionItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str = Field(max_length=80)
    why: str = Field(max_length=220)
    resource_ids: list[str] = Field(default_factory=list, max_length=3)


class ComplaintDraft(BaseModel):
    model_config = ConfigDict(extra="ignore")

    what_happened: str = Field(max_length=900)
    platform_or_service: str | None = Field(default=None, max_length=80)
    when_it_happened: str | None = Field(default=None, max_length=120)
    account_identifiers: list[AccountIdentifier] = Field(default_factory=list, max_length=8)
    threat_and_demand: str = Field(max_length=500)
    demand_amount_or_deadline: str | None = Field(default=None, max_length=160)
    money_transferred: MoneyTransferred = MoneyTransferred.not_stated
    chronology: list[ChronologyItem] = Field(default_factory=list, max_length=12)
    supporting_material_user_has: list[str] = Field(default_factory=list, max_length=8)
    missing_information: list[MissingInformationItem] = Field(default_factory=list, max_length=4)
    evidence_checklist: list[EvidenceChecklistItem] = Field(default_factory=list, max_length=10)
    action_suggestions: list[ActionSuggestionItem] = Field(default_factory=list, max_length=5)
    limitations: list[str] = Field(default_factory=list, min_length=1, max_length=5)


class SafetyFlags(BaseModel):
    physical_danger: bool = False
    self_harm: bool = False


class AnalyzeResponse(BaseModel):
    request_id: str
    source: Literal["gemini", "sample"]
    model: str | None = None
    paid_tier: bool
    generated_at: str
    draft: ComplaintDraft
    safety: SafetyFlags
    notices: list[str] = Field(default_factory=list)
    resource_ids: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    ai_configured: bool
    paid_tier: bool
