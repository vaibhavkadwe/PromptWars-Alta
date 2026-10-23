/**
 * Centralized privacy disclosures and Gemini terms explanation for SafeSignal.
 *
 * NOTE: This copy must be re-checked against current Google terms and approved
 * by the project owner / legal counsel before unrestricted public deployment.
 */

export interface PrivacyCopyConfig {
  lastChecked: string
  source: string
  paidTierVariant: string
  freeTierVariant: string
  whatWillBeSent: string
  whySend: string
  limitsAndConfidentiality: string
  offlineAlternative: string
}

export const PRIVACY_COPY: PrivacyCopyConfig = {
  lastChecked: '2026-10-23',
  source: 'https://ai.google.dev/gemini-api/terms',
  paidTierVariant:
    "Google's paid-service terms say it doesn't use this content to improve its products, and describe how it processes the data under its terms. We still can't promise absolute confidentiality.",
  freeTierVariant:
    "This prototype uses Google's free tier. Under Google's terms for free use, submitted content may be used to improve Google products and may be reviewed by people. Please enter only fictional details.",
  whatWillBeSent:
    'Only the incident description and message text you choose to share will be sent to the AI service. No images, videos, audio, or account credentials are ever uploaded or sent.',
  whySend:
    'To organise your typed words into an editable, structured complaint-preparation draft and an evidence preservation checklist.',
  limitsAndConfidentiality:
    'SafeSignal does not store your draft, and runs in-memory only. However, because data travels over the network to external servers, SafeSignal cannot promise absolute confidentiality.',
  offlineAlternative:
    'You do not need to use the AI service. You can skip AI drafting entirely and write the draft yourself on your own device, with no network requests.',
}

export function getGeminiTermsNotice(paidTier: boolean): string {
  return paidTier ? PRIVACY_COPY.paidTierVariant : PRIVACY_COPY.freeTierVariant
}
