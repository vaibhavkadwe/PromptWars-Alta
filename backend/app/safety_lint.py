"""Safety lint interpreter for SafeSignal (Python).

Evaluates user-visible advice against eval/safety_rules.json with negation and qualifier awareness.
"""

import json
import re
from dataclasses import dataclass
from pathlib import Path


@dataclass
class LintResult:
    passed: bool
    rule_id: str | None = None
    category: str | None = None
    matched_text: str | None = None


def load_rules(rules_path: Path | None = None) -> dict:
    if rules_path is None:
        # Look in workspace eval/safety_rules.json
        base_dir = Path(__file__).resolve().parent.parent.parent
        rules_path = base_dir / "eval" / "safety_rules.json"

    with open(rules_path, encoding="utf-8") as f:
        return json.load(f)


class SafetyLinter:
    def __init__(self, rules_data: dict | None = None):
        if rules_data is None:
            rules_data = load_rules()

        self.rules = rules_data.get("rules", [])
        self.negation_phrases = rules_data.get("negation_phrases", [
            "do not", "don't", "dont", "never", "avoid", "not to", "cannot", "can't"
        ])

        # Precompile regexes
        self.compiled_rules = []
        for r in self.rules:
            pattern = re.compile(r["pattern"], re.IGNORECASE)
            qualifier = re.compile(r["qualifier_pattern"], re.IGNORECASE) if r.get("requires_qualifier") else None
            self.compiled_rules.append({
                "id": r["id"],
                "category": r["category"],
                "pattern": pattern,
                "negation_aware": r.get("negation_aware", False),
                "requires_qualifier": r.get("requires_qualifier", False),
                "qualifier_pattern": qualifier,
            })

    def is_negated(self, text_before: str) -> bool:
        """Check if negation appears within ~6 words before the match."""
        # Split on whitespace to get tokens
        words = text_before.strip().split()
        preceding_window = " ".join(words[-6:]).lower()
        for neg in self.negation_phrases:
            if re.search(r"\b" + re.escape(neg) + r"\b", preceding_window):
                return True
        return False

    def check(self, text: str) -> LintResult:
        if not text:
            return LintResult(passed=True)

        for rule in self.compiled_rules:
            for match in rule["pattern"].finditer(text):
                start, end = match.span()
                text_before = text[:start]

                # 1. Negation check
                if rule["negation_aware"] and self.is_negated(text_before):
                    continue

                # 2. Qualifier check (for rules like absolute guardian advice)
                if rule["requires_qualifier"]:
                    words_before = " ".join(text_before.strip().split()[-10:])
                    words_after = " ".join(text[end:].strip().split()[:10])
                    window = f"{words_before} {match.group(0)} {words_after}"
                    if rule["qualifier_pattern"] and rule["qualifier_pattern"].search(window):
                        continue

                # If we get here, it's a violation
                return LintResult(
                    passed=False,
                    rule_id=rule["id"],
                    category=rule["category"],
                    matched_text=match.group(0),
                )

        return LintResult(passed=True)


_DEFAULT_LINTER = None


def get_linter() -> SafetyLinter:
    global _DEFAULT_LINTER
    if _DEFAULT_LINTER is None:
        _DEFAULT_LINTER = SafetyLinter()
    return _DEFAULT_LINTER


def lint_safety(text: str) -> LintResult:
    return get_linter().check(text)
