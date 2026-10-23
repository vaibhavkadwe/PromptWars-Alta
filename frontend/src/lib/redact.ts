/**
 * Client-side PII redactor and restorer for SafeSignal.
 * Replaces sensitive identifiers with tokens ([PHONE_1], [EMAIL_1], [ACCOUNT_1])
 * before sending to Gemini, and restores originals locally on the draft screen.
 */

export interface RedactionOptions {
  hidePhones: boolean
  hideEmails: boolean
  hideAccounts: boolean
}

export interface RedactionResult {
  redactedText: string
  tokenMap: Record<string, string>
}

const PHONE_REGEX = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|\b\d{10,12}\b/g
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const UPI_REGEX = /\b[A-Za-z0-9._-]+@(?!gmail\b|yahoo\b|outlook\b|hotmail\b|icloud\b)[A-Za-z]{2,}\b/g

export function redactPii(text: string, options: RedactionOptions): RedactionResult {
  if (!text) {
    return { redactedText: text, tokenMap: {} }
  }

  const tokenMap: Record<string, string> = {}
  let currentText = text

  let phoneCounter = 1
  let emailCounter = 1
  let accountCounter = 1

  // 1. Redact Emails first (so @domain isn't mistaken for UPI)
  if (options.hideEmails) {
    currentText = currentText.replace(EMAIL_REGEX, (match) => {
      const token = `[EMAIL_${emailCounter++}]`
      tokenMap[token] = match
      return token
    })
  }

  // 2. Redact UPI / Account handles
  if (options.hideAccounts) {
    currentText = currentText.replace(UPI_REGEX, (match) => {
      const token = `[ACCOUNT_${accountCounter++}]`
      tokenMap[token] = match
      return token
    })
  }

  // 3. Redact Phones
  if (options.hidePhones) {
    currentText = currentText.replace(PHONE_REGEX, (match) => {
      const token = `[PHONE_${phoneCounter++}]`
      tokenMap[token] = match
      return token
    })
  }

  return { redactedText: currentText, tokenMap }
}

export function restorePii(text: string | null | undefined, tokenMap: Record<string, string>): string {
  if (!text) {
    return text ?? ''
  }

  let restored = text
  for (const [token, original] of Object.entries(tokenMap)) {
    // Replace all occurrences of this token
    restored = restored.split(token).join(original)
  }
  return restored
}

export function restoreDraftPii<T>(target: T, tokenMap: Record<string, string>): T {
  if (typeof target === 'string') {
    return restorePii(target, tokenMap) as unknown as T
  }
  if (Array.isArray(target)) {
    return target.map((item) => restoreDraftPii(item, tokenMap)) as unknown as T
  }
  if (target !== null && typeof target === 'object') {
    const copy: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(target)) {
      copy[k] = restoreDraftPii(v, tokenMap)
    }
    return copy as T
  }
  return target
}
