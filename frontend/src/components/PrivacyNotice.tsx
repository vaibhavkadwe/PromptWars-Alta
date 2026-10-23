import React, { useEffect, useRef } from 'react'
import { getGeminiTermsNotice, PRIVACY_COPY } from '../content/privacyCopy'

interface PrivacyNoticeProps {
  isOpen: boolean
  onClose: () => void
  paidTier: boolean
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ isOpen, onClose, paidTier }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    modalRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-notice-title"
      onClick={onClose}
    >
      <div
        className="modal-sheet"
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        <div className="modal-header">
          <h2 id="privacy-notice-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            Privacy Architecture & Limits
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={onClose}
            aria-label="Close privacy notice"
          >
            ✕ Close
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.92rem', padding: '1rem 0' }}>
          {/* Tier-dependent Gemini terms */}
          <div className="banner banner-info" style={{ margin: 0, padding: '0.75rem 1rem' }}>
            <strong>Google Gemini Terms ({paidTier ? 'Paid Tier' : 'Free Tier'}):</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem' }}>
              {getGeminiTermsNotice(paidTier)}
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>
              Source: <a href={PRIVACY_COPY.source} target="_blank" rel="noopener noreferrer">{PRIVACY_COPY.source}</a> &bull; Last checked {PRIVACY_COPY.lastChecked}
            </div>
          </div>

          <div>
            <strong style={{ display: 'block', marginBottom: '0.2rem' }}>1. No Media or Image Uploads</strong>
            <p style={{ margin: 0, color: 'var(--color-muted)' }}>
              SafeSignal strictly never requests, accepts, uploads, or stores sexual or intimate media. Local OCR runs entirely in your browser using WebAssembly; image files never leave your device and are immediately dropped from memory.
            </p>
          </div>

          <div>
            <strong style={{ display: 'block', marginBottom: '0.2rem' }}>2. Pure In-Memory Browser Execution</strong>
            <p style={{ margin: 0, color: 'var(--color-muted)' }}>
              Incident text, triage choices, and drafts exist only in volatile browser memory while this tab is open. We do not use localStorage, sessionStorage, cookies, or IndexedDB for incident records.
            </p>
          </div>

          <div>
            <strong style={{ display: 'block', marginBottom: '0.2rem' }}>3. Metadata-Only Server Logs</strong>
            <p style={{ margin: 0, color: 'var(--color-muted)' }}>
              Our backend server logs only request identifiers, coarse character length buckets, latency, and status codes. User descriptions, evidence, prompts, and model outputs are never written to server logs under any circumstances.
            </p>
          </div>

          <div>
            <strong style={{ display: 'block', marginBottom: '0.2rem' }}>4. Not Law Enforcement or Legal Counsel</strong>
            <p style={{ margin: 0, color: 'var(--color-muted)' }}>
              SafeSignal is a first-response triage tool to help organize an editable draft. It cannot investigate suspects, verify authenticity, or file official complaints on your behalf.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
