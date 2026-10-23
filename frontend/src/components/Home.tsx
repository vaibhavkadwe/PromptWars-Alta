import React from 'react'

interface HomeProps {
  onStartIntake: () => void
  onTryFictionalExample: () => void
  paidTier?: boolean
}

export const Home: React.FC<HomeProps> = ({
  onStartIntake,
  onTryFictionalExample,
  paidTier = false,
}) => {
  return (
    <div>
      {!paidTier && (
        <div className="banner banner-demo" role="alert">
          <strong>Demo Mode Active:</strong> This prototype uses a free-tier AI key. Google may use
          inputs to improve its products and human reviewers may read them. Please enter ONLY fictional
          or simulated information.
        </div>
      )}

      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <h1>SafeSignal</h1>
        <p className="lead-text" style={{ maxWidth: '520px', margin: '0.5rem auto 1.75rem auto' }}>
          Turn a confusing digital threat into a clear, safer plan for what to do next.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '340px', margin: '0 auto' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onStartIntake}
            aria-label="Get Help Safely: Start incident intake form"
          >
            Get Help Safely
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onTryFictionalExample}
            aria-label="Try a fictional example scenario"
          >
            Try a fictional example
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Privacy-First Safety Rules</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>
          SafeSignal was designed from the ground up for strict confidentiality and crisis response in India:
        </p>

        <ul className="privacy-bullets">
          <li>
            <span className="bullet-icon" aria-hidden="true">✓</span>
            <div>
              <strong>No account or login required:</strong> You will never be asked for your name, phone number, address, or email.
            </div>
          </li>
          <li>
            <span className="bullet-icon" aria-hidden="true">✓</span>
            <div>
              <strong>No intimate images accepted:</strong> We only process text. SafeSignal never asks for or accepts photos or videos.
            </div>
          </li>
          <li>
            <span className="bullet-icon" aria-hidden="true">✓</span>
            <div>
              <strong>Zero server storage:</strong> Incident data is held in browser memory only and never saved to a database.
            </div>
          </li>
          <li>
            <span className="bullet-icon" aria-hidden="true">✓</span>
            <div>
              <strong>Minimise sensitive details:</strong> Share only what is needed to understand the threat and preserve timeline facts.
            </div>
          </li>
          <li>
            <span className="bullet-icon" aria-hidden="true">✓</span>
            <div>
              <strong>Verified official resources only:</strong> All emergency numbers (112, 1098, 1930) and reporting portals are static, verified Government of India channels.
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}
