import React, { useEffect, useReducer } from 'react'
import {
  analyzeIncident,
  fetchHealth,
  fetchSampleReport,
  SafeSignalApiError,
} from './api/client'
import { ActionCardScreen } from './components/ActionCardScreen'
import { AiIntroScreen } from './components/AiIntroScreen'
import { Analyzing } from './components/Analyzing'
import { DraftScreen } from './components/DraftScreen'
import { ErrorState } from './components/ErrorState'
import { Home } from './components/Home'
import { InputScreen } from './components/InputScreen'
import { Layout } from './components/Layout'
import { PrivacyNotice } from './components/PrivacyNotice'
import { ReviewOutgoingScreen } from './components/ReviewOutgoingScreen'
import { TriageScreen } from './components/TriageScreen'
import { UrgentHelp } from './components/UrgentHelp'
import { restoreDraftPii } from './lib/redact'
import { INITIAL_STATE, workflowReducer } from './state/workflow'
import { ComplaintDraft } from './types/report'

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(workflowReducer, INITIAL_STATE)

  // On mount: fetch health check (tier information) and attach popstate listener
  useEffect(() => {
    fetchHealth()
      .then((health) => dispatch({ type: 'SET_HEALTH', payload: health }))
      .catch(() => {
        // App starts gracefully offline without backend
      })

    const handlePopState = () => {
      dispatch({ type: 'POP_STEP' })
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Move focus to new step's heading on transition
  useEffect(() => {
    const heading = document.querySelector('h1')
    if (heading) {
      heading.tabIndex = -1
      heading.focus()
    }
  }, [state.step])

  // Handlers
  const handleStartAnalysis = async (
    redactedDesc: string,
    redactedEv: string,
    tokenMap: Record<string, string>,
  ) => {
    const controller = new AbortController()
    dispatch({ type: 'START_ANALYSIS', payload: controller })

    try {
      const response = await analyzeIncident(
        {
          description: redactedDesc,
          evidence_text: redactedEv || undefined,
          platform: state.inputData.platform || undefined,
          incident_when: state.inputData.incidentWhen || undefined,
          money_status: state.inputData.moneyStatus || undefined,
          adult_confirmed: state.inputData.adultConfirmed,
          consent_ai_processing: state.inputData.consentAi,
        },
        controller.signal,
      )

      // Restore redacted PII tokens locally on client
      const restoredDraft = restoreDraftPii(response.draft, tokenMap)
      const restoredResponse = { ...response, draft: restoredDraft }

      dispatch({ type: 'ANALYSIS_SUCCESS', payload: restoredResponse })
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }

      if (err instanceof SafeSignalApiError) {
        dispatch({
          type: 'ANALYSIS_ERROR',
          payload: {
            code: err.code,
            message: err.message,
            retryAfter: err.retryAfter,
          },
        })
      } else {
        dispatch({
          type: 'ANALYSIS_ERROR',
          payload: {
            code: 'NETWORK_ERROR',
            message: 'Could not connect to SafeSignal server. You can prepare your draft offline.',
          },
        })
      }
    }
  }

  const handleCreateManualDraft = () => {
    // Pure offline manual draft creation
    const manualDraft: ComplaintDraft = {
      what_happened: state.inputData.description,
      platform_or_service: state.inputData.platform || null,
      when_it_happened: state.inputData.incidentWhen || null,
      account_identifiers: [],
      threat_and_demand: 'Details provided in description',
      demand_amount_or_deadline: null,
      money_transferred: state.inputData.moneyStatus === 'sent'
        ? 'sent'
        : state.inputData.moneyStatus === 'not_sent'
        ? 'not_sent'
        : 'not_stated',
      chronology: [
        {
          when_text: state.inputData.incidentWhen || null,
          event: state.inputData.description,
          source: 'user_description',
          certainty: 'stated',
        },
      ],
      supporting_material_user_has: state.inputData.evidenceText
        ? ['Pasted evidence / message transcripts']
        : [],
      missing_information: [],
      evidence_checklist: [
        {
          item: 'Threatening chat messages',
          how_to_preserve: 'Keep message history intact and take full screenshots showing timestamps and handles.',
        },
        {
          item: 'Suspect account profile URL',
          how_to_preserve: 'Record the profile URL or handle before blocking the account.',
        },
      ],
      action_suggestions: [
        {
          title: 'Preserve messages and secure accounts',
          why: 'Preserve threatening records before blocking, and change passwords.',
          resource_ids: ['NCRP'],
        },
      ],
      limitations: [
        'This is a local preparation draft created on your device without AI processing. Review and verify all details before filing.',
      ],
    }

    dispatch({ type: 'SET_MANUAL_DRAFT', payload: manualDraft })
  }

  const handleViewSample = async () => {
    try {
      const sample = await fetchSampleReport()
      dispatch({ type: 'ANALYSIS_SUCCESS', payload: sample })
    } catch {
      // In case server is offline, fallback will still show error state
    }
  }

  return (
    <Layout
      currentStep={state.step}
      onBack={state.step !== 'home' ? () => dispatch({ type: 'GO_BACK' }) : undefined}
      onReset={state.step !== 'home' ? () => dispatch({ type: 'RESET' }) : undefined}
      onOpenUrgent={() => dispatch({ type: 'TOGGLE_URGENT_MODAL', payload: true })}
      onOpenPrivacy={() => dispatch({ type: 'TOGGLE_PRIVACY_MODAL', payload: true })}
    >
      <div aria-live="polite" className="sr-only">
        Current step: {state.step}
      </div>

      {/* 1. Home */}
      {state.step === 'home' && (
        <Home
          onStartTriage={() => dispatch({ type: 'GO_TO_STEP', payload: 'triage' })}
          onTryFictionalExample={() => {
            dispatch({ type: 'FILL_FICTIONAL_EXAMPLE' })
            dispatch({ type: 'GO_TO_STEP', payload: 'triage' })
          }}
          paidTier={state.health?.paid_tier ?? false}
        />
      )}

      {/* 2. Triage */}
      {state.step === 'triage' && (
        <TriageScreen
          money={state.triageAnswers.money}
          age={state.triageAnswers.age}
          danger={state.triageAnswers.danger}
          onAnswerChange={(field, value) =>
            dispatch({ type: 'SET_TRIAGE_ANSWER', payload: { field, value } })
          }
          onSubmit={() => dispatch({ type: 'SUBMIT_TRIAGE' })}
        />
      )}

      {/* 3. Action Card */}
      {state.step === 'actionCard' && state.actionCard && (
        <ActionCardScreen
          card={state.actionCard}
          onProceed={(useAi) => {
            if (useAi) {
              dispatch({ type: 'GO_TO_STEP', payload: 'aiIntro' })
            } else {
              dispatch({ type: 'CHOOSE_AI_PATH', payload: false })
            }
          }}
        />
      )}

      {/* 4. AI Intro */}
      {state.step === 'aiIntro' && (
        <AiIntroScreen
          paidTier={state.health?.paid_tier ?? false}
          onChooseAi={(useAi) => dispatch({ type: 'CHOOSE_AI_PATH', payload: useAi })}
        />
      )}

      {/* 5. Input */}
      {state.step === 'input' && (
        <InputScreen
          data={state.inputData}
          useAi={state.useAi}
          isMinorRoute={state.actionCard?.isMinorRoute ?? false}
          onChange={(updates) => dispatch({ type: 'SET_INPUT_DATA', payload: updates })}
          onNext={() => {
            if (state.useAi) {
              dispatch({ type: 'GO_TO_STEP', payload: 'reviewOutgoing' })
            } else {
              handleCreateManualDraft()
            }
          }}
        />
      )}

      {/* 6. Review Outgoing */}
      {state.step === 'reviewOutgoing' && (
        <ReviewOutgoingScreen
          description={state.inputData.description}
          evidenceText={state.inputData.evidenceText}
          redactionOptions={state.redactionOptions}
          isSubmitting={state.isSubmitting}
          onToggleRedaction={(opts) => dispatch({ type: 'SET_REDACTION_OPTIONS', payload: opts })}
          onSend={(rDesc, rEv, tokenMap) => handleStartAnalysis(rDesc, rEv, tokenMap)}
        />
      )}

      {/* 7. Analyzing */}
      {state.step === 'analyzing' && (
        <Analyzing
          onCancel={() => dispatch({ type: 'CANCEL_ANALYSIS' })}
          onOpenUrgent={() => dispatch({ type: 'TOGGLE_URGENT_MODAL', payload: true })}
        />
      )}

      {/* 8. Draft Screen */}
      {state.step === 'draft' && state.draft && (
        <DraftScreen
          draft={state.draft}
          isSample={state.isSample}
          notices={state.responseMetadata?.notices}
          resourceIds={state.responseMetadata?.resourceIds || state.actionCard?.resourceIds}
          onUpdateDraft={(updates) => dispatch({ type: 'UPDATE_DRAFT', payload: updates })}
          onReset={() => dispatch({ type: 'RESET' })}
        />
      )}

      {/* 9. Error State */}
      {state.step === 'error' && (
        <ErrorState
          error={state.error}
          onRetry={() => {
            if (state.stepStack.includes('reviewOutgoing')) {
              dispatch({ type: 'GO_TO_STEP', payload: 'reviewOutgoing' })
            } else {
              dispatch({ type: 'GO_TO_STEP', payload: 'input' })
            }
          }}
          onViewSample={handleViewSample}
          onDraftOffline={handleCreateManualDraft}
        />
      )}

      {/* Static Sheets & Modals */}
      <UrgentHelp
        isOpen={state.showUrgentModal}
        onClose={() => dispatch({ type: 'TOGGLE_URGENT_MODAL', payload: false })}
      />

      <PrivacyNotice
        isOpen={state.showPrivacyModal}
        onClose={() => dispatch({ type: 'TOGGLE_PRIVACY_MODAL', payload: false })}
        paidTier={state.health?.paid_tier ?? false}
      />
    </Layout>
  )
}

export default App
