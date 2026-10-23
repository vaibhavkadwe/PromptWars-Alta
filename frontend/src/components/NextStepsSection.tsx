import React from 'react'
import { Resource, ReviewedAction } from '../types/report'
import { ResourceCard } from './ResourceCard'

interface NextStepsSectionProps {
  actions: ReviewedAction[]
  resources: Resource[]
  onUpdateAction: (id: string, include: boolean) => void
}

export const NextStepsSection: React.FC<NextStepsSectionProps> = ({
  actions,
  resources,
  onUpdateAction,
}) => {
  const activeActions = actions.filter((a) => a.include)

  // Map resources by ID for lookup
  const resourceMap = new Map<string, Resource>()
  for (const res of resources) {
    resourceMap.set(res.id, res)
  }

  return (
    <div className="card">
      <h2>Section D: Your Next Steps</h2>
      <p style={{ color: 'var(--color-muted)', fontSize: '0.92rem' }}>
        Prioritized action steps tailored to your circumstances. Most critical actions are listed first.
      </p>

      {activeActions.length === 0 ? (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>All next steps were marked irrelevant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
          {activeActions.map((item) => {
            const urgencyBadge = item.original.urgency === 'now' ? 'urgent' : 'stated'
            const linkedResources = item.original.resource_ids
              .map((rid) => resourceMap.get(rid))
              .filter((r): r is Resource => r !== undefined)

            return (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.15rem',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: '#FFFFFF',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      {item.original.priority}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{item.original.title}</h3>
                  </div>
                  <span className={`badge badge-${urgencyBadge}`}>{item.original.urgency.toUpperCase()}</span>
                </div>

                <div style={{ fontSize: '0.95rem', color: 'var(--color-muted)', margin: '0.4rem 0' }}>
                  <strong>Why:</strong> {item.original.why}
                </div>

                {linkedResources.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.2rem' }}>
                      Recommended Official Support:
                    </div>
                    {linkedResources.map((res) => (
                      <ResourceCard key={res.id} resource={res} />
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.8rem', minHeight: '30px', padding: '0.2rem 0.5rem' }}
                    onClick={() => onUpdateAction(item.id, false)}
                  >
                    Not relevant
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
