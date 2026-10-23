"""Pytest fixtures and configuration."""

import json
from pathlib import Path

import pytest
from backend.app.gemini_client import FakeGeminiClient
from backend.app.main import create_app
from backend.app.ratelimit import limiter
from httpx import ASGITransport, AsyncClient

FIXTURE_PATH = Path(__file__).parent.parent / "app" / "fixtures" / "sample_report.json"


@pytest.fixture
def sample_report_json() -> str:
    with open(FIXTURE_PATH, encoding="utf-8") as f:
        return f.read()


@pytest.fixture
def sample_report_dict(sample_report_json: str) -> dict:
    return json.loads(sample_report_json)


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture
def app_with_fake_gemini(sample_report_json: str):
    app = create_app()
    app.state.gemini_client = FakeGeminiClient(response_text=sample_report_json)
    return app


@pytest.fixture
async def client(app_with_fake_gemini):
    transport = ASGITransport(app=app_with_fake_gemini)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
