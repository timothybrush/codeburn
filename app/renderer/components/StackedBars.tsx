import type { DailyHistoryEntry } from '../lib/types'

export const SERIES_HEX = {
  opus: '#5B8CFF',
  sonnet: '#8B7CF6',
  haiku: '#B5A8FF',
  gpt: '#4DD8E6',
  other: '#5F6780',
} as const

export type SeriesKey = keyof typeof SERIES_HEX

export function seriesKeyForModel(model?: string): SeriesKey {
  const m = (model ?? '').toLowerCase()
  if (m.includes('opus')) return 'opus'
  if (m.includes('sonnet')) return 'sonnet'
  if (m.includes('haiku')) return 'haiku'
  if (m.includes('gpt') || m.includes('codex')) return 'gpt'
  return 'other'
}

export function seriesClassForModel(model?: string): string {
  switch (seriesKeyForModel(model)) {
    case 'opus':
      return 's-opus'
    case 'sonnet':
      return 's-son'
    case 'haiku':
      return 's-hai'
    case 'gpt':
      return 's-gpt'
    case 'other':
      return 's-other'
  }
}

export function seriesHexForModel(model?: string): string {
  return SERIES_HEX[seriesKeyForModel(model)]
}

export function isOtherNode(idOrLabel?: string): boolean {
  const value = (idOrLabel ?? '').trim().toLowerCase()
  return value === '__other__' || value === 'other' || value === 'others'
}

export function StackedBars({ daily }: { daily: DailyHistoryEntry[] }) {
  const maxTotal = Math.max(
    1,
    ...daily.map(day => day.topModels.reduce((sum, model) => sum + Math.max(0, model.cost), 0)),
  )

  return (
    <>
      <div className="sbars" aria-label="Daily spend by model">
        {daily.map(day => (
          <div className="c" key={day.date} data-date={day.date} title={`${day.date} · ${fmtUsd(day.cost)}`}>
            {day.topModels.map(model => {
              const pct = Math.max(2, (Math.max(0, model.cost) / maxTotal) * 100)
              return (
                <span
                  key={`${day.date}-${model.name}`}
                  className={`s ${seriesClassForModel(model.name)}`}
                  style={{ height: `${pct}%` }}
                  title={`${model.name} · ${fmtUsd(model.cost)}`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="legend">
        <span>
          <i style={{ background: 'var(--blue)' }} />
          Opus 4.8
        </span>
        <span>
          <i style={{ background: 'var(--purple)' }} />
          Sonnet 5
        </span>
        <span>
          <i style={{ background: 'var(--lav)' }} />
          Haiku 4.5
        </span>
        <span>
          <i style={{ background: 'var(--cyan)' }} />
          GPT-5.5 Codex
        </span>
      </div>
    </>
  )
}

function fmtUsd(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
