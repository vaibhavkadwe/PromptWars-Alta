"""Analysis orchestration pipeline for SafeSignal."""

import json
import logging
import re
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from backend.app.config import get_settings
from backend.app.gemini_client import GeminiClientProtocol
from backend.app.safety import check_minor_signal, screen_safety
from backend.app.sanitize import (
    IllegalLanguageError,
    SafetyLintViolationError,
    sanitize_and_guard_draft,
)
from backend.app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ComplaintDraft,
)
from pydantic import ValidationError

logger = logging.getLogger(__name__)

# Load system prompt at startup
PROMPT_PATH = Path(__file__).parent / "prompts" / "system_prompt.md"
with open(PROMPT_PATH, encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()

# Delimiter pattern to neutralize delimiter-breaking attacks
_DELIMITER_TAG_REGEX = re.compile(
    r"</?(?:user_description|evidence_text|user_details)>",
    re.IGNORECASE,
)


class AnalysisException(Exception):
    """Base exception for analysis failures."""
    def __init__(self, code: str, message: str, status_code: int):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class MinorSignalException(AnalysisException):
    def __init__(self):
        super().__init__(
            code="MINOR_SIGNAL",
            message="SafeSignal detected words indicating this situation may involve a minor. AI analysis is disabled for minor safety; please use our dedicated guidance for young people and trusted adults.",
            status_code=422,
        )


class AINotConfiguredException(AnalysisException):
    def __init__(self):
        super().__init__(
            code="AI_NOT_CONFIGURED",
            message="AI analysis service is not configured. Please use the fictional sample or general safety checklist.",
            status_code=503,
        )


class AIUnavailableException(AnalysisException):
    def __init__(self, message: str = "AI service is temporarily unavailable. Please try again or use the general safety checklist."):
        super().__init__(
            code="AI_UNAVAILABLE",
            message=message,
            status_code=503,
        )


class AIBadOutputException(AnalysisException):
    def __init__(self):
        super().__init__(
            code="AI_BAD_OUTPUT",
            message="The AI engine produced an invalid response. Please retry or consult the general safety checklist.",
            status_code=502,
        )


def escape_delimiters(text: str) -> str:
    """Neutralize any literal occurrences of delimiter tags in untrusted user text."""
    return _DELIMITER_TAG_REGEX.sub("[sanitized_tag]", text)


def build_user_prompt(request: AnalyzeRequest) -> str:
    """Build user turn prompt with strict XML-style delimiters around untrusted data."""
    safe_description = escape_delimiters(request.description)
    parts = [
        f"<user_description>\n{safe_description}\n</user_description>"
    ]

    if request.evidence_text:
        safe_evidence = escape_delimiters(request.evidence_text)
        parts.append(f"<evidence_text>\n{safe_evidence}\n</evidence_text>")

    # Details serialized as clean JSON inside <user_details>
    details_dict = {
        "platform": request.platform,
        "incident_when": request.incident_when,
        "money_status": request.money_status,
    }
    clean_details = {k: v for k, v in details_dict.items() if v is not None}
    details_json = json.dumps(clean_details, indent=2)
    safe_details = escape_delimiters(details_json)
    parts.append(f"<user_details>\n{safe_details}\n</user_details>")

    return "\n\n".join(parts)


async def run_analysis_pipeline(
    request: AnalyzeRequest,
    client: GeminiClientProtocol,
    request_id: str | None = None,
) -> AnalyzeResponse:
    """
    Execute full analysis pipeline:
    1. Server-side minor guard heuristic check -> MINOR_SIGNAL (no Gemini call).
    2. Deterministic danger/self-harm screen.
    3. Build delimited user prompt.
    4. Call Gemini client with system prompt (one retry on invalid output/guards).
    5. Validate JSON response with ComplaintDraft schema.
    6. Run post-processing guards (scrubbing, legal/guarantee rejection, grounding check, safety lint, resource allowlisting).
    7. Construct AnalyzeResponse.
    """
    req_id = request_id or str(uuid4())
    settings = get_settings()

    # 1. Server-side minor guard heuristic check
    if check_minor_signal(request.description, request.evidence_text):
        raise MinorSignalException()

    # 2. Deterministic safety screen
    safety_flags = screen_safety(
        description=request.description,
        evidence_text=request.evidence_text,
    )

    # 3. Build delimited prompt
    user_prompt = build_user_prompt(request)

    # 4 & 5. Call Gemini with one bounded retry
    draft: ComplaintDraft | None = None
    notices: list[str] = []
    resource_ids: list[str] = []
    max_attempts = 2

    for attempt in range(1, max_attempts + 1):
        try:
            raw_text = await client.analyse(
                system_prompt=SYSTEM_PROMPT,
                user_content=user_prompt,
            )
            if not raw_text:
                raise ValueError("Empty response from AI service.")

            # Validate schema
            parsed_draft = ComplaintDraft.model_validate_json(raw_text)

            # Post-processing guards
            draft, notices, resource_ids = sanitize_and_guard_draft(
                draft=parsed_draft,
                user_description=request.description,
                evidence_text=request.evidence_text,
                platform=request.platform,
                incident_when=request.incident_when,
                money_status=request.money_status,
            )
            break  # Success
        except RuntimeError as err:
            if "not configured" in str(err).lower():
                raise AINotConfiguredException() from err
            raise AIUnavailableException() from err
        except TimeoutError as err:
            logger.warning("Gemini timeout on attempt %d [%s]", attempt, req_id)
            if attempt == max_attempts:
                raise AIUnavailableException("AI service request timed out. Please try again.") from err
        except (ValidationError, ValueError, IllegalLanguageError, SafetyLintViolationError) as err:
            logger.warning("Draft validation/guard error on attempt %d [%s]: %s", attempt, req_id, str(err))
            if attempt == max_attempts:
                raise AIBadOutputException() from err
        except Exception as err:
            logger.error("Unexpected error in Gemini pipeline [%s]: %s", req_id, type(err).__name__)
            if attempt == max_attempts:
                raise AIUnavailableException() from err

    if draft is None:
        raise AIBadOutputException()

    return AnalyzeResponse(
        request_id=req_id,
        source="gemini",
        model=getattr(client, "model", settings.GEMINI_MODEL),
        paid_tier=settings.GEMINI_PAID_TIER,
        generated_at=datetime.now(UTC).isoformat(),
        draft=draft,
        safety=safety_flags,
        notices=notices,
        resource_ids=resource_ids,
    )
