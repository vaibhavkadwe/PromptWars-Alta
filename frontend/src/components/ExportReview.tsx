import React, { useMemo } from 'react'
import { ExportSectionsOptions, generateExportText } from '../lib/exportText'
import {
  AnalyzeResponse,
  ReviewedAction,
  ReviewedDetail,
  ReviewedEvidence,
  ReviewedTimeline,
} from '../types/report'

interface ExportReviewProps {
  response: AnalyzeResponse
  reviewedDetails: ReviewedDetail[]
  reviewedTimeline: ReviewedTimeline[]
  reviewedEvidence: ReviewedEvidence[]
  reviewedActions: ReviewedAction[]
  options: ExportSectionsOptions
  originalDescription: string
  onOptionsChange: (opts: Partial<ExportSectionsOptions>) => void
  onBack: () => void
  onReset: () => void
}

export const ExportReview: React.FC<ExportReviewProps> = ({
  response,
  reviewedDetails,
  reviewedTimeline,
  reviewedEvidence,
  reviewedActions,
  options,
  originalDescription,
  onOptionsChange,
  onBack,
  onReset,
}) => {
  const exportText = useMemo(() => {
    return generateExportText(
      response,
      reviewedDetails,
      reviewedTimeline,
      reviewedEvidence,
      reviewedActions,
      options,
      originalDescription,
    )
  }, [
    response,
    reviewedDetails,
    reviewedTimeline,
    reviewedEvidence,
    reviewedActions,
    options,
    originalDescription,
  ])

  const handleDownload = () => {
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `SafeSignal_Incident_Report_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div>
      <div className="card">
        <h1>Review and Export Action Plan</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>
          Select which sections you wish to include in your saved report. Any items you removed during
          review are already excluded.
        </p>

        {/* Section selection checkboxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem', margin: '1rem 0' }}>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={options.includeSummary}
              onChange={(e) => onOptionsChange({ includeSummary: e.target.checked })}
            />
            <span>Incident summary</span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={options.includeCategories}
              onChange={(e) => onOptionsChange({ includeCategories: e.target.checked })}
            />
            <span>Threat categories</span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={options.includeDetails}
              onChange={(e) => onOptionsChange({ includeDetails: e.target.checked })}
            />
            <span>Recorded details</span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={options.includeTimeline}
              onChange={(e) => onOptionsChange({ includeTimeline: e.target.checked })}
            />
            <span>Incident timeline</span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={options.includeEvidence}
              onChange={(e) => onOptionsChange({ includeEvidence: e.target.checked })}
            />
            <span>Evidence checklist</span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={options.includeActions}
              onChange={(e) => onOptionsChange({ includeActions: e.target.checked })}
            />
            <span>Next steps</span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={options.includeContacts}
              onChange={(e) => onOptionsChange({ includeContacts: e.target.checked })}
            />
            <span>Support contacts</span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={options.includeOriginalDescription}
              onChange={(e) => onOptionsChange({ includeOriginalDescription: e.target.checked })}
            />
            <span>Original submission (optional)</span>
          </label>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-primary" onClick={handleDownload}>
            Download .txt
          </button>
          <button type="button" className="btn btn-secondary" onClick={handlePrint}>
            Print Report
          </button>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Back to Report
          </button>
          <button type="button" className="btn btn-urgent" onClick={onReset}>
            Start a new report
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.75rem' }}>
          Reset note: &ldquo;Start a new report&rdquo; clears all incident state on this page immediately.
          It cannot erase downloaded files or browser history.
        </div>
      </div>

      {/* Text Preview */}
      <div className="card">
        <h2>Report Preview</h2>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'monospace',
            fontSize: '0.88rem',
            lineHeight: '1.5',
            backgroundColor: 'var(--color-bg)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {exportText}
        </pre>
      </div>
    </div>
  )
}
