import type { DailyHistoryEntry, Period } from './types'

/** Local calendar date key "YYYY-MM-DD", matching the CLI's `dateKey` (src/day-aggregator.ts). */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Shared period-window helper for backfilled `history.daily` arrays. T8 should
 * migrate Overview.tsx to this helper so both sections use one source of truth.
 */
export function periodWindowStart(period: Period, now = new Date()): string | null {
  switch (period) {
    case 'today':
      return localDateKey(now)
    case 'week':
      return localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6))
    case '30days':
      return localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29))
    case 'month':
      return localDateKey(new Date(now.getFullYear(), now.getMonth(), 1))
    case 'all':
      return null
  }
}

/** `history.daily` entries within the selected period's date window. */
export function sliceDailyToPeriod(daily: DailyHistoryEntry[], period: Period, now = new Date()): DailyHistoryEntry[] {
  const start = periodWindowStart(period, now)
  const todayKey = localDateKey(now)
  return daily.filter(d => (start === null || d.date >= start) && d.date <= todayKey)
}

/** Length of the selected period in days; `all` spans available history when provided. */
export function periodLengthDays(period: Period, daily: DailyHistoryEntry[] = [], now = new Date()): number {
  switch (period) {
    case 'today':
      return 1
    case 'week':
      return 7
    case '30days':
      return 30
    case 'month':
      return now.getDate()
    case 'all': {
      if (daily.length === 0) return 1
      const earliest = daily.reduce((min, d) => (d.date < min ? d.date : min), daily[0].date)
      const [y, m, d] = earliest.split('-').map(Number)
      const start = new Date(y, m - 1, d)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return Math.max(1, Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1)
    }
  }
}
