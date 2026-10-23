"""Pydantic schemas and enums for SafeSignal."""

import re
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CategoryId(StrEnum):
    THREAT_TO_SHARE_IMAGES = "THREAT_TO_SHARE_IMAGES"
    MONEY_DEMAND = "MONEY_DEMAND"
    THREAT_TO_CONTACT_OTHERS = "THREAT_TO_CONTACT_OTHERS"
    COERCION_FOR_MORE_CONTENT = "COERCION_FOR_MORE_CONTENT"
    SUSPECTED_NON_CONSENSUAL_RECORDING = "SUSPECTED_NON_CONSENSUAL_RECORDING"
    SUSPECTED_AI_GENERATED_IMAGERY = "SUSPECTED_AI_GENERATED_IMAGERY"
    IMPERSONATION_OR_FAKE_PROFILE = "IMPERSONATION_OR_FAKE_PROFILE"
    INSUFFICIENT_INFORMATION = "INSUFFICIENT_INFORMATION"


class Likelihood(StrEnum):
    stated = "stated"
    likely = "likely"
    possible = "possible"


class DetailKind(StrEnum):
    date_time = "date_time"
    platform = "platform"
    username = "username"
    money_demand = "money_demand"
    image_demand = "image_demand"
    threat = "threat"
    deadline = "deadline"
    payment_method = "payment_method"
    other = "other"


class Source(StrEnum):
    user_description = "user_description"
    evidence_text = "evidence_text"


class Basis(StrEnum):
    stated = "stated"
    inferred = "inferred"


class Certainty(StrEnum):
    stated = "stated"
    approximate = "approximate"
    unknown = "unknown"
    conflicting = "conflicting"


class RiskLevel(StrEnum):
    routine = "routine"
    elevated = "elevated"
    urgent = "urgent"


class Urgency(StrEnum):
    now = "now"
    today = "today"
    soon = "soon"


class Relevance(StrEnum):
    high = "high"
    medium = "medium"
    low = "low"


class ResourceId(StrEnum):
    NCRP = "NCRP"
    HELPLINE_1930 = "HELPLINE_1930"
    ERSS_112 = "ERSS_112"
    CHILDLINE_1098 = "CHILDLINE_1098"
    WOMEN_181 = "WOMEN_181"
    STOPNCII = "STOPNCII"
    TAKE_IT_DOWN = "TAKE_IT_DOWN"
    META_NCII = "META_NCII"


def clean_untrusted_text(val: str | None) -> str | None:
    """Strip control characters, NUL bytes, and normalise newlines."""
    if val is None:
        return None
    # Remove NUL bytes and control characters except \n, \r, \t
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", val)
    # Normalise newlines \r\n and \r to \n
    cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
    return cleaned.strip()


class IncidentDetails(BaseModel):
    model_config = ConfigDict(extra="ignore")

    incident_when: str | None = Field(default=None, max_length=100)
    platform: str | None = Field(default=None, max_length=60)
    threat_types: list[CategoryId] = Field(default_factory=list, max_length=6)
    money_demanded: bool | None = None
    more_images_demanded: bool | None = None
    immediate_disclosure_threat: bool | None = None
    feels_physically_unsafe: bool | None = None
    may_be_under_18: bool | None = None

    @field_validator("incident_when", "platform", mode="before")
    @classmethod
    def clean_strings(cls, v: str | None) -> str | None:
        cleaned = clean_untrusted_text(v)
        return cleaned if cleaned else None


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    description: str
    evidence_text: str | None = None
    details: IncidentDetails = Field(default_factory=IncidentDetails)
    consent_ai_processing: bool

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


# Gemini response schema components (clean, shallow, standard JSON schema compatibility)
class CategoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: CategoryId
    likelihood: Likelihood
    rationale: str = Field(max_length=200)


class ExtractedDetail(BaseModel):
    model_config = ConfigDict(extra="ignore")
    kind: DetailKind
    label: str = Field(max_length=60)
    value: str = Field(max_length=200)
    source: Source
    basis: Basis


class TimelineItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    when_text: str | None = Field(default=None, max_length=80)
    event: str = Field(max_length=200)
    source: Source
    certainty: Certainty


class MissingInfoItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    question: str = Field(max_length=160)
    why_it_matters: str = Field(max_length=160)


class RiskAssessment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    level: RiskLevel
    factors: list[str] = Field(default_factory=list, max_length=5)
    physical_danger_mentioned: bool
    self_harm_mentioned: bool
    possible_minor: bool


class ActionItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    priority: int = Field(ge=1, le=7)
    title: str = Field(max_length=80)
    why: str = Field(max_length=220)
    urgency: Urgency
    resource_ids: list[str] = Field(default_factory=list)


class EvidenceItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item: str = Field(max_length=100)
    how_to_preserve: str = Field(max_length=220)
    suggested_filename: str | None = Field(default=None, max_length=60)
    relevance: Relevance


class IncidentReport(BaseModel):
    model_config = ConfigDict(extra="ignore")

    summary: str = Field(max_length=600)
    categories: list[CategoryItem] = Field(max_length=6)
    extracted_details: list[ExtractedDetail] = Field(max_length=15)
    timeline: list[TimelineItem] = Field(max_length=12)
    missing_information: list[MissingInfoItem] = Field(max_length=3)
    risk: RiskAssessment
    actions: list[ActionItem] = Field(min_length=4, max_length=7)
    evidence_items: list[EvidenceItem] = Field(max_length=10)
    limitations: list[str] = Field(min_length=1, max_length=5)


class SafetyFlags(BaseModel):
    model_config = ConfigDict(extra="ignore")
    physical_danger: bool = False
    self_harm: bool = False
    possible_minor: bool = False


class Resource(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: ResourceId
    title: str
    kind: Literal["link", "phone"]
    value: str
    purpose: str
    when: str
    limitations: str
    last_checked: str = "2026-10-23"


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    request_id: str
    source: Literal["gemini", "sample"]
    model: str | None = None
    paid_tier: bool = False
    generated_at: str
    report: IncidentReport
    safety: SafetyFlags
    resources: list[Resource]


class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str


class ErrorResponse(BaseModel):
    error: ErrorDetail


class HealthResponse(BaseModel):
    ai_configured: bool
    paid_tier: bool
