import React from 'react'

interface LayoutProps {
  children: React.ReactNode
  onOpenUrgent: () => void
  onOpenPrivacy: () => void
}

export const Layout: React.FC<LayoutProps> = ({ children, onOpenUrgent, onOpenPrivacy }) => {
  const handleQuickExit = () => {
    // Immediate redirect to neutral site without retaining session state
    window.location.replace('https://www.google.com')
  }

  return (
    <div className="app-container">
      <header className="site-header" role="banner">
        <div className="header-inner">
          <div className="logo-area">
            <span className="logo-title" aria-label="SafeSignal First Response">
              SafeSignal
            </span>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-sm btn-urgent"
              onClick={onOpenUrgent}
              aria-label="Open emergency crisis and helpline contacts"
            >
              Urgent help
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={onOpenPrivacy}
              aria-label="View privacy and security guarantees"
            >
              Privacy & limits
            </button>
            <button
              type="button"
              className="btn btn-sm btn-exit"
              onClick={handleQuickExit}
              title="Immediately leaves SafeSignal to a neutral search engine"
              aria-label="Quick exit to neutral search engine"
            >
              Quick exit
            </button>
          </div>
        </div>
      </header>

      <main className="main-content" id="main-content" role="main">
        {children}
      </main>

      <div
        className="quick-exit-note"
        style={{
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--color-muted)',
          padding: '1rem',
        }}
      >
        Note: &ldquo;Quick exit&rdquo; opens a neutral website immediately. It cannot erase your browser
        history, device downloads, or router logs.
      </div>
    </div>
  )
}
