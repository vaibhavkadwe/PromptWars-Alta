/**
 * SafeSignal single-page state machine and workflow reducer.
 * Strictly in-memory; no localStorage, sessionStorage, cookies, or IndexedDB.
 */

import { ActionCard, AgeAnswer, DangerAnswer, MoneyAnswer, triage } from '../triage/rules'
import {
  AnalyzeResponse,
  ComplaintDraft,
  HealthResponse,
} from '../types/report'

export type Step =
  | 'home'
  | 'triage'
  | 'actionCard'
  | 'aiIntro'
  | 'input'
  | 'reviewOutgoing'
  | 'analyzing'
  | 'draft'
  | 'error'

export interface InputData {
  description: string
  evidenceText: string
  platform: string
  incidentWhen: string
  moneyStatus: 'sent' | 'not_sent' | 'unsure' | null
  adultConfirmed: boolean
  consentAi: boolean
}

export interface RedactionOptions {
  hidePhones: boolean
  hideEmails: boolean
  hideAccounts: boolean
}

export interface WorkflowState {
  step: Step
  stepStack: Step[]
  triageAnswers: {
    money: MoneyAnswer | null
    age: AgeAnswer | null
    danger: DangerAnswer | null
  }
  actionCard: ActionCard | null
  useAi: boolean
  inputData: InputData
  redactionOptions: RedactionOptions
  redactionMap: Record<string, string>
  outgoingText: {
    description: string
    evidenceText: string
  }
  isSubmitting: boolean
  abortController: AbortController | null
  draft: ComplaintDraft | null
  isSample: boolean
  responseMetadata: {
    requestId?: string
    model?: string | null
    generatedAt?: string
    notices?: string[]
    resourceIds?: string[]
  } | null
  error: { code: string; message: string; retryAfter?: number } | null
  health: HealthResponse | null
  showUrgentModal: boolean
  showPrivacyModal: boolean
}

export const INITIAL_INPUT_DATA: InputData = {
  description: '',
  evidenceText: '',
  platform: '',
  incidentWhen: '',
  moneyStatus: null,
  adultConfirmed: false,
  consentAi: false,
}

export const INITIAL_REDACTION_OPTIONS: RedactionOptions = {
  hidePhones: true,
  hideEmails: true,
  hideAccounts: true,
}

export const INITIAL_STATE: WorkflowState = {
  step: 'home',
  stepStack: ['home'],
  triageAnswers: {
    money: null,
    age: null,
    danger: null,
  },
  actionCard: null,
  useAi: true,
  inputData: INITIAL_INPUT_DATA,
  redactionOptions: INITIAL_REDACTION_OPTIONS,
  redactionMap: {},
  outgoingText: {
    description: '',
    evidenceText: '',
  },
  isSubmitting: false,
  abortController: null,
  draft: null,
  isSample: false,
  responseMetadata: null,
  error: null,
  health: null,
  showUrgentModal: false,
  showPrivacyModal: false,
}

export const FICTIONAL_SCENARIO_INPUT: InputData = {
  description:
    "I met someone calling themselves 'rhea_travels_22' on a dating app. We had a video call on Monday. " +
    "Later that week I received a message: 'Pay 15000 by tomorrow 8 pm or I send the video to all your followers'. " +
    "They provided a UPI ID: quickpay.help@examplebank. I haven't sent any money.",
  evidenceText: "Payment requested to quickpay.help@examplebank by tomorrow 8 pm.",
  platform: "dating app",
  incidentWhen: "Monday and later that week",
  moneyStatus: "not_sent",
  adultConfirmed: true,
  consentAi: true,
}

export type WorkflowAction =
  | { type: 'GO_TO_STEP'; payload: Step }
  | { type: 'GO_BACK' }
  | { type: 'POP_STEP' }
  | { type: 'SET_TRIAGE_ANSWER'; payload: { field: 'money' | 'age' | 'danger'; value: string } }
  | { type: 'SUBMIT_TRIAGE' }
  | { type: 'CHOOSE_AI_PATH'; payload: boolean }
  | { type: 'SET_INPUT_DATA'; payload: Partial<InputData> }
  | { type: 'FILL_FICTIONAL_EXAMPLE' }
  | { type: 'SET_REDACTION_OPTIONS'; payload: Partial<RedactionOptions> }
  | { type: 'PREPARE_OUTGOING'; payload: { description: string; evidenceText: string; tokenMap: Record<string, string> } }
  | { type: 'START_ANALYSIS'; payload: AbortController }
  | { type: 'ANALYSIS_SUCCESS'; payload: AnalyzeResponse }
  | { type: 'ANALYSIS_ERROR'; payload: { code: string; message: string; retryAfter?: number } }
  | { type: 'CANCEL_ANALYSIS' }
  | { type: 'UPDATE_DRAFT'; payload: Partial<ComplaintDraft> }
  | { type: 'SET_MANUAL_DRAFT'; payload: ComplaintDraft }
  | { type: 'SET_HEALTH'; payload: HealthResponse }
  | { type: 'TOGGLE_URGENT_MODAL'; payload?: boolean }
  | { type: 'TOGGLE_PRIVACY_MODAL'; payload?: boolean }
  | { type: 'RESET' }

