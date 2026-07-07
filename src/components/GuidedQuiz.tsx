import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import {
  doomsdayDateForMonth,
  explainDate,
  mod7,
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
  /** How-to-work-it-out guidance, shown on demand before answering. */
  hint: ReactNode
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
  // The number of days to count forward once whole weeks are dropped.
  const yearShift = mod7(b.yearSum)
  const dayShift = mod7(b.dayDelta)
  const absDelta = Math.abs(b.dayDelta)

  return [
    {
      title: 'Century anchor',
      prompt: (
        <>
          Start with the century: what is the <b>anchor day</b> of the{' '}
          <b>{b.century}00s</b>?
        </>
      ),
      hint: (
        <>
          <p>
            Every century has a fixed anchor day. This one is pure memory —
            learn these four, and they repeat forever (2200s = 1800s, and so
            on):
          </p>
          <ul>
            <li>
              1800s → <b>Friday</b>
            </li>
            <li>
              1900s → <b>Wednesday</b> — “We-in-dis-day”
            </li>
            <li>
              2000s → <b>Tuesday</b> — “Y2K was a Twos-day”
            </li>
            <li>
              2100s → <b>Sunday</b>
            </li>
          </ul>
          <p>
            Prefer to compute it? <code>5 × (century mod 4) + 2</code>, counting
            days as Sun 0 · Mon 1 · Tue 2 · Wed 3 · Thu 4 · Fri 5 · Sat 6.
          </p>
        </>
      ),
      options: WEEKDAY_OPTIONS,
      label: (v) => WEEKDAYS[v],
      correct: b.anchor,
      explain: (
        <>
          The {b.century}00s anchor is <b>{b.anchorName}</b>. Formula check: 5 ×{' '}
          {b.centuryMod4} + 2 = {5 * b.centuryMod4 + 2}; drop whole weeks to get{' '}
          {b.anchor}, and day {b.anchor} is {b.anchorName} (Sun&nbsp;0 …
          Sat&nbsp;6).
        </>
      ),
    },
    {
      title: "Year's doomsday",
      prompt: (
        <>
          Anchor in hand: <b>{b.anchorName}</b>. Now shift it to the year — what
          is <b>{b.year}</b>'s doomsday?
        </>
      ),
      hint: (
        <>
          <p>
            Take the last two digits, <b>{b.yearOfCentury}</b>, and ask three
            quick questions:
          </p>
          <ol>
            <li>
              How many <b>12s</b> fit in {b.yearOfCentury}?
            </li>
            <li>
              How much is <b>left over</b> after those 12s?
            </li>
            <li>
              How many <b>4s</b> fit in that leftover?
            </li>
          </ol>
          <p>
            Add the three answers, drop whole weeks (7s), and count the
            remaining days forward from <b>{b.anchorName}</b>.
          </p>
        </>
      ),
      options: WEEKDAY_OPTIONS,
      label: (v) => WEEKDAYS[v],
      correct: b.doomsdayOfYear,
      explain: (
        <>
          12s in {b.yearOfCentury}: <b>{b.a}</b>. Left over:{' '}
          <b>{b.b}</b>. 4s in {b.b}: <b>{b.c}</b>. Total: {b.a} + {b.b} + {b.c}{' '}
          = {b.yearSum}
          {yearShift !== b.yearSum && (
            <> — drop whole weeks and {yearShift} remains</>
          )}
          .{' '}
          {yearShift === 0 ? (
            <>
              That's a whole number of weeks, so the doomsday stays put:{' '}
              <b>{b.doomsdayOfYearName}</b>.
            </>
          ) : (
            <>
              {b.anchorName} + {yearShift} day{yearShift === 1 ? '' : 's'} ={' '}
              <b>{b.doomsdayOfYearName}</b>.
            </>
          )}
        </>
      ),
    },
    {
      title: 'Month doomsday date',
      prompt: (
        <>
          {b.year}'s doomsday is <b>{b.doomsdayOfYearName}</b>. Which date in{' '}
          <b>{b.monthName}</b> is a doomsday date
          {b.leap && b.monthIndex <= 1 ? (
            <>
              {' '}
              — careful, {b.year} is a <b>leap year</b>
            </>
          ) : null}
          ?
        </>
      ),
      hint: (
        <>
          <p>The doomsday dates come in memorable families:</p>
          <ul>
            <li>
              Even months double up: <b>4/4, 6/6, 8/8, 10/10, 12/12</b>
            </li>
            <li>
              “Working <b>9-to-5</b> at the <b>7-11</b>”: 5/9, 9/5, 7/11, 11/7
            </li>
            <li>
              March: <b>Pi Day</b>, 3/14
            </li>
            <li>
              January: the <b>3rd</b> three years out of four; the <b>4th</b> in
              the 4th (leap) year
            </li>
            <li>
              February: the <b>last day</b> — 28th, or 29th in a leap year
            </li>
          </ul>
        </>
      ),
      options: dateOptions(b.monthDoomsdayDate),
      label: (v) => ord(v),
      correct: b.monthDoomsdayDate,
      explain: (
        <>
          {b.monthName}'s doomsday date
          {b.leap && b.monthIndex <= 1 ? ' in a leap year' : ''} is the{' '}
          <b>{ord(b.monthDoomsdayDate)}</b> — so {b.monthName}{' '}
          {b.monthDoomsdayDate}, {b.year} is a <b>{b.doomsdayOfYearName}</b>.
        </>
      ),
    },
    {
      title: 'Count to your day',
      prompt: (
        <>
          So {b.monthName} {b.monthDoomsdayDate} is a{' '}
          <b>{b.doomsdayOfYearName}</b>. Home stretch: what weekday is{' '}
          <b>
            {b.monthName} {b.day}, {b.year}
          </b>
          ?
        </>
      ),
      hint: (
        <>
          <ol>
            <li>
              Find the gap: {b.day} − {b.monthDoomsdayDate} = <b>{b.dayDelta}</b>{' '}
              day{absDelta === 1 ? '' : 's'}.
            </li>
            <li>
              Drop whole weeks — moving 7 days lands on the same weekday.
            </li>
            <li>
              Count what's left forward from <b>{b.doomsdayOfYearName}</b>.
              Going <i>back</i> n days is the same as going <i>forward</i> 7 − n.
            </li>
          </ol>
        </>
      ),
      options: WEEKDAY_OPTIONS,
      label: (v) => WEEKDAYS[v],
      correct: b.weekday,
      explain:
        b.dayDelta === 0 ? (
          <>
            {b.monthName} {b.day} <i>is</i> the doomsday date, so it's a{' '}
            <b>{b.weekdayName}</b>.
          </>
        ) : dayShift === 0 ? (
          <>
            The gap of {b.dayDelta} days is a whole number of weeks — same
            weekday: <b>{b.weekdayName}</b>.
          </>
        ) : (
          <>
            {b.monthName} {b.day} is {absDelta} day{absDelta === 1 ? '' : 's'}{' '}
            {b.dayDelta > 0 ? 'after' : 'before'} the{' '}
            {ord(b.monthDoomsdayDate)}
            {dayShift !== b.dayDelta && (
              <>
                {' '}
                — the same as <b>{dayShift} forward</b> once whole weeks are
                dropped
              </>
            )}
            . {b.doomsdayOfYearName} + {dayShift} = <b>{b.weekdayName}</b>.
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

          <details className="method-hint" key={`hint-${stepIndex}`}>
            <summary>Need the method?</summary>
            <div className="method-hint-body">{step.hint}</div>
          </details>

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
