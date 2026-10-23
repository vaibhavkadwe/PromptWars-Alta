import React from 'react'
import { ReviewedTimeline } from '../types/report'

interface TimelineSectionProps {
  timeline: ReviewedTimeline[]
  onUpdateTimeline: (id: string, include: boolean) => void
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ timeline, onUpdateTimeline }) => {
  const activeEvents = timeline.filter((t) => t.include)

  return (
    <div className="card">
      <h2>Section B: Incident Timeline</h2>
      <p style={{ color: 'var(--color-muted)', fontSize: '0.92rem' }}>
        Chronological sequence of reported events. Establishing when events happened is critical for
        platform investigations and official reports.
      </p>

      {activeEvents.length === 0 ? (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>All timeline events were marked irrelevant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          {activeEvents.map((t, idx) => {
            const when = t.original.when_text ? t.original.when_text : 'Time unknown'
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                    marginTop: '0.1rem',
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-primary)' }}>
                      {when}
                    </span>
                    <span className="badge badge-inferred" style={{ fontSize: '0.75rem' }}>
                      {t.original.certainty}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.95rem', margin: '0.25rem 0 0.4rem 0' }}>{t.original.event}</div>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.8rem', minHeight: '30px', padding: '0.2rem 0.5rem' }}
                    onClick={() => onUpdateTimeline(t.id, false)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
