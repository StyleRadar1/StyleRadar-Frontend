import { useMemo, useState } from 'react'
import { DataTable } from '../charts'
import { DonutChart, type DistributionChartItem } from './DonutChart'
import { MetricError, MetricSkeleton } from './MetricState'
import { StackedBar } from './StackedBar'
import { usePersistedView } from './usePersistedView'
import { ViewSelector, type ViewOption } from './ViewSelector'

export type DistributionRow = DistributionChartItem
export type DistributionView = 'donut' | 'stacked' | 'table'

const DISTRIBUTION_VIEW_OPTIONS: readonly ViewOption<DistributionView>[] = [
  { id: 'donut', label: 'Dona' },
  { id: 'stacked', label: 'Apilada' },
  { id: 'table', label: 'Tabla' },
]

export interface DistributionCardProps {
  title: string
  subtitle?: string
  centerLabel?: string
  rows: DistributionRow[]
  total: number
  storageKey?: string
  note?: string
  loading?: boolean
  empty?: boolean
  emptyText?: string
  error?: string | null
  status?: number | null
  onRetry?: () => void
  className?: string
}

export function DistributionCard({
  title,
  subtitle,
  centerLabel = 'Total',
  rows,
  total,
  storageKey,
  note,
  loading = false,
  empty = false,
  emptyText = 'Sin datos disponibles en este momento',
  error = null,
  status = null,
  onRetry,
  className = '',
}: DistributionCardProps) {
  const [view, setView] = usePersistedView<DistributionView>(
    storageKey,
    'donut',
    ['donut', 'stacked', 'table'],
  )
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([])

  const toggleCategory = (key: string) => {
    setHiddenKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const { visibleRows, visibleTotal } = useMemo(() => {
    const active = rows.filter((r) => !hiddenKeys.includes(r.key))
    const sum = active.reduce((acc, r) => acc + r.count, 0)
    const recalculated = active.map((r) => ({
      ...r,
      percentage: sum > 0 ? (r.count / sum) * 100 : 0,
    }))
    return { visibleRows: recalculated, visibleTotal: sum }
  }, [rows, hiddenKeys])

  const noData = empty || rows.length === 0 || total === 0

  return (
    <section className={`glass-card flex flex-col p-6 sm:p-7 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--sr-text-primary,var(--color-text))]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--sr-text-muted,var(--color-text-muted))]">
              {subtitle}
            </p>
          )}
        </div>

        {!loading && !error && !noData && (
          <ViewSelector
            label={`Tipo de gráfico para ${title}`}
            options={DISTRIBUTION_VIEW_OPTIONS}
            value={view}
            onChange={setView}
          />
        )}
      </div>

      <div className="mt-6 flex-1">
        {loading ? (
          <MetricSkeleton tall lines={3} />
        ) : error && onRetry ? (
          <MetricError error={error} status={status} onRetry={onRetry} />
        ) : noData ? (
          <div
            role="status"
            className="flex min-h-36 items-center justify-center rounded-2xl border border-white/10 bg-white/[.02] px-4 py-8 text-center text-sm text-[var(--sr-text-muted,var(--color-text-muted))]"
          >
            {emptyText}
          </div>
        ) : view === 'table' ? (
          <DataTable
            caption={title}
            head={['Categoría', 'Cantidad', 'Porcentaje']}
            rows={visibleRows.map((r) => [
              r.label,
              r.count.toLocaleString('es-CO'),
              `${r.percentage.toFixed(1)}%`,
            ])}
          />
        ) : (
          <div className="space-y-6">
            {visibleRows.length === 0 ? (
              <div
                role="status"
                className="flex min-h-36 items-center justify-center rounded-2xl border border-white/10 bg-white/[.02] px-4 py-6 text-center text-sm text-[var(--sr-text-muted,var(--color-text-muted))]"
              >
                Todas las categorías están ocultas. Haz clic en la leyenda para volver a mostrarlas.
              </div>
            ) : view === 'donut' ? (
              <div className="grid gap-6 md:grid-cols-[200px_1fr] md:items-center">
                <DonutChart
                  title={title}
                  centerLabel={centerLabel}
                  rows={visibleRows}
                  total={visibleTotal}
                  hoverKey={hoverKey}
                  onHoverKey={setHoverKey}
                />
                <ul className="space-y-2">
                  {visibleRows.map((r) => {
                    const isHover = hoverKey === r.key
                    const dimmed = hoverKey !== null && !isHover
                    return (
                      <li
                        key={r.key}
                        onMouseEnter={() => setHoverKey(r.key)}
                        onMouseLeave={() => setHoverKey(null)}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.03] px-3.5 py-2.5 text-sm transition-opacity duration-150"
                        style={{ opacity: dimmed ? 0.38 : 1 }}
                      >
                        <span className="flex items-center gap-2.5 font-semibold text-[var(--sr-text-primary,#f8fafc)]">
                          <i
                            aria-hidden="true"
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: r.color }}
                          />
                          {r.label}
                        </span>
                        <span className="shrink-0 tabular-nums text-xs text-[var(--sr-text-secondary,#b8b3ce)]">
                          <b className="text-[var(--sr-text-primary,#f8fafc)]">
                            {r.count.toLocaleString('es-CO')}
                          </b>{' '}
                          · {r.percentage.toFixed(1)}%
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : (
              <StackedBar
                rows={visibleRows}
                hoverKey={hoverKey}
                onHoverKey={setHoverKey}
              />
            )}

            {/* Leyenda interactiva para mostrar/ocultar categorías (recalcula en cliente) */}
            <div
              className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4"
              role="group"
              aria-label={`Filtrar categorías de ${title}`}
            >
              {rows.map((r) => {
                const hidden = hiddenKeys.includes(r.key)
                const active = !hidden
                const displayRow = visibleRows.find((vr) => vr.key === r.key)
                return (
                  <button
                    key={r.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleCategory(r.key)}
                    onMouseEnter={() => {
                      if (active) setHoverKey(r.key)
                    }}
                    onMouseLeave={() => setHoverKey(null)}
                    className={`glass-pill cursor-pointer px-3 py-1 text-xs font-semibold ${
                      active ? 'is-active' : 'opacity-50 line-through'
                    }`}
                  >
                    <i
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                    <span>{r.label}</span>
                    {displayRow && (
                      <span className="tabular-nums opacity-80">
                        {displayRow.count.toLocaleString('es-CO')} ({displayRow.percentage.toFixed(1)}%)
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {note && !loading && !error && !noData && (
        <p className="mt-4 border-t border-white/10 pt-3 text-xs text-[var(--sr-text-muted,var(--color-text-muted))]">
          {note}
        </p>
      )}
    </section>
  )
}
