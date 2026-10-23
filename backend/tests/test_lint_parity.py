"""Safety lint interpreter parity test for Python.

Loads eval/lint_selftest.json and verifies every positive and negative test case,
proving exact behavior parity with the TypeScript interpreter.
"""

import json
from pathlib import Path

from backend.app.safety_lint import lint_safety


def test_safety_lint_selftest_parity():
    selftest_path = Path(__file__).resolve().parent.parent.parent / "eval" / "lint_selftest.json"
    assert selftest_path.exists(), f"lint_selftest.json not found at {selftest_path}"

    with open(selftest_path, encoding="utf-8") as f:
        test_cases = json.load(f)

    for idx, tc in enumerate(test_cases):
        text = tc["text"]
        should_pass = tc["should_pass"]
        res = lint_safety(text)

        if should_pass:
            assert res.passed is True, (
                f"Case {idx}: '{text}' should have passed, but failed on rule "
                f"'{res.rule_id}' ('{res.matched_text}')"
            )
        else:
            assert res.passed is False, f"Case {idx}: '{text}' should have failed"
            if "expected_rule" in tc:
                assert res.rule_id == tc["expected_rule"], (
                    f"Case {idx}: expected rule '{tc['expected_rule']}', got '{res.rule_id}'"
                )
