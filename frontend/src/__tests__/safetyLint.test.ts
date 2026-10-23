import { describe, expect, it } from 'vitest'
import selftestCases from '../../../eval/lint_selftest.json'
import { defaultLinter } from '../safety/lint'

describe('Safety Linter Parity & Selftest', () => {
  it('correctly passes all 25 selftest cases matching Python behavior', () => {
    selftestCases.forEach((tc, idx) => {
      const res = defaultLinter.check(tc.text)
      if (tc.should_pass) {
        expect(res.passed, `Case ${idx}: "${tc.text}" should have passed, but failed with rule ${res.ruleId} (${res.matchedText})`).toBe(true)
      } else {
        expect(res.passed, `Case ${idx}: "${tc.text}" should have failed`).toBe(false)
        if ('expected_rule' in tc) {
          expect(res.ruleId).toBe(tc.expected_rule)
        }
      }
    })
  })
})
