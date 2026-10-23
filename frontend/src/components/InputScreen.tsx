import React, { useRef, useState } from 'react'
import { recognizeImages } from '../lib/ocr'
import { InputData } from '../state/workflow'

interface InputScreenProps {
  data: InputData
  useAi: boolean
  isMinorRoute: boolean
  onChange: (updates: Partial<InputData>) => void
  onNext: () => void
}

const PLATFORM_OPTIONS = [
  { id: 'Instagram', icon: 'photo_camera' },
  { id: 'Snapchat', icon: 'chat_bubble' },
  { id: 'WhatsApp', icon: 'forum' },
  { id: 'Discord', icon: 'headset_mic' },
  { id: 'Dating App', icon: 'favorite' },
  { id: 'Other', icon: 'more_horiz' },
] as const

export const InputScreen: React.FC<InputScreenProps> = ({
  data,
  useAi,
  isMinorRoute,
  onChange,
  onNext,
}) => {
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrStatus, setOcrStatus] = useState<string | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedPlatforms = data.platform
    ? data.platform.split(',').map((p) => p.trim()).filter(Boolean)
    : []

  const togglePlatform = (id: string) => {
    const set = new Set(selectedPlatforms)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChange({ platform: Array.from(set).join(', ') })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return

    setOcrError(null)
    setOcrLoading(true)
    setOcrStatus('Validating and reading image locally...')

    try {
      const extractedText = await recognizeImages(files, (p) => {
        setOcrStatus(`${p.status} (${Math.round(p.progress * 100)}%)`)
      })

      const combined = data.evidenceText
        ? `${data.evidenceText}\n\n${extractedText}`
        : extractedText

      onChange({ evidenceText: combined })
      setOcrStatus('Text extracted successfully. Please review and edit the text below.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Local OCR encountered an error.'
      setOcrError(`${msg} You can type or paste the message text manually.`)
    } finally {
      setOcrLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const isFormValid =
    data.description.trim().length >= 10 &&
    (!useAi || (data.adultConfirmed && data.consentAi))

  return (
    <div>
      <div className="banner banner-calm" style={{ marginBottom: '1.25rem' }}>
        <span className="material-symbols-outlined fill" aria-hidden="true">
          psychology
        </span>
        <div>
          <p style={{ margin: 0, fontWeight: 500, fontSize: 13 }}>
            You can get guidance without sharing intimate images.{' '}
            <strong style={{ color: 'var(--color-tertiary)' }}>
              Never upload explicit content.
            </strong>
          </p>
          <p className="label-sm" style={{ color: 'var(--color-outline)', margin: '0.25rem 0 0' }}>
            SafeSignal focuses on threat patterns, timestamps, and platform metadata.
          </p>
        </div>
      </div>

      <section className="card" style={{ background: 'var(--color-surface-low)', borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }} aria-hidden="true">
            verified_user
          </span>
          <h2 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--color-primary)' }}>
            Privacy Disclosure
          </h2>
        </div>
        <p style={{ color: 'var(--color-muted)', marginBottom: '1rem', lineHeight: 1.55 }}>
          This step is optional for documenting details (platform, handles, demands) into an
          organized report. Text stays on-device unless you explicitly choose optional AI drafting.
        </p>
        <div className="lock-banner">
          <span className="material-symbols-outlined fill" aria-hidden="true">
            lock
          </span>
          Encrypted locally. Zero server persistence until you explicitly export or send.
        </div>
      </section>

      <div className="card card-elevated">
        <div
          style={{
            borderBottom: '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)',
            paddingBottom: '0.75rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }} aria-hidden="true">
              edit_square
            </span>
            <h1 id="input-heading" style={{ fontSize: '1.25rem', margin: 0 }}>
              {useAi ? 'Describe What Happened' : 'Prepare Your Complaint Draft (Offline)'}
            </h1>
          </div>
          <span className="label-sm" style={{ color: 'var(--color-outline)', textTransform: 'uppercase' }}>
            Incident Details
          </span>
        </div>

        <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          {useAi
            ? 'Provide the details of what occurred. Only the text in these fields will be reviewed and sent to the drafting assistant.'
            : 'Enter your incident details below to generate a formatted complaint checklist locally on this device.'}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (isFormValid) onNext()
          }}
        >
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                What platform did this occur on?
              </label>
              <span className="label-sm" style={{ color: 'var(--color-outline)' }}>
                Select one or more
              </span>
            </div>
            <div className="platform-pills" role="group" aria-label="Platforms">
              {PLATFORM_OPTIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`platform-pill ${selectedPlatforms.includes(p.id) ? 'active' : ''}`}
                  onClick={() => togglePlatform(p.id)}
                  aria-pressed={selectedPlatforms.includes(p.id)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {p.icon}
                  </span>
                  {p.id}
                </button>
              ))}
            </div>
            <label htmlFor="input-platform" className="sr-only">
              Platform or app (Optional)
            </label>
            <input
              id="input-platform"
              className="form-control"
              type="text"
              value={data.platform}
              onChange={(e) => onChange({ platform: e.target.value })}
              placeholder="Or type platform name…"
              maxLength={80}
              style={{ marginTop: '0.75rem' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="input-description" className="form-label">
              What happened? (Required, at least 10 characters)
            </label>
            <textarea
              id="input-description"
              className="form-control"
              rows={5}
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Describe the sequence of events, threats, demands, and any deadlines. Do not include intimate photos."
              maxLength={4000}
              required
            />
            <div className="char-counter">
              {data.description.length} / 4000
            </div>
          </div>

          {!isMinorRoute && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="form-label" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 18 }} aria-hidden="true">
                    document_scanner
                  </span>
                  Screenshot Text Extractor (OCR)
                </span>
                <span
                  className="label-sm"
                  style={{
                    color: 'var(--color-primary)',
                    background: 'color-mix(in srgb, var(--color-primary-fixed) 30%, transparent)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 4,
                  }}
                >
                  Client-Side Only
                </span>
              </div>
              <p className="form-help">
                Choose only screenshots of messages. Do not choose nude or sexual images. The image
                stays on this device and is never uploaded.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".png,image/png,.jpg,.jpeg,image/jpeg"
                multiple
                onChange={handleFileChange}
                disabled={ocrLoading}
                style={{ display: 'none' }}
                id="ocr-file-picker"
              />

              <div
                className="dropzone"
                role="button"
                tabIndex={0}
                onClick={() => !ocrLoading && fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (!ocrLoading) fileInputRef.current?.click()
                  }
                }}
              >
                <div className="dropzone-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                </div>
                <p style={{ margin: 0, fontWeight: 500, fontSize: 13 }}>
                  {ocrLoading ? 'Extracting text locally…' : 'Optional: Upload screenshot for text extraction'}
                </p>
                <p className="label-sm" style={{ color: 'var(--color-outline)', marginTop: 4 }}>
                  Screenshots processed locally for text only
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.75rem' }}
                  disabled={ocrLoading}
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  Browse File
                </button>
              </div>

              {ocrStatus && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginTop: '0.5rem' }}>
                  {ocrStatus}
                </p>
              )}
              {ocrError && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-urgent-text)', marginTop: '0.5rem' }}>
                  {ocrError}
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="input-evidence" className="form-label">
              Evidence or transcript text (Optional)
            </label>
            <textarea
              id="input-evidence"
              className="form-control"
              rows={4}
              value={data.evidenceText}
              onChange={(e) => onChange({ evidenceText: e.target.value })}
              placeholder="Pasted chat logs, account URLs, payment details, or OCR text. Review before continuing."
              maxLength={20000}
            />
            <div className="char-counter">{data.evidenceText.length} / 20000</div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
            className="when-grid"
          >
            <div>
              <label htmlFor="input-when" className="form-label" style={{ fontSize: '0.9rem' }}>
                When did this happen? (Optional)
              </label>
              <input
                id="input-when"
                className="form-control"
                type="text"
                value={data.incidentWhen}
                onChange={(e) => onChange({ incidentWhen: e.target.value })}
                placeholder="e.g. Yesterday 4 pm"
                maxLength={100}
              />
            </div>
          </div>

          <div className="form-group">
            <span className="form-label" style={{ fontSize: '0.9rem' }}>
              Money transferred status (Optional)
            </span>
            <div className="pill-stack" style={{ paddingLeft: 0, marginTop: '0.5rem' }}>
              {(
                [
                  { value: 'not_sent', label: 'No money sent' },
                  { value: 'sent', label: 'Money was transferred' },
                  { value: 'unsure', label: 'Unsure / pending' },
                ] as const
              ).map((opt) => (
                <div className="pill-option" key={opt.value}>
                  <input
                    type="radio"
                    id={`money-${opt.value}`}
                    name="money_status"
                    value={opt.value}
                    checked={data.moneyStatus === opt.value}
                    onChange={() => onChange({ moneyStatus: opt.value })}
                  />
                  <label htmlFor={`money-${opt.value}`}>
                    <span className="pill-indicator" aria-hidden="true">
                      <span className="pill-indicator-dot" />
                    </span>
                    <span className="pill-text">{opt.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {useAi && (
            <div
              className="card"
              style={{ background: 'var(--color-surface-low)', marginBottom: '1.5rem' }}
            >
              <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                Required Confirmations for AI Assistance
              </strong>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={data.adultConfirmed}
                  onChange={(e) => onChange({ adultConfirmed: e.target.checked })}
                  required
                />
                <span style={{ fontSize: '0.9rem' }}>
                  I confirm that I am 18 years of age or older.
                </span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={data.consentAi}
                  onChange={(e) => onChange({ consentAi: e.target.checked })}
                  required
                />
                <span style={{ fontSize: '0.9rem' }}>
                  I consent to having the text I review sent to the Google Gemini AI service under
                  its terms.
                </span>
              </label>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={!isFormValid} style={{ width: '100%' }}>
            <span className="material-symbols-outlined" aria-hidden="true">
              analytics
            </span>
            {useAi ? 'Review Outgoing Text →' : 'Create Offline Complaint Draft →'}
          </button>
        </form>
      </div>
    </div>
  )
}
