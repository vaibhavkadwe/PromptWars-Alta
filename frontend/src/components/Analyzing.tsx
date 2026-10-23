import React from 'react'

interface AnalyzingProps {
  onCancel: () => void
  onOpenUrgent: () => void
}

export const Analyzing: React.FC<AnalyzingProps> = ({ onCancel, onOpenUrgent }) => {
  return (
    <div className="card card-elevated" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <div className="spinner-container">
        <div className="spinner" role="status" aria-label="Loading analysis"></div>
        <h2>Organising what you told us</h2>
        <p style={{ color: 'var(--color-muted)', maxWidth: '420px', margin: '0.5rem auto 1.5rem auto' }}>
          This can take up to 30 seconds. SafeSignal is structuring facts, building a timeline, and
          matching verified response resources.
        </p>
        <div className="lock-banner" style={{ justifyContent: 'center', marginBottom: '1.5rem', textAlign: 'left' }}>
          <span className="material-symbols-outlined fill" aria-hidden="true">
            lock
          </span>
          Session remains in-browser. You can cancel anytime.
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            aria-label="Cancel analysis and return to form"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-urgent"
            onClick={onOpenUrgent}
            aria-label="Open emergency contacts while analyzing"
          >
            Need urgent help now?
          </button>
        </div>
      </div>
    </div>
  )
}
