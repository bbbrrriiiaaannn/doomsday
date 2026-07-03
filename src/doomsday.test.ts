import { describe, expect, it } from 'vitest'
import {
  anchorForCentury,
  isLeapYear,
  mod7,
  weekdayOf,
  explainDate,
  WEEKDAYS,
} from './doomsday'

describe('mod7', () => {
  it('handles negatives', () => {
    expect(mod7(-1)).toBe(6)
    expect(mod7(-7)).toBe(0)
    expect(mod7(8)).toBe(1)
  })
})

describe('isLeapYear', () => {
  it.each([
    [2000, true],
    [1900, false],
    [2024, true],
    [2023, false],
    [1600, true],
    [2100, false],
  ])('%i -> %s', (year, expected) => {
    expect(isLeapYear(year)).toBe(expected)
  })
})

describe('anchorForCentury', () => {
  it.each([
    [1800, 'Friday'],
    [1900, 'Wednesday'],
    [2000, 'Tuesday'],
    [2100, 'Sunday'],
    [2400, 'Tuesday'],
  ])('%i anchor is %s', (year, name) => {
    expect(WEEKDAYS[anchorForCentury(year)]).toBe(name)
  })
})

describe('weekdayOf matches the native Date implementation', () => {
  // JS Date.getDay() uses the same proleptic Gregorian calendar for this range.
  const cases: Array<[number, number, number]> = [
    [2000, 0, 1], // 2000-01-01 Saturday
    [2023, 3, 4], // 2023-04-04 Tuesday (a doomsday date)
    [2024, 3, 4], // 2024-04-04 Thursday (leap year doomsday)
    [1969, 6, 20], // 1969-07-20 moon landing, Sunday
    [1955, 10, 5], // Back to the Future, 1955-11-05 Saturday
    [1900, 0, 1], // 1900-01-01 Monday
    [2100, 11, 25],
    [1776, 6, 4], // US independence, 1776-07-04 Thursday
  ]

  it.each(cases)('%i-%i-%i', (year, monthIndex, day) => {
    const expected = new Date(Date.UTC(year, monthIndex, day)).getUTCDay()
    expect(weekdayOf(year, monthIndex, day)).toBe(expected)
  })
})

describe('exhaustive check against native Date across a wide range', () => {
  it('agrees for every day from 1800 through 2200', () => {
    const d = new Date(Date.UTC(1800, 0, 1))
    const end = Date.UTC(2200, 11, 31)
    let checked = 0
    while (d.getTime() <= end) {
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth()
      const day = d.getUTCDate()
      expect(weekdayOf(y, m, day)).toBe(d.getUTCDay())
      checked++
      d.setUTCDate(d.getUTCDate() + 1)
    }
    expect(checked).toBeGreaterThan(140000)
  })
})

describe('explainDate breakdown', () => {
  it('reports a known worked example (2023-04-04)', () => {
    const b = explainDate(2023, 3, 4)
    expect(b.anchorName).toBe('Tuesday') // 2000s anchor
    expect(b.yearOfCentury).toBe(23)
    expect(b.a).toBe(1) // floor(23/12)
    expect(b.b).toBe(11) // 23 mod 12
    expect(b.c).toBe(2) // floor(11/4)
    expect(b.yearSum).toBe(14)
    expect(b.doomsdayOfYearName).toBe('Tuesday')
    expect(b.monthDoomsdayDate).toBe(4) // 4/4
    expect(b.dayDelta).toBe(0)
    expect(b.weekdayName).toBe('Tuesday')
  })

  it('shifts January in leap years', () => {
    expect(explainDate(2024, 0, 1).monthDoomsdayDate).toBe(4)
    expect(explainDate(2023, 0, 1).monthDoomsdayDate).toBe(3)
  })
})
