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
    <div className="card">
      <h1 id="triage-heading" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
        Immediate Safety Triage
      </h1>
      <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
        Answer these 3 quick questions to receive an immediate, personalized action plan.
        These answers stay strictly on your device and are never sent over the network or saved.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (isComplete) onSubmit()
        }}
      >
        {/* Question 1: Money */}
        <fieldset className="form-group" style={{ border: 'none', padding: 0, marginBottom: '1.5rem' }}>
          <legend style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
            1. Is someone demanding money or payment?
          </legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="triage-money"
                value="yes"
                checked={money === 'yes'}
                onChange={() => onAnswerChange('money', 'yes')}
              />
              <span>Yes</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="triage-money"
                value="no"
                checked={money === 'no'}
                onChange={() => onAnswerChange('money', 'no')}
              />
              <span>No</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="triage-money"
                value="not_sure"
                checked={money === 'not_sure'}
                onChange={() => onAnswerChange('money', 'not_sure')}
              />
              <span>Not sure</span>
            </label>
          </div>
        </fieldset>

        {/* Question 2: Age */}
        <fieldset className="form-group" style={{ border: 'none', padding: 0, marginBottom: '1.5rem' }}>
          <legend style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
            2. Are you under 18?
          </legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="triage-age"
                value="yes"
                checked={age === 'yes'}
                onChange={() => onAnswerChange('age', 'yes')}
              />
              <span>Yes</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="triage-age"
                value="no"
                checked={age === 'no'}
                onChange={() => onAnswerChange('age', 'no')}
              />
              <span>No</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="triage-age"
                value="prefer_not_to_say"
                checked={age === 'prefer_not_to_say'}
                onChange={() => onAnswerChange('age', 'prefer_not_to_say')}
              />
              <span>Prefer not to say</span>
            </label>
          </div>
        </fieldset>

        {/* Question 3: Physical Danger */}
        <fieldset className="form-group" style={{ border: 'none', padding: 0, marginBottom: '1.5rem' }}>
          <legend style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
            3. Are you in immediate physical danger, or has someone threatened to physically harm you?
          </legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="triage-danger"
                value="yes"
                checked={danger === 'yes'}
                onChange={() => onAnswerChange('danger', 'yes')}
              />
              <span>Yes</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="triage-danger"
                value="no"
                checked={danger === 'no'}
                onChange={() => onAnswerChange('danger', 'no')}
              />
              <span>No</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="triage-danger"
                value="not_sure"
                checked={danger === 'not_sure'}
                onChange={() => onAnswerChange('danger', 'not_sure')}
              />
              <span>Not sure</span>
            </label>
          </div>
        </fieldset>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '1.5rem' }}>
          Note: These questions provide an initial routing decision to immediate safety resources, not a full risk assessment or legal determination.
        </p>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isComplete}
          style={{ width: '100%' }}
        >
          See my steps
        </button>
      </form>
    </div>
  )
}
