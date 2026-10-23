import React from 'react'
import { Resource } from '../types/report'

interface ResourceCardProps {
  resource: Resource
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  return (
    <div className="resource-card">
      <div className="resource-header">
        <div>
          <span className="resource-title">{resource.title}</span>
          <div className="resource-meta">Verified Official Resource &bull; Verified: {resource.last_checked}</div>
        </div>
        <span className="badge badge-stated">{resource.kind.toUpperCase()}</span>
      </div>

      <p style={{ fontSize: '0.92rem', margin: '0.3rem 0' }}>{resource.purpose}</p>

      <div style={{ fontSize: '0.88rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>
        <strong>When to use:</strong> {resource.when}
      </div>

      <div style={{ fontSize: '0.88rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
        <strong>Limitations:</strong> {resource.limitations}
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        {resource.kind === 'phone' ? (
          <a
            href={`tel:${resource.value}`}
            className="btn btn-sm btn-primary resource-btn"
            aria-label={`Call ${resource.title} at ${resource.value}`}
          >
            Call {resource.value}
          </a>
        ) : (
          <a
            href={resource.value}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-secondary resource-btn"
            aria-label={`Open external link to ${resource.title}`}
          >
            Open {resource.title} &rarr;
          </a>
        )}
      </div>
    </div>
  )
}
