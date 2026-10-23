import React, { useEffect, useRef } from 'react'

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
      >
        <div className="modal-header">
          <h2 id="privacy-notice-title" style={{ margin: 0 }}>
            Privacy, Limits & Security
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={onClose}
            aria-label="Close privacy notice"
          >
            Close (Esc)
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
          <div>
            <h3>1. Complete Ephemerality</h3>
            <p>
              SafeSignal operates with zero persistence. There are no user accounts, no databases,
              and no browser cookies or local storage for incident reports. When you close the tab or
              click &ldquo;Start a new report&rdquo;, all data held in memory is erased.
            </p>
          </div>

          <div>
            <h3>2. Text-Only Analysis (No Media Accepted)</h3>
            <p>
              We never request, accept, or process photos, videos, or screenshots. Only typed or pasted
              text descriptions are analyzed. Never share nude or intimate media with SafeSignal.
            </p>
          </div>

          <div>
            <h3>3. AI Processing & Google Data Terms</h3>
            <p>
              When you submit a description, it is transmitted securely over HTTPS directly to the server,
              which contacts Google Gemini API to structure your report.
            </p>
            {paidTier ? (
              <p>
                <strong>Tier Status: Paid Commercial Tier.</strong> Under Google&apos;s commercial terms,
                customer data is not used to train Google models.
              </p>
            ) : (
              <div className="banner banner-demo" style={{ margin: '0.5rem 0' }}>
                <strong>Tier Status: Free Prototype Key.</strong> Under Google&apos;s standard free-tier
                terms, submitted text may be logged and reviewed by human reviewers to improve products.
                <strong>
                  {' '}
                  Please do not enter real names, phone numbers, or private details into this prototype.
                </strong>
              </div>
            )}
          </div>

          <div>
            <h3>4. Zero Incident Logging</h3>
            <p>
              Our backend server logs only coarse operational metadata: request ID, response status,
              latency in milliseconds, and input length buckets (e.g. &ldquo;&lt;500 chars&rdquo;).
              Incident descriptions, evidence excerpts, prompts, and AI outputs are strictly forbidden
              from being logged.
            </p>
          </div>

          <div>
            <h3>5. Not Legal or Police Advice</h3>
            <p>
              SafeSignal is an educational first-response tool to organize your information. It cannot
              authenticate files, trace perpetrators, or guarantee prosecution or content removal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
