import React, { useRef, useState } from 'react'
import { validateTxtFile } from '../lib/validateTxtFile'

interface EvidenceInputProps {
  value: string
  onChange: (val: string) => void
}

export const EvidenceInput: React.FC<EvidenceInputProps> = ({ value, onChange }) => {
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const result = await validateTxtFile(file)
    if (!result.valid) {
      setFileError(result.error || 'Invalid file.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (result.content) {
      // Append or set content
      const separator = value.trim() ? '\n\n' : ''
      onChange((value + separator + result.content).slice(0, 20000))
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="form-group">
      <label htmlFor="evidence-text" className="form-label">
        Evidence Text / Message Logs (Optional)
      </label>
      <p className="form-help">
        Paste chat excerpts, extortion demands, profile links, or load a .txt transcript.
      </p>

      <div
        className="banner banner-demo"
        style={{
          backgroundColor: '#FFFBEB',
          borderColor: '#FDE68A',
          color: '#92400E',
          margin: '0.4rem 0 0.8rem 0',
          fontSize: '0.88rem',
        }}
      >
        <strong>Safety Warning:</strong> Do not paste or upload nude, sexually explicit, or intimate
        images. We only analyze text transcripts and never need intimate media.
      </div>

      <textarea
        id="evidence-text"
        className="form-control"
        placeholder="e.g. 'Pay 15000 by 8pm or I will send your video to your Instagram followers. UPI: quickpay.help@examplebank'"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 20000))}
        style={{ minHeight: '110px' }}
      />
      <div className="char-counter">
        <span>{value.length} / 20,000 characters</span>
      </div>

      <div style={{ marginTop: '0.6rem' }}>
        <label
          htmlFor="evidence-file-upload"
          style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}
        >
          Or load text from a .txt transcript file (≤ 100 KB):
        </label>
        <input
          id="evidence-file-upload"
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileChange}
          style={{ fontSize: '0.9rem' }}
        />
        {fileError && (
          <div
            style={{
              color: 'var(--color-urgent-text)',
              fontSize: '0.88rem',
              marginTop: '0.4rem',
              fontWeight: 500,
            }}
            role="alert"
          >
            {fileError}
          </div>
        )}
      </div>
    </div>
  )
}
