import React from 'react'
import { Step } from '../state/workflow'

const STAGES = [
  { id: 1, label: '1. Safety Check' },
  { id: 2, label: '2. Immediate Guidance' },
  { id: 3, label: '3. Incident Details' },
  { id: 4, label: '4. Review & Report' },
] as const

export function getWorkflowStage(step: Step): number {
  switch (step) {
    case 'triage':
      return 1
    case 'actionCard':
      return 2
    case 'aiIntro':
    case 'input':
    case 'reviewOutgoing':
    case 'analyzing':
    case 'error':
      return 3
    case 'draft':
      return 4
    default:
      return 0
  }
}

interface WorkflowProgressProps {
  step: Step
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ step }) => {
  const active = getWorkflowStage(step)
  if (active === 0) return null

  return (
    <section className="workflow-progress" aria-label="Intake progression">
      <div className="workflow-progress-labels">
        {STAGES.map((stage) => {
          const status =
            stage.id < active ? 'done' : stage.id === active ? 'active' : 'upcoming'
          return (
            <div key={stage.id} className={`workflow-stage ${status}`}>
              <div className="workflow-stage-num" aria-hidden="true">
                {stage.id < active ? (
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    check
                  </span>
                ) : (
                  stage.id
                )}
              </div>
              <span className="workflow-stage-label">{stage.label}</span>
            </div>
          )
        })}
      </div>

      <div className="workflow-bars" aria-hidden="true">
        {STAGES.map((stage) => {
          const status =
            stage.id < active ? 'done' : stage.id === active ? 'active' : ''
          return <div key={stage.id} className={`workflow-bar ${status}`} />
        })}
      </div>

      <div className="workflow-meta">
        <span>
          Step {active} of 4 • Confidential &amp; In-Browser
        </span>
        <span className="workflow-meta-secure">
          <span className="material-symbols-outlined">verified_user</span>
          Zero Server Persistence
        </span>
      </div>
    </section>
  )
}
