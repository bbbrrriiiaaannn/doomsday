export interface QuizDate {
  year: number
  monthIndex: number
  day: number
}

const MIN_YEAR = 1900
const MAX_YEAR = 2099

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

export function randomDate(): QuizDate {
  const year = MIN_YEAR + Math.floor(Math.random() * (MAX_YEAR - MIN_YEAR + 1))
  const monthIndex = Math.floor(Math.random() * 12)
  const day = 1 + Math.floor(Math.random() * daysInMonth(year, monthIndex))
  return { year, monthIndex, day }
}
