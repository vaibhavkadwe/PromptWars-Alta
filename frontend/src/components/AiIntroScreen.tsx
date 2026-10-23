import React from 'react'
import { getGeminiTermsNotice, PRIVACY_COPY } from '../content/privacyCopy'

interface AiIntroScreenProps {
  paidTier: boolean
  onChooseAi: (useAi: boolean) => void
}

export const AiIntroScreen: React.FC<AiIntroScreenProps> = ({
  paidTier,
  onChooseAi,
}) => {
  return (
    <div className="card">
      <h1 id="ai-intro-heading" style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>
        Optional AI Complaint Drafting
      </h1>

      <p className="lead-text" style={{ fontSize: '1.05rem', marginBottom: '1.5rem', color: 'var(--color-text)' }}>
        You can choose to use Google Gemini to help organize what happened into a structured draft for an official police or cybercrime complaint.
      </p>

      {/* Tier-Specific Terms Notice */}
      <div
        className={`banner ${paidTier ? 'banner-info' : 'banner-demo'}`}
        role="alert"
        style={{ marginBottom: '1.5rem' }}
      >
        <strong>Terms of Service ({paidTier ? 'Paid Tier' : 'Free Prototype'}):</strong>{' '}
        {getGeminiTermsNotice(paidTier)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '1rem' }}>
          <strong>What will be sent:</strong>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', color: 'var(--color-muted)' }}>
            {PRIVACY_COPY.whatWillBeSent}
          </p>
        </div>

        <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '1rem' }}>
          <strong>Why:</strong>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', color: 'var(--color-muted)' }}>
            {PRIVACY_COPY.whySend}
          </p>
        </div>

        <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '1rem' }}>
          <strong>Confidentiality notice:</strong>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', color: 'var(--color-muted)' }}>
            {PRIVACY_COPY.limitsAndConfidentiality}
          </p>
        </div>

        <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '1rem' }}>
          <strong>You stay in control:</strong>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', color: 'var(--color-muted)' }}>
            You will review the exact redacted text before anything is sent. You can also skip AI processing entirely and draft your complaint locally on your own device.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onChooseAi(true)}
          style={{ width: '100%' }}
        >
          I understand — Use AI drafting
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onChooseAi(false)}
          style={{ width: '100%' }}
        >
          No thanks — Write the draft myself
        </button>
      </div>
    </div>
  )
}
