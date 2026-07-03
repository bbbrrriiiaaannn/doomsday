import { useState } from 'react'
import { MONTHS } from '../doomsday'
import { Breakdown } from './Breakdown'

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

const today = new Date()

/** Lets the user pick any date and see the full worked breakdown. */
export function Explorer() {
  const [year, setYear] = useState(today.getFullYear())
  const [monthIndex, setMonthIndex] = useState(today.getMonth())
  const [day, setDay] = useState(today.getDate())

  const maxDay = daysInMonth(year, monthIndex)
  const clampedDay = Math.min(day, maxDay)

  return (
    <div className="explorer">
      <div className="date-picker">
        <label>
          <span>Month</span>
          <select
            value={monthIndex}
            onChange={(e) => setMonthIndex(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Day</span>
          <select value={clampedDay} onChange={(e) => setDay(Number(e.target.value))}>
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Year</span>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <Breakdown year={year} monthIndex={monthIndex} day={clampedDay} />
    </div>
  )
}
