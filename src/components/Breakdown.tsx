import { explainDate, WEEKDAYS } from '../doomsday'

interface Props {
  year: number
  monthIndex: number
  day: number
}

function ord(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/**
 * Renders the full Doomsday computation for a date as an ordered list of
 * worked steps, ending on the resulting weekday.
 */
export function Breakdown({ year, monthIndex, day }: Props) {
  const b = explainDate(year, monthIndex, day)

  return (
    <ol className="steps">
      <li>
        <div className="step-head">
          <span className="step-num">1</span>
          <h3>Century anchor day</h3>
        </div>
        <p>
          The century is <b>{b.century}00s</b>. Using{' '}
          <code>anchor = (5 × (c mod 4) + 2) mod 7</code> with{' '}
          <code>c = {b.century}</code>:
        </p>
        <p className="calc">
          (5 × ({b.century} mod 4) + 2) mod 7 = (5 × {b.centuryMod4} + 2) mod 7 ={' '}
          {5 * b.centuryMod4 + 2} mod 7 = <b>{b.anchor}</b>
        </p>
        <p>
          Anchor weekday: <span className="pill">{b.anchorName}</span>
        </p>
      </li>

      <li>
        <div className="step-head">
          <span className="step-num">2</span>
          <h3>Doomsday of the year</h3>
        </div>
        <p>
          Take the last two digits, <code>y = {b.yearOfCentury}</code>, and
          apply the "divide by 12" method:
        </p>
        <p className="calc">
          a = ⌊{b.yearOfCentury} / 12⌋ = <b>{b.a}</b>
          <br />b = {b.yearOfCentury} mod 12 = <b>{b.b}</b>
          <br />c = ⌊{b.b} / 4⌋ = <b>{b.c}</b>
          <br />sum = {b.a} + {b.b} + {b.c} = <b>{b.yearSum}</b>
        </p>
        <p>
          Add the anchor and reduce mod 7:{' '}
          <code>
            ({b.anchor} + {b.yearSum}) mod 7 = {b.doomsdayOfYear}
          </code>
        </p>
        <p>
          {b.year}'s doomsday is{' '}
          <span className="pill">{b.doomsdayOfYearName}</span>
        </p>
      </li>

      <li>
        <div className="step-head">
          <span className="step-num">3</span>
          <h3>Nearest doomsday date in {b.monthName}</h3>
        </div>
        <p>
          In {b.year} ({b.leap ? 'a leap year' : 'a common year'}), the doomsday
          date for {b.monthName} is the{' '}
          <b>{ord(b.monthDoomsdayDate)}</b>. That date falls on{' '}
          <span className="pill">{b.doomsdayOfYearName}</span>.
        </p>
      </li>

      <li>
        <div className="step-head">
          <span className="step-num">4</span>
          <h3>Count to your day</h3>
        </div>
        <p>
          Your day is the <b>{ord(b.day)}</b>. Distance from the doomsday date:{' '}
          <code>
            {b.day} − {b.monthDoomsdayDate} = {b.dayDelta}
          </code>
          .
        </p>
        <p className="calc">
          ({b.doomsdayOfYear} + {b.dayDelta}) mod 7 = <b>{b.weekday}</b> →{' '}
          {WEEKDAYS[b.weekday]}
        </p>
      </li>

      <li className="result-step">
        <div className="step-head">
          <span className="step-num">✓</span>
          <h3>Result</h3>
        </div>
        <p className="final">
          {b.monthName} {b.day}, {b.year} is a{' '}
          <span className="pill pill-final">{b.weekdayName}</span>
        </p>
      </li>
    </ol>
  )
}
