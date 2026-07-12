import { formatUsd } from '../lib/format'
import { SERIES_LABELS, type SeriesKey, seriesClassForKey, seriesClassForModel, seriesKeyForModel } from '../lib/modelSeries'
import type { DailyHistoryEntry } from '../lib/types'

const SERIES_ORDER: readonly SeriesKey[] = ['opus', 'fable', 'haiku', 'gpt', 'sonnet', 'other']

export function StackedBars({ daily }: { daily: DailyHistoryEntry[] }) {
  const visibleDaily = daily.slice(-15)
  const presentSeries = new Set<SeriesKey>()
  const maxTotal = Math.max(
    1,
    ...visibleDaily.map(day => day.topModels.reduce((sum, model) => sum + Math.max(0, model.cost), 0)),
  )
  for (const day of visibleDaily) {
    for (const model of day.topModels) {
      if (model.cost > 0) presentSeries.add(seriesKeyForModel(model.name))
    }
  }
  const legendSeries = SERIES_ORDER.filter(series => presentSeries.has(series))

  return (
    <div className="sbars-wrap">
      <div className="sbars" aria-label="Daily spend by model">
        {visibleDaily.map(day => (
          <div className="c" key={day.date} data-date={day.date} title={`${day.date} · ${formatUsd(day.cost)}`}>
            {[...day.topModels].sort(
              (a, b) => SERIES_ORDER.indexOf(seriesKeyForModel(a.name)) - SERIES_ORDER.indexOf(seriesKeyForModel(b.name)),
            ).map(model => {
              const pct = Math.max(1, (Math.max(0, model.cost) / maxTotal) * 100)
              return (
                <span
                  key={`${day.date}-${model.name}`}
                  className={`s ${seriesClassForModel(model.name)}`}
                  style={{ height: `${pct}%` }}
                  title={`${model.name} · ${formatUsd(model.cost)}`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="legend">
        {legendSeries.map(series => (
          <span key={series}>
            <i className={seriesClassForKey(series)} />
            {SERIES_LABELS[series]}
          </span>
        ))}
      </div>
    </div>
  )
}
