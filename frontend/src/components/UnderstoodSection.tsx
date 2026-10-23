import React, { useState } from 'react'
import { CategoryItem, MissingInfoItem, ReviewedDetail } from '../types/report'

interface UnderstoodSectionProps {
  summary: string
  categories: CategoryItem[]
  details: ReviewedDetail[]
  missingInfo: MissingInfoItem[]
  onUpdateDetail: (
    id: string,
    updates: { include?: boolean; confirmed?: boolean; valueOverride?: string },
  ) => void
}

export const UnderstoodSection: React.FC<UnderstoodSectionProps> = ({
  summary,
  categories,
  details,
  missingInfo,
  onUpdateDetail,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = (detail: ReviewedDetail) => {
    setEditingId(detail.id)
    setEditValue(detail.valueOverride ?? detail.original.value)
  }

  const saveEdit = (id: string) => {
    onUpdateDetail(id, { valueOverride: editValue, confirmed: true })
    setEditingId(null)
  }

  const activeDetails = details.filter((d) => d.include)

  return (
    <div className="card">
      <h2>Section A: What We Understood</h2>
      <p style={{ color: 'var(--color-muted)', fontSize: '0.92rem' }}>
        Here is how SafeSignal organized your statements. You can confirm details, edit any mistake,
        or remove irrelevant items.
      </p>

      {/* Summary */}
      <div style={{ backgroundColor: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', margin: '1rem 0' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem', color: 'var(--color-primary)' }}>
          Incident Summary
        </h3>
        <p style={{ margin: 0, fontSize: '0.95rem' }}>{summary}</p>
      </div>

      {/* Category Chips */}
      {categories.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'block', marginBottom: '0.4rem' }}>
            Threat Categories Identified:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {categories.map((cat, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.88rem',
                }}
              >
                <strong>{cat.id.replace(/_/g, ' ')}</strong> &bull;{' '}
                <span style={{ color: 'var(--color-muted)' }}>{cat.likelihood}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Details */}
      <div style={{ marginTop: '1.25rem' }}>
        <h3>Recorded Details (Review &amp; Confirm)</h3>
        {activeDetails.length === 0 ? (
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>All details were marked irrelevant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
            {activeDetails.map((item) => {
              const isEditing = editingId === item.id
              const displayVal = item.valueOverride ?? item.original.value
              const badgeType = item.confirmed
                ? 'confirmed'
                : item.original.basis === 'stated'
                ? 'stated'
                : 'inferred'
              const badgeLabel = item.confirmed
                ? 'You confirmed'
                : item.original.basis === 'stated'
                ? 'From your text'
                : 'AI inferred'

              return (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.original.label}</span>
                    <span className={`badge badge-${badgeType}`}>{badgeLabel}</span>
                  </div>

                  {isEditing ? (
                    <div style={{ marginTop: '0.4rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{ marginBottom: '0.4rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => saveEdit(item.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '0.95rem', margin: '0.2rem 0 0.4rem 0' }}>{displayVal}</div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {!item.confirmed && (
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => onUpdateDetail(item.id, { confirmed: true })}
                          >
                            Looks right
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => onUpdateDetail(item.id, { include: false })}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Missing Information / Follow-up Questions */}
      {missingInfo.length > 0 && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--color-caution-text)' }}>
            Missing Information / Follow-Up Considerations
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-muted)', margin: '0.2rem 0 0.5rem 0' }}>
            These details were not found in your description but could affect your reporting options:
          </p>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {missingInfo.map((mi, i) => (
              <li key={i} style={{ fontSize: '0.92rem' }}>
                <strong>{mi.question}</strong>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>{mi.why_it_matters}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
