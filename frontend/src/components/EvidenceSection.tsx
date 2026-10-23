import React from 'react'
import { ReviewedEvidence } from '../types/report'

interface EvidenceSectionProps {
  evidence: ReviewedEvidence[]
  onUpdateEvidence: (id: string, updates: { include?: boolean; confirmed?: boolean }) => void
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({ evidence, onUpdateEvidence }) => {
  const activeEvidence = evidence.filter((e) => e.include)

  return (
    <div className="card">
      <h2>Section C: Preserve Your Evidence</h2>
      <p style={{ color: 'var(--color-muted)', fontSize: '0.92rem' }}>
        Preserving exact evidence before blocking or reporting is critical. In many messaging apps,
        blocking deletes or hides access to the chat.
      </p>

      {/* Static Reminders */}
      <div
        className="banner banner-sample"
        style={{ margin: '1rem 0', fontSize: '0.9rem', lineHeight: '1.5' }}
      >
        <strong>Preservation Golden Rules:</strong>
        <ul style={{ paddingLeft: '1.25rem', marginTop: '0.4rem' }}>
          <li>Do not crop, edit, or filter original screenshots.</li>
          <li>Never forward or share intimate images to group chats or cloud albums.</li>
          <li>Store captured evidence in a secure, password-protected folder only you can access.</li>
        </ul>
      </div>

      {activeEvidence.length === 0 ? (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>All evidence items were marked irrelevant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          {activeEvidence.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                backgroundColor: item.confirmed ? 'var(--color-highlight)' : 'var(--color-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <input
                  type="checkbox"
                  id={`ev-check-${item.id}`}
                  checked={item.confirmed}
                  onChange={(e) => onUpdateEvidence(item.id, { confirmed: e.target.checked })}
                  style={{ width: '20px', height: '20px', marginTop: '0.2rem', accentColor: 'var(--color-primary)' }}
                />
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor={`ev-check-${item.id}`}
                    style={{ fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', display: 'block' }}
                  >
                    {item.original.item}
                  </label>

                  <div style={{ fontSize: '0.9rem', color: 'var(--color-muted)', margin: '0.3rem 0' }}>
                    <strong>How to preserve:</strong> {item.original.how_to_preserve}
                  </div>

                  {item.original.suggested_filename && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                      Suggested file: {item.original.suggested_filename}
                    </div>
                  )}

                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.8rem', minHeight: '30px', padding: '0.2rem 0.5rem' }}
                      onClick={() => onUpdateEvidence(item.id, { include: false })}
                    >
                      Not relevant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
