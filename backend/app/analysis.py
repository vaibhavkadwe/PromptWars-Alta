"""Analysis orchestration pipeline for SafeSignal."""

import json
import logging
import re
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from backend.app.config import get_settings
from backend.app.gemini_client import GeminiClientProtocol
from backend.app.resources import select_resources
from backend.app.safety import screen_safety
from backend.app.sanitize import GuaranteeLanguageError, sanitize_and_validate_report
from backend.app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    IncidentReport,
    SafetyFlags,
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
    details_dict = request.details.model_dump(exclude_none=True)
    details_json = json.dumps(details_dict, indent=2)
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
    1. Consent check (ensured by caller/Pydantic).
    2. Deterministic safety screen.
    3. Build delimited user prompt.
    4. Call Gemini client with system prompt.
    5. Validate JSON response with IncidentReport (retry once on validation/guarantee failure).
    6. Post-process and sanitize report (scrubbing, guarantee rejection, grounding check, action sort).
    7. Merge safety flags (deterministic screen OR model risk flags).
    8. Select and order verified resources from catalog.
    9. Construct AnalyzeResponse.
    """
    req_id = request_id or str(uuid4())
    settings = get_settings()

    # 2. Deterministic safety screen (always computed, works even if AI fails)
    screen_flags = screen_safety(
        description=request.description,
        evidence_text=request.evidence_text,
        details=request.details,
    )

    # 3. Build delimited prompt
    user_prompt = build_user_prompt(request)

    # 4 & 5. Call Gemini with retry logic
    report: IncidentReport | None = None
    max_attempts = 2

    for attempt in range(1, max_attempts + 1):
        try:
            raw_text = await client.analyse(
                system_prompt=SYSTEM_PROMPT,
                user_content=user_prompt,
            )
            # Validate JSON schema
            parsed_report = IncidentReport.model_validate_json(raw_text)

            # 6. Sanitize, scrub, check guarantees, grounding, action order
            report = sanitize_and_validate_report(
                report=parsed_report,
                user_description=request.description,
                evidence_text=request.evidence_text,
            )
            break  # Success
        except RuntimeError as err:
            if "not configured" in str(err).lower():
                raise AINotConfiguredException() from err
            logger.warning("Runtime error in AI pipeline (attempt %d): %s", attempt, err.__class__.__name__)
            if attempt == max_attempts:
                raise AIUnavailableException() from err
        except TimeoutError as err:
            logger.warning("Timeout in AI pipeline (attempt %d): %s", attempt, err.__class__.__name__)
            if attempt == max_attempts:
                raise AIUnavailableException() from err
        except (ValidationError, GuaranteeLanguageError, ValueError) as err:
            # Bad output: log only error class (never content)
            logger.warning("Bad AI output error (attempt %d): %s", attempt, err.__class__.__name__)
            if attempt == max_attempts:
                raise AIBadOutputException() from err
        except Exception as err:
            # Map provider errors (e.g. 429, 503, network) to AIUnavailableException
            err_name = err.__class__.__name__
            logger.warning("Provider/network exception (attempt %d): %s", attempt, err_name)
            if attempt == max_attempts:
                raise AIUnavailableException() from err

    if not report:
        raise AIBadOutputException()

    # 7. Merge safety flags (screen OR model)
    merged_safety = SafetyFlags(
        physical_danger=screen_flags.physical_danger or report.risk.physical_danger_mentioned,
        self_harm=screen_flags.self_harm or report.risk.self_harm_mentioned,
        possible_minor=screen_flags.possible_minor or report.risk.possible_minor,
    )

    # Select verified static resources
    selected_resources = select_resources(
        details=request.details,
        safety=merged_safety,
        report=report,
    )

    # 8. Construct response
    return AnalyzeResponse(
        request_id=req_id,
        source="gemini",
        model=settings.GEMINI_MODEL,
        paid_tier=settings.GEMINI_PAID_TIER,
        generated_at=datetime.now(UTC).isoformat(),
        report=report,
        safety=merged_safety,
        resources=selected_resources,
    )
