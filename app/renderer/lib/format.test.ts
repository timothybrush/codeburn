import { describe, expect, it } from 'vitest'

import { formatCompact, formatDayLong, formatDayShort, formatDuration } from './format'

describe('formatCompact', () => {
  it('formats zero, plain counts, thousands, and millions compactly', () => {
    expect(formatCompact(0)).toBe('0')
    expect(formatCompact(842)).toBe('842')
    expect(formatCompact(1_842)).toBe('1.8K')
    expect(formatCompact(184_000)).toBe('184K')
    expect(formatCompact(1_200_000)).toBe('1.2M')
  })

  it('trims trailing decimals and rejects non-finite values', () => {
    expect(formatCompact(2_000_000)).toBe('2M')
    expect(formatCompact(Number.NaN)).toBe('—')
  })
})

describe('date and duration formatters', () => {
  it('formats short and long calendar dates and handles invalid input', () => {
    const date = '2026-07-10T12:00:00'
    expect(formatDayShort(date)).toBe('Jul 10')
    expect(formatDayLong(date)).toBe('Jul 10, 2026')
    expect(formatDayShort('not-a-date')).toBe('—')
    expect(formatDayLong('not-a-date')).toBe('—')
  })

  it('formats seconds, minutes, hours, and invalid durations', () => {
    expect(formatDuration(29_000)).toBe('29s')
    expect(formatDuration(47 * 60_000)).toBe('47m')
    expect(formatDuration(134 * 60_000)).toBe('2h 14m')
    expect(formatDuration(0)).toBe('—')
  })
})
