import React from 'react'
import { CategoryId, IncidentDetails } from '../types/report'
import { EvidenceInput } from './EvidenceInput'

interface IntakeFormProps {
  description: string
  evidenceText: string
  details: IncidentDetails
  consent: boolean
  paidTier: boolean
  onDescriptionChange: (val: string) => void
  onEvidenceChange: (val: string) => void
  onDetailsChange: (val: Partial<IncidentDetails>) => void
  onToggleThreatType: (val: CategoryId) => void
  onConsentChange: (val: boolean) => void
  onFillFictionalExample: () => void
  onSubmit: () => void
}

const THREAT_CHIPS: { id: CategoryId; label: string }[] = [
  { id: 'THREAT_TO_SHARE_IMAGES', label: 'Threat to share images/video' },
  { id: 'MONEY_DEMAND', label: 'Money demand (UPI / cash)' },
  { id: 'THREAT_TO_CONTACT_OTHERS', label: 'Threat to contact friends/family' },
  { id: 'COERCION_FOR_MORE_CONTENT', label: 'Demanding more photos/videos' },
  { id: 'SUSPECTED_NON_CONSENSUAL_RECORDING', label: 'Recorded video call' },
  { id: 'SUSPECTED_AI_GENERATED_IMAGERY', label: 'AI generated / morphed images' },
  { id: 'IMPERSONATION_OR_FAKE_PROFILE', label: 'Impersonation / fake profile' },
]