export function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'GO_TO_STEP': {
      const nextStep = action.payload
      if (nextStep === state.step) return state
      // Synchronize pushState without sensitive data
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ step: nextStep }, '')
      }
      return {
        ...state,
        step: nextStep,
        stepStack: [...state.stepStack, nextStep],
        error: null,
      }
    }

    case 'GO_BACK': {
      if (state.stepStack.length <= 1) {
        return state
      }
      const newStack = [...state.stepStack]
      newStack.pop() // remove current step
      let prevStep = newStack[newStack.length - 1] || 'home'

      // analyzing is never a target for back/forward
      if (prevStep === 'analyzing') {
        prevStep = 'input'
      }

      if (typeof window !== 'undefined' && window.history) {
        window.history.back()
      }

      return {
        ...state,
        step: prevStep,
        stepStack: newStack,
        isSubmitting: false,
      }
    }

    case 'POP_STEP': {
      // Triggered by window popstate
      if (state.stepStack.length <= 1) {
        return { ...state, step: 'home', stepStack: ['home'] }
      }
      const newStack = [...state.stepStack]
      newStack.pop()
      let prevStep = newStack[newStack.length - 1] || 'home'
      if (prevStep === 'analyzing') {
        prevStep = 'input'
      }
      return {
        ...state,
        step: prevStep,
        stepStack: newStack,
        isSubmitting: false,
      }
    }

    case 'SET_TRIAGE_ANSWER': {
      const { field, value } = action.payload
      return {
        ...state,
        triageAnswers: {
          ...state.triageAnswers,
          [field]: value,
        },
      }
    }

    case 'SUBMIT_TRIAGE': {
      const { money, age, danger } = state.triageAnswers
      if (!money || !age || !danger) return state

      const card = triage({ money, age, danger })
      const nextStep: Step = 'actionCard'
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ step: nextStep }, '')
      }

      return {
        ...state,
        actionCard: card,
        step: nextStep,
        stepStack: [...state.stepStack, nextStep],
        useAi: !card.isAiDisabled,
      }
    }

    case 'CHOOSE_AI_PATH': {
      const useAi = action.payload && (!state.actionCard || !state.actionCard.isAiDisabled)
      const nextStep: Step = 'input'
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ step: nextStep }, '')
      }
      return {
        ...state,
        useAi,
        step: nextStep,
        stepStack: [...state.stepStack, nextStep],
      }
    }

    case 'SET_INPUT_DATA': {
      return {
        ...state,
        inputData: {
          ...state.inputData,
          ...action.payload,
        },
      }
    }

    case 'FILL_FICTIONAL_EXAMPLE': {
      // Set fictional triage + input
      const fictionalTriage = triage({ money: 'no', age: 'no', danger: 'no' })
      return {
        ...state,
        triageAnswers: { money: 'no', age: 'no', danger: 'no' },
        actionCard: fictionalTriage,
        useAi: true,
        inputData: FICTIONAL_SCENARIO_INPUT,
      }
    }

    case 'SET_REDACTION_OPTIONS': {
      return {
        ...state,
        redactionOptions: {
          ...state.redactionOptions,
          ...action.payload,
        },
      }
    }

    case 'PREPARE_OUTGOING': {
      return {
        ...state,
        outgoingText: {
          description: action.payload.description,
          evidenceText: action.payload.evidenceText,
        },
        redactionMap: action.payload.tokenMap,
        step: 'reviewOutgoing',
        stepStack: [...state.stepStack, 'reviewOutgoing'],
      }
    }

    case 'START_ANALYSIS': {
      return {
        ...state,
        isSubmitting: true,
        abortController: action.payload,
        step: 'analyzing',
        error: null,
      }
    }

    case 'ANALYSIS_SUCCESS': {
      const resp = action.payload
      const nextStep: Step = 'draft'
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ step: nextStep }, '')
      }
      return {
        ...state,
        isSubmitting: false,
        abortController: null,
        draft: resp.draft,
        isSample: resp.source === 'sample',
        responseMetadata: {
          requestId: resp.request_id,
          model: resp.model,
          generatedAt: resp.generated_at,
          notices: resp.notices,
          resourceIds: resp.resource_ids,
        },
        step: nextStep,
        stepStack: [...state.stepStack, nextStep],
      }
    }

    case 'ANALYSIS_ERROR': {
      return {
        ...state,
        isSubmitting: false,
        abortController: null,
        error: action.payload,
        step: 'error',
      }
    }

    case 'CANCEL_ANALYSIS': {
      if (state.abortController) {
        state.abortController.abort()
      }
      // Return to reviewOutgoing or input
      const prevStep: Step = state.useAi ? 'reviewOutgoing' : 'input'
      return {
        ...state,
        isSubmitting: false,
        abortController: null,
        step: prevStep,
      }
    }

    case 'UPDATE_DRAFT': {
      if (!state.draft) return state
      return {
        ...state,
        draft: {
          ...state.draft,
          ...action.payload,
        },
      }
    }

    case 'SET_MANUAL_DRAFT': {
      const nextStep: Step = 'draft'
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ step: nextStep }, '')
      }
      return {
        ...state,
        draft: action.payload,
        isSample: false,
        step: nextStep,
        stepStack: [...state.stepStack, nextStep],
      }
    }

    case 'SET_HEALTH': {
      return { ...state, health: action.payload }
    }

    case 'TOGGLE_URGENT_MODAL': {
      return {
        ...state,
        showUrgentModal: action.payload ?? !state.showUrgentModal,
      }
    }

    case 'TOGGLE_PRIVACY_MODAL': {
      return {
        ...state,
        showPrivacyModal: action.payload ?? !state.showPrivacyModal,
      }
    }

    case 'RESET': {
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ step: 'home' }, '')
      }
      return {
        ...INITIAL_STATE,
        health: state.health, // preserve health check status
      }
    }

    default:
      return state
  }
}
