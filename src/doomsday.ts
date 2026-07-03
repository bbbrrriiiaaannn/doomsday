/**
 * Conway's Doomsday algorithm for computing the day of the week of any date
 * in the proleptic Gregorian calendar.
 *
 * Every function here is pure so it can be exercised from tests and rendered
 * step-by-step in the UI.
 */

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export type Weekday = (typeof WEEKDAYS)[number]

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/** Always returns a value in [0, 6], even for negative inputs. */
export function mod7(n: number): number {
  return ((n % 7) + 7) % 7
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * The "doomsday date" for each month — a date every year that always lands on
 * that year's doomsday. January and February shift by one in leap years.
 * Index 0 = January.
 */
export function doomsdayDateForMonth(monthIndex: number, leap: boolean): number {
  const dates = [
    leap ? 4 : 3, // January
    leap ? 29 : 28, // February (last day of the month)
    14, // March — "Pi day", 3/14
    4, // April — 4/4
    9, // May — 5/9 ("9-to-5")
    6, // June — 6/6
    11, // July — 7/11
    8, // August — 8/8
    5, // September — 9/5 ("9-to-5")
    10, // October — 10/10
    7, // November — 11/7 ("7-11")
    12, // December — 12/12
  ]
  return dates[monthIndex]
}

/**
 * The anchor weekday for a century (the doomsday of the years xx00 within it).
 * anchor = (5 * (c mod 4) + 2) mod 7, with Sunday = 0.
 * e.g. 1800s = Friday, 1900s = Wednesday, 2000s = Tuesday, 2100s = Sunday.
 */
export function anchorForCentury(year: number): number {
  const c = Math.floor(year / 100)
  return mod7(5 * (((c % 4) + 4) % 4) + 2)
}

/** A fully broken-down computation, suitable for rendering in the UI. */
export interface DoomsdayBreakdown {
  year: number
  monthIndex: number
  day: number
  leap: boolean

  century: number
  centuryMod4: number
  anchor: number
  anchorName: Weekday

  yearOfCentury: number
  /** floor(y / 12) */
  a: number
  /** y mod 12 */
  b: number
  /** floor((y mod 12) / 4) */
  c: number
  /** a + b + c */
  yearSum: number
  doomsdayOfYear: number
  doomsdayOfYearName: Weekday

  monthName: string
  monthDoomsdayDate: number
  dayDelta: number
  weekday: number
  weekdayName: Weekday
}

/**
 * Compute the weekday of a date together with every intermediate value used
 * along the way. `monthIndex` is 0-based (January = 0).
 */
export function explainDate(
  year: number,
  monthIndex: number,
  day: number,
): DoomsdayBreakdown {
  const leap = isLeapYear(year)
  const century = Math.floor(year / 100)
  const centuryMod4 = ((century % 4) + 4) % 4
  const anchor = anchorForCentury(year)

  const yearOfCentury = ((year % 100) + 100) % 100
  const a = Math.floor(yearOfCentury / 12)
  const b = yearOfCentury % 12
  const c = Math.floor(b / 4)
  const yearSum = a + b + c
  const doomsdayOfYear = mod7(anchor + yearSum)

  const monthDoomsdayDate = doomsdayDateForMonth(monthIndex, leap)
  const dayDelta = day - monthDoomsdayDate
  const weekday = mod7(doomsdayOfYear + dayDelta)

  return {
    year,
    monthIndex,
    day,
    leap,
    century,
    centuryMod4,
    anchor,
    anchorName: WEEKDAYS[anchor],
    yearOfCentury,
    a,
    b,
    c,
    yearSum,
    doomsdayOfYear,
    doomsdayOfYearName: WEEKDAYS[doomsdayOfYear],
    monthName: MONTHS[monthIndex],
    monthDoomsdayDate,
    dayDelta,
    weekday,
    weekdayName: WEEKDAYS[weekday],
  }
}

/** Weekday of a date, 0 = Sunday. */
export function weekdayOf(year: number, monthIndex: number, day: number): number {
  return explainDate(year, monthIndex, day).weekday
}