export const IntakeForm: React.FC<IntakeFormProps> = ({
  description,
  evidenceText,
  details,
  consent,
  paidTier,
  onDescriptionChange,
  onEvidenceChange,
  onDetailsChange,
  onToggleThreatType,
  onConsentChange,
  onFillFictionalExample,
  onSubmit,
}) => {
  const isDescriptionValid = description.trim().length >= 10
  const canSubmit = isDescriptionValid && consent

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Incident Intake</h1>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={onFillFictionalExample}
          aria-label="Fill fictional example into form"
        >
          Load fictional example
        </button>
      </div>

      {!paidTier && (
        <div className="banner banner-demo" role="alert">
          <strong>Demo mode:</strong> This prototype uses a free-tier AI key. Google may use inputs
          to improve its products and human reviewers may read them. Please enter ONLY fictional
          information.
        </div>
      )}

      {/* Immediate 112 Alert if Physically Unsafe */}
      {details.feels_physically_unsafe && (
        <div className="urgent-panel" role="alert">
          <div className="urgent-panel-header">
            <span>Immediate Safety Warning: Physical Danger Reported</span>
          </div>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
            If you feel physically unsafe or someone is threatening to come to your physical location,
            do not wait for an analysis. Call 112 emergency services immediately.
          </p>
          <a href="tel:112" className="urgent-dial-btn">
            Call 112 (Emergency Police)
          </a>
        </div>
      )}

      {/* 1. Main Description */}
      <div className="form-group">
        <label htmlFor="incident-description" className="form-label">
          What happened? <span style={{ color: 'var(--color-urgent-text)' }}>*</span>
        </label>
        <p className="form-help">
          Describe what the person said or demanded in your own words. Do not include your real name or address.
        </p>
        <textarea
          id="incident-description"
          className="form-control"
          placeholder="e.g. Someone I met on a social app is threatening to post screenshots of our video call to my contacts unless I send money..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value.slice(0, 4000))}
          required
          rows={5}
        />
        <div className="char-counter">
          <span style={{ color: description.trim().length < 10 ? 'var(--color-caution-text)' : 'inherit' }}>
            {description.length} / 4,000 characters (min 10)
          </span>
        </div>
      </div>

      {/* 2. Optional Details */}
      <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
        <h2>Optional Incident Context</h2>
        <p className="form-help" style={{ marginBottom: '1rem' }}>
          Providing context helps SafeSignal recommend relevant platform tools and helplines.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="incident-when" className="form-label">
              When did this happen?
            </label>
            <input
              id="incident-when"
              type="text"
              className="form-control"
              placeholder="e.g. Yesterday evening, or 2 days ago"
              value={details.incident_when || ''}
              onChange={(e) => onDetailsChange({ incident_when: e.target.value.slice(0, 100) })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="incident-platform" className="form-label">
              Platform or app involved
            </label>
            <input
              id="incident-platform"
              type="text"
              className="form-control"
              placeholder="e.g. Instagram, WhatsApp, Telegram"
              value={details.platform || ''}
              onChange={(e) => onDetailsChange({ platform: e.target.value.slice(0, 60) })}
            />
          </div>
        </div>

        {/* Threat Type Chips */}
        <div className="form-group">
          <label className="form-label">Type of threats involved (select all that apply):</label>
          <div className="chip-container">
            {THREAT_CHIPS.map((chip) => {
              const active = details.threat_types.includes(chip.id)
              return (
                <button
                  key={chip.id}
                  type="button"
                  className={`chip-btn ${active ? 'active' : ''}`}
                  onClick={() => onToggleThreatType(chip.id)}
                  aria-pressed={active}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tri-state Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.92rem' }}>
              Did the sender demand money or payment?
            </label>
            <div className="tristate-group">
              <button
                type="button"
                className={`tristate-btn ${details.money_demanded === true ? 'active' : ''}`}
                onClick={() => onDetailsChange({ money_demanded: true })}
              >
                Yes
              </button>
              <button
                type="button"
                className={`tristate-btn ${details.money_demanded === false ? 'active' : ''}`}
                onClick={() => onDetailsChange({ money_demanded: false })}
              >
                No
              </button>
              <button
                type="button"
                className={`tristate-btn ${details.money_demanded === null ? 'active' : ''}`}
                onClick={() => onDetailsChange({ money_demanded: null })}
              >
                Not sure
              </button>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.92rem' }}>
              Did they demand more photos or sexual content?
            </label>
            <div className="tristate-group">
              <button
                type="button"
                className={`tristate-btn ${details.more_images_demanded === true ? 'active' : ''}`}
                onClick={() => onDetailsChange({ more_images_demanded: true })}
              >
                Yes
              </button>
              <button
                type="button"
                className={`tristate-btn ${details.more_images_demanded === false ? 'active' : ''}`}
                onClick={() => onDetailsChange({ more_images_demanded: false })}
              >
                No
              </button>
              <button
                type="button"
                className={`tristate-btn ${details.more_images_demanded === null ? 'active' : ''}`}
                onClick={() => onDetailsChange({ more_images_demanded: null })}
              >
                Not sure
              </button>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.92rem' }}>
              Did they threaten immediate disclosure (e.g. today or countdown)?
            </label>
            <div className="tristate-group">
              <button
                type="button"
                className={`tristate-btn ${details.immediate_disclosure_threat === true ? 'active' : ''}`}
                onClick={() => onDetailsChange({ immediate_disclosure_threat: true })}
              >
                Yes
              </button>
              <button
                type="button"
                className={`tristate-btn ${details.immediate_disclosure_threat === false ? 'active' : ''}`}
                onClick={() => onDetailsChange({ immediate_disclosure_threat: false })}
              >
                No
              </button>
              <button
                type="button"
                className={`tristate-btn ${details.immediate_disclosure_threat === null ? 'active' : ''}`}
                onClick={() => onDetailsChange({ immediate_disclosure_threat: null })}
              >
                Not sure
              </button>
            </div>
          </div>
        </div>

        {/* Checkboxes for physical danger and minor */}
        <div style={{ marginTop: '1.25rem' }}>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={details.feels_physically_unsafe || false}
              onChange={(e) => onDetailsChange({ feels_physically_unsafe: e.target.checked })}
            />
            <span style={{ fontSize: '0.95rem' }}>
              <strong>I feel physically unsafe</strong> (someone threatened to come to my home/school or hurt me)
            </span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={details.may_be_under_18 || false}
              onChange={(e) => onDetailsChange({ may_be_under_18: e.target.checked })}
            />
            <span style={{ fontSize: '0.95rem' }}>
              <strong>I am under 18</strong> (or the images were created when under 18)
            </span>
          </label>
        </div>
      </div>

      {/* 3. Evidence Excerpts */}
      <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
        <EvidenceInput value={evidenceText} onChange={onEvidenceChange} />
      </div>

      {/* 4. Explicit Consent & Submission */}
      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div className="card" style={{ backgroundColor: 'var(--color-bg)', padding: '1rem', marginBottom: '1.25rem' }}>
          <label className="checkbox-row" style={{ alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              id="consent-checkbox"
              checked={consent}
              onChange={(e) => onConsentChange(e.target.checked)}
              required
            />
            <span style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
              {paidTier ? (
                <span>
                  I understand my text will be sent to Google&apos;s Gemini API to be analysed, under
                  Google&apos;s terms, and SafeSignal does not store it.
                </span>
              ) : (
                <span>
                  I understand my text will be sent to Google&apos;s Gemini API to be analysed, under
                  Google&apos;s terms, and SafeSignal does not store it, <strong>and I am entering fictional information only.</strong>
                </span>
              )}
            </span>
          </label>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '1.1rem' }}
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          Analyse Incident Safely
        </button>

        {!isDescriptionValid && (
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>
            Please write at least 10 characters in the description to analyse.
          </p>
        )}
      </div>
    </div>
  )
}
