import React from 'react'

interface ErrorStateProps {
  error: { code: string; message: string; retryAfter?: number } | null
  onRetry: () => void
  onViewSample: () => void
  onDraftOffline?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  onViewSample,
  onDraftOffline,
}) => {
  const getHumanExplanation = () => {
    if (!error) return 'An unexpected error occurred.'
    if (error.code === 'MINOR_SIGNAL') {
      return 'SafeSignal detected words indicating this situation may involve a minor. AI processing is disabled for minor safety. Please use our safe offline complaint draft.'
    }
    if (error.code === 'ADULT_NOT_CONFIRMED') {
      return 'You must confirm you are 18 or older to use the optional AI drafting tool.'
    }
    if (error.code === 'CONSENT_REQUIRED') {
      return 'Explicit consent for AI processing is required before text can be sent.'
    }
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      return `Too many requests were sent in a short period. Please wait ${
        error.retryAfter || 30
      } seconds before trying again.`
    }
    if (error.code === 'AI_NOT_CONFIGURED') {
      return 'The AI engine API key is not configured on this server. You can view the sample draft or draft your complaint offline.'
    }
    if (error.code === 'AI_UNAVAILABLE') {
      return 'The AI service is temporarily unavailable or timed out. You can retry or prepare your draft offline.'
    }
    if (error.code === 'AI_BAD_OUTPUT') {
      return 'The AI response could not be safely validated against our strict safety rules. You can retry or write the draft offline.'
    }
    if (error.code === 'PAYLOAD_TOO_LARGE') {
      return 'Your input exceeded the 64 KB limit. Please reduce the length of your text.'
    }
    return error.message || 'We could not complete the automated analysis.'
  }

  const isMinorSignal = error?.code === 'MINOR_SIGNAL'

  return (
    <div className="card">
      <div
        className="banner banner-urgent"
        role="alert"
        style={{ marginBottom: '1.5rem' }}
      >
        <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.4rem 0' }}>
          {isMinorSignal ? 'Minor Safety Protection' : 'Analysis Could Not Be Completed'}
        </h2>
        <p style={{ margin: 0, fontSize: '0.95rem' }}>{getHumanExplanation()}</p>
        {error?.code && (
          <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', opacity: 0.8 }}>
            Error code: <code>{error.code}</code>
          </div>
        )}
      </div>

      <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
        You do not need AI to prepare an official report. You can write your complaint draft offline on your own device, explore our fictional sample, or retry.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {!isMinorSignal && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            Retry Analysis
          </button>
        )}

        {onDraftOffline && (
          <button type="button" className="btn btn-primary" onClick={onDraftOffline}>
            Draft offline without AI
          </button>
        )}

        <button type="button" className="btn btn-secondary" onClick={onViewSample}>
          View fictional sample draft
        </button>
      </div>
    </div>
  )
}
