import { describe, expect, it } from 'vitest'

import type { DailyHistoryEntry, Period } from './types'
import { contiguousDailyWindow, formatChartDate, periodWindowStart, sliceDailyToPeriod } from './period'

function entry(date: string): DailyHistoryEntry {
  return {
    date,
    cost: 1,
    savingsUSD: 0,
    calls: 1,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    topModels: [],
  }
}

const NOW = new Date(2026, 6, 10, 12, 0, 0)
const DAILY = [
  entry('2026-05-31'),
  entry('2026-06-01'),
  entry('2026-06-10'),
  entry('2026-06-11'),
  entry('2026-07-01'),
  entry('2026-07-03'),
  entry('2026-07-04'),
  entry('2026-07-09'),
  entry('2026-07-10'),
  entry('2026-07-11'),
]

// All active-day entries at or before NOW's calendar day (the future 07-11 entry
// is always excluded). Reused by the widest windows ('all', 'lifetime').
const ALL_ACTIVE_THROUGH_NOW = [
  '2026-05-31',
  '2026-06-01',
  '2026-06-10',
  '2026-06-11',
  '2026-07-01',
  '2026-07-03',
  '2026-07-04',
  '2026-07-09',
  '2026-07-10',
]

describe('sliceDailyToPeriod', () => {
  it.each<[Period, string[]]>([
    ['today', ['2026-07-10']],
    // Window boundaries mirror src/cli-date.ts: week = now-7, 30days = now-30.
    ['week', ['2026-07-03', '2026-07-04', '2026-07-09', '2026-07-10']],
    ['30days', ['2026-06-10', '2026-06-11', '2026-07-01', '2026-07-03', '2026-07-04', '2026-07-09', '2026-07-10']],
    ['month', ['2026-07-01', '2026-07-03', '2026-07-04', '2026-07-09', '2026-07-10']],
    ['all', ALL_ACTIVE_THROUGH_NOW],
    // lifetime is unbounded below (1970), so it holds every active day up to today.
    ['lifetime', ALL_ACTIVE_THROUGH_NOW],
  ])('returns only in-window entries for %s', (period, expectedDates) => {
    expect(sliceDailyToPeriod(DAILY, period, NOW).map(day => day.date)).toEqual(expectedDates)
  })
})

// Parity fixture: the inclusive window-start each period must produce, computed
// exactly as src/cli-date.ts getDateRange() does for the same NOW. If cli-date
// shifts a boundary, this table must move with it or the client will drift.
describe('periodWindowStart matches src/cli-date.ts getDateRange', () => {
  // NOW = 2026-07-10. Values below are the local date-key of getDateRange().range.start.
  it.each<[Period, string]>([
    ['today', '2026-07-10'], // new Date(y, m, d)
    ['week', '2026-07-03'], // new Date(y, m, d - 7)
    ['30days', '2026-06-10'], // new Date(y, m, d - 30)
    ['month', '2026-07-01'], // new Date(y, m, 1)
    ['all', '2026-01-01'], // new Date(y, m - 6, 1)
    ['lifetime', '1970-01-01'], // new Date(1970, 0, 1)
  ])('aligns %s to the CLI window start', (period, expected) => {
    expect(periodWindowStart(period, NOW)).toBe(expected)
  })
})

describe('contiguousDailyWindow', () => {
  it('zero-fills inactive calendar days between sparse real entries', () => {
    const sparse = [entry('2026-07-08'), entry('2026-07-10')]
    const window = contiguousDailyWindow(sparse, '2026-07-07', '2026-07-10')

    expect(window.map(day => day.date)).toEqual(['2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10'])
    // The real entries keep their cost; the two gaps are zero-filled.
    expect(window.map(day => day.cost)).toEqual([0, 1, 0, 1])
  })
})

describe('formatChartDate', () => {
  it('formats date keys without shifting the local calendar day', () => {
    expect(formatChartDate('2026-07-01')).toBe('Jul 1')
  })
})
