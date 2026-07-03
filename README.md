# Doomsday Trainer

A web app for practicing **Conway's Doomsday algorithm** — the mental-math
trick for working out the day of the week of any date.

Two modes:

- **Quiz me** — get a random date, guess the weekday (mouse or keys `1`–`7`),
  and track your streak, accuracy, and answer time. After each guess you can
  reveal the full step-by-step solution.
- **Break down a date** — pick any date and see every stage of the algorithm
  worked out: the century anchor, the year's doomsday via the "divide by 12"
  method, the nearest doomsday date in the month, and the final count.

## The algorithm

For a date in year `Y`, month, and day:

1. **Century anchor.** With `c = ⌊Y / 100⌋`,
   `anchor = (5 × (c mod 4) + 2) mod 7` (Sunday = 0). This gives Friday for the
   1800s, Wednesday for the 1900s, Tuesday for the 2000s, Sunday for the 2100s.
2. **Doomsday of the year.** Take `y = Y mod 100`, then
   `a = ⌊y / 12⌋`, `b = y mod 12`, `c = ⌊b / 4⌋`, and
   `doomsday = (anchor + a + b + c) mod 7`.
3. **Month's doomsday date.** Each month has a date that always lands on the
   year's doomsday (4/4, 6/6, 8/8, 10/10, 12/12, 5/9, 9/5, 7/11, 11/7, the last
   day of February, etc.), shifted by one in January/February of leap years.
4. **Count.** Add the offset between your day and the month's doomsday date to
   the year's doomsday, mod 7.

The implementation lives in [`src/doomsday.ts`](src/doomsday.ts) as pure
functions, so it is both rendered in the UI and covered by tests — including an
exhaustive day-by-day comparison against the native `Date` object for every
date from 1800 through 2200.

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm test           # run the algorithm test suite
npm run build      # typecheck + production build
npm run preview    # serve the production build
```

## Stack

Vite + React + TypeScript, with Vitest for tests. No runtime dependencies
beyond React.
