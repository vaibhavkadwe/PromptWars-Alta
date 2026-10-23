import React, { useMemo } from 'react'
import { redactPii, RedactionOptions } from '../lib/redact'

interface ReviewOutgoingScreenProps {
  description: string
  evidenceText: string
  redactionOptions: RedactionOptions
  isSubmitting: boolean
  onToggleRedaction: (updates: Partial<RedactionOptions>) => void
  onSend: (redactedDesc: string, redactedEv: string, tokenMap: Record<string, string>) => void
}

export const ReviewOutgoingScreen: React.FC<ReviewOutgoingScreenProps> = ({
  description,
  evidenceText,
  redactionOptions,
  isSubmitting,
  onToggleRedaction,
  onSend,
}) => {
  // Apply redaction dynamically based on toggles
  const { redactedDesc, redactedEv, combinedMap } = useMemo(() => {
    const rDesc = redactPii(description, redactionOptions)
    const rEv = redactPii(evidenceText, redactionOptions)

    return {
      redactedDesc: rDesc.redactedText,
      redactedEv: rEv.redactedText,
      combinedMap: { ...rDesc.tokenMap, ...rEv.tokenMap },
    }
  }, [description, evidenceText, redactionOptions])

  const tokenCount = Object.keys(combinedMap).length

  return (
    <div className="card">
      <h1 id="review-heading" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
        Review Outgoing Text
      </h1>
      <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
        This is the EXACT text that will be transmitted to the Gemini AI service. Nothing is sent until you explicitly tap the button below.
      </p>

      {/* Redaction Toggles */}
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          backgroundColor: 'var(--color-bg)',
          marginBottom: '1.5rem',
        }}
      >
        <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
          Automatic Privacy Redaction
        </strong>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
          Numbers and handles are replaced with placeholders like [PHONE_1] before leaving your browser, and restored locally when your draft is created.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={redactionOptions.hidePhones}
              onChange={(e) => onToggleRedaction({ hidePhones: e.target.checked })}
            />
            <span>Hide phone numbers ([PHONE_1], etc.)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={redactionOptions.hideEmails}
              onChange={(e) => onToggleRedaction({ hideEmails: e.target.checked })}
            />
            <span>Hide email addresses ([EMAIL_1], etc.)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={redactionOptions.hideAccounts}
              onChange={(e) => onToggleRedaction({ hideAccounts: e.target.checked })}
            />
            <span>Hide UPI and account handles ([ACCOUNT_1], etc.)</span>
          </label>
        </div>

        {tokenCount > 0 && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-primary)' }}>
            ✓ {tokenCount} details will be protected with local placeholders.
          </div>
        )}

        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-caution-text)', fontWeight: 500 }}>
          ⚠️ Notice: AI models cannot automatically detect all personal names. If you wish to hide your name or friends' names, please return to edit them.
        </div>
      </div>

      {/* Outgoing Text Display */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
          Description text to send:
        </label>
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            whiteSpace: 'pre-wrap',
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        >
          {redactedDesc}
        </div>
      </div>

      {redactedEv && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
            Evidence / message text to send:
          </label>
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              whiteSpace: 'pre-wrap',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          >
            {redactedEv}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        className="btn btn-primary"
        disabled={isSubmitting}
        onClick={() => onSend(redactedDesc, redactedEv, combinedMap)}
        style={{ width: '100%' }}
      >
        {isSubmitting ? 'Sending to AI service...' : 'Send to AI service'}
      </button>
    </div>
  )
}
