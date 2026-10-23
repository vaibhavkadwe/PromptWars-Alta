import React, { useEffect, useRef } from 'react'

interface UrgentHelpProps {
  isOpen: boolean
  onClose: () => void
}

export const UrgentHelp: React.FC<UrgentHelpProps> = ({ isOpen, onClose }) => {
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
      aria-labelledby="urgent-help-title"
      onClick={onClose}
    >
      <div
        className="modal-sheet"
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        <div className="modal-header">
          <h2 id="urgent-help-title" style={{ color: 'var(--color-urgent-text)', margin: 0, fontSize: '1.25rem' }}>
            Immediate & Urgent Help
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={onClose}
            aria-label="Close Urgent Help"
          >
            ✕ Close
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1rem 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 112 for immediate danger */}
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-urgent-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-urgent-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: 'var(--color-urgent-text)', display: 'block' }}>112 — Immediate Physical Danger</strong>
                  <span style={{ fontSize: '0.85rem' }}>Call right now if anyone has threatened physical harm or you feel unsafe in your location.</span>
                </div>
                <a href="tel:112" className="btn btn-sm btn-urgent" style={{ marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>
                  Call 112
                </a>
              </div>
            </div>

            {/* Childline 1098 */}
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-highlight)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: 'var(--color-primary-hover)', display: 'block' }}>1098 — Childline (Under 18)</strong>
                  <span style={{ fontSize: '0.85rem' }}>Free 24-hour helpline for children and teens in need of care, advice, and protection.</span>
                </div>
                <a href="tel:1098" className="btn btn-sm btn-primary" style={{ marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>
                  Call 1098
                </a>
              </div>
            </div>

            {/* Key safety principles */}
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>
                <strong>Do not pay or send more:</strong> Paying demands does not guarantee threats will stop and usually leads to more demands.
              </li>
              <li>
                <strong>Tell a trusted person if safe:</strong> Reach out to a relative, counsellor, or teacher you feel comfortable confiding in.
              </li>
              <li>
                <strong>Preserve records:</strong> Keep message screenshots showing handles and times before blocking or reporting.
              </li>
            </ul>

            {/* National Cyber Crime Reporting Portal link */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                National Cyber Crime Reporting Portal
              </strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', margin: '0 0 0.5rem 0' }}>
                Government of India portal to report cybercrime and image abuse online.
              </p>
              <a
                href="https://cybercrime.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-secondary"
              >
                Open cybercrime.gov.in &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
