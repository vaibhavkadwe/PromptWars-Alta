"""In-memory sliding window rate limiter and daily cap.

Note: This rate limiter is strictly in-memory and per-instance; state resets on server restart.
"""

import time
from collections import defaultdict

from backend.app.config import get_settings
from fastapi import Request
from starlette.responses import JSONResponse


class InMemoryRateLimiter:
    """
    Sliding window per client IP (RATE_LIMIT_PER_MINUTE) and global daily cap (DAILY_ANALYSIS_CAP).
    """

    def __init__(self):
        self._ip_windows: dict[str, list[float]] = defaultdict(list)
        self._daily_window: list[float] = []

    def get_client_ip(self, request: Request) -> str:
        settings = get_settings()
        if settings.TRUST_PROXY:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                # First address in list is original client
                return forwarded.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    def check_rate_limit(self, request: Request) -> JSONResponse | None:
        """
        Check if request exceeds per-minute IP limit or global daily cap.
        Returns a 429 JSONResponse with Retry-After header if limited, or None if allowed.
        """
        settings = get_settings()
        now = time.time()
        client_ip = self.get_client_ip(request)
        req_id = getattr(request.state, "request_id", "unknown")

        # 1. Clean up global daily window (86400 seconds)
        day_cutoff = now - 86400.0
        self._daily_window = [t for t in self._daily_window if t > day_cutoff]

        if len(self._daily_window) >= settings.DAILY_ANALYSIS_CAP:
            oldest = self._daily_window[0]
            retry_after = max(1, int(oldest + 86400.0 - now))
            response = JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "DAILY_CAP_EXCEEDED",
                        "message": "Daily analysis limit reached. Please try again later or consult the static checklist.",
                        "request_id": req_id,
                    }
                },
            )
            response.headers["Retry-After"] = str(retry_after)
            return response

        # 2. Clean up per-IP 60-second window
        minute_cutoff = now - 60.0
        ip_timestamps = [t for t in self._ip_windows[client_ip] if t > minute_cutoff]
        self._ip_windows[client_ip] = ip_timestamps

        if len(ip_timestamps) >= settings.RATE_LIMIT_PER_MINUTE:
            oldest = ip_timestamps[0]
            retry_after = max(1, int(oldest + 60.0 - now))
            response = JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Too many requests. Please wait {retry_after} seconds before trying again.",
                        "request_id": req_id,
                    }
                },
            )
            response.headers["Retry-After"] = str(retry_after)
            return response

        # Allowed: record timestamp
        self._daily_window.append(now)
        self._ip_windows[client_ip].append(now)
        return None

    def reset(self):
        """Reset all rate limit tracking (useful for testing)."""
        self._ip_windows.clear()
        self._daily_window.clear()


limiter = InMemoryRateLimiter()
