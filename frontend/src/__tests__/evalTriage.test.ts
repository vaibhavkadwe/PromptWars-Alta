/**
 * Frontend triage evaluation test suite for SafeSignal.
 * Runs 20 synthetic cases through the deterministic client-side triage module
 * and verifies all safety invariants, resource routings, and lint compliance.
 * Writes output to eval/results/triage.json.
 */

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import casesData from '../../../eval/cases/cases.json'
import { defaultLinter } from '../safety/lint'
import { triage, TriageAnswers } from '../triage/rules'

interface EvalCase {
  id: string
  title: string
  tags: string[]
  triage: {
    money: 'yes' | 'no' | 'not_sure'
    age: 'yes' | 'no' | 'prefer_not_to_say'
    danger: 'yes' | 'no' | 'not_sure'
  }
  expect: {
    triage: {
      first_action: string
      ai_available: boolean
      requires_minor_route: boolean
      must_include_resources: string[]
      must_not_include_resources: string[]
    }
    pipeline: {
      expects_draft: boolean
      expected_error_code: string | null
    }
  }
}

describe('Evaluation: 20 Synthetic Triage Cases', () => {
  const cases = casesData as EvalCase[]
  const results: Record<string, unknown> = {}

  cases.forEach((c) => {
    it(`evaluates case ${c.id}: ${c.title}`, () => {
      const card = triage(c.triage as TriageAnswers)
      const exp = c.expect.triage

      let passed = true
      const failureReasons: string[] = []

      // Invariant: First action item matches
      if (card.items.length === 0) {
        passed = false
        failureReasons.push('Action card has no items')
      } else if (!card.items[0].id.startsWith(exp.first_action)) {
        passed = false
        failureReasons.push(`First action expected ${exp.first_action}, got ${card.items[0].id}`)
      }

      // Check minor route on triage
      if (c.triage.age === 'yes' || c.triage.age === 'prefer_not_to_say') {
        if (!card.isMinorRoute || !card.isAiDisabled) {
          passed = false
          failureReasons.push('Minor route should have isMinorRoute=true and isAiDisabled=true')
        }
      }

      // Must include resources
      for (const reqRes of exp.must_include_resources) {
        if (!card.resourceIds.includes(reqRes)) {
          passed = false
          failureReasons.push(`Missing required resource ${reqRes}`)
        }
      }

      // Must not include resources
      for (const forbiddenRes of exp.must_not_include_resources) {
        if (card.resourceIds.includes(forbiddenRes)) {
          passed = false
          failureReasons.push(`Found forbidden resource ${forbiddenRes}`)
        }
      }

      // Safety lint on all visible card strings
      for (const item of card.items) {
        const titleLint = defaultLinter.check(item.title)
        if (!titleLint.passed) {
          passed = false
          failureReasons.push(`Title lint failed: ${titleLint.ruleId} (${titleLint.matchedText})`)
        }
        const whyLint = defaultLinter.check(item.why)
        if (!whyLint.passed) {
          passed = false
          failureReasons.push(`Why lint failed: ${whyLint.ruleId} (${whyLint.matchedText})`)
        }
      }

      results[c.id] = {
        id: c.id,
        title: c.title,
        first_action_id: card.items[0]?.id,
        is_ai_disabled: card.isAiDisabled,
        is_minor_route: card.isMinorRoute,
        resource_ids: card.resourceIds,
        passed,
        failure_reasons: failureReasons,
      }

      expect(passed, `Case ${c.id} failed: ${failureReasons.join('; ')}`).toBe(true)
    })
  })

  it('saves triage evaluation results to eval/results/triage.json', () => {
    const resultsDir = path.resolve(process.cwd(), '../eval/results')
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true })
    }
    const outputPath = path.join(resultsDir, 'triage.json')
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          total_cases: cases.length,
          passed_cases: Object.values(results).filter((r) => (r as { passed: boolean }).passed).length,
          cases: results,
        },
        null,
        2,
      ),
      'utf-8',
    )
    expect(fs.existsSync(outputPath)).toBe(true)
  })
})
