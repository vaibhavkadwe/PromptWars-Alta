import React from 'react'
import { getGeminiTermsNotice } from '../content/privacyCopy'

interface HomeProps {
  onStartTriage: () => void
  onTryFictionalExample: () => void
  paidTier?: boolean
}

export const Home: React.FC<HomeProps> = ({
  onStartTriage,
  onTryFictionalExample,
  paidTier = false,
}) => {
  return (
    <div>
      {!paidTier && (
        <div className="banner banner-demo" role="alert">
          <strong>Prototype Notice:</strong> {getGeminiTermsNotice(false)}
        </div>
      )}

      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <h1 id="home-heading">SafeSignal</h1>
        <p className="lead-text" style={{ maxWidth: '520px', margin: '0.5rem auto 1.75rem auto' }}>
          First-response safety triage and complaint preparation for people in India facing digital blackmail, sextortion, or threats to share images.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '340px', margin: '0 auto' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onStartTriage}
            aria-label="Start Safety Triage: Answer 3 simple questions"
          >
            Start Safety Triage
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onTryFictionalExample}
            aria-label="Explore a fictional example scenario"
          >
            Explore fictional example
          </button>
        </div>
      </div>

      <div className="card">
        <h2>How SafeSignal Protects You</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>
          Your immediate safety comes first. Core protections enforced by design:
        </p>

        <ul className="privacy-bullets" style={{ marginTop: '1rem' }}>
          <li>
            <span className="bullet-icon" aria-hidden="true">✓</span>
            <div>
              <strong>Works completely offline:</strong> Immediate safety guidance (triage and action card) requires no server, no AI, and no personal details.
            </div>
          </li>
          <li>
            <span className="bullet-icon" aria-hidden="true">✓</span>
            <div>
              <strong>Never upload intimate media:</strong> SafeSignal never asks for, accepts, or transmits intimate images or videos.
            </div>
          </li>
          <li>
            <span className="bullet-icon" aria-hidden="true">✓</span>
            <div>
              <strong>Zero persistent storage:</strong> No accounts, no database, no cookies, and no tracking analytics. Everything clears on reset or when you close the tab.
            </div>
          </li>
          <li>
            <span className="bullet-icon" aria-hidden="true">✓</span>
            <div>
              <strong>Optional AI with explicit control:</strong> AI complaint drafting is strictly optional, adult-only, and displays the exact redacted text before anything is sent.
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}
