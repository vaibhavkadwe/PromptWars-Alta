import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AnalyzeResponse } from '../types/report'

const MOCK_SAMPLE_RESPONSE: AnalyzeResponse = {
  request_id: 'test-sample-id-123',
  source: 'sample',
  model: null,
  paid_tier: false,
  generated_at: '2026-10-23T10:00:00Z',
  draft: {
    what_happened: 'I met an account named rhea_travels_22 on an app and received a 15000 demand.',
    platform_or_service: 'dating app',
    when_it_happened: 'yesterday',
    account_identifiers: [
      { kind: 'username', value: 'rhea_travels_22', source: 'user_description' },
    ],
    threat_and_demand: 'Extortion demand of 15000 under threat of sharing video.',
    demand_amount_or_deadline: '15000 by tomorrow 8 pm',
    money_transferred: 'not_sent',
    chronology: [
      { when_text: 'Monday', event: 'Video call took place.', source: 'user_description', certainty: 'approximate' },
    ],
    supporting_material_user_has: ['Screenshots of threatening messages'],
    missing_information: [],
    evidence_checklist: [
      { item: 'Threatening chat messages', how_to_preserve: 'Take screenshots showing timestamps and usernames.' },
    ],
    action_suggestions: [
      { title: 'Preserve messages and secure accounts', why: 'Change passwords and turn on MFA.', resource_ids: ['NCRP'] },
    ],
    limitations: ['Not legal advice.'],
  },
  safety: { physical_danger: false, self_harm: false },
  notices: [],
  resource_ids: ['NCRP'],
}

describe('SafeSignal End-to-End User Journey (App Component)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/health') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ai_configured: true, paid_tier: false }),
        })
      }
      if (url === '/api/sample') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_SAMPLE_RESPONSE),
        })
      }
      if (url === '/api/analyze') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_SAMPLE_RESPONSE),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  it('navigates full offline flow: Home -> Triage -> ActionCard -> AiIntro -> Input -> Offline Draft -> Reset', async () => {
    render(<App />)

    // 1. Verify Home screen
    expect(screen.getByRole('heading', { level: 1, name: /Clarity when things feel out of control/i })).toBeDefined()
    expect(screen.getByText('SafeSignal', { selector: '.brand-hero-name' })).toBeDefined()

    // 2. Start triage (accessible name preserves "Start Safety Triage")
    const startBtn = screen.getByRole('button', { name: /Start Safety Triage/i })
    await act(async () => {
      fireEvent.click(startBtn)
    })

    // 3. Triage Screen
    expect(screen.getByRole('heading', { name: /Quick Safety Assessment/i })).toBeDefined()
    const continueBtn = screen.getByRole('button', { name: /Continue to Guidance/i }) as HTMLButtonElement
    expect(continueBtn.disabled).toBe(true)

    // Answer the 3 questions by label
    await act(async () => {
      fireEvent.click(screen.getByLabelText(/No — they are threatening something else/i))
    })
    await act(async () => {
      fireEvent.click(screen.getByLabelText(/No \(18 or older\)/i))
    })
    await act(async () => {
      fireEvent.click(screen.getByLabelText(/No physical danger/i))
    })

    expect(continueBtn.disabled).toBe(false)
    await act(async () => {
      fireEvent.click(continueBtn)
    })

    // 4. ActionCard Screen
    expect(screen.getByRole('heading', { name: /Immediate Safety Actions/i })).toBeDefined()
    const nextAiBtn = screen.getByRole('button', { name: /Next: Optional AI Complaint Drafting/i })
    await act(async () => {
      fireEvent.click(nextAiBtn)
    })

    // 5. AiIntro Screen
    expect(screen.getByRole('heading', { name: /Optional AI Complaint Drafting/i })).toBeDefined()
    const noThanksBtn = screen.getByRole('button', { name: /No thanks — Write the draft myself/i })
    await act(async () => {
      fireEvent.click(noThanksBtn)
    })

    // 6. Input Screen (Offline)
    expect(screen.getByRole('heading', { name: /Prepare Your Complaint Draft \(Offline\)/i })).toBeDefined()
    const descTextarea = screen.getByLabelText(/What happened\?/i)
    await act(async () => {
      fireEvent.change(descTextarea, {
        target: { value: 'Someone is blackmailing me on a messaging app demanding money.' },
      })
    })

    const createDraftBtn = screen.getByRole('button', { name: /Create Offline Complaint Draft/i }) as HTMLButtonElement
    expect(createDraftBtn.disabled).toBe(false)
    await act(async () => {
      fireEvent.click(createDraftBtn)
    })

    // 7. Draft Screen
    expect(screen.getByRole('heading', { name: /Official Complaint Preparation Draft/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Print \/ Save a copy/i })).toBeDefined()

    // 8. Test Two-Step Reset / Start Over
    const startOverBtn = screen.getByRole('button', { name: /Start over/i })
    await act(async () => {
      fireEvent.click(startOverBtn)
    })
    expect(screen.getByText(/Tap again to clear everything/i)).toBeDefined()

    await act(async () => {
      fireEvent.click(screen.getByText(/Tap again to clear everything/i))
    })

    // Returned to Home
    expect(screen.getByRole('heading', { level: 1, name: /Clarity when things feel out of control/i })).toBeDefined()
  })

  it('opens and closes Urgent Help modal cleanly', async () => {
    render(<App />)

    const urgentBtn = screen.getByRole('button', { name: /Urgent Help Contacts/i })
    await act(async () => {
      fireEvent.click(urgentBtn)
    })

    expect(screen.getByRole('heading', { name: /Immediate & Urgent Help/i })).toBeDefined()
    expect(screen.getByText(/112 .* Immediate Physical Danger/i)).toBeDefined()
    expect(screen.getByText(/1098 .* Childline/i)).toBeDefined()

    const closeBtn = screen.getByRole('button', { name: /Close Urgent Help/i })
    await act(async () => {
      fireEvent.click(closeBtn)
    })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Immediate & Urgent Help/i })).toBeNull()
    })
  })
})
