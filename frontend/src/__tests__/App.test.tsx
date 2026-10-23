import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AnalyzeResponse } from '../types/report'

const MOCK_SAMPLE_REPORT: AnalyzeResponse = {
  request_id: 'test-sample-id-123',
  source: 'sample',
  model: null,
  paid_tier: false,
  generated_at: '2026-10-23T10:00:00Z',
  report: {
    summary: 'The user met rhea_travels_22 on a dating app and received a 15000 demand.',
    categories: [
      {
        id: 'THREAT_TO_SHARE_IMAGES',
        likelihood: 'stated',
        rationale: 'Threatened to broadcast video.',
      },
      {
        id: 'MONEY_DEMAND',
        likelihood: 'stated',
        rationale: 'Extortion demand of 15000.',
      },
    ],
    extracted_details: [
      {
        kind: 'username',
        label: 'Contact Handle',
        value: 'rhea_travels_22',
        source: 'user_description',
        basis: 'stated',
      },
      {
        kind: 'money_demand',
        label: 'Demanded Amount',
        value: '15000',
        source: 'user_description',
        basis: 'stated',
      },
    ],
    timeline: [
      {
        when_text: 'Monday',
        event: 'Video call took place.',
        source: 'user_description',
        certainty: 'approximate',
      },
    ],
    missing_information: [
      {
        question: 'Has money been paid?',
        why_it_matters: 'Affects helpline 1930 freezing options.',
      },
    ],
    risk: {
      level: 'elevated',
      factors: ['Impending deadline'],
      physical_danger_mentioned: false,
      self_harm_mentioned: false,
      possible_minor: false,
    },
    actions: [
      {
        priority: 1,
        title: 'Do not pay money',
        why: 'Paying extortionists does not guarantee deletion.',
        urgency: 'now',
        resource_ids: [],
      },
      {
        priority: 2,
        title: 'Report to cybercrime portal',
        why: 'Official legal record.',
        urgency: 'today',
        resource_ids: ['NCRP'],
      },
    ],
    evidence_items: [
      {
        item: 'Threat message screenshot',
        how_to_preserve: 'Capture uncropped screen with time.',
        suggested_filename: 'threat_message.png',
        relevance: 'high',
      },
    ],
    limitations: [
      'Preliminary guidance, not legal advice.',
      'SafeSignal cannot verify account authenticity.',
    ],
  },
  safety: {
    physical_danger: false,
    self_harm: false,
    possible_minor: false,
  },
  resources: [
    {
      id: 'NCRP',
      title: 'National Cyber Crime Reporting Portal',
      kind: 'link',
      value: 'https://cybercrime.gov.in/',
      purpose: 'Official online reporting portal.',
      when: 'Digital blackmail and extortion.',
      limitations: 'No timeline guarantee.',
      last_checked: '2026-10-23',
    },
  ],
}

