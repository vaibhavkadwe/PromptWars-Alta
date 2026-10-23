import { describe, expect, it } from 'vitest'
import { defaultLinter } from '../safety/lint'
import {
  AgeAnswer,
  DangerAnswer,
  MoneyAnswer,
  triage,
  TriageAnswers,
} from '../triage/rules'

describe('Safety Triage Rules (3x3x3 Invariant Matrix)', () => {
  const moneyOptions: MoneyAnswer[] = ['yes', 'no', 'not_sure']
  const ageOptions: AgeAnswer[] = ['yes', 'no', 'prefer_not_to_say']
  const dangerOptions: DangerAnswer[] = ['yes', 'no', 'not_sure']

  const allCombinations: TriageAnswers[] = []
  for (const m of moneyOptions) {
    for (const a of ageOptions) {
      for (const d of dangerOptions) {
        allCombinations.push({ money: m, age: a, danger: d })
      }
    }
  }

  it('contains exactly 27 combinations in the test matrix', () => {
    expect(allCombinations.length).toBe(27)
  })

  allCombinations.forEach((combo) => {
    const name = `money=${combo.money}, age=${combo.age}, danger=${combo.danger}`

    it(`satisfies all safety invariants for [${name}]`, () => {
      const card = triage(combo)

      // Invariant 1: At most 5 action items
      expect(card.items.length).toBeGreaterThan(0)
      expect(card.items.length).toBeLessThanOrEqual(5)

      // Invariant 2: Danger = yes/not_sure -> first item is emergency 112
      if (combo.danger === 'yes' || combo.danger === 'not_sure') {
        expect(card.hasUrgentDanger).toBe(true)
        expect(card.items[0].id).toMatch(/^r1_emergency/)
        expect(card.items[0].resourceIds).toContain('ERSS_112')
      } else {
        expect(card.hasUrgentDanger).toBe(false)
        expect(card.items[0].id).not.toMatch(/^r1_emergency/)
      }

      // Invariant 3: Age = yes/prefer_not_to_say -> AI disabled, minor route, conservative items
      if (combo.age === 'yes' || combo.age === 'prefer_not_to_say') {
        expect(card.isAiDisabled).toBe(true)
        expect(card.isMinorRoute).toBe(true)

        // Must have safe adult item
        const adultItem = card.items.find((i) => i.id === 'r2_safe_adult')
        expect(adultItem).toBeDefined()
        // Must NOT unconditionally say "tell your parents" without alternatives
        expect(adultItem?.why).toMatch(/parent or guardian, another relative|or call Childline/i)

        // Must NOT offer StopNCII (which is adults only)
        expect(card.items.some((i) => i.id === 'r6_stopncii')).toBe(false)
      } else {
        expect(card.isAiDisabled).toBe(false)
        expect(card.isMinorRoute).toBe(false)
      }

      // Invariant 4: Money = no -> NEVER mention 1930 anywhere
      if (combo.money === 'no') {
        expect(card.resourceIds).not.toContain('HELPLINE_1930')
        card.items.forEach((item) => {
          expect(item.why).not.toContain('1930')
          expect(item.title).not.toContain('1930')
          expect(item.resourceIds || []).not.toContain('HELPLINE_1930')
        })
      }

      // Invariant 5: Money = yes -> 1930 only with fraud caveat
      if (combo.money === 'yes') {
        const moneyItem = card.items.find((i) => i.id === 'r3_money_yes')
        expect(moneyItem).toBeDefined()
        expect(moneyItem?.why).toMatch(/1930 is mainly for online financial fraud/i)
      }

      // Invariant 6: Every text string in the card passes the safety lint
      expect(defaultLinter.check(card.disclaimer).passed).toBe(true)
      card.items.forEach((item) => {
        const titleLint = defaultLinter.check(item.title)
        expect(
          titleLint.passed,
          `Title lint failed for item ${item.id}: ${titleLint.matchedText} (${titleLint.ruleId})`,
        ).toBe(true)

        const whyLint = defaultLinter.check(item.why)
        expect(
          whyLint.passed,
          `Why lint failed for item ${item.id}: ${whyLint.matchedText} (${whyLint.ruleId}) in "${item.why}"`,
        ).toBe(true)
      })
    })
  })
})
