import { describe, expect, it } from 'vitest'
import { generateExportText } from '../lib/exportText'
import { validateTxtFile } from '../lib/validateTxtFile'
import { INITIAL_STATE, workflowReducer } from '../state/workflow'
import {
  AnalyzeResponse,
  ReviewedAction,
  ReviewedDetail,
  ReviewedEvidence,
  ReviewedTimeline,
} from '../types/report'

describe('validateTxtFile', () => {
  it('accepts valid small UTF-8 txt file', async () => {
    const file = new File(['Hello world, blackmail evidence transcript.'], 'notes.txt', {
      type: 'text/plain',
    })
    const res = await validateTxtFile(file)
    expect(res.valid).toBe(true)
    expect(res.content).toContain('blackmail evidence transcript')
  })

  it('rejects wrong extension or non-text file', async () => {
    const file = new File(['fake image data'], 'photo.png', {
      type: 'image/png',
    })
    const res = await validateTxtFile(file)
    expect(res.valid).toBe(false)
    expect(res.error).toContain('Only plain text (.txt) files are supported')
  })

  it('rejects oversize files (>100 KB)', async () => {
    const hugeContent = 'a'.repeat(101 * 1024)
    const file = new File([hugeContent], 'huge.txt', {
      type: 'text/plain',
    })
    const res = await validateTxtFile(file)
    expect(res.valid).toBe(false)
    expect(res.error).toContain('100 KB limit')
  })

  it('rejects binary files containing NUL bytes', async () => {
    const binaryData = new Uint8Array([72, 101, 108, 0, 108, 111]) // "Hel\0lo"
    const file = new File([binaryData], 'binary.txt', {
      type: 'text/plain',
    })
    const res = await validateTxtFile(file)
    expect(res.valid).toBe(false)
    expect(res.error).toContain('Binary or non-text content detected')
  })
})

describe('exportText', () => {
  const mockResponse: AnalyzeResponse = {
    request_id: 'test-req-123',
    source: 'sample',
    model: null,
    paid_tier: false,
    generated_at: '2026-10-23T10:00:00Z',
    report: {
      summary: 'Extortion demand received via dating app.',
      categories: [
        {
          id: 'THREAT_TO_SHARE_IMAGES',
          likelihood: 'stated',
          rationale: 'Threatened to broadcast video.',
        },
      ],
      extracted_details: [],
      timeline: [],
      missing_information: [],
      risk: {
        level: 'elevated',
        factors: ['impending deadline'],
        physical_danger_mentioned: false,
        self_harm_mentioned: false,
        possible_minor: false,
      },
      actions: [],
      evidence_items: [],
      limitations: ['Not legal advice.'],
    },
    safety: { physical_danger: false, self_harm: false, possible_minor: false },
    resources: [],
  }

  const reviewedDetails: ReviewedDetail[] = [
    {
      id: 'd1',
      original: {
        kind: 'username',
        label: 'Sender Handle',
        value: 'rhea_travels_22',
        source: 'user_description',
        basis: 'stated',
      },
      include: true,
      confirmed: true,
    },
    {
      id: 'd2',
      original: {
        kind: 'money_demand',
        label: 'Demanded Amount',
        value: '15000',
        source: 'user_description',
        basis: 'inferred',
      },
      include: true,
      confirmed: false,
    },
    {
      id: 'd3',
      original: {
        kind: 'platform',
        label: 'Irrelevant Platform',
        value: 'random_app',
        source: 'user_description',
        basis: 'inferred',
      },
      include: false, // Removed by user
      confirmed: false,
    },
  ]

  const reviewedTimeline: ReviewedTimeline[] = []
  const reviewedEvidence: ReviewedEvidence[] = []
  const reviewedActions: ReviewedAction[] = []

  it('excludes removed items and labels confirmed vs AI items', () => {
    const text = generateExportText(
      mockResponse,
      reviewedDetails,
      reviewedTimeline,
      reviewedEvidence,
      reviewedActions,
      {
        includeSummary: true,
        includeCategories: true,
        includeDetails: true,
        includeTimeline: true,
        includeEvidence: true,
        includeActions: true,
        includeContacts: true,
        includeOriginalDescription: false, // Default is false
      },
      'My secret raw description text that should be excluded by default',
    )

    // Confirmed detail has confirmed tag
    expect(text).toContain('Sender Handle: rhea_travels_22 [Confirmed by you]')
    // Unconfirmed detail has AI tag
    expect(text).toContain('Demanded Amount: 15000 [AI-extracted, unchecked]')
    // Removed item must NEVER appear
    expect(text).not.toContain('random_app')
    expect(text).not.toContain('Irrelevant Platform')
    // Original description excluded by default
    expect(text).not.toContain('My secret raw description text')
  })
})

describe('workflowReducer RESET', () => {
  it('clears all incident draft, response, and review state back to initial state', () => {
    const stateWithData = {
      ...INITIAL_STATE,
      step: 'report' as const,
      draft: {
        ...INITIAL_STATE.draft,
        description: 'Sensitive user threat story',
        evidence_text: 'Secret payment info',
      },
      response: {} as AnalyzeResponse,
      reviewedDetails: [
        {
          id: '1',
          original: {
            kind: 'username' as const,
            label: 'Test',
            value: 'val',
            source: 'user_description' as const,
            basis: 'stated' as const,
          },
          include: true,
          confirmed: true,
        },
      ],
      health: { ai_configured: true, paid_tier: true },
    }

    const resetState = workflowReducer(stateWithData, { type: 'RESET' })

    expect(resetState.step).toBe('home')
    expect(resetState.draft.description).toBe('')
    expect(resetState.draft.evidence_text).toBe('')
    expect(resetState.response).toBeNull()
    expect(resetState.reviewedDetails).toEqual([])
    // Preserves health info
    expect(resetState.health?.ai_configured).toBe(true)
  })
})
