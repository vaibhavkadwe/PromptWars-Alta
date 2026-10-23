/**
 * Plain text export generator for SafeSignal incident reports.
 * Formats user-reviewed incident facts, evidence log, and action plan.
 */

import {
  AnalyzeResponse,
  ReviewedAction,
  ReviewedDetail,
  ReviewedEvidence,
  ReviewedTimeline,
} from '../types/report'

export interface ExportSectionsOptions {
  includeSummary: boolean
  includeCategories: boolean
  includeDetails: boolean
  includeTimeline: boolean
  includeEvidence: boolean
  includeActions: boolean
  includeContacts: boolean
  includeOriginalDescription: boolean
}

export function generateExportText(
  response: AnalyzeResponse,
  reviewedDetails: ReviewedDetail[],
  reviewedTimeline: ReviewedTimeline[],
  reviewedEvidence: ReviewedEvidence[],
  reviewedActions: ReviewedAction[],
  options: ExportSectionsOptions,
  originalDescription?: string,
): string {
  const now = new Date().toISOString().split('T')[0]
  const lines: string[] = []

  // Standard Safety & Legal Header
  lines.push('================================================================================')
  lines.push(`SAFESIGNAL INCIDENT REPORT & ACTION PLAN`)
  lines.push(`Generated: ${now} | Request ID: ${response.request_id}`)
  lines.push(`AI-assisted first-response guidance. NOT legal counsel, police, or counselling.`)
  lines.push('================================================================================')
  lines.push('')

  // 1. Incident Summary
  if (options.includeSummary && response.report.summary) {
    lines.push('--- INCIDENT SUMMARY ---')
    lines.push(response.report.summary)
    lines.push('')
  }

  // 2. Incident Classification
  if (options.includeCategories && response.report.categories.length > 0) {
    lines.push('--- CLASSIFICATION (ORGANISATIONAL LABELS, NOT LEGAL FINDINGS) ---')
    for (const cat of response.report.categories) {
      lines.push(`• [${cat.likelihood.toUpperCase()}] ${cat.id.replace(/_/g, ' ')}`)
      lines.push(`  Rationale: ${cat.rationale}`)
    }
    lines.push('')
  }

  // 3. Extracted Details (only included items; tagged as Confirmed by you or AI-extracted)
  if (options.includeDetails) {
    const includedDetails = reviewedDetails.filter((d) => d.include)
    if (includedDetails.length > 0) {
      lines.push('--- RECORDED INCIDENT DETAILS ---')
      for (const d of includedDetails) {
        const tag = d.confirmed ? '[Confirmed by you]' : '[AI-extracted, unchecked]'
        const val = d.valueOverride?.trim() || d.original.value
        lines.push(`• ${d.original.label}: ${val} ${tag}`)
      }
      lines.push('')
    }
  }

  // 4. Timeline
  if (options.includeTimeline) {
    const includedEvents = reviewedTimeline.filter((t) => t.include)
    if (includedEvents.length > 0) {
      lines.push('--- INCIDENT TIMELINE ---')
      for (const t of includedEvents) {
        const when = t.original.when_text ? t.original.when_text : 'Time unknown'
        lines.push(`• [${when}] (${t.original.certainty}): ${t.original.event}`)
      }
      lines.push('')
    }
  }

  // 5. Evidence Preservation Checklist
  if (options.includeEvidence) {
    const includedEvidence = reviewedEvidence.filter((e) => e.include)
    if (includedEvidence.length > 0) {
      lines.push('--- EVIDENCE PRESERVATION CHECKLIST ---')
      lines.push('Reminder: Preserve original files without alterations. Do not share intimate media.')
      for (const e of includedEvidence) {
        const statusBox = e.confirmed ? '[X]' : '[ ]'
        const filename = e.original.suggested_filename ? ` (File: ${e.original.suggested_filename})` : ''
        lines.push(`${statusBox} ${e.original.item}${filename}`)
        lines.push(`    How to preserve: ${e.original.how_to_preserve}`)
      }
      lines.push('')
    }
  }

  // 6. Action Plan
  if (options.includeActions) {
    const includedActions = reviewedActions.filter((a) => a.include)
    if (includedActions.length > 0) {
      lines.push('--- PRIORITISED NEXT STEPS ---')
      for (const a of includedActions) {
        lines.push(`${a.original.priority}. [Urgency: ${a.original.urgency.toUpperCase()}] ${a.original.title}`)
        lines.push(`   Why: ${a.original.why}`)
      }
      lines.push('')
    }
  }

  // 7. Verified Support & Reporting Contacts
  if (options.includeContacts && response.resources.length > 0) {
    lines.push('--- VERIFIED CONTACTS & REPORTING CHANNELS (INDIA) ---')
    for (const r of response.resources) {
      lines.push(`• ${r.title} [${r.kind.toUpperCase()}: ${r.value}]`)
      lines.push(`  Purpose: ${r.purpose}`)
      lines.push(`  When to use: ${r.when}`)
      lines.push(`  Limitations: ${r.limitations}`)
      lines.push(`  Last verified: ${r.last_checked}`)
    }
    lines.push('')
  }

  // Optional: Original Description (off by default)
  if (options.includeOriginalDescription && originalDescription) {
    lines.push('--- ORIGINAL USER SUBMISSION (FOR YOUR PRIVATE RECORDS) ---')
    lines.push(originalDescription)
    lines.push('')
  }

  // Mandatory Limitations
  lines.push('--- IMPORTANT LIMITATIONS ---')
  for (const lim of response.report.limitations) {
    lines.push(`• ${lim}`)
  }
  lines.push('')
  lines.push('End of Report. Stay safe.')

  return lines.join('\n')
}
