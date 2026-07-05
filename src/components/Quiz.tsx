import { useCallback, useEffect, useMemo, useState } from 'react'
import { MONTHS, WEEKDAYS, weekdayOf } from '../doomsday'
import { Breakdown } from './Breakdown'
import { GuidedQuiz } from './GuidedQuiz'
import { randomDate, type QuizDate } from './quizDate'

type Mode = 'quick' | 'guided'

export function Quiz() {
  const [mode, setMode] = useState<Mode>('quick')
  const [date, setDate] = useState<QuizDate>(randomDate)
  const [guess, setGuess] = useState<number | null>(null)
  const [showSteps, setShowSteps] = useState(false)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [stats, setStats] = useState({
    correct: 0,
    total: 0,
    streak: 0,
    best: 0,
  })

  const answer = useMemo(
    () => weekdayOf(date.year, date.monthIndex, date.day),
    [date],
  )
  const answered = guess !== null
  const isCorrect = guess === answer

  // Live timer until the question is answered (quick mode only).
  useEffect(() => {
    if (answered || mode === 'guided') return
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 100)
    return () => clearInterval(id)
  }, [answered, startedAt, mode])

  const nextQuestion = useCallback(() => {
    setDate(randomDate())
    setGuess(null)
    setShowSteps(false)
    setStartedAt(Date.now())
    setElapsed(0)
  }, [])

  const submit = useCallback(
    (weekday: number) => {
      if (answered) return
      setElapsed(Date.now() - startedAt)
      setGuess(weekday)
      const right = weekday === answer
      setStats((s) => {
        const streak = right ? s.streak + 1 : 0
        return {
          correct: s.correct + (right ? 1 : 0),
          total: s.total + 1,
          streak,
          best: Math.max(s.best, streak),
        }
      })
    },
    [answered, answer, startedAt],
  )

  // Keyboard shortcuts: 1–7 to answer, Enter/Space for next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode === 'guided') return
      if (!answered && e.key >= '1' && e.key <= '7') {
        submit(Number(e.key) - 1)
      } else if (answered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        nextQuestion()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, submit, nextQuestion, mode])

  const accuracy =
    stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100)

  return (
    <div className="quiz">
      <div className="mode-toggle" role="tablist" aria-label="Quiz mode">
        <button
          role="tab"
          aria-selected={mode === 'quick'}
          className={mode === 'quick' ? 'active' : ''}
          onClick={() => setMode('quick')}
        >
          Quick answer
        </button>
        <button
          role="tab"
          aria-selected={mode === 'guided'}
          className={mode === 'guided' ? 'active' : ''}
          onClick={() => setMode('guided')}
        >
          Step by step
        </button>
      </div>

      {mode === 'guided' && <GuidedQuiz />}

      {mode === 'quick' && (
        <>
      <div className="scoreboard">
        <Stat label="Streak" value={stats.streak} />
        <Stat label="Best" value={stats.best} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Answered" value={stats.total} />
      </div>

      <div className="prompt-card">
        <p className="prompt-label">What day of the week is</p>
        <p className="prompt-date">
          {MONTHS[date.monthIndex]} {date.day}, {date.year}?
        </p>
        <p className="timer" aria-live="off">
          {(elapsed / 1000).toFixed(1)}s
        </p>
      </div>

      <div className="weekday-grid" role="group" aria-label="Pick a weekday">
        {WEEKDAYS.map((name, i) => {
          const state = !answered
            ? ''
            : i === answer
              ? 'correct'
              : i === guess
                ? 'wrong'
                : 'dim'
          return (
            <button
              key={name}
              className={`weekday-btn ${state}`}
              onClick={() => submit(i)}
              disabled={answered}
            >
              <span className="kbd">{i + 1}</span>
              {name}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className={`feedback ${isCorrect ? 'ok' : 'no'}`}>
          <p className="feedback-title">
            {isCorrect ? '✓ Correct!' : '✗ Not quite'} — it was{' '}
            <b>{WEEKDAYS[answer]}</b>{' '}
            <span className="feedback-time">in {(elapsed / 1000).toFixed(1)}s</span>
          </p>
          <div className="actions">
            <button className="btn primary" onClick={nextQuestion} autoFocus>
              Next date →
            </button>
            <button
              className="btn ghost"
              onClick={() => setShowSteps((v) => !v)}
            >
              {showSteps ? 'Hide' : 'Show'} the steps
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
        Tip: press keys <kbd>1</kbd>–<kbd>7</kbd> to answer, then{' '}
        <kbd>Enter</kbd> for the next date.
      </p>
        </>
      )}
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
