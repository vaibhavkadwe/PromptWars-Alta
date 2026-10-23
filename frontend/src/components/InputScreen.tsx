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
    <div className="card">
      <h1 id="input-heading" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
        {useAi ? 'Describe What Happened' : 'Prepare Your Complaint Draft (Offline)'}
      </h1>

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
        {/* Description */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="input-description" style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
            What happened? (Required, at least 10 characters)
          </label>
          <textarea
            id="input-description"
            rows={5}
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Describe the messages, who sent them, what was threatened, and what demands were made. Do not include intimate photos."
            maxLength={4000}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
          />
          <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.2rem', textAlign: 'right' }}>
            {data.description.length} / 4000
          </div>
        </div>

        {/* Local Screenshot OCR (Adults & AI path only) */}
        {!isMinorRoute && (
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              backgroundColor: 'var(--color-bg)',
              marginBottom: '1.25rem',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
              Add Message Screenshots (Local OCR)
            </strong>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
              Choose only screenshots of messages. Do not choose nude or sexual images. SafeSignal cannot detect this for you.
              The image stays on this device and is never uploaded.
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

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={ocrLoading}
            >
              {ocrLoading ? 'Extracting text locally...' : 'Select message screenshots (PNG/JPEG)'}
            </button>

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

        {/* Evidence Text / Extracted Text */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="input-evidence" style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
            Evidence or transcript text (Optional)
          </label>
          <textarea
            id="input-evidence"
            rows={4}
            value={data.evidenceText}
            onChange={(e) => onChange({ evidenceText: e.target.value })}
            placeholder="Pasted chat logs, account URLs, payment details, or text extracted from screenshots. Check and remove any unwanted lines."
            maxLength={20000}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
          />
          <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.2rem', textAlign: 'right' }}>
            {data.evidenceText.length} / 20000
          </div>
        </div>

        {/* Optional Circumstances */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label htmlFor="input-platform" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Platform or app (Optional)
            </label>
            <input
              id="input-platform"
              type="text"
              value={data.platform}
              onChange={(e) => onChange({ platform: e.target.value })}
              placeholder="e.g. Instagram, WhatsApp"
              maxLength={80}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            />
          </div>

          <div>
            <label htmlFor="input-when" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              When did this happen? (Optional)
            </label>
            <input
              id="input-when"
              type="text"
              value={data.incidentWhen}
              onChange={(e) => onChange({ incidentWhen: e.target.value })}
              placeholder="e.g. Yesterday 4 pm"
              maxLength={100}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            />
          </div>
        </div>

        {/* Money status */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Money transferred status (Optional)
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="money_status"
                value="not_sent"
                checked={data.moneyStatus === 'not_sent'}
                onChange={() => onChange({ moneyStatus: 'not_sent' })}
              />
              <span>No money sent</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="money_status"
                value="sent"
                checked={data.moneyStatus === 'sent'}
                onChange={() => onChange({ moneyStatus: 'sent' })}
              />
              <span>Money was transferred</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="money_status"
                value="unsure"
                checked={data.moneyStatus === 'unsure'}
                onChange={() => onChange({ moneyStatus: 'unsure' })}
              />
              <span>Unsure / pending</span>
            </label>
          </div>
        </div>

        {/* Adult and Consent Confirmation Checkboxes (AI Path Only) */}
        {useAi && (
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              backgroundColor: 'var(--color-bg)',
              marginBottom: '1.5rem',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Required Confirmations for AI Assistance
            </strong>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.adultConfirmed}
                onChange={(e) => onChange({ adultConfirmed: e.target.checked })}
                style={{ marginTop: '0.2rem' }}
                required
              />
              <span style={{ fontSize: '0.9rem' }}>
                I confirm that I am 18 years of age or older.
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.consentAi}
                onChange={(e) => onChange({ consentAi: e.target.checked })}
                style={{ marginTop: '0.2rem' }}
                required
              />
              <span style={{ fontSize: '0.9rem' }}>
                I consent to having the text I review sent to the Google Gemini AI service under its terms.
              </span>
            </label>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isFormValid}
          style={{ width: '100%' }}
        >
          {useAi ? 'Review Outgoing Text &rarr;' : 'Create Offline Complaint Draft &rarr;'}
        </button>
      </form>
    </div>
  )
}