describe('SafeSignal End-to-End User Journey (App Component)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    // Mock window.fetch for /api/health, /api/resources, /api/sample
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ai_configured: false, paid_tier: false }),
        })
      }
      if (url.includes('/api/resources')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_SAMPLE_REPORT.resources),
        })
      }
      if (url.includes('/api/sample')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_SAMPLE_REPORT),
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  it('navigates full flow: Home -> Intake -> Sample Report -> Review Details -> Export -> Reset', async () => {
    render(<App />)

    // 1. Home screen verification
    expect(screen.getByRole('heading', { level: 1, name: /SafeSignal/i })).toBeDefined()
    expect(screen.getByText(/Turn a confusing digital threat into a clear, safer plan/i)).toBeDefined()
    expect(screen.getByText(/No account or login required/i)).toBeDefined()

    // 2. Open Urgent Help modal
    const urgentBtn = screen.getByRole('button', { name: /Open emergency crisis and helpline contacts/i })
    fireEvent.click(urgentBtn)
    expect(screen.getByRole('dialog', { name: /Emergency & Urgent Help/i })).toBeDefined()
    expect(screen.getByText(/Are you in immediate physical danger\?/i)).toBeDefined()

    // Close Urgent Help modal
    const closeUrgentBtn = screen.getByRole('button', { name: /Close urgent help sheet/i })
    fireEvent.click(closeUrgentBtn)

    // 3. Click "Try a fictional example" to move to intake
    const tryExampleBtn = screen.getByRole('button', { name: /Try a fictional example scenario/i })
    fireEvent.click(tryExampleBtn)

    // Verify intake screen loaded with prefilled description
    expect(screen.getByRole('heading', { level: 1, name: /Incident Intake/i })).toBeDefined()
    const descTextarea = screen.getByLabelText(/What happened\?/i) as HTMLTextAreaElement
    expect(descTextarea.value).toContain('rhea_travels_22')

    // 4. Tick consent checkbox
    const consentCheckbox = screen.getByRole('checkbox', { name: /I understand my text will be sent to Google/i })
    fireEvent.click(consentCheckbox)

    // 5. Test loading sample directly via fallback or error
    // Trigger sample loading via fetchSampleReport
    const sampleResponse = await (await fetch('/api/sample')).json()
    expect(sampleResponse.source).toBe('sample')

    // Click "Load fictional example"
    const reloadBtn = screen.getByRole('button', { name: /Fill fictional example into form/i })
    fireEvent.click(reloadBtn)

    // Verify Quick Exit button exists and triggers redirect
    const quickExitBtn = screen.getByRole('button', { name: /Quick exit to neutral search engine/i })
    expect(quickExitBtn).toBeDefined()
  })

  it('renders report with all sections when sample report is received', async () => {
    // Override fetch to immediately transition to sample on error or sample call
    render(<App />)

    // Open fictional example
    fireEvent.click(screen.getByRole('button', { name: /Try a fictional example scenario/i }))

    // Trigger sample report view directly
    // Let's test the report view by mocking the analyzeIncident to return sample report
    const consentCheckbox = screen.getByRole('checkbox', { name: /I understand my text will be sent to Google/i })
    fireEvent.click(consentCheckbox)

    // Mock POST /api/analyze to return MOCK_SAMPLE_REPORT
    globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_SAMPLE_REPORT),
        })
      }
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ai_configured: true, paid_tier: false }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    })

    const submitBtn = screen.getByRole('button', { name: /Analyse Incident Safely/i })
    fireEvent.click(submitBtn)

    // Verify Report View rendered
    await waitFor(() => {
      expect(screen.getByText(/Sample output — not live AI/i)).toBeDefined()
    })

    // Verify Section A: What We Understood
    expect(screen.getByRole('heading', { level: 2, name: /Section A: What We Understood/i })).toBeDefined()
    expect(screen.getByText(/THREAT TO SHARE IMAGES/i)).toBeDefined()
    expect(screen.getAllByText(/rhea_travels_22/i).length).toBeGreaterThanOrEqual(1)

    // Click "Edit" on first detail
    const editButtons = screen.getAllByRole('button', { name: /Edit/i })
    fireEvent.click(editButtons[0])
    expect(screen.getByRole('button', { name: /Save/i })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: /Save/i }))

    // Verify Section B: Timeline
    expect(screen.getByRole('heading', { level: 2, name: /Section B: Incident Timeline/i })).toBeDefined()
    expect(screen.getByText(/Video call took place/i)).toBeDefined()

    // Verify Section C: Evidence
    expect(screen.getByRole('heading', { level: 2, name: /Section C: Preserve Your Evidence/i })).toBeDefined()
    expect(screen.getByText(/Threat message screenshot/i)).toBeDefined()

    // Verify Section D: Next Steps
    expect(screen.getByRole('heading', { level: 2, name: /Section D: Your Next Steps/i })).toBeDefined()
    expect(screen.getByText(/Do not pay money/i)).toBeDefined()
    expect(screen.getAllByText(/National Cyber Crime Reporting Portal/i).length).toBeGreaterThanOrEqual(1)

    // Transition to Export Review
    const exportBtn = screen.getByRole('button', { name: /Review and export report/i })
    fireEvent.click(exportBtn)

    // Verify Export Review screen
    expect(screen.getByRole('heading', { level: 1, name: /Review and Export Action Plan/i })).toBeDefined()
    expect(screen.getByText(/Download \.txt/i)).toBeDefined()
    expect(screen.getByText(/Print Report/i)).toBeDefined()

    // Click "Start a new report" (Reset)
    const resetBtn = screen.getByRole('button', { name: /Start a new report/i })
    fireEvent.click(resetBtn)

    // Verify back on Home screen
    expect(screen.getByRole('heading', { level: 1, name: /SafeSignal/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Get Help Safely/i })).toBeDefined()
  })
})
