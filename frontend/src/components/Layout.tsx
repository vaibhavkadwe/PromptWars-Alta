import React, { useState } from 'react'
import { Step } from '../state/workflow'

interface LayoutProps {
  currentStep: Step
  onBack?: () => void
  onReset?: () => void
  onOpenUrgent: () => void
  onOpenPrivacy: () => void
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({
  currentStep,
  onBack,
  onReset,
  onOpenUrgent,
  onOpenPrivacy,
  children,
}) => {
  const [resetConfirming, setResetConfirming] = useState(false)

  const handleQuickExit = () => {
    // Replace URL immediately to leave no back-page in immediate tab history
    window.location.replace('https://www.google.com')
  }

  const handleResetClick = () => {
    if (resetConfirming) {
      setResetConfirming(false)
      if (onReset) onReset()
    } else {
      setResetConfirming(true)
      // Auto-revert after 5 seconds
      setTimeout(() => {
        setResetConfirming(false)
      }, 5000)
    }
  }

  return (
    <div className="app-container">
      {/* Universal Header on Every Screen */}
      <header className="site-header" role="banner">
        <div className="header-inner">
          <div className="logo-area">
            <span className="logo-icon" aria-hidden="true">🛡️</span>
            <span className="logo-text">SafeSignal</span>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenUrgent}
              aria-label="Urgent Help Contacts"
            >
              Urgent help
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenPrivacy}
              aria-label="Privacy & Limits"
            >
              Privacy & limits
            </button>
            <button
              type="button"
              className="btn btn-urgent btn-sm"
              onClick={handleQuickExit}
              title="Quick exit will navigate away immediately"
            >
              Quick exit
            </button>
          </div>
        </div>

        {/* Global navigation bar when not on Home */}
        {currentStep !== 'home' && (
          <div className="header-nav-bar no-print" style={{
            maxWidth: 'var(--max-content-width)',
            margin: '0.5rem auto 0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.25rem',
            borderTop: '1px solid var(--color-border)',
          }}>
            {onBack ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onBack}
                aria-label="Go back to previous screen"
              >
                ← Back
              </button>
            ) : <div />}

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
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                    Clears in-memory data; cannot erase browser history or downloads.
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="main-content" id="main-content" tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer no-print" role="contentinfo">
        <p>
          SafeSignal is a first-response triage tool, not law enforcement or legal counsel.
          Zero persistent storage.
        </p>
      </footer>
    </div>
  )
}
