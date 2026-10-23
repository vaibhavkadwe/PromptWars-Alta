"""Metadata-only logging configuration for SafeSignal.

CRITICAL PRIVACY GUARANTEE:
Descriptions, evidence texts, user details, prompts, model outputs, and API keys
must NEVER be written to logs under any circumstances, including on error paths.
"""

import logging
import sys

logger = logging.getLogger("safesignal")


def get_length_bucket(length: int | None, is_evidence: bool = False) -> str:
    """Classify text length into coarse privacy-preserving buckets."""
    if length is None or length == 0:
        return "none" if is_evidence else "0"

    if is_evidence:
        if length < 1000:
            return "<1k"
        if length < 5000:
            return "1k-5k"
        if length < 10000:
            return "5k-10k"
        if length <= 20000:
            return "10k-20k"
        return ">20k"

    if length < 100:
        return "<100"
    if length < 500:
        return "100-500"
    if length < 1000:
        return "500-1000"
    if length <= 4000:
        return "1000-4000"
    return ">4000"


def setup_logging():
    """Configure structured metadata-only logger."""
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [safesignal] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    # Avoid duplicate handlers
    if not any(isinstance(h, logging.StreamHandler) for h in root_logger.handlers):
        root_logger.addHandler(handler)

    # Silence verbose third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("google.genai").setLevel(logging.WARNING)


def log_analysis_event(
    request_id: str,
    route: str,
    status_code: int,
    latency_ms: float,
    model: str | None = None,
    desc_length: int | None = None,
    evidence_length: int | None = None,
    error_class: str | None = None,
):
    """
    Log strictly metadata about an analysis request.
    NEVER logs descriptions, evidence text, or error message contents that might reflect inputs.
    """
    desc_bucket = get_length_bucket(desc_length, is_evidence=False)
    ev_bucket = get_length_bucket(evidence_length, is_evidence=True)

    log_entry = (
        f"request_id={request_id} route={route} status={status_code} "
        f"latency_ms={latency_ms:.1f} model={model or 'none'} "
        f"desc_bucket={desc_bucket} ev_bucket={ev_bucket} "
        f"error_class={error_class or 'none'}"
    )
    if status_code >= 500:
        logger.error(log_entry)
    elif status_code >= 400:
        logger.warning(log_entry)
    else:
        logger.info(log_entry)
