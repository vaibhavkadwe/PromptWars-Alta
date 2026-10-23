import React, { useState } from 'react'
import resourcesData from '../../../shared/resources.json'
import { ActionCard } from '../triage/rules'
import { Resource } from '../types/report'
import { ResourceCard } from './ResourceCard'

interface ActionCardScreenProps {
  card: ActionCard
  onProceed: (useAi: boolean) => void
}

export const ActionCardScreen: React.FC<ActionCardScreenProps> = ({
  card,
  onProceed,
}) => {
  const [showMore, setShowMore] = useState(false)
  const [dangerAcknowledged, setDangerAcknowledged] = useState(!card.hasUrgentDanger)

  // Resolve resources from shared catalog
  const catalog = resourcesData as Resource[]
  const relevantResources = catalog.filter((r) => card.resourceIds.includes(r.id))

  const visibleItems = card.items.slice(0, 3)
  const remainingItems = card.items.slice(3)

  return (
    <div>
      {/* R1 Urgent Danger Banner if present */}
      {card.hasUrgentDanger && (
        <div
          className="banner banner-urgent"
          role="alert"
          style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--color-urgent-text)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                Immediate Safety Priority
              </strong>
              <p style={{ margin: 0 }}>
                If you are in immediate physical danger, call 112 right now from a safe location.
              </p>
            </div>
            {!dangerAcknowledged && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDangerAcknowledged(true)}
                style={{ marginLeft: '1rem', whiteSpace: 'nowrap' }}
              >
                Continue anyway
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Action Steps Card */}
      <div className="card">
        <h1 id="action-heading" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
          Your Immediate Safety Steps
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          {card.disclaimer}
        </p>

        {card.isMinorRoute && (
          <div className="banner banner-info" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
            <strong>Guidance for Young People:</strong> Safe adult and trusted outreach pathways are highlighted below. AI analysis and screenshot tools are disabled for your safety.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visibleItems.map((item, index) => (
            <div
              key={item.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-highlight)',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {index + 1}
                </span>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{item.title}</h2>
              </div>
              <p style={{ margin: 0, color: 'var(--color-text)', fontSize: '0.95rem', paddingLeft: '2rem' }}>
                {item.why}
              </p>
            </div>
          ))}

          {/* Progressive disclosure for steps 4 and 5 */}
          {remainingItems.length > 0 && (
            <div>
              {!showMore ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowMore(true)}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  View more steps ({remainingItems.length}) ↓
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  {remainingItems.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        backgroundColor: 'var(--color-surface)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-highlight)',
                            color: 'var(--color-primary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {index + 4}
                        </span>
                        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{item.title}</h2>
                      </div>
                      <p style={{ margin: 0, color: 'var(--color-text)', fontSize: '0.95rem', paddingLeft: '2rem' }}>
                        {item.why}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button to Proceed */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          {card.isAiDisabled ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onProceed(false)}
              style={{ width: '100%' }}
            >
              Continue to Complaint Draft (Offline only) &rarr;
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onProceed(true)}
              style={{ width: '100%' }}
            >
              Next: Optional AI Complaint Drafting &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Relevant Emergency & Official Resources */}
      {relevantResources.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Relevant Reporting Resources</h2>
          {relevantResources.map((res) => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      )}
    </div>
  )
}
