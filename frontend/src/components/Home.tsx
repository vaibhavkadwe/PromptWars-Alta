import React from 'react'
import { getGeminiTermsNotice } from '../content/privacyCopy'

interface HomeProps {
  onStartTriage: () => void
  onTryFictionalExample: () => void
  paidTier?: boolean
}

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuASRFtQKm_jTee-Hqpwmw2BTIX3766OIcl3q6vPk4SzfvbXDBNT4-RYk2F7DjmFgXgpH6q8hFw8mMmOmE-bgpX2wpvkdZjMJ-6Oxj9EdTIK3B23Yo9GBb56e5imggVYfpQTriZNcqzhPuqpjpQ6x9g8qm_NH4rZjYrkp9Yr9ap5jKC_ZJBVfYasM9dVIwVRZ7IDi2pESdUKe9s1_XOug_3hx6hRr_izd6ETF6hRGYrJe7nGQKAV1vUa'

export const Home: React.FC<HomeProps> = ({
  onStartTriage,
  onTryFictionalExample,
  paidTier = false,
}) => {
  return (
    <div>
      {!paidTier && (
        <div className="banner banner-demo" role="alert">
          <span className="material-symbols-outlined fill" aria-hidden="true">
            info
          </span>
          <div>
            <strong>Prototype Notice:</strong> {getGeminiTermsNotice(false)}
          </div>
        </div>
      )}

      <section className="home-hero" aria-labelledby="home-heading">
        <div>
          <div className="status-pill">
            <span className="status-dot" aria-hidden="true" />
            <span className="label-sm" style={{ color: 'var(--color-muted)' }}>
              Encrypted In-Browser Session • No Logs Kept
            </span>
          </div>

          <p className="brand-hero-name">SafeSignal</p>

          <h1 id="home-heading">Clarity when things feel out of control.</h1>

          <p className="lead-text" style={{ maxWidth: '36rem' }}>
            First-response safety triage and complaint preparation for people in India facing
            digital blackmail, sextortion, or threats to share images.
          </p>

          <div className="home-cta-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onStartTriage}
              aria-label="Start Safety Triage: Answer 3 simple questions"
            >
              Get Help Safely
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onTryFictionalExample}
              aria-label="Explore a fictional example scenario"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                visibility
              </span>
              Try a fictional demo
            </button>
          </div>

          <div className="trust-badge">
            <span className="material-symbols-outlined fill" aria-hidden="true">
              shield
            </span>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.45 }}>
              <strong style={{ color: 'var(--color-on-surface)' }}>
                100% confidential. No account required.
              </strong>{' '}
              Your data never leaves your device unless you choose optional AI drafting or export.
            </p>
          </div>
        </div>

        <div className="hero-visual">
          <img
            src={HERO_IMAGE}
            alt="Calm, secure interior space with morning light"
          />
          <div className="hero-visual-overlay">
            <div className="hero-visual-overlay-left">
              <span className="material-symbols-outlined" aria-hidden="true">
                verified_user
              </span>
              <span className="label-sm" style={{ color: 'var(--color-on-surface)', fontWeight: 500 }}>
                Safe Local Vault • Active
              </span>
            </div>
            <span className="label-sm" style={{ color: 'var(--color-outline)' }}>
              Encrypted
            </span>
          </div>
        </div>
      </section>

      <section id="how-it-works" style={{ borderTop: '1px solid color-mix(in srgb, var(--color-border) 40%, transparent)', paddingTop: '2rem' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '2rem',
          }}
          className="feature-section-header"
        >
          <div>
            <span className="section-eyebrow">A Structured Pathway</span>
            <h2 style={{ marginTop: '0.25rem' }}>Calm action, divided into simple steps.</h2>
          </div>
          <p style={{ color: 'var(--color-outline)', fontSize: 13, maxWidth: '28rem', margin: 0 }}>
            Zero algorithmic pressure. You dictate the pace, stop anytime, and retain total control
            of your record.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <div>
              <div className="feature-icon" aria-hidden="true">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <span className="label-sm" style={{ color: 'var(--color-outline)', display: 'block', marginBottom: 4 }}>
                Step 01
              </span>
              <h3>Understand your next steps</h3>
              <p style={{ color: 'var(--color-muted)', margin: 0, lineHeight: 1.55 }}>
                Immediate, practical rules-based actions to protect your safety right now — works
                fully offline, no server required.
              </p>
            </div>
            <div className="feature-card-foot">
              <span className="material-symbols-outlined">check_circle</span>
              De-escalation guidance
            </div>
          </article>

          <article className="feature-card">
            <div>
              <div className="feature-icon" aria-hidden="true">
                <span className="material-symbols-outlined">edit_note</span>
              </div>
              <span className="label-sm" style={{ color: 'var(--color-outline)', display: 'block', marginBottom: 4 }}>
                Step 02
              </span>
              <h3>Organize relevant information</h3>
              <p style={{ color: 'var(--color-muted)', margin: 0, lineHeight: 1.55 }}>
                Securely structure timelines, messages, and evidence records at your own pace.
                Never upload intimate media.
              </p>
            </div>
            <div className="feature-card-foot">
              <span className="material-symbols-outlined">check_circle</span>
              Client-side chronology
            </div>
          </article>

          <article className="feature-card">
            <div>
              <div className="feature-icon" aria-hidden="true">
                <span className="material-symbols-outlined">assignment_turned_in</span>
              </div>
              <span className="label-sm" style={{ color: 'var(--color-outline)', display: 'block', marginBottom: 4 }}>
                Step 03
              </span>
              <h3>Prepare a complaint draft</h3>
              <p style={{ color: 'var(--color-muted)', margin: 0, lineHeight: 1.55 }}>
                Export a calm incident report ready for NCRP, cybercrime portals, helplines, or
                trusted support — optional AI, adult-only.
              </p>
            </div>
            <div className="feature-card-foot">
              <span className="material-symbols-outlined">check_circle</span>
              Zero persistent storage
            </div>
          </article>
        </div>
      </section>

      <div className="support-strip">
        <div className="support-strip-left">
          <div className="support-strip-icon" aria-hidden="true">
            <span className="material-symbols-outlined">spa</span>
          </div>
          <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-on-surface)' }}>
            You deserve support, not judgment. You do not have to figure everything out at once.
          </p>
        </div>
        <a className="crisis-link" href="tel:112">
          <span className="material-symbols-outlined">emergency</span>
          Immediate danger: Dial 112
        </a>
      </div>
    </div>
  )
}
