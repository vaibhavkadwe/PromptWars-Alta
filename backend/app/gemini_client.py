"""Gemini client Protocol and implementation using google-genai SDK."""

import asyncio
import logging
from typing import Protocol

from backend.app.config import get_settings
from backend.app.schemas import ComplaintDraft
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class GeminiClientProtocol(Protocol):
    """Protocol for Gemini analysis to allow dependency injection during testing."""

    async def analyse(self, system_prompt: str, user_content: str) -> str:
        """Analyze user content given a system prompt and return JSON string."""
        ...


class GeminiClient:
    """Production Gemini client using google-genai SDK."""

    def __init__(self, api_key: str | None = None, model: str | None = None, timeout_seconds: int = 30):
        settings = get_settings()
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL
        self.timeout_seconds = timeout_seconds or settings.GEMINI_TIMEOUT_SECONDS

        if self.api_key:
            self._client = genai.Client(api_key=self.api_key)
        else:
            self._client = None

    async def analyse(self, system_prompt: str, user_content: str) -> str:
        if not self._client or not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured.")

        # Configure structured output with ComplaintDraft schema
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=ComplaintDraft,
            temperature=0.2,
            max_output_tokens=8192,
        )

        # Execute call with asyncio timeout guard
        try:
            response = await asyncio.wait_for(
                self._client.aio.models.generate_content(
                    model=self.model,
                    contents=user_content,
                    config=config,
                ),
                timeout=float(self.timeout_seconds),
            )
        except TimeoutError as err:
            raise TimeoutError("Gemini analysis timed out.") from err

        if not response or not response.text:
            # Token exhaustion or safety filter suppression in structured output
            raise ValueError("Gemini returned empty response.")

        return response.text


class FakeGeminiClient:
    """In-memory fake client for testing without external network calls."""

    def __init__(self, response_text: str | None = None, exception_to_raise: Exception | None = None):
        self.response_text = response_text
        self.exception_to_raise = exception_to_raise
        self.last_system_prompt: str | None = None
        self.last_user_content: str | None = None

    async def analyse(self, system_prompt: str, user_content: str) -> str:
        self.last_system_prompt = system_prompt
        self.last_user_content = user_content

        if self.exception_to_raise:
            raise self.exception_to_raise

        if self.response_text is None:
            raise ValueError("Fake client response text not configured.")

        return self.response_text
