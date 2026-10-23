import { describe, expect, it } from 'vitest'
import { redactPii, restoreDraftPii, restorePii } from '../lib/redact'

describe('Client-Side PII Redactor', () => {
  it('replaces phone, email, and UPI with tokens and restores them', () => {
    const input = 'Call 9876543210 or email test@example.com, pay to quickpay.help@oksbi'
    const { redactedText, tokenMap } = redactPii(input, {
      hidePhones: true,
      hideEmails: true,
      hideAccounts: true,
    })

    expect(redactedText).toContain('[PHONE_1]')
    expect(redactedText).toContain('[EMAIL_1]')
    expect(redactedText).toContain('[ACCOUNT_1]')
    expect(redactedText).not.toContain('9876543210')
    expect(redactedText).not.toContain('test@example.com')
    expect(redactedText).not.toContain('quickpay.help@oksbi')

    const restored = restorePii(redactedText, tokenMap)
    expect(restored).toBe(input)
  })

  it('leaves unknown tokens intact when restoring', () => {
    const textWithUnknown = 'Here is [PHONE_1] and unknown [PHONE_99].'
    const restored = restorePii(textWithUnknown, { '[PHONE_1]': '9999999999' })
    expect(restored).toBe('Here is 9999999999 and unknown [PHONE_99].')
  })

  it('recursively restores PII inside complex draft objects', () => {
    const draft = {
      what_happened: 'Account contacted me at [PHONE_1].',
      identifiers: [
        { kind: 'phone', value: '[PHONE_1]' },
        { kind: 'email', value: '[EMAIL_1]' },
      ],
    }
    const tokenMap = {
      '[PHONE_1]': '9876543210',
      '[EMAIL_1]': 'victim@domain.test',
    }
    const restored = restoreDraftPii(draft, tokenMap)
    expect(restored.what_happened).toBe('Account contacted me at 9876543210.')
    expect(restored.identifiers[0].value).toBe('9876543210')
    expect(restored.identifiers[1].value).toBe('victim@domain.test')
  })
})
