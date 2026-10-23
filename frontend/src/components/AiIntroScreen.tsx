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
    <div>
      <div className="banner banner-calm" style={{ marginBottom: '1.25rem' }}>
        <span className="material-symbols-outlined" aria-hidden="true">
          psychology
        </span>
        <p style={{ margin: 0, fontWeight: 500 }}>
          AI drafting is optional. You can prepare a complete offline draft without sending anything.
        </p>
      </div>

      <div className="card card-elevated">
        <h1 id="ai-intro-heading" style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
          Optional AI Complaint Drafting
        </h1>

        <p className="lead-text" style={{ fontSize: '1.05rem', marginBottom: '1.5rem', color: 'var(--color-text)' }}>
          You can choose to use Google Gemini to help organize what happened into a structured draft
          for an official police or cybercrime complaint.
        </p>

        <div
          className={`banner ${paidTier ? 'banner-info' : 'banner-demo'}`}
          role="alert"
          style={{ marginBottom: '1.5rem' }}
        >
          <strong>Terms of Service ({paidTier ? 'Paid Tier' : 'Free Prototype'}):</strong>{' '}
          {getGeminiTermsNotice(paidTier)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
          {(
            [
              { title: 'What will be sent', body: PRIVACY_COPY.whatWillBeSent },
              { title: 'Why', body: PRIVACY_COPY.whySend },
              { title: 'Confidentiality notice', body: PRIVACY_COPY.limitsAndConfidentiality },
              {
                title: 'You stay in control',
                body: 'You will review the exact redacted text before anything is sent. You can also skip AI processing entirely and draft your complaint locally on your own device.',
              },
            ] as const
          ).map((row) => (
            <div
              key={row.title}
              style={{
                borderLeft: '3px solid var(--color-primary)',
                paddingLeft: '1rem',
              }}
            >
              <strong>{row.title}:</strong>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', color: 'var(--color-muted)' }}>
                {row.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onChooseAi(true)}
            style={{ width: '100%' }}
          >
            I understand — Use AI drafting
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
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
    </div>
  )
}
