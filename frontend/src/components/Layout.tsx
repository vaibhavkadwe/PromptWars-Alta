import React, { useEffect, useState } from 'react'
import { Step } from '../state/workflow'
import { getWorkflowStage, WorkflowProgress } from './WorkflowProgress'

interface LayoutProps {
  currentStep: Step
  onBack?: () => void
  onReset?: () => void
  onOpenUrgent: () => void
  onOpenPrivacy: () => void
  children: React.ReactNode
}

const QUICK_EXIT_URL = 'https://www.google.com'

export const Layout: React.FC<LayoutProps> = ({
  currentStep,
  onBack,
  onReset,
  onOpenUrgent,
  onOpenPrivacy,
  children,
}) => {
  const [resetConfirming, setResetConfirming] = useState(false)
  const stage = getWorkflowStage(currentStep)
  const isHome = currentStep === 'home'

  const handleQuickExit = () => {
    window.location.replace(QUICK_EXIT_URL)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleQuickExit()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleResetClick = () => {
    if (resetConfirming) {
      setResetConfirming(false)
      if (onReset) onReset()
    } else {
      setResetConfirming(true)
      setTimeout(() => setResetConfirming(false), 5000)
    }
  }

  const navStage = (n: number) => {
    if (stage === 0) return ''
    if (n === stage) return 'active'
    return ''
  }

  return (
    <div className="app-container">
      <header className="site-header" role="banner">
        <div className="header-inner">
          <div className="logo-area" aria-label="SafeSignal">
            <div className="logo-mark" aria-hidden="true">
              <span className="material-symbols-outlined fill">lock</span>
            </div>
            <div className="logo-text-stack">
              <span className="logo-text">SafeSignal</span>
              <span className="logo-sub">
                {isHome ? 'Discreet Assistance' : 'Encrypted Session'}
              </span>
            </div>
          </div>

          {!isHome && (
            <nav className="header-nav" aria-label="Incident triage workflow">
              <span className={`header-nav-link ${navStage(1)}`}>Safety Check</span>
              <span className={`header-nav-link ${navStage(2)}`}>Immediate Guidance</span>
              <span className={`header-nav-link ${navStage(3)}`}>Incident Details</span>
              <span className={`header-nav-link ${navStage(4)}`}>Review Report</span>
            </nav>
          )}

          {isHome && (
            <nav className="header-nav" aria-label="Primary">
              <a className="header-nav-link" href="#how-it-works">
                How it Works
              </a>
              <button type="button" className="header-nav-link" onClick={onOpenPrivacy}>
                Privacy Guarantee
              </button>
              <button type="button" className="header-nav-link" onClick={onOpenUrgent}>
                <span className="material-symbols-outlined">phone_in_talk</span>
                Emergency Resources
              </button>
            </nav>
          )}

          <div className="header-actions">
            {!isHome && (
              <span className="session-chip" aria-hidden="true">
                <span className="material-symbols-outlined">lock</span>
                Confidential Session
              </span>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenUrgent}
              aria-label="Urgent Help Contacts"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
                call
              </span>
              <span className="header-hotline-label">Urgent help</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenPrivacy}
              aria-label="Privacy & Limits"
            >
              Privacy
            </button>
            <button
              type="button"
              className="btn-quick-exit"
              onClick={handleQuickExit}
              title="Instantly leave this site (or press Esc)"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Quick Exit</span>
              <kbd className="kbd-hint">Esc</kbd>
            </button>
          </div>
        </div>

        {!isHome && (
          <div className="header-workflow-bar no-print">
            {onBack ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onBack}
                aria-label="Go back to previous screen"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  arrow_back
                </span>
                Back
              </button>
            ) : (
              <div />
            )}

            {onReset && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${resetConfirming ? 'btn-urgent' : 'btn-secondary'}`}
                  onClick={handleResetClick}
                  aria-label="Start over and clear all incident data"
                >
                  {resetConfirming ? 'Tap again to clear everything' : 'Start over'}
                </button>
                {resetConfirming && (
                  <span
                    className="label-sm"
                    style={{ color: 'var(--color-outline)', marginTop: 2 }}
                  >
                    Clears in-memory data; cannot erase browser history or downloads.
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      <main
        className={`main-content ${isHome ? '' : 'main-narrow'}`}
        id="main-content"
        tabIndex={-1}
      >
        {!isHome && <WorkflowProgress step={currentStep} />}
        {children}
      </main>

      <footer className="site-footer no-print" role="contentinfo">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <strong>SafeSignal</strong>
            <span>• First-response triage — not law enforcement or legal counsel</span>
          </div>
          <div className="site-footer-links">
            <button type="button" onClick={onOpenPrivacy}>
              Privacy Principles
            </button>
            <button type="button" onClick={onOpenUrgent}>
              Urgent Help
            </button>
            <button type="button" onClick={handleQuickExit}>
              Leave Page
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
