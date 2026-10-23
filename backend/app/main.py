"""FastAPI application factory, routers, error handlers, and static mount."""

import json
import logging
import time
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from backend.app.analysis import (
    AINotConfiguredException,
    AnalysisException,
    run_analysis_pipeline,
)
from backend.app.config import get_settings
from backend.app.gemini_client import GeminiClient
from backend.app.logging_config import log_analysis_event, setup_logging
from backend.app.middleware import BodySizeLimitMiddleware, SecurityHeadersMiddleware
from backend.app.ratelimit import limiter
from backend.app.resources import get_all_resources, select_resources
from backend.app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    HealthResponse,
    IncidentDetails,
    IncidentReport,
    Resource,
    SafetyFlags,
)
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger("safesignal")
setup_logging()


def create_app() -> FastAPI:
    settings = get_settings()

    # Disable interactive documentation in production
    docs_url = None if settings.is_production else "/docs"
    redoc_url = None if settings.is_production else "/redoc"
    openapi_url = None if settings.is_production else "/openapi.json"

    app = FastAPI(
        title="SafeSignal API",
        version="0.1.0",
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url=openapi_url,
    )

    # Attach default production GeminiClient (can be overridden in tests via app.state.gemini_client)
    app.state.gemini_client = GeminiClient()

    # Middlewares (order matters: SecurityHeaders wraps entire response, BodySizeLimit checks body)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(BodySizeLimitMiddleware)

    # ------------------ Custom Exception Handlers ------------------
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        req_id = getattr(request.state, "request_id", str(uuid4()))
        errors = exc.errors()

        # Check if consent is the missing or invalid field
        is_consent_err = any("consent_ai_processing" in err.get("loc", ()) for err in errors)
        code = "CONSENT_REQUIRED" if is_consent_err else "VALIDATION_ERROR"

        # Build clean message NEVER echoing sensitive 'input' values
        clean_msgs = []
        for err in errors:
            loc = " -> ".join([str(x) for x in err.get("loc", ()) if x != "body"])
            msg = err.get("msg", "Invalid value")
            clean_msgs.append(f"{loc}: {msg}" if loc else msg)

        friendly_msg = "; ".join(clean_msgs) if clean_msgs else "Invalid request data provided."
        if is_consent_err:
            friendly_msg = "Explicit consent for AI processing is required to analyze your report."

        log_analysis_event(
            request_id=req_id,
            route=request.url.path,
            status_code=422,
            latency_ms=0.0,
            error_class=code,
        )

        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": code,
                    "message": friendly_msg,
                    "request_id": req_id,
                }
            },
        )

    @app.exception_handler(AnalysisException)
    async def analysis_exception_handler(request: Request, exc: AnalysisException):
        req_id = getattr(request.state, "request_id", str(uuid4()))
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "request_id": req_id,
                }
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        req_id = getattr(request.state, "request_id", str(uuid4()))
        logger.error("Unhandled server exception [%s]: %s", req_id, exc.__class__.__name__)
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred. Please try again or use the offline safety checklist.",
                    "request_id": req_id,
                }
            },
        )

    # ------------------ API Routes ------------------
    @app.get("/api/health", response_model=HealthResponse)
    async def health_check():
        app_settings = get_settings()
        return HealthResponse(
            ai_configured=app_settings.is_ai_configured,
            paid_tier=app_settings.GEMINI_PAID_TIER,
        )

    @app.get("/api/resources", response_model=list[Resource])
    async def list_resources():
        return get_all_resources()

    @app.get("/api/sample", response_model=AnalyzeResponse)
    async def get_sample_report(request: Request):
        req_id = getattr(request.state, "request_id", str(uuid4()))
        fixture_path = Path(__file__).parent / "fixtures" / "sample_report.json"
        with open(fixture_path, encoding="utf-8") as f:
            sample_data = json.load(f)

        report = IncidentReport.model_validate(sample_data)
        safety = SafetyFlags(
            physical_danger=report.risk.physical_danger_mentioned,
            self_harm=report.risk.self_harm_mentioned,
            possible_minor=report.risk.possible_minor,
        )
        resources = select_resources(
            details=IncidentDetails(),
            safety=safety,
            report=report,
        )

        return AnalyzeResponse(
            request_id=req_id,
            source="sample",
            model=None,
            paid_tier=get_settings().GEMINI_PAID_TIER,
            generated_at=datetime.now(UTC).isoformat(),
            report=report,
            safety=safety,
            resources=resources,
        )

    @app.post("/api/analyze", response_model=AnalyzeResponse)
    async def analyze_incident(payload: AnalyzeRequest, request: Request):
        req_id = getattr(request.state, "request_id", str(uuid4()))
        start_time = time.perf_counter()

        # Enforce consent
        if not payload.consent_ai_processing:
            log_analysis_event(
                request_id=req_id,
                route=request.url.path,
                status_code=422,
                latency_ms=0.0,
                error_class="CONSENT_REQUIRED",
            )
            return JSONResponse(
                status_code=422,
                content={
                    "error": {
                        "code": "CONSENT_REQUIRED",
                        "message": "Explicit consent for AI processing is required.",
                        "request_id": req_id,
                    }
                },
            )

        # In-memory Rate limiting check
        rate_limit_resp = limiter.check_rate_limit(request)
        if rate_limit_resp:
            log_analysis_event(
                request_id=req_id,
                route=request.url.path,
                status_code=429,
                latency_ms=0.0,
                error_class="RATE_LIMIT_EXCEEDED",
            )
            return rate_limit_resp

        # Check AI configuration
        app_settings = get_settings()
        if not app_settings.is_ai_configured and not hasattr(app.state.gemini_client, "response_text"):
            # Real client requested but no key provided
            log_analysis_event(
                request_id=req_id,
                route=request.url.path,
                status_code=503,
                latency_ms=0.0,
                error_class="AI_NOT_CONFIGURED",
            )
            raise AINotConfiguredException()

        try:
            response = await run_analysis_pipeline(
                request=payload,
                client=app.state.gemini_client,
                request_id=req_id,
            )
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            log_analysis_event(
                request_id=req_id,
                route=request.url.path,
                status_code=200,
                latency_ms=latency_ms,
                model=response.model,
                desc_length=len(payload.description),
                evidence_length=len(payload.evidence_text) if payload.evidence_text else 0,
            )
            return response
        except AnalysisException as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            log_analysis_event(
                request_id=req_id,
                route=request.url.path,
                status_code=exc.status_code,
                latency_ms=latency_ms,
                error_class=exc.code,
            )
            raise

    # ------------------ Static Files Mount (Production) ------------------
    # In production, serve frontend/dist at "/" mounted AFTER API routes
    dist_path = Path(__file__).parent.parent.parent / "frontend" / "dist"
    if dist_path.exists() and dist_path.is_dir():
        app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="frontend-dist")

    return app


app = create_app()
