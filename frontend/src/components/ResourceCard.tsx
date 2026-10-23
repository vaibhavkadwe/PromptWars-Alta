import React from 'react'
import { Resource } from '../types/report'

interface ResourceCardProps {
  resource: Resource
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  return (
    <div className="resource-card" style={{
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '1rem',
      backgroundColor: 'var(--color-surface)',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{resource.name}</h3>
        <span style={{
          fontSize: '0.75rem',
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: 'var(--color-highlight)',
          color: 'var(--color-primary-hover)',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          {resource.kind}
        </span>
      </div>

      <p style={{ fontSize: '0.92rem', margin: '0.3rem 0', color: 'var(--color-text)' }}>
        {resource.purpose}
      </p>

      <div style={{ fontSize: '0.88rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>
        <strong>When to use:</strong> {resource.whenToUse}
      </div>

      <div style={{ fontSize: '0.88rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
        <strong>Does not cover:</strong> {resource.doesNotCover}
      </div>

      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        {resource.kind === 'phone' ? (
          <a
            href={`tel:${resource.value}`}
            className="btn btn-sm btn-primary"
            aria-label={`Call ${resource.name} at ${resource.value}`}
          >
            Call {resource.value}
          </a>
        ) : (
          <a
            href={resource.value}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-secondary"
            aria-label={`Open ${resource.name}`}
          >
            Visit portal &rarr;
          </a>
        )}

        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
          {resource.kind === 'link' ? 'Opens in a new tab. Opening this does not file a complaint. ' : ''}
          Last checked 23 Oct 2026
        </div>
      </div>
    </div>
  )
}
