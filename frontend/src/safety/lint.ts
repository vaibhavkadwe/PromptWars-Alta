/**
 * Safety lint interpreter for SafeSignal (TypeScript).
 * Evaluates text against eval/safety_rules.json with negation and qualifier awareness.
 */

import safetyRulesData from '../../../eval/safety_rules.json'

export interface LintResult {
  passed: boolean
  ruleId?: string
  category?: string
  matchedText?: string
}

export interface RuleDefinition {
  id: string
  category: string
  pattern: string
  negation_aware?: boolean
  requires_qualifier?: boolean
  qualifier_pattern?: string
}

export class SafetyLinter {
  private rules: RuleDefinition[]
  private negationPhrases: string[]

  constructor(data = safetyRulesData) {
    this.rules = data.rules as RuleDefinition[]
    this.negationPhrases = data.negation_phrases || [
      'do not',
      "don't",
      'dont',
      'never',
      'avoid',
      'not to',
      'cannot',
      "can't",
    ]
  }

  private isNegated(textBefore: string): boolean {
    const words = textBefore.trim().split(/\s+/)
    const window = words.slice(-6).join(' ').toLowerCase()
    for (const neg of this.negationPhrases) {
      const regex = new RegExp(`\\b${neg}\\b`, 'i')
      if (regex.test(window)) {
        return true
      }
    }
    return false
  }

  public check(text: string): LintResult {
    if (!text) {
      return { passed: true }
    }

    for (const rule of this.rules) {
      const regex = new RegExp(rule.pattern, 'gi')
      let match: RegExpExecArray | null

      while ((match = regex.exec(text)) !== null) {
        const start = match.index
        const end = start + match[0].length
        const textBefore = text.slice(0, start)

        // 1. Negation check
        if (rule.negation_aware && this.isNegated(textBefore)) {
          continue
        }

        // 2. Qualifier check
        if (rule.requires_qualifier && rule.qualifier_pattern) {
          const wordsBefore = textBefore.trim().split(/\s+/).slice(-10).join(' ')
          const wordsAfter = text.slice(end).trim().split(/\s+/).slice(0, 10).join(' ')
          const window = `${wordsBefore} ${match[0]} ${wordsAfter}`
          const qualifierRegex = new RegExp(rule.qualifier_pattern, 'i')
          if (qualifierRegex.test(window)) {
            continue
          }
        }

        return {
          passed: false,
          ruleId: rule.id,
          category: rule.category,
          matchedText: match[0],
        }
      }
    }

    return { passed: true }
  }
}

export const defaultLinter = new SafetyLinter()

export function lintSafety(text: string): LintResult {
  return defaultLinter.check(text)
}
