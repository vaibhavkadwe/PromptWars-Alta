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

  const catalog = resourcesData as Resource[]
  const relevantResources = catalog.filter((r) => card.resourceIds.includes(r.id))

  const visibleItems = card.items.slice(0, 3)
  const remainingItems = card.items.slice(3)

  const renderItem = (
    item: ActionCard['items'][number],
    index: number,
    urgent: boolean,
  ) => (
    <article key={item.id} className={`priority-card ${urgent ? 'urgent' : ''}`}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: '0.65rem',
          flexWrap: 'wrap',
        }}
      >
        <span className={`priority-badge ${urgent ? 'urgent' : 'normal'}`}>
          <span
            className="status-dot"
            style={{
              width: 6,
              height: 6,
              animation: urgent ? undefined : 'none',
              background: urgent ? 'var(--color-tertiary)' : 'var(--color-primary)',
            }}
            aria-hidden="true"
          />
          PRIORITY {index + 1}
          {urgent ? ' · URGENT' : ''}
        </span>
        <span className="label-sm" style={{ color: 'var(--color-outline)' }}>
          {urgent ? 'DO THIS FIRST' : 'GUIDED STEP'}
        </span>
      </div>
      <h2
        style={{
          fontSize: '1.15rem',
          marginBottom: '0.5rem',
          color: urgent ? 'var(--color-tertiary)' : 'var(--color-on-surface)',
        }}
      >
        {item.title}
      </h2>
      <div
        style={{
          padding: '0.75rem',
          background: 'var(--color-surface-lowest)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid color-mix(in srgb, var(--color-border) 40%, transparent)',
          marginBottom: '0.5rem',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
          <strong>Why:</strong> {item.why}
        </p>
      </div>
      <div className="priority-rule">
        <span className="material-symbols-outlined" aria-hidden="true">
          {urgent ? 'pause_circle' : 'check_circle'}
        </span>
        <p style={{ margin: 0 }}>
          Focus on this step before moving on. You can pause and return anytime.
        </p>
      </div>
    </article>
  )

  return (
    <div>
      {card.hasUrgentDanger && (
        <div className="banner banner-urgent" role="alert" style={{ marginBottom: '1.5rem' }}>
          <span className="material-symbols-outlined fill" aria-hidden="true">
            emergency
          </span>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
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
              style={{ whiteSpace: 'nowrap' }}
            >
              Continue anyway
            </button>
          )}
        </div>
      )}

      <div className="banner banner-calm" style={{ marginBottom: '1.5rem' }}>
        <span className="material-symbols-outlined" aria-hidden="true">
          psychology
        </span>
        <div>
          <p style={{ margin: 0, fontWeight: 600 }}>
            You are not responsible for someone else&apos;s threats or extortion.
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
            This is a criminal pattern, not personal negligence. Focus on one safe micro-step at a
            time.
          </p>
        </div>
      </div>

      <section style={{ marginBottom: '1.5rem' }}>
        <h1 id="action-heading" style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>
          Immediate Safety Actions
        </h1>
        <p style={{ color: 'var(--color-muted)', margin: 0 }}>{card.disclaimer}</p>
      </section>

      {card.isMinorRoute && (
        <div className="banner banner-info" style={{ marginBottom: '1rem' }}>
          <span className="material-symbols-outlined" aria-hidden="true">
            family_restroom
          </span>
          <div>
            <strong>Guidance for Young People:</strong> Safe adult and trusted outreach pathways
            are highlighted below. AI analysis and screenshot tools are disabled for your safety.
          </div>
        </div>
      )}

      <div>
        {visibleItems.map((item, index) => renderItem(item, index, index === 0))}

        {remainingItems.length > 0 && (
          <div>
            {!showMore ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowMore(true)}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                View more steps ({remainingItems.length})
                <span className="material-symbols-outlined" aria-hidden="true">
                  expand_more
                </span>
              </button>
            ) : (
              <div>
                {remainingItems.map((item, index) => renderItem(item, index + 3, false))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="form-actions-row" style={{ marginTop: '2rem' }}>
        <p
          style={{
            fontSize: 12,
            color: 'var(--color-outline)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            className="material-symbols-outlined fill"
            style={{ fontSize: 14, color: 'var(--color-primary)' }}
            aria-hidden="true"
          >
            lock
          </span>
          No data saved to remote servers.
        </p>
        {card.isAiDisabled ? (
          <button type="button" className="btn btn-primary" onClick={() => onProceed(false)}>
            Continue to Complaint Draft (Offline only)
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onProceed(true)}
            aria-label="Next: Optional AI Complaint Drafting"
          >
            Continue to Optional Incident Details
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
          </button>
        )}
      </div>

      {relevantResources.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Relevant Reporting Resources</h2>
          {relevantResources.map((res) => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      )}
    </div>
  )
}
