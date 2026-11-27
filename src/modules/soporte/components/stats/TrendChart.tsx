import { useState, type ReactNode } from 'react'
import { tope } from '../../utils/charts'
import type { RealDelta } from '../../utils/statsFormat'
import { DataTable } from '../charts'
import { ActivityBars } from './ActivityBars'
import { AreaChart, type SeriesPoint } from './AreaChart'
import { CalendarHeatmap } from './CalendarHeatmap'
import { MetricError, MetricSkeleton } from './MetricState'
import { usePersistedView } from './usePersistedView'
import { ViewSelector, type ViewOption } from './ViewSelector'

export type TrendPoint = SeriesPoint
export type TrendView = 'area' | 'bars' | 'activity' | 'heatmap' | 'table'

const VIEW_LABELS: Record<TrendView, string> = {
  area: 'Área',
  bars: 'Barras',
  activity: 'Actividad',
  heatmap: 'Calendario',
  table: 'Tabla',
}

export interface TrendChartProps {
  title: string
  subtitle?: string
  seriesLabel: string
  tableColumnLabel?: string
  tableDateHeader?: string
  points: TrendPoint[]
  variant?: 'area' | 'bars'
  views?: readonly TrendView[]
  storageKey?: string
  highlightPeaks?: boolean
  enableAverageToggle?: boolean
  formatValue?: (v: number) => string
  delta?: RealDelta | null
  headerControls?: ReactNode
  note?: string
  loading?: boolean
  emptyText?: string
  error?: string | null
  status?: number | null
  onRetry?: () => void
  className?: string
}

export function TrendChart({
  title,
  subtitle,
  seriesLabel,
  tableColumnLabel = 'Total',
  tableDateHeader = 'Periodo',
  points,
  variant = 'area',
  views,
  storageKey,
  highlightPeaks = false,
  enableAverageToggle = false,
  formatValue = (v) => v.toLocaleString('es-CO'),
  delta = null,
  headerControls,
  note,
  loading = false,
  emptyText = 'Sin datos en el periodo',
  error = null,
  status = null,
  onRetry,
  className = '',
}: TrendChartProps) {
  const defaultViews: readonly TrendView[] =
    views ?? (variant === 'area' ? ['area', 'bars', 'table'] : ['activity', 'heatmap', 'area', 'table'])
  const [view, setView] = usePersistedView<TrendView>(storageKey, defaultViews[0], defaultViews)
  const [showAverage, setShowAverage] = useState(false)

  const viewOptions: ViewOption<TrendView>[] = defaultViews.map((id) => ({
    id,
    label: VIEW_LABELS[id],
  }))

  const rawMax = Math.max(...points.map((p) => p.value), 0)
  const axisMax = rawMax > 0 ? tope(rawMax) : 0
  const allZero = points.length === 0 || rawMax === 0
  const supportsAverage = enableAverageToggle && view !== 'table' && view !== 'heatmap' && !allZero

  return (
    <section className={`glass-card p-6 sm:p-7 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold text-[var(--sr-text-primary,var(--color-text))]">
              {title}
            </h2>
            {delta && !loading && !error && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  delta.direction === 'up'
                    ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                    : delta.direction === 'down'
                      ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'
                      : 'bg-white/10 text-[var(--sr-text-muted,var(--color-text-muted))]'
                }`}
              >
                <span aria-hidden="true">
                  {delta.direction === 'up' ? '▲' : delta.direction === 'down' ? '▼' : '—'}
                </span>
                {delta.label}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--sr-text-muted,var(--color-text-muted))]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {supportsAverage && (
            <button
              type="button"
              aria-pressed={showAverage}
              onClick={() => setShowAverage((prev) => !prev)}
              className={`glass-pill cursor-pointer px-2.5 py-1 text-xs font-semibold ${
                showAverage ? 'is-active' : ''
              }`}
            >
              Promedio
            </button>
          )}
          {headerControls}
          {!loading && !error && (
            <ViewSelector
              label={`Tipo de gráfico para ${title}`}
              options={viewOptions}
              value={view}
              onChange={setView}
            />
          )}
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <MetricSkeleton tall lines={3} />
        ) : error && onRetry ? (
          <MetricError error={error} status={status} onRetry={onRetry} />
        ) : allZero ? (
          <div
            role="status"
            className="flex min-h-36 items-center justify-center rounded-2xl border border-white/10 bg-white/[.02] px-4 py-8 text-center text-sm text-[var(--sr-text-muted,var(--color-text-muted))]"
          >
            {emptyText}
          </div>
        ) : view === 'table' ? (
          <DataTable
            caption={title}
            head={[tableDateHeader, tableColumnLabel]}
            rows={points.map((p) => [p.fullLabel, formatValue(p.value)])}
          />
        ) : view === 'heatmap' ? (
          <CalendarHeatmap
            title={title}
            seriesLabel={seriesLabel}
            points={points}
            formatValue={formatValue}
          />
        ) : view === 'bars' || view === 'activity' ? (
          <ActivityBars
            title={title}
            seriesLabel={seriesLabel}
            points={points}
            axisMax={axisMax}
            variant={view === 'activity' ? 'activity' : 'vertical'}
            formatValue={formatValue}
            highlightPeaks={highlightPeaks}
            showAverage={showAverage}
          />
        ) : (
          <AreaChart
            title={title}
            seriesLabel={seriesLabel}
            points={points}
            axisMax={axisMax}
            formatValue={formatValue}
            highlightPeaks={highlightPeaks}
            showAverage={showAverage}
          />
        )}
      </div>

      {note && !loading && !error && (
        <p className="mt-5 border-t border-white/10 pt-3 text-xs text-[var(--sr-text-muted,var(--color-text-muted))]">
          {note}
        </p>
      )}
    </section>
  )
}
