import React from 'react'
import { AgeAnswer, DangerAnswer, MoneyAnswer } from '../triage/rules'

interface TriageScreenProps {
  money: MoneyAnswer | null
  age: AgeAnswer | null
  danger: DangerAnswer | null
  onAnswerChange: (field: 'money' | 'age' | 'danger', value: string) => void
  onSubmit: () => void
}

export const TriageScreen: React.FC<TriageScreenProps> = ({
  money,
  age,
  danger,
  onAnswerChange,
  onSubmit,
}) => {
  const isComplete = money !== null && age !== null && danger !== null

  return (
    <div>
      <div className="banner banner-info" role="status">
        <span className="material-symbols-outlined" aria-hidden="true">
          psychology
        </span>
        <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.55 }}>
          One safe step at a time. Take a deep breath — you are in complete control of this session.
        </p>
      </div>

      <div className="card card-elevated">
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
          <h1 id="triage-heading" style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
            Quick Safety Assessment
          </h1>
          <p style={{ color: 'var(--color-muted)', margin: 0 }}>
            Answer three simple questions so we can prioritize the safest immediate steps for your
            situation. Answers stay on this device only.
          </p>
        </div>

        <form
          id="triage-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (isComplete) onSubmit()
          }}
        >
          <fieldset className="fieldset-block">
            <legend className="fieldset-legend">
              <span className="q-badge">Q1</span>
              <span>Is someone demanding money or payment?</span>
            </legend>
            <p className="fieldset-help">
              Extortionists often apply pressure through financial ultimatums.
            </p>
            <div className="pill-stack">
              {(
                [
                  { value: 'yes', label: 'Yes — they are asking for payment' },
                  { value: 'no', label: 'No — they are threatening something else' },
                  { value: 'not_sure', label: 'Not sure / not yet clear' },
                ] as const
              ).map((opt) => (
                <div className="pill-option" key={opt.value}>
                  <input
                    type="radio"
                    id={`q1-${opt.value}`}
                    name="triage-money"
                    value={opt.value}
                    checked={money === opt.value}
                    onChange={() => onAnswerChange('money', opt.value)}
                  />
                  <label htmlFor={`q1-${opt.value}`}>
                    <span className="pill-indicator" aria-hidden="true">
                      <span className="pill-indicator-dot" />
                    </span>
                    <span className="pill-text">{opt.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="fieldset-block">
            <legend className="fieldset-legend">
              <span className="q-badge">Q2</span>
              <span>Are you under 18?</span>
            </legend>
            <p className="fieldset-help">
              Young people get specialized pathways (including Childline 1098) and AI tools stay
              disabled for safety.
            </p>
            <div className="pill-stack cols-3">
              {(
                [
                  { value: 'yes', label: 'Yes (Under 18)' },
                  { value: 'no', label: 'No (18 or older)' },
                  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                ] as const
              ).map((opt) => (
                <div className="pill-option" key={opt.value}>
                  <input
                    type="radio"
                    id={`q2-${opt.value}`}
                    name="triage-age"
                    value={opt.value}
                    checked={age === opt.value}
                    onChange={() => onAnswerChange('age', opt.value)}
                  />
                  <label htmlFor={`q2-${opt.value}`}>
                    <span className="pill-indicator" aria-hidden="true">
                      <span className="pill-indicator-dot" />
                    </span>
                    <span className="pill-text">{opt.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="fieldset-block">
            <legend className="fieldset-legend">
              <span className="q-badge">Q3</span>
              <span>
                Are you in immediate physical danger, or has someone threatened to physically harm
                you?
              </span>
            </legend>
            <p className="fieldset-help">
              Bodily safety comes before any digital blackmail or extortion.
            </p>
            <div className="pill-stack cols-2">
              {(
                [
                  {
                    value: 'yes',
                    label: 'Yes, I feel physically unsafe',
                    warn: true,
                  },
                  { value: 'no', label: 'No physical danger', warn: false },
                  { value: 'not_sure', label: 'Not sure', warn: false },
                ] as const
              ).map((opt) => (
                <div className="pill-option" key={opt.value}>
                  <input
                    type="radio"
                    id={`q3-${opt.value}`}
                    name="triage-danger"
                    value={opt.value}
                    checked={danger === opt.value}
                    onChange={() => onAnswerChange('danger', opt.value)}
                  />
                  <label htmlFor={`q3-${opt.value}`}>
                    <span className="pill-indicator" aria-hidden="true">
                      <span className="pill-indicator-dot" />
                    </span>
                    <span
                      className="pill-text"
                      style={
                        opt.warn
                          ? { display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }
                          : undefined
                      }
                    >
                      {opt.warn && (
                        <span
                          className="material-symbols-outlined fill"
                          style={{ color: 'var(--color-tertiary)', fontSize: 18 }}
                          aria-hidden="true"
                        >
                          warning
                        </span>
                      )}
                      {opt.label}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="form-actions-row">
            <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0, maxWidth: '20rem' }}>
              These questions route you to immediate safety resources — not a full legal assessment.
            </p>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isComplete}
              id="continue-btn"
            >
              Continue to Guidance
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </div>
        </form>
      </div>

      <aside aria-label="Emergency disclaimer" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <p
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: 13,
            color: 'var(--color-muted)',
            margin: 0,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span
            className="material-symbols-outlined fill"
            style={{ color: 'var(--color-tertiary)', fontSize: 14 }}
            aria-hidden="true"
          >
            emergency
          </span>
          If you or someone else is in immediate physical danger, call{' '}
          <strong style={{ color: 'var(--color-on-surface)' }}>112</strong> or local emergency
          services immediately.
        </p>
      </aside>

    </div>
  )
}
