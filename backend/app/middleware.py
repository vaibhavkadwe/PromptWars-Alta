"""Security headers, body-size enforcement, and request-id middleware."""

from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

MAX_BODY_BYTES = 64 * 1024  # 64 KB


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforce strict security headers on all responses and no-store for /api."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Generate or preserve X-Request-ID
        req_id = request.headers.get("X-Request-ID") or str(uuid4())
        request.state.request_id = req_id

        response = await call_next(request)

        # Attach request ID to response header
        response.headers["X-Request-ID"] = req_id

        # Mandatory security headers
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self'; "
            "img-src 'self' data:; "
            "connect-src 'self'; "
            "font-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'none'; "
            "form-action 'self'"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        # Disable caching on all /api responses
        if request.url.path.startswith("/api"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            response.headers["Pragma"] = "no-cache"

        return response


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Enforce a hard 64 KB limit on request bodies even if Content-Length header is omitted.
    Returns 413 Payload Too Large if exceeded.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method in ("POST", "PUT", "PATCH"):
            # Check Content-Length header if present
            content_length = request.headers.get("content-length")
            if content_length:
                try:
                    if int(content_length) > MAX_BODY_BYTES:
                        req_id = getattr(request.state, "request_id", str(uuid4()))
                        return JSONResponse(
                            status_code=413,
                            content={
                                "error": {
                                    "code": "PAYLOAD_TOO_LARGE",
                                    "message": "Request payload exceeds 64 KB limit.",
                                    "request_id": req_id,
                                }
                            },
                        )
                except ValueError:
                    pass

            # Read and count actual body bytes to handle streaming or chunked uploads
            body = await request.body()
            if len(body) > MAX_BODY_BYTES:
                req_id = getattr(request.state, "request_id", str(uuid4()))
                return JSONResponse(
                    status_code=413,
                    content={
                        "error": {
                            "code": "PAYLOAD_TOO_LARGE",
                            "message": "Request payload exceeds 64 KB limit.",
                            "request_id": req_id,
                        }
                    },
                )

        return await call_next(request)
