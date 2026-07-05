import {
  anchorForCentury,
  doomsdayDateForMonth,
  explainDate,
  MONTHS,
  WEEKDAYS,
} from '../doomsday'

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

// The classic memorized set of century anchors. Because the Gregorian anchor
// repeats every 400 years, these four cover every century (matched by c mod 4).
const REFERENCE_CENTURIES = [18, 19, 20, 21]

/** The four "magic numbers" people memorize for recent centuries. */
function CenturyAnchorReference({ century }: { century: number }) {
  return (
    <table className="ref-table">
      <thead>
        <tr>
          <th>Century</th>
          <th>c mod 4</th>
          <th>Anchor</th>
        </tr>
      </thead>
      <tbody>
        {REFERENCE_CENTURIES.map((c) => {
          const anchor = anchorForCentury(c * 100)
          const active = c % 4 === ((century % 4) + 4) % 4
          return (
            <tr key={c} className={active ? 'active' : ''}>
              <td>{c}00s</td>
              <td>{c % 4}</td>
              <td>{WEEKDAYS[anchor]}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// Short mnemonic for each month's doomsday date, indexed by month.
const MONTH_MNEMONICS = [
  'last day of Jan (3rd, or 4th in a leap year)',
  'last day of Feb (28th, or 29th in a leap year)',
  'Pi day — 3/14',
  '4/4',
  '"9-to-5" — 5/9',
  '6/6',
  '"7-11" — 7/11',
  '8/8',
  '"9-to-5" — 9/5',
  '10/10',
  '"7-11" — 11/7',
  '12/12',
]

/** Every month's doomsday date, with the leap-year shift called out. */
function MonthlyDoomsdayReference({
  monthIndex,
  leap,
}: {
  monthIndex: number
  leap: boolean
}) {
  return (
    <table className="ref-table month-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Doomsday date</th>
          <th>How to remember</th>
        </tr>
      </thead>
      <tbody>
        {MONTHS.map((name, i) => {
          const common = doomsdayDateForMonth(i, false)
          const leapDate = doomsdayDateForMonth(i, true)
          const shifts = common !== leapDate
          return (
            <tr key={name} className={i === monthIndex ? 'active' : ''}>
              <td>{name}</td>
              <td>
                {shifts ? (
                  <>
                    {common}
                    <span className="leap-note">
                      {' '}
                      / {leapDate} <em>(leap)</em>
                    </span>
                  </>
                ) : (
                  common
                )}
              </td>
              <td className="mnemonic-cell">{MONTH_MNEMONICS[i]}</td>
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3}>
            This {leap ? 'is' : 'is not'} a leap year, so{' '}
            {MONTHS[monthIndex]} uses the{' '}
            <b>{ord(doomsdayDateForMonth(monthIndex, leap))}</b>.
          </td>
        </tr>
      </tfoot>
    </table>
  )
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
        <p className="ref-label">
          Recent century "magic numbers" (they repeat every 400 years):
        </p>
        <CenturyAnchorReference century={b.century} />
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
        <p className="ref-label">Doomsday date for every month:</p>
        <MonthlyDoomsdayReference monthIndex={b.monthIndex} leap={b.leap} />
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
