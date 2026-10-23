import React, { useState } from 'react'
import resourcesData from '../../../shared/resources.json'
import {
  ComplaintDraft,
  Resource,
} from '../types/report'
import { ResourceCard } from './ResourceCard'

interface DraftScreenProps {
  draft: ComplaintDraft
  isSample?: boolean
  notices?: string[]
  resourceIds?: string[]
  onUpdateDraft: (updates: Partial<ComplaintDraft>) => void
  onReset: () => void
}

export const DraftScreen: React.FC<DraftScreenProps> = ({
  draft,
  isSample = false,
  notices = [],
  resourceIds = [],
  onUpdateDraft,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const handleCopy = (sectionKey: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedSection(sectionKey)
      setTimeout(() => setCopiedSection(null), 2000)
    })
  }

  const handlePrint = () => {
    window.print()
  }

  // Remove item helpers
  const handleRemoveChronology = (index: number) => {
    const updated = draft.chronology.filter((_, i) => i !== index)
    onUpdateDraft({ chronology: updated })
  }

  const handleRemoveEvidence = (index: number) => {
    const updated = draft.evidence_checklist.filter((_, i) => i !== index)
    onUpdateDraft({ evidence_checklist: updated })
  }

  const handleRemoveAction = (index: number) => {
    const updated = draft.action_suggestions.filter((_, i) => i !== index)
    onUpdateDraft({ action_suggestions: updated })
  }

  // Resolve relevant resources
  const catalog = resourcesData as Resource[]
  const relevantResources = catalog.filter((r) => resourceIds.includes(r.id) || r.id === 'NCRP')

  return (
    <div className="draft-screen-container">
      <div className="banner banner-calm no-print" style={{ marginBottom: '1.25rem' }}>
        <span className="material-symbols-outlined" aria-hidden="true">
          volunteer_activism
        </span>
        <div>
          <p style={{ margin: 0, fontWeight: 500 }}>
            You do not have to figure everything out at once. You are in complete control of this
            report.
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
            Nothing leaves your browser without your explicit command.
          </p>
        </div>
      </div>

      {isSample && (
        <div className="banner banner-demo no-print" role="alert" style={{ marginBottom: '1.25rem' }}>
          <strong>Sample — not live AI:</strong> This draft was generated from a fictional example scenario to illustrate the complaint preparation format.
        </div>
      )}

      {notices.length > 0 && (
        <div className="banner banner-info no-print" role="alert" style={{ marginBottom: '1.25rem' }}>
          <strong>Draft Notices:</strong>
          <ul style={{ margin: '0.25rem 0 0 1.25rem', fontSize: '0.9rem' }}>
            {notices.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="draft-layout">
      <div className="card card-elevated printable-draft" id="printable-draft-area">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid color-mix(in srgb, var(--color-border) 40%, transparent)', paddingBottom: '1rem' }}>
          <div>
            <div className="draft-doc-meta">
              <span className="doc-chip">Local Vault Only</span>
              <span className="doc-chip muted">Ready for Review</span>
            </div>
            <h1 id="draft-heading" style={{ fontSize: '1.35rem', margin: '0.35rem 0 0' }}>
              Official Complaint Preparation Draft
            </h1>
          </div>
          <span className="label-sm" style={{ color: 'var(--color-muted)' }}>
            Editable in-memory draft
          </span>
        </div>

        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Note: These are generic complaint-preparation sections to help organize your report, not confirmed fields of the official cybercrime portal. Review and edit directly.
        </p>

        {/* 1. What Happened */}
        <div className="draft-section" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <label htmlFor="draft-what-happened" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              What Happened <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 400 }}>(From your description)</span>
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-sm no-print"
              onClick={() => handleCopy('what_happened', draft.what_happened || '[not provided]')}
            >
              {copiedSection === 'what_happened' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            id="draft-what-happened"
            rows={4}
            value={draft.what_happened || '[not provided]'}
            onChange={(e) => onUpdateDraft({ what_happened: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
          />
        </div>

        {/* 2. Platform & When */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <label htmlFor="draft-platform" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Platform / Service
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm no-print"
                onClick={() => handleCopy('platform', draft.platform_or_service || '[not provided]')}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                {copiedSection === 'platform' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <input
              id="draft-platform"
              type="text"
              value={draft.platform_or_service || '[not provided]'}
              onChange={(e) => onUpdateDraft({ platform_or_service: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <label htmlFor="draft-when" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                When It Happened
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm no-print"
                onClick={() => handleCopy('when', draft.when_it_happened || '[not provided]')}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                {copiedSection === 'when' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <input
              id="draft-when"
              type="text"
              value={draft.when_it_happened || '[not provided]'}
              onChange={(e) => onUpdateDraft({ when_it_happened: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        {/* 3. The Threat and Demand */}
        <div className="draft-section" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <label htmlFor="draft-threat" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              The Threat or Demand <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 400 }}>(From your text)</span>
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-sm no-print"
              onClick={() => handleCopy('threat', draft.threat_and_demand || '[not provided]')}
            >
              {copiedSection === 'threat' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            id="draft-threat"
            rows={3}
            value={draft.threat_and_demand || '[not provided]'}
            onChange={(e) => onUpdateDraft({ threat_and_demand: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
          />
        </div>

        {/* 4. Demand Amount or Deadline */}
        <div className="draft-section" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <label htmlFor="draft-deadline" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Demand Amount or Deadline
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-sm no-print"
              onClick={() => handleCopy('deadline', draft.demand_amount_or_deadline || '[not provided]')}
            >
              {copiedSection === 'deadline' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <input
            id="draft-deadline"
            type="text"
            value={draft.demand_amount_or_deadline || '[not provided]'}
            onChange={(e) => onUpdateDraft({ demand_amount_or_deadline: e.target.value })}
            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
          />
        </div>

        {/* 5. Account Identifiers */}
        <div className="draft-section" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Suspect Account Identifiers
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm no-print"
              onClick={() => {
                const text = draft.account_identifiers
                  .map((id) => `${id.kind}: ${id.value}`)
                  .join('\n') || '[not provided]'
                handleCopy('identifiers', text)
              }}
            >
              {copiedSection === 'identifiers' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {draft.account_identifiers.length === 0 ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>[not provided]</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {draft.account_identifiers.map((ident, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    <strong>{ident.kind}:</strong> {ident.value}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                    From {ident.source === 'user_description' ? 'description' : 'messages'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 6. Chronology / Timeline */}
        <div className="draft-section" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Timeline of Events</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm no-print"
              onClick={() => {
                const text = draft.chronology
                  .map((c) => `${c.when_text ? c.when_text + ': ' : ''}${c.event}`)
                  .join('\n') || '[not provided]'
                handleCopy('chronology', text)
              }}
            >
              {copiedSection === 'chronology' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {draft.chronology.length === 0 ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>[not provided]</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {draft.chronology.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                  }}
                >
                  <div>
                    {item.when_text && (
                      <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>{item.when_text}:</span>
                    )}
                    <span>{item.event}</span>
                  </div>
                  <button
                    type="button"
                    className="no-print"
                    onClick={() => handleRemoveChronology(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      marginLeft: '0.5rem',
                    }}
                    aria-label={`Remove timeline event ${idx + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7. Supporting Material User Has */}
        <div className="draft-section" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Supporting Material I Have</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm no-print"
              onClick={() => handleCopy('material', draft.supporting_material_user_has.join('\n') || '[not provided]')}
            >
              {copiedSection === 'material' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {draft.supporting_material_user_has.length === 0 ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>[not provided]</div>
          ) : (
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
              {draft.supporting_material_user_has.map((m, idx) => (
                <li key={idx} style={{ marginBottom: '0.2rem' }}>{m}</li>
              ))}
            </ul>
          )}
        </div>

        {/* 8. What I Don't Know Yet (Read-Only Prompts) */}
        {draft.missing_information.length > 0 && (
          <div className="draft-section" style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'block', marginBottom: '0.3rem' }}>
              What I Don&apos;t Know Yet (Information to look for)
            </span>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
              {draft.missing_information.map((mi, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                  <strong>{mi.item}:</strong> {mi.why}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 9. Evidence Checklist */}
        <div className="draft-section" style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Evidence Preservation Checklist</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
            Preserve text and context only. Never screenshot or save nude or intimate photos.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {draft.evidence_checklist.map((ev, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.6rem 0.75rem',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.9rem', display: 'block' }}>{ev.item}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{ev.how_to_preserve}</span>
                  {ev.isAiSuggested && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginLeft: '0.5rem', fontWeight: 600 }}>
                      [Suggested by AI]
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="no-print"
                  onClick={() => handleRemoveEvidence(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    marginLeft: '0.5rem',
                  }}
                  aria-label={`Remove evidence item ${idx + 1}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 10. Suggested Next Steps */}
        {draft.action_suggestions.length > 0 && (
          <div className="draft-section" style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Circumstance-Specific Suggestions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {draft.action_suggestions.map((act, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.6rem 0.75rem',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.9rem', display: 'block' }}>{act.title}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{act.why}</span>
                  </div>
                  <button
                    type="button"
                    className="no-print"
                    onClick={() => handleRemoveAction(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      marginLeft: '0.5rem',
                    }}
                    aria-label={`Remove action suggestion ${idx + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Limitations */}
        {draft.limitations.length > 0 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
            <strong>Limitations:</strong>
            <ul style={{ margin: '0.2rem 0 0 1rem' }}>
              {draft.limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="print-only-footer" style={{ marginTop: '2rem', borderTop: '1px solid #000', paddingTop: '0.5rem', fontSize: '9pt', textAlign: 'center' }}>
          Draft — review and correct before using. Not legal advice.
        </div>
      </div>

      <aside className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {relevantResources.length > 0 && (
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid color-mix(in srgb, var(--color-border) 40%, transparent)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }} aria-hidden="true">
                verified
              </span>
              <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Reporting Channels</h2>
            </div>
            {relevantResources.map((res) => (
              <ResourceCard key={res.id} resource={res} />
            ))}
          </div>
        )}

        <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid color-mix(in srgb, var(--color-border) 40%, transparent)', textAlign: 'left' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }} aria-hidden="true">
              folder_zip
            </span>
            <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Document Controls</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '0.75rem', textAlign: 'left' }}>
            Your copy may stay on this device or in its Downloads folder. SafeSignal can&apos;t control where it goes.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrint}
            style={{ width: '100%' }}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              download
            </span>
            Print / Save a copy
          </button>
        </div>

        <div className="lock-banner">
          <span className="material-symbols-outlined fill" aria-hidden="true">
            lock
          </span>
          Encrypted locally. Zero server persistence until you export.
        </div>
      </aside>
      </div>
    </div>
  )
}
