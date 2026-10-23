/**
 * State machine and workflow reducer for SafeSignal.
 * Stores all incident data in-memory only.
 */

import { ExportSectionsOptions } from '../lib/exportText'
import {
  AnalyzeResponse,
  CategoryId,
  HealthResponse,
  IncidentDetails,
  ReviewedAction,
  ReviewedDetail,
  ReviewedEvidence,
  ReviewedTimeline,
} from '../types/report'

export type Step = 'home' | 'intake' | 'analyzing' | 'report' | 'export' | 'error'

export interface DraftState {
  description: string
  evidence_text: string
  details: IncidentDetails
  consent_ai_processing: boolean
}

export interface WorkflowState {
  step: Step
  draft: DraftState
  response: AnalyzeResponse | null
  reviewedDetails: ReviewedDetail[]
  reviewedTimeline: ReviewedTimeline[]
  reviewedEvidence: ReviewedEvidence[]
  reviewedActions: ReviewedAction[]
  exportOptions: ExportSectionsOptions
  abortController: AbortController | null
  error: { code: string; message: string; retryAfter?: number } | null
  health: HealthResponse | null
  showUrgentModal: boolean
  showPrivacyModal: boolean
}

export const INITIAL_DRAFT: DraftState = {
  description: '',
  evidence_text: '',
  details: {
    incident_when: '',
    platform: '',
    threat_types: [],
    money_demanded: null,
    more_images_demanded: null,
    immediate_disclosure_threat: null,
    feels_physically_unsafe: false,
    may_be_under_18: false,
  },
  consent_ai_processing: false,
}

export const INITIAL_EXPORT_OPTIONS: ExportSectionsOptions = {
  includeSummary: true,
  includeCategories: true,
  includeDetails: true,
  includeTimeline: true,
  includeEvidence: true,
  includeActions: true,
  includeContacts: true,
  includeOriginalDescription: false, // OFF by default
}

export const INITIAL_STATE: WorkflowState = {
  step: 'home',
  draft: INITIAL_DRAFT,
  response: null,
  reviewedDetails: [],
  reviewedTimeline: [],
  reviewedEvidence: [],
  reviewedActions: [],
  exportOptions: INITIAL_EXPORT_OPTIONS,
  abortController: null,
  error: null,
  health: null,
  showUrgentModal: false,
  showPrivacyModal: false,
}

export const FICTIONAL_SCENARIO_TEXT =
  "I met someone calling themselves 'rhea_travels_22' on a dating app. We moved to a video call on Monday. " +
  "Later that week I received a message: 'Pay 15000 by tomorrow 8 pm or I send the video to all your followers'. " +
  "They provided a UPI ID: quickpay.help@examplebank. I don't know what to do."

export type WorkflowAction =
  | { type: 'SET_STEP'; payload: Step }
  | { type: 'SET_DRAFT'; payload: Partial<DraftState> }
  | { type: 'SET_DETAILS'; payload: Partial<IncidentDetails> }
  | { type: 'TOGGLE_THREAT_TYPE'; payload: CategoryId }
  | { type: 'FILL_FICTIONAL_EXAMPLE' }
  | { type: 'START_ANALYSIS'; payload: AbortController }
  | { type: 'ANALYSIS_SUCCESS'; payload: AnalyzeResponse }
  | { type: 'ANALYSIS_ERROR'; payload: { code: string; message: string; retryAfter?: number } }
  | { type: 'CANCEL_ANALYSIS' }
  | { type: 'UPDATE_DETAIL'; payload: { id: string; include?: boolean; confirmed?: boolean; valueOverride?: string } }
  | { type: 'UPDATE_TIMELINE'; payload: { id: string; include: boolean } }
  | { type: 'UPDATE_EVIDENCE'; payload: { id: string; include?: boolean; confirmed?: boolean } }
  | { type: 'UPDATE_ACTION'; payload: { id: string; include: boolean } }
  | { type: 'SET_EXPORT_OPTIONS'; payload: Partial<ExportSectionsOptions> }
  | { type: 'SET_HEALTH'; payload: HealthResponse }
  | { type: 'TOGGLE_URGENT_MODAL'; payload?: boolean }
  | { type: 'TOGGLE_PRIVACY_MODAL'; payload?: boolean }
  | { type: 'RESET' }

