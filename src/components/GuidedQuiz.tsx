import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import {
  doomsdayDateForMonth,
  explainDate,
  MONTHS,
  WEEKDAYS,
} from '../doomsday'
import { Breakdown } from './Breakdown'
import { randomDate, type QuizDate } from './quizDate'

function ord(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

interface Step {
  title: string
  prompt: ReactNode
  /** Choices the learner picks from, as raw values. */
  options: number[]
  /** Label for a given option value. */
  label: (value: number) => string
  correct: number
  /** Shown after the step is answered. */
  explain: ReactNode
}

const WEEKDAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6]

// A pool of plausible "doomsday date" distractors, drawn from real months.
function dateOptions(correct: number): number[] {
  const pool = new Set<number>()
  for (let m = 0; m < 12; m++) {
    pool.add(doomsdayDateForMonth(m, false))
    pool.add(doomsdayDateForMonth(m, true))
  }
  pool.delete(correct)
  const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3)
  return [correct, ...distractors].sort(() => Math.random() - 0.5)
}

function buildSteps(date: QuizDate): Step[] {
  const b = explainDate(date.year, date.monthIndex, date.day)
  return [
    {
      title: 'Century anchor',
      prompt: (
        <>
          What is the <b>anchor day</b> for the <b>{b.century}00s</b>?
        </>
      ),
      options: WEEKDAY_OPTIONS,
      label: (v) => WEEKDAYS[v],
      correct: b.anchor,
      explain: (
        <>
          <code>
            (5 × {b.centuryMod4} + 2) mod 7 = {b.anchor}
          </code>{' '}
          → the {b.century}00s anchor is <b>{b.anchorName}</b>.
        </>
      ),
    },
    {
      title: "Year's doomsday",
      prompt: (
        <>
          The anchor is <b>{b.anchorName}</b>. What is <b>{b.year}</b>'s doomsday?
        </>
      ),
      options: WEEKDAY_OPTIONS,
      label: (v) => WEEKDAYS[v],
      correct: b.doomsdayOfYear,
      explain: (
        <>
          y = {b.yearOfCentury}: a={b.a}, b={b.b}, c={b.c}, sum={b.yearSum}.{' '}
          <code>
            ({b.anchor} + {b.yearSum}) mod 7 = {b.doomsdayOfYear}
          </code>{' '}
          → <b>{b.doomsdayOfYearName}</b>.
        </>
      ),
    },
    {
      title: 'Month doomsday date',
      prompt: (
        <>
          Which date is the <b>doomsday date</b> for <b>{b.monthName}</b>
          {b.leap ? ' in this leap year' : ''}?
        </>
      ),
      options: dateOptions(b.monthDoomsdayDate),
      label: (v) => ord(v),
      correct: b.monthDoomsdayDate,
      explain: (
        <>
          {b.monthName}'s doomsday date is the <b>{ord(b.monthDoomsdayDate)}</b>,
          which falls on <b>{b.doomsdayOfYearName}</b> (the year's doomsday).
        </>
      ),
    },
    {
      title: 'Your day',
      prompt: (
        <>
          {b.monthName} {b.day} is <b>{b.dayDelta}</b> day
          {Math.abs(b.dayDelta) === 1 ? '' : 's'} from the{' '}
          {ord(b.monthDoomsdayDate)}. So what weekday is{' '}
          <b>
            {b.monthName} {b.day}, {b.year}
          </b>
          ?
        </>
      ),
      options: WEEKDAY_OPTIONS,
      label: (v) => WEEKDAYS[v],
      correct: b.weekday,
      explain: (
        <>
          <code>
            ({b.doomsdayOfYear} + {b.dayDelta}) mod 7 = {b.weekday}
          </code>{' '}
          → <b>{b.weekdayName}</b>.
        </>
      ),
    },
  ]
}

export function GuidedQuiz() {
  const [date, setDate] = useState<QuizDate>(randomDate)
  const [stepIndex, setStepIndex] = useState(0)
  const [guess, setGuess] = useState<number | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [done, setDone] = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const [stats, setStats] = useState({
    dates: 0,
    perfect: 0,
    streak: 0,
    best: 0,
    stepsCorrect: 0,
    stepsTotal: 0,
  })

  const steps = useMemo(() => buildSteps(date), [date])
  const step = steps[stepIndex]
  const answered = guess !== null
  const isLast = stepIndex === steps.length - 1

  const newDate = useCallback(() => {
    setDate(randomDate())
    setStepIndex(0)
    setGuess(null)
    setResults([])
    setDone(false)
    setShowSteps(false)
  }, [])

  const choose = useCallback(
    (value: number) => {
      if (answered) return
      const right = value === step.correct
      setGuess(value)
      setResults((r) => [...r, right])
      setStats((s) => ({
        ...s,
        stepsCorrect: s.stepsCorrect + (right ? 1 : 0),
        stepsTotal: s.stepsTotal + 1,
      }))
    },
    [answered, step],
  )

  const advance = useCallback(() => {
    if (!answered) return
    if (!isLast) {
      setStepIndex((i) => i + 1)
      setGuess(null)
      return
    }
    // Finished the date — fold the per-step results into date-level stats.
    setDone(true)
    setStats((s) => {
      const perfect = results.length === steps.length && results.every(Boolean)
      const streak = perfect ? s.streak + 1 : 0
      return {
        ...s,
        dates: s.dates + 1,
        perfect: s.perfect + (perfect ? 1 : 0),
        streak,
        best: Math.max(s.best, streak),
      }
    })
  }, [answered, isLast, results, steps.length])

  // Keyboard: number keys pick an option, Enter advances.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          newDate()
        }
        return
      }
      if (!answered) {
        const n = Number(e.key)
        if (n >= 1 && n <= step.options.length) choose(step.options[n - 1])
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, done, step, choose, advance, newDate])

  const stepAccuracy =
    stats.stepsTotal === 0
      ? 0
      : Math.round((stats.stepsCorrect / stats.stepsTotal) * 100)

  return (
    <div className="guided">
      <div className="scoreboard">
        <Stat label="Streak" value={stats.streak} />
        <Stat label="Best" value={stats.best} />
        <Stat label="Step acc." value={`${stepAccuracy}%`} />
        <Stat label="Solved" value={stats.dates} />
      </div>

      <div className="prompt-card">
        <p className="prompt-label">Work out, step by step</p>
        <p className="prompt-date">
          {MONTHS[date.monthIndex]} {date.day}, {date.year}
        </p>
        <div className="progress-dots" aria-hidden="true">
          {steps.map((s, i) => {
            const cls =
              i < results.length
                ? results[i]
                  ? 'ok'
                  : 'no'
                : i === stepIndex && !done
                  ? 'current'
                  : ''
            return <span key={s.title} className={`dot ${cls}`} />
          })}
        </div>
      </div>

      {!done ? (
        <>
          <div className="guided-step">
            <p className="step-progress-label">
              Step {stepIndex + 1} of {steps.length} · {step.title}
            </p>
            <p className="guided-prompt">{step.prompt}</p>
          </div>

          <div
            className="weekday-grid"
            role="group"
            aria-label={step.title}
          >
            {step.options.map((value, i) => {
              const state = !answered
                ? ''
                : value === step.correct
                  ? 'correct'
                  : value === guess
                    ? 'wrong'
                    : 'dim'
              return (
                <button
                  key={value}
                  className={`weekday-btn ${state}`}
                  onClick={() => choose(value)}
                  disabled={answered}
                >
                  <span className="kbd">{i + 1}</span>
                  {step.label(value)}
                </button>
              )
            })}
          </div>

          {answered && (
            <div className={`feedback ${guess === step.correct ? 'ok' : 'no'}`}>
              <p className="feedback-title">
                {guess === step.correct ? '✓ Correct!' : '✗ Not quite.'}{' '}
                <span className="feedback-explain">{step.explain}</span>
              </p>
              <div className="actions">
                <button className="btn primary" onClick={advance} autoFocus>
                  {isLast ? 'See result →' : 'Next step →'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          className={`feedback ${results.every(Boolean) ? 'ok' : 'no'}`}
        >
          <p className="feedback-title">
            {results.every(Boolean)
              ? '✓ Perfect — every step correct!'
              : `You got ${results.filter(Boolean).length} of ${steps.length} steps.`}{' '}
            {MONTHS[date.monthIndex]} {date.day}, {date.year} is a{' '}
            <b>{WEEKDAYS[steps[steps.length - 1].correct]}</b>.
          </p>
          <div className="actions">
            <button className="btn primary" onClick={newDate} autoFocus>
              New date →
            </button>
            <button className="btn ghost" onClick={() => setShowSteps((v) => !v)}>
              {showSteps ? 'Hide' : 'Review'} the full breakdown
            </button>
          </div>
          {showSteps && (
            <div className="quiz-breakdown">
              <Breakdown
                year={date.year}
                monthIndex={date.monthIndex}
                day={date.day}
              />
            </div>
          )}
        </div>
      )}

      <p className="hint">
        Tip: press number keys to pick an answer, then <kbd>Enter</kbd> to
        continue.
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
