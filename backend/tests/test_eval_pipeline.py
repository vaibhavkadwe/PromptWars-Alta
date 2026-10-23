"""Pipeline evaluation suite for SafeSignal.

Executes 20 synthetic cases through the real backend validation, minor guards,
safety screening, and sanitization/grounding/linting pipeline using controlled replay fixtures.
Outputs per-case evaluation data to eval/results/pipeline.json.
"""

import json
from pathlib import Path

import pytest
from backend.app.gemini_client import FakeGeminiClient
from backend.app.main import create_app
from backend.app.ratelimit import limiter
from backend.app.safety_lint import lint_safety
from httpx import ASGITransport, AsyncClient

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CASES_FILE = BASE_DIR / "eval" / "cases" / "cases.json"
REPLAYS_DIR = BASE_DIR / "eval" / "replays"
RESULTS_DIR = BASE_DIR / "eval" / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = RESULTS_DIR / "pipeline.json"


def load_cases():
    with open(CASES_FILE, encoding="utf-8") as f:
        return json.load(f)


@pytest.mark.asyncio
async def test_run_eval_pipeline():
    cases = load_cases()
    results = {}
    total_adversarial_injected = 0
    total_adversarial_caught = 0

    for case in cases:
        # Reset in-memory rate limiter so synthetic benchmark can run sequentially
        limiter._ip_windows.clear()
        limiter._daily_window.clear()

        case_id = case["id"]
        inp = case["input"]
        expect_pipe = case["expect"]["pipeline"]
        replay_file = REPLAYS_DIR / f"{case_id}.json"

        with open(replay_file, encoding="utf-8") as rf:
            replay_data = json.load(rf)

        app = create_app()

        # Determine adult_confirmed and consent flags
        is_adult = not case["expect"]["triage"]["requires_minor_route"] or case_id == "10"
        # If expected error is ADULT_NOT_CONFIRMED, send adult_confirmed=False
        if expect_pipe["expected_error_code"] == "ADULT_NOT_CONFIRMED":
            is_adult = False

        payload = {
            "description": inp["description"],
            "evidence_text": inp.get("evidence_text"),
            "platform": inp.get("platform"),
            "incident_when": inp.get("incident_when"),
            "money_status": inp.get("money_status"),
            "adult_confirmed": is_adult,
            "consent_ai_processing": True,
        }

        fake_client = FakeGeminiClient()

        # Configure fake client according to case
        if "simulate_error" in replay_data and replay_data["simulate_error"] == "TimeoutError":
            fake_client = FakeGeminiClient(exception_to_raise=TimeoutError("Request timed out"))
        elif "malformed_output" in replay_data:
            fake_client = FakeGeminiClient(response_text=replay_data["malformed_output"])
        elif "good_output" in replay_data:
            fake_client = FakeGeminiClient(response_text=json.dumps(replay_data["good_output"]))

        app.state.gemini_client = fake_client

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/analyze", json=payload)

        case_result = {
            "id": case_id,
            "title": case["title"],
            "status_code": resp.status_code,
            "produced_draft": False,
            "error_code": None,
            "gemini_called": fake_client.last_user_content is not None,
            "hallucination_detected": False,
            "unsafe_advice_detected": False,
            "guard_interventions": 0,
            "adversarial_test": None,
            "passed": True,
            "failure_reasons": [],
        }

        # Check expected error code
        if expect_pipe["expected_error_code"]:
            if resp.status_code == 200:
                case_result["passed"] = False
                case_result["failure_reasons"].append(
                    f"Expected error {expect_pipe['expected_error_code']}, but got 200 OK"
                )
            else:
                err_data = resp.json().get("error", {})
                code = err_data.get("code")
                case_result["error_code"] = code
                if code != expect_pipe["expected_error_code"]:
                    case_result["passed"] = False
                    case_result["failure_reasons"].append(
                        f"Expected error code {expect_pipe['expected_error_code']}, got {code}"
                    )

            # Special verification for case 10: Gemini must NOT have been called
            if case_id == "10" and fake_client.last_user_content is not None:
                case_result["passed"] = False
                case_result["failure_reasons"].append("Gemini was called despite MINOR_SIGNAL")

        elif expect_pipe["expects_draft"]:
            if resp.status_code != 200:
                case_result["passed"] = False
                case_result["failure_reasons"].append(f"Expected draft with 200, got {resp.status_code}")
            else:
                case_result["produced_draft"] = True
                data = resp.json()
                draft = data.get("draft", {})
                notices = data.get("notices", [])
                case_result["guard_interventions"] += len(notices)

                # Check forbidden strings in draft
                draft_str = json.dumps(draft).lower()
                for forb in expect_pipe.get("forbidden_strings", []):
                    if forb.lower() in draft_str:
                        case_result["hallucination_detected"] = True
                        case_result["passed"] = False
                        case_result["failure_reasons"].append(f"Forbidden string found in draft: '{forb}'")

                # Check safety lint on all visible strings
                visible_texts = [
                    draft.get("what_happened", ""),
                    draft.get("threat_and_demand", ""),
                ]
                for c in draft.get("chronology", []):
                    visible_texts.append(c.get("event", ""))
                for ev in draft.get("evidence_checklist", []):
                    visible_texts.append(f"{ev.get('item', '')} {ev.get('how_to_preserve', '')}")
                for act in draft.get("action_suggestions", []):
                    visible_texts.append(f"{act.get('title', '')} {act.get('why', '')}")
                visible_texts.extend(draft.get("limitations", []))

                for txt in visible_texts:
                    if txt:
                        lint_res = lint_safety(txt)
                        if not lint_res.passed:
                            case_result["unsafe_advice_detected"] = True
                            case_result["passed"] = False
                            case_result["failure_reasons"].append(
                                f"Lint violation: rule {lint_res.rule_id} matched '{lint_res.matched_text}'"
                            )

        # Run adversarial replay if present to evaluate guards
        if "adversarial_output" in replay_data:
            limiter._ip_windows.clear()
            limiter._daily_window.clear()
            total_adversarial_injected += 1
            adv_client = FakeGeminiClient(response_text=json.dumps(replay_data["adversarial_output"]))
            app.state.gemini_client = adv_client

            async with AsyncClient(transport=transport, base_url="http://test") as client:
                adv_resp = await client.post("/api/analyze", json=payload)

            # A guard caught the adversarial output if:
            # 1. It returned 502 AI_BAD_OUTPUT (rejection of illegal language/core lint violation)
            # 2. Or returned 200 with notices / dropped ungrounded tokens / scrubbed URLs / dropped unsafe items
            caught = False
            caught_detail = ""
            if adv_resp.status_code == 502:
                caught = True
                caught_detail = "Rejected with 502 AI_BAD_OUTPUT"
            elif adv_resp.status_code == 200:
                adv_data = adv_resp.json()
                adv_notices = adv_data.get("notices", [])
                adv_draft_str = json.dumps(adv_data.get("draft", {}))
                # Check if hallucinated token or unsafe URL was dropped/scrubbed
                if len(adv_notices) > 0 or "unsupported_crypto_wallet_999" not in adv_draft_str:
                    caught = True
                    caught_detail = f"Sanitized with {len(adv_notices)} notices"

            if caught:
                total_adversarial_caught += 1

            case_result["adversarial_test"] = {
                "injected": True,
                "caught": caught,
                "detail": caught_detail,
            }

        results[case_id] = case_result

    # Save output to eval/results/pipeline.json
    output_data = {
        "mode": "pipeline",
        "total_cases": len(cases),
        "total_adversarial_injected": total_adversarial_injected,
        "total_adversarial_caught": total_adversarial_caught,
        "cases": results,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        json.dump(output_data, out, indent=2)

    # Assert that all cases passed pipeline expectations
    failed_cases = [cid for cid, r in results.items() if not r["passed"]]
    assert not failed_cases, f"Pipeline evaluation failed for cases: {failed_cases}"
