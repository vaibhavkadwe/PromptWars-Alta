"""Optional live smoke test for Gemini API integration.

This test is skipped automatically unless GEMINI_API_KEY is set in the environment.
"""

import os

import pytest
from backend.app.main import create_app
from httpx import ASGITransport, AsyncClient

FICTIONAL_DESCRIPTION = (
    "I met someone calling themselves rhea_travels_22 on a dating app. We had a video call on Monday. "
    "Now they sent a message saying 'Pay 15000 by tomorrow 8 pm or I send the video to all your followers'. "
    "They gave a UPI id quickpay.help@examplebank."
)


@pytest.mark.asyncio
async def test_live_gemini_smoke():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        pytest.skip("GEMINI_API_KEY not set in environment; skipping live call.")

    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/analyze",
            json={
                "description": FICTIONAL_DESCRIPTION,
                "consent_ai_processing": True,
            },
            timeout=35.0,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["source"] == "gemini"
        assert len(data["report"]["actions"]) >= 4
        assert len(data["resources"]) > 0
