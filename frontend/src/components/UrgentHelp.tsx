import React, { useEffect, useRef } from 'react'
import { Resource } from '../types/report'

interface UrgentHelpProps {
  isOpen: boolean
  onClose: () => void
  resources?: Resource[]
}

const STATIC_FALLBACK_RESOURCES = [
  { id: 'ERSS_112', title: 'Emergency Response (police, fire, ambulance)', value: '112', kind: 'phone' },
  { id: 'CHILDLINE_1098', title: 'Childline (child helpline)', value: '1098', kind: 'phone' },
  { id: 'HELPLINE_1930', title: 'National Cyber Crime Helpline', value: '1930', kind: 'phone' },
  { id: 'NCRP', title: 'National Cyber Crime Reporting Portal', value: 'https://cybercrime.gov.in/', kind: 'link' },
]

export const UrgentHelp: React.FC<UrgentHelpProps> = ({ isOpen, onClose, resources }) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const displayResources = resources && resources.length > 0 ? resources : STATIC_FALLBACK_RESOURCES

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
      >
        <div className="modal-header">
          <h2 id="urgent-help-title" style={{ color: 'var(--color-urgent-text)', margin: 0 }}>
            Emergency & Urgent Help
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={onClose}
            aria-label="Close urgent help sheet"
          >
            Close (Esc)
          </button>
        </div>

        <div className="urgent-panel" style={{ marginTop: '0.5rem' }}>
          <div className="urgent-panel-header">
            <span>Are you in immediate physical danger?</span>
          </div>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>
            If someone is threatening to come to your home, school, or physically hurt you, call
            emergency services immediately.
          </p>
          <a href="tel:112" className="urgent-dial-btn" aria-label="Call 112 emergency services">
            Call 112 (Emergency Police / Medical)
          </a>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <h3>Immediate Safe Rules</h3>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            <li>
              <strong>Do not pay:</strong> Sending money does not guarantee deletion and usually leads
              to escalating demands.
            </li>
            <li>
              <strong>Do not send more images:</strong> Complying with demands gives perpetrators more leverage.
            </li>
            <li>
              <strong>Do not delete chats yet:</strong> Preserve the message logs and profile identifiers
              first before blocking.
            </li>
            <li>
              <strong>Talk to a trusted person:</strong> You do not have to handle this in isolation.
              If safe, tell a trusted adult or family member.
            </li>
          </ul>
        </div>

        <div>
          <h3>Verified Helplines &amp; Portals (India)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {displayResources.map((res) => (
              <div key={res.id} className="card" style={{ padding: '0.85rem', margin: 0 }}>
                <strong>{res.title}</strong>
                <div style={{ margin: '0.4rem 0 0 0' }}>
                  {res.kind === 'phone' ? (
                    <a href={`tel:${res.value}`} className="btn btn-sm btn-primary">
                      Call {res.value}
                    </a>
                  ) : (
                    <a
                      href={res.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-secondary"
                    >
                      Visit {res.title} &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
