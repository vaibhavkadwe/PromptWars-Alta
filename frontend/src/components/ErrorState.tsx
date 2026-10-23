import React, { useState } from 'react'
import { GENERAL_SAFETY_CHECKLIST } from '../lib/generalChecklist'

interface ErrorStateProps {
  error: { code: string; message: string; retryAfter?: number } | null
  onRetry: () => void
  onViewSample: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, onViewSample }) => {
  const [showChecklist, setShowChecklist] = useState(false)

  const getHumanExplanation = () => {
    if (!error) return 'An unexpected error occurred.'
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      return `Too many requests were sent in a short period. Please wait ${
        error.retryAfter || 30
      } seconds before trying again.`
    }
    if (error.code === 'DAILY_CAP_EXCEEDED') {
      return 'The prototype daily analysis limit has been reached. You can view the fictional sample or use the general checklist below.'
    }
    if (error.code === 'AI_NOT_CONFIGURED') {
      return 'The AI engine API key is not configured on this server. You can view the sample report or use the general safety checklist.'
    }
    if (error.code === 'AI_UNAVAILABLE') {
      return 'The AI engine is temporarily busy or unreachable. You can retry in a moment or view the safety checklist.'
    }
    if (error.code === 'AI_BAD_OUTPUT') {
      return 'The AI engine output failed schema or safety validation. Please retry or adjust your text description.'
    }
    if (error.code === 'PAYLOAD_TOO_LARGE') {
      return 'Your input exceeded the 64 KB limit. Please reduce the length of your description or evidence text.'
    }
    return error.message || 'We could not complete the automated analysis.'
  }

  return (
    <div className="card">
      <div
        className="banner banner-demo"
        style={{
          backgroundColor: 'var(--color-urgent-bg)',
          borderColor: 'var(--color-urgent-border)',
          color: 'var(--color-urgent-text)',
        }}
        role="alert"
      >
        <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.4rem 0' }}>Analysis Could Not Be Completed</h2>
        <p style={{ margin: 0, fontSize: '0.95rem' }}>{getHumanExplanation()}</p>
      </div>

      <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
        You can retry, inspect a sample report to see how SafeSignal works, or use our verified offline
        safety checklist immediately.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Retry Analysis
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowChecklist(!showChecklist)}
        >
          {showChecklist ? 'Hide general checklist' : 'Use general safety checklist'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onViewSample}>
          View fictional sample
        </button>
      </div>

      {showChecklist && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '1.25rem',
            marginTop: '1rem',
          }}
        >
          <div
            className="banner banner-sample"
            style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}
          >
            General guidance &mdash; not personalised, not AI-generated
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {GENERAL_SAFETY_CHECKLIST.map((section, idx) => (
              <div key={idx} className="card" style={{ padding: '1rem', margin: 0 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  {section.title}
                </h3>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {section.items.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.95rem' }}>
                      <strong>{item.text}</strong>
                      {item.details && (
                        <div style={{ color: 'var(--color-muted)', fontSize: '0.88rem', marginTop: '0.15rem' }}>
                          {item.details}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