export function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload }

    case 'SET_DRAFT':
      return {
        ...state,
        draft: { ...state.draft, ...action.payload },
      }

    case 'SET_DETAILS':
      return {
        ...state,
        draft: {
          ...state.draft,
          details: { ...state.draft.details, ...action.payload },
        },
      }

    case 'TOGGLE_THREAT_TYPE': {
      const current = state.draft.details.threat_types
      const exists = current.includes(action.payload)
      const updated = exists ? current.filter((t) => t !== action.payload) : [...current, action.payload]
      return {
        ...state,
        draft: {
          ...state.draft,
          details: { ...state.draft.details, threat_types: updated },
        },
      }
    }

    case 'FILL_FICTIONAL_EXAMPLE':
      return {
        ...state,
        step: 'intake',
        draft: {
          ...state.draft,
          description: FICTIONAL_SCENARIO_TEXT,
          evidence_text: 'Payment demand sent to UPI quickpay.help@examplebank. Threat deadline stated: tomorrow 8 pm.',
          details: {
            incident_when: 'Monday video call, threat received later that week',
            platform: 'dating app',
            threat_types: ['THREAT_TO_SHARE_IMAGES', 'MONEY_DEMAND', 'THREAT_TO_CONTACT_OTHERS'],
            money_demanded: true,
            more_images_demanded: false,
            immediate_disclosure_threat: true,
            feels_physically_unsafe: false,
            may_be_under_18: false,
          },
          // Keep consent as user must tick it themselves or can be set
          consent_ai_processing: false,
        },
      }

    case 'START_ANALYSIS':
      return {
        ...state,
        step: 'analyzing',
        abortController: action.payload,
        error: null,
      }

    case 'ANALYSIS_SUCCESS': {
      const resp = action.payload
      const rep = resp.report

      const reviewedDetails: ReviewedDetail[] = rep.extracted_details.map((d, i) => ({
        id: `detail-${i}`,
        original: d,
        include: true,
        confirmed: d.basis === 'stated',
        valueOverride: undefined,
      }))

      const reviewedTimeline: ReviewedTimeline[] = rep.timeline.map((t, i) => ({
        id: `timeline-${i}`,
        original: t,
        include: true,
      }))

      const reviewedEvidence: ReviewedEvidence[] = rep.evidence_items.map((e, i) => ({
        id: `evidence-${i}`,
        original: e,
        include: true,
        confirmed: false,
      }))

      const reviewedActions: ReviewedAction[] = rep.actions.map((a, i) => ({
        id: `action-${i}`,
        original: a,
        include: true,
      }))

      return {
        ...state,
        step: 'report',
        response: resp,
        reviewedDetails,
        reviewedTimeline,
        reviewedEvidence,
        reviewedActions,
        abortController: null,
        error: null,
      }
    }

    case 'ANALYSIS_ERROR':
      return {
        ...state,
        step: 'error',
        error: action.payload,
        abortController: null,
      }

    case 'CANCEL_ANALYSIS':
      if (state.abortController) {
        state.abortController.abort()
      }
      return {
        ...state,
        step: 'intake',
        abortController: null,
      }

    case 'UPDATE_DETAIL': {
      const { id, include, confirmed, valueOverride } = action.payload
      return {
        ...state,
        reviewedDetails: state.reviewedDetails.map((item) =>
          item.id === id
            ? {
                ...item,
                include: include !== undefined ? include : item.include,
                confirmed: confirmed !== undefined ? confirmed : item.confirmed,
                valueOverride: valueOverride !== undefined ? valueOverride : item.valueOverride,
              }
            : item,
        ),
      }
    }

    case 'UPDATE_TIMELINE': {
      const { id, include } = action.payload
      return {
        ...state,
        reviewedTimeline: state.reviewedTimeline.map((item) =>
          item.id === id ? { ...item, include } : item,
        ),
      }
    }

    case 'UPDATE_EVIDENCE': {
      const { id, include, confirmed } = action.payload
      return {
        ...state,
        reviewedEvidence: state.reviewedEvidence.map((item) =>
          item.id === id
            ? {
                ...item,
                include: include !== undefined ? include : item.include,
                confirmed: confirmed !== undefined ? confirmed : item.confirmed,
              }
            : item,
        ),
      }
    }

    case 'UPDATE_ACTION': {
      const { id, include } = action.payload
      return {
        ...state,
        reviewedActions: state.reviewedActions.map((item) =>
          item.id === id ? { ...item, include } : item,
        ),
      }
    }

    case 'SET_EXPORT_OPTIONS':
      return {
        ...state,
        exportOptions: { ...state.exportOptions, ...action.payload },
      }

    case 'SET_HEALTH':
      return { ...state, health: action.payload }

    case 'TOGGLE_URGENT_MODAL':
      return {
        ...state,
        showUrgentModal: action.payload !== undefined ? action.payload : !state.showUrgentModal,
      }

    case 'TOGGLE_PRIVACY_MODAL':
      return {
        ...state,
        showPrivacyModal: action.payload !== undefined ? action.payload : !state.showPrivacyModal,
      }

    case 'RESET':
      // Return fresh state dropping all incident references
      return {
        ...INITIAL_STATE,
        health: state.health, // preserve health check status
      }

    default:
      return state
  }
}
