import React from 'react'
import {
  AnalyzeResponse,
  ReviewedAction,
  ReviewedDetail,
  ReviewedEvidence,
  ReviewedTimeline,
} from '../types/report'
import { EvidenceSection } from './EvidenceSection'
import { NextStepsSection } from './NextStepsSection'
import { TimelineSection } from './TimelineSection'
import { UnderstoodSection } from './UnderstoodSection'

interface ReportViewProps {
  response: AnalyzeResponse
  reviewedDetails: ReviewedDetail[]
  reviewedTimeline: ReviewedTimeline[]
  reviewedEvidence: ReviewedEvidence[]
  reviewedActions: ReviewedAction[]
  onUpdateDetail: (id: string, updates: { include?: boolean; confirmed?: boolean; valueOverride?: string }) => void
  onUpdateTimeline: (id: string, include: boolean) => void
  onUpdateEvidence: (id: string, updates: { include?: boolean; confirmed?: boolean }) => void
  onUpdateAction: (id: string, include: boolean) => void
  onGoToExport: () => void
  onReset: () => void
}

export const ReportView: React.FC<ReportViewProps> = ({
  response,
  reviewedDetails,
  reviewedTimeline,
  reviewedEvidence,
  reviewedActions,
  onUpdateDetail,
  onUpdateTimeline,
  onUpdateEvidence,
  onUpdateAction,
  onGoToExport,
  onReset,
}) => {
  const isSample = response.source === 'sample'
  const safety = response.safety

  return (
    <div>
      {/* Source Banner */}
      <div className={`banner ${isSample ? 'banner-sample' : 'banner-live'}`} role="status">
        {isSample ? (
          <span>
            <strong>Sample output &mdash; not live AI:</strong> This is a fictional example report demonstrating how SafeSignal organizes digital blackmail incidents.
          </span>
        ) : (
          <span>
            <strong>Live Gemini analysis:</strong> Processed via server-side Google Gemini structured pipeline. Generated at {response.generated_at}.
          </span>
        )}
      </div>

      {/* Pinned Urgent Emergency Panel if Safety Flags Triggered */}
      {(safety.physical_danger || safety.self_harm || safety.possible_minor) && (
        <div className="urgent-panel" role="alert">
          <div className="urgent-panel-header">
            <span>Critical Incident Notice</span>
          </div>
          {(safety.physical_danger || safety.self_harm) && (
            <div style={{ marginBottom: '0.6rem' }}>
              <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem' }}>
                Your report mentions physical danger, threats to your location, or crisis. Please do not
                face this alone. Reach out to 112 emergency services immediately.
              </p>
              <a href="tel:112" className="urgent-dial-btn" style={{ minHeight: '40px', padding: '0.5rem 1rem' }}>
                Call 112 (Emergency Police)
              </a>
            </div>
          )}

          {safety.possible_minor && (
            <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--color-urgent-border)' }}>
              <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem' }}>
                Indicators suggest a minor under 18 may be involved. Contact Childline or use Take It Down
                dedicated to minor protections.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a href="tel:1098" className="btn btn-sm btn-secondary">
                  Call 1098 (Childline)
                </a>
                <a
                  href="https://takeitdown.ncmec.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-secondary"
                >
                  Take It Down &rarr;
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section A: What We Understood */}
      <UnderstoodSection
        summary={response.report.summary}
        categories={response.report.categories}
        details={reviewedDetails}
        missingInfo={response.report.missing_information}
        onUpdateDetail={onUpdateDetail}
      />

      {/* Section B: Timeline */}
      <TimelineSection
        timeline={reviewedTimeline}
        onUpdateTimeline={onUpdateTimeline}
      />

      {/* Section C: Preserve Evidence */}
      <EvidenceSection
        evidence={reviewedEvidence}
        onUpdateEvidence={onUpdateEvidence}
      />

      {/* Section D: Next Steps & Verified Resources */}
      <NextStepsSection
        actions={reviewedActions}
        resources={response.resources}
        onUpdateAction={onUpdateAction}
      />

      {/* Limitations Card */}
      <div className="card" style={{ backgroundColor: 'var(--color-bg)' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--color-muted)' }}>Important System Limitations</h3>
        <ul style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', fontSize: '0.88rem', color: 'var(--color-muted)' }}>
          {response.report.limitations.map((lim, i) => (
            <li key={i} style={{ marginBottom: '0.2rem' }}>{lim}</li>
          ))}
        </ul>
      </div>

      {/* Footer Actions */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button type="button" className="btn btn-primary" onClick={onGoToExport}>
          Review and export report &rarr;
        </button>
        <button type="button" className="btn btn-secondary" onClick={onReset}>
          Start a new report
        </button>
      </div>
    </div>
  )
}
