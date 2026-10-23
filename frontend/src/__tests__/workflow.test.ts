import { describe, expect, it } from 'vitest'
import { validateTxtFile } from '../lib/validateTxtFile'
import { INITIAL_STATE, workflowReducer } from '../state/workflow'

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

describe('workflowReducer & Step Stack Navigation', () => {
  it('initializes with home step and stepStack ["home"]', () => {
    expect(INITIAL_STATE.step).toBe('home')
    expect(INITIAL_STATE.stepStack).toEqual(['home'])
  })

  it('pushes steps onto stack and goes back to previous step without data loss', () => {
    // 1. Home -> Triage
    let state = workflowReducer(INITIAL_STATE, { type: 'GO_TO_STEP', payload: 'triage' })
    expect(state.step).toBe('triage')
    expect(state.stepStack).toEqual(['home', 'triage'])

    // 2. Set triage answers
    state = workflowReducer(state, {
      type: 'SET_TRIAGE_ANSWER',
      payload: { field: 'money', value: 'yes' },
    })
    state = workflowReducer(state, {
      type: 'SET_TRIAGE_ANSWER',
      payload: { field: 'age', value: 'no' },
    })
    state = workflowReducer(state, {
      type: 'SET_TRIAGE_ANSWER',
      payload: { field: 'danger', value: 'no' },
    })

    // 3. Submit triage -> actionCard
    state = workflowReducer(state, { type: 'SUBMIT_TRIAGE' })
    expect(state.step).toBe('actionCard')
    expect(state.actionCard).toBeDefined()
    expect(state.stepStack).toEqual(['home', 'triage', 'actionCard'])

    // 4. ActionCard -> aiIntro
    state = workflowReducer(state, { type: 'GO_TO_STEP', payload: 'aiIntro' })
    expect(state.step).toBe('aiIntro')
    expect(state.stepStack).toEqual(['home', 'triage', 'actionCard', 'aiIntro'])

    // 5. aiIntro -> input
    state = workflowReducer(state, { type: 'CHOOSE_AI_PATH', payload: true })
    expect(state.step).toBe('input')
    expect(state.useAi).toBe(true)

    // 6. Enter input text
    state = workflowReducer(state, {
      type: 'SET_INPUT_DATA',
      payload: { description: 'A detailed extortion complaint with more than 10 characters.' },
    })
    expect(state.inputData.description).toContain('detailed extortion complaint')

    // 7. Test GO_BACK: Back should return to aiIntro, keeping inputData intact!
    state = workflowReducer(state, { type: 'GO_BACK' })
    expect(state.step).toBe('aiIntro')
    expect(state.inputData.description).toContain('detailed extortion complaint')

    // 8. Back again -> actionCard
    state = workflowReducer(state, { type: 'GO_BACK' })
    expect(state.step).toBe('actionCard')
    expect(state.triageAnswers.money).toBe('yes')
  })

  it('cancel analysis aborts and returns to reviewOutgoing or input', () => {
    const controller = new AbortController()
    let state = workflowReducer(INITIAL_STATE, { type: 'GO_TO_STEP', payload: 'input' })
    state = workflowReducer(state, { type: 'START_ANALYSIS', payload: controller })
    expect(state.step).toBe('analyzing')
    expect(state.isSubmitting).toBe(true)

    state = workflowReducer(state, { type: 'CANCEL_ANALYSIS' })
    expect(state.isSubmitting).toBe(false)
    expect(state.abortController).toBeNull()
    expect(controller.signal.aborted).toBe(true)
    expect(['input', 'reviewOutgoing']).toContain(state.step)
  })

  it('reset clears all in-memory state back to initial state', () => {
    let state = workflowReducer(INITIAL_STATE, { type: 'GO_TO_STEP', payload: 'input' })
    state = workflowReducer(state, {
      type: 'SET_INPUT_DATA',
      payload: { description: 'Confidential text that must be cleared.' },
    })
    state = workflowReducer(state, { type: 'RESET' })

    expect(state.step).toBe('home')
    expect(state.stepStack).toEqual(['home'])
    expect(state.inputData.description).toBe('')
    expect(state.triageAnswers.money).toBeNull()
    expect(state.actionCard).toBeNull()
    expect(state.draft).toBeNull()
  })
})
