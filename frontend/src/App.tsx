import React, { useEffect, useReducer, useState } from 'react'
import {
  analyzeIncident,
  fetchHealth,
  fetchResources,
  fetchSampleReport,
  SafeSignalApiError,
} from './api/client'
import { Analyzing } from './components/Analyzing'
import { ErrorState } from './components/ErrorState'
import { ExportReview } from './components/ExportReview'
import { Home } from './components/Home'
import { IntakeForm } from './components/IntakeForm'
import { Layout } from './components/Layout'
import { PrivacyNotice } from './components/PrivacyNotice'
import { ReportView } from './components/ReportView'
import { UrgentHelp } from './components/UrgentHelp'
import { INITIAL_STATE, workflowReducer } from './state/workflow'
import { Resource } from './types/report'

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(workflowReducer, INITIAL_STATE)
  const [cachedResources, setCachedResources] = useState<Resource[]>([])

  // On mount: fetch health check and catalog resources
  useEffect(() => {
    fetchHealth()
      .then((health) => dispatch({ type: 'SET_HEALTH', payload: health }))
      .catch(() => {
        // App starts gracefully even if backend is offline
      })

    fetchResources()
      .then((res) => setCachedResources(res))
      .catch(() => {
        // Fallback resources handled in components
      })
  }, [])

  // Action Handlers
  const handleStartAnalysis = async () => {
    const controller = new AbortController()
    dispatch({ type: 'START_ANALYSIS', payload: controller })

    try {
      const response = await analyzeIncident(
        {
          description: state.draft.description,
          evidence_text: state.draft.evidence_text || undefined,
          details: state.draft.details,
          consent_ai_processing: state.draft.consent_ai_processing,
        },
        controller.signal,
      )
      dispatch({ type: 'ANALYSIS_SUCCESS', payload: response })
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Analysis was cancelled by user
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
            message: 'Could not connect to SafeSignal server. Please check your connection.',
          },
        })
      }
    }
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
      onOpenUrgent={() => dispatch({ type: 'TOGGLE_URGENT_MODAL', payload: true })}
      onOpenPrivacy={() => dispatch({ type: 'TOGGLE_PRIVACY_MODAL', payload: true })}
    >
      {/* 1. Home Screen */}
      {state.step === 'home' && (
        <Home
          onStartIntake={() => dispatch({ type: 'SET_STEP', payload: 'intake' })}
          onTryFictionalExample={() => dispatch({ type: 'FILL_FICTIONAL_EXAMPLE' })}
          paidTier={state.health?.paid_tier ?? false}
        />
      )}

      {/* 2. Intake Form */}
      {state.step === 'intake' && (
        <IntakeForm
          description={state.draft.description}
          evidenceText={state.draft.evidence_text}
          details={state.draft.details}
          consent={state.draft.consent_ai_processing}
          paidTier={state.health?.paid_tier ?? false}
          onDescriptionChange={(desc) => dispatch({ type: 'SET_DRAFT', payload: { description: desc } })}
          onEvidenceChange={(ev) => dispatch({ type: 'SET_DRAFT', payload: { evidence_text: ev } })}
          onDetailsChange={(details) => dispatch({ type: 'SET_DETAILS', payload: details })}
          onToggleThreatType={(catId) => dispatch({ type: 'TOGGLE_THREAT_TYPE', payload: catId })}
          onConsentChange={(consent) => dispatch({ type: 'SET_DRAFT', payload: { consent_ai_processing: consent } })}
          onFillFictionalExample={() => dispatch({ type: 'FILL_FICTIONAL_EXAMPLE' })}
          onSubmit={handleStartAnalysis}
        />
      )}

      {/* 3. Analyzing Screen */}
      {state.step === 'analyzing' && (
        <Analyzing
          onCancel={() => dispatch({ type: 'CANCEL_ANALYSIS' })}
          onOpenUrgent={() => dispatch({ type: 'TOGGLE_URGENT_MODAL', payload: true })}
        />
      )}

      {/* 4. Error State */}
      {state.step === 'error' && (
        <ErrorState
          error={state.error}
          onRetry={handleStartAnalysis}
          onViewSample={handleViewSample}
        />
      )}

      {/* 5. Report View */}
      {state.step === 'report' && state.response && (
        <ReportView
          response={state.response}
          reviewedDetails={state.reviewedDetails}
          reviewedTimeline={state.reviewedTimeline}
          reviewedEvidence={state.reviewedEvidence}
          reviewedActions={state.reviewedActions}
          onUpdateDetail={(id, updates) => dispatch({ type: 'UPDATE_DETAIL', payload: { id, ...updates } })}
          onUpdateTimeline={(id, include) => dispatch({ type: 'UPDATE_TIMELINE', payload: { id, include } })}
          onUpdateEvidence={(id, updates) => dispatch({ type: 'UPDATE_EVIDENCE', payload: { id, ...updates } })}
          onUpdateAction={(id, include) => dispatch({ type: 'UPDATE_ACTION', payload: { id, include } })}
          onGoToExport={() => dispatch({ type: 'SET_STEP', payload: 'export' })}
          onReset={() => dispatch({ type: 'RESET' })}
        />
      )}

      {/* 6. Export Review */}
      {state.step === 'export' && state.response && (
        <ExportReview
          response={state.response}
          reviewedDetails={state.reviewedDetails}
          reviewedTimeline={state.reviewedTimeline}
          reviewedEvidence={state.reviewedEvidence}
          reviewedActions={state.reviewedActions}
          options={state.exportOptions}
          originalDescription={state.draft.description}
          onOptionsChange={(opts) => dispatch({ type: 'SET_EXPORT_OPTIONS', payload: opts })}
          onBack={() => dispatch({ type: 'SET_STEP', payload: 'report' })}
          onReset={() => dispatch({ type: 'RESET' })}
        />
      )}

      {/* Modals & Overlays */}
      <UrgentHelp
        isOpen={state.showUrgentModal}
        onClose={() => dispatch({ type: 'TOGGLE_URGENT_MODAL', payload: false })}
        resources={cachedResources}
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
