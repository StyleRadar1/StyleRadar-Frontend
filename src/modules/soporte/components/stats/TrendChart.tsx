import { useId, useState, type ReactNode } from 'react'
import { Card } from '@/modules/core/design-system'
import { tope } from '../../utils/charts'
import type { RealDelta } from '../../utils/statsFormat'
import { DataTable, TableToggle } from '../charts'
import { MetricError, MetricSkeleton } from './MetricState'

export interface TrendPoint {
  key: string
  axisLabel: string
  fullLabel: string
  value: number
}

export interface TrendChartProps {
  title: string
  subtitle?: string
  seriesLabel: string
  tableColumnLabel?: string
  tableDateHeader?: string
  points: TrendPoint[]
  variant?: 'area' | 'bars'
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
  const gradId = `sr-trend-${useId().replace(/:/g, '')}`
  const [showTable, setShowTable] = useState(false)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const rawMax = Math.max(...points.map((p) => p.value), 0)
  const axisMax = rawMax > 0 ? tope(rawMax) : 0
  const allZero = points.length === 0 || rawMax === 0
  const n = points.length

  const areaCoords = points.map((p, i) => {
    const x = n > 1 ? ((i + 0.5) / n) * 1000 : 500
    const y = axisMax > 0 ? 180 - (p.value / axisMax) * 164 : 180
    return [x, y] as const
  })
  const linePath = areaCoords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')
  const areaPath =
    areaCoords.length > 0
      ? `${linePath} L${areaCoords[areaCoords.length - 1][0].toFixed(1)} 180 L${areaCoords[0][0].toFixed(1)} 180 Z`
      : ''

  const tickStep = n > 14 ? Math.ceil(n / 8) : 1

  return (
    <Card className={`p-6 sm:p-7 ${className}`}>
      {/* Encabezado: título a la izquierda; leyenda, selectores y botón tabla en la esquina superior derecha */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold text-[var(--sr-text-primary,var(--color-text))]">
              {title}
            </h2>
            {delta && !loading && !error && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                  delta.direction === 'up'
                    ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                    : delta.direction === 'down'
                      ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'
                      : 'bg-[var(--color-border)]/40 text-[var(--sr-text-muted,var(--color-text-muted))]'
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

        <div className="flex flex-wrap items-center justify-end gap-3">
          {!loading && !error && !showTable && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--sr-text-muted,var(--color-text-muted))]">
              <i
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full bg-[var(--color-violeta-claro,#7C3AED)]"
              />
              {seriesLabel}
            </span>
          )}
          {headerControls}
          {!loading && !error && (
            <TableToggle on={showTable} onChange={setShowTable} />
          )}
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <MetricSkeleton tall lines={3} />
        ) : error && onRetry ? (
          <MetricError error={error} status={status} onRetry={onRetry} />
        ) : (
          <>
            {allZero && (
              <p
                role="status"
                className="mb-4 text-sm text-[var(--sr-text-muted,var(--color-text-muted))]"
              >
                {emptyText}
              </p>
            )}

            {showTable ? (
              <DataTable
                caption={title}
                head={[tableDateHeader, tableColumnLabel]}
                rows={points.map((p) => [p.fullLabel, formatValue(p.value)])}
              />
            ) : (
              <div className="relative grid grid-cols-[auto_1fr] gap-x-3">
                {/* Eje vertical */}
                <div
                  aria-hidden="true"
                  className="flex h-48 flex-col justify-between text-right text-[11px] tabular-nums text-[var(--sr-text-muted,var(--color-text-muted))]"
                >
                  <span>{formatValue(axisMax)}</span>
                  <span>{formatValue(axisMax > 0 ? Math.round(axisMax / 2) : 0)}</span>
                  <span>{formatValue(0)}</span>
                </div>

                {/* Área de dibujo */}
                <div className="relative h-48 border-b border-[var(--sr-border-subtle,var(--color-border))]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-[var(--sr-border-subtle,var(--color-border))]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-[var(--sr-border-subtle,var(--color-border))]"
                  />

                  {variant === 'area' ? (
                    <svg
                      viewBox="0 0 1000 180"
                      preserveAspectRatio="none"
                      className="h-full w-full"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.42" />
                          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
                      {linePath && (
                        <path
                          d={linePath}
                          fill="none"
                          stroke="var(--color-violeta-claro, #7C3AED)"
                          strokeWidth="2.6"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      )}
                      {hoverIdx !== null && areaCoords[hoverIdx] && (
                        <line
                          x1={areaCoords[hoverIdx][0]}
                          x2={areaCoords[hoverIdx][0]}
                          y1="0"
                          y2="180"
                          stroke="var(--sr-text-muted, var(--color-text-muted))"
                          strokeOpacity="0.45"
                          strokeDasharray="4 4"
                          vectorEffect="non-scaling-stroke"
                        />
                      )}
                    </svg>
                  ) : (
                    <div aria-hidden="true" className="flex h-full items-end gap-1 px-0.5 pt-2">
                      {points.map((p, i) => {
                        const pct = axisMax > 0 ? (p.value / axisMax) * 100 : 0
                        return (
                          <div
                            key={p.key}
                            className={`flex h-full flex-1 items-end justify-center rounded-t transition-colors ${
                              hoverIdx === i ? 'bg-[var(--color-border)]/25' : ''
                            }`}
                          >
                            <span
                              className="w-full max-w-6 rounded-t-md bg-[var(--color-violeta-claro,#7C3AED)] transition-all duration-300"
                              style={{ height: `${pct}%` }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Capa accesible interactiva (mouse + teclado) */}
                  <ol className="absolute inset-0 flex items-stretch" aria-label={title}>
                    {points.map((p, i) => (
                      <li
                        key={p.key}
                        tabIndex={0}
                        className="relative flex-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-violeta-claro,#7C3AED)]"
                        aria-label={`${p.fullLabel}: ${seriesLabel} ${formatValue(p.value)}`}
                        onMouseEnter={() => setHoverIdx(i)}
                        onMouseLeave={() => setHoverIdx(null)}
                        onFocus={() => setHoverIdx(i)}
                        onBlur={() => setHoverIdx(null)}
                      >
                        {hoverIdx === i && (
                          <span
                            role="tooltip"
                            className={`pointer-events-none absolute top-2 z-10 whitespace-nowrap rounded-lg border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] px-3 py-2 text-xs text-[var(--sr-text-primary,var(--color-text))] shadow-lg ${
                              i > n / 2 ? 'right-full mr-1.5' : 'left-full ml-1.5'
                            }`}
                          >
                            <b className="block">{p.fullLabel}</b>
                            <span className="mt-0.5 flex items-center gap-2">
                              <span className="text-[var(--sr-text-muted,var(--color-text-muted))]">
                                {seriesLabel}
                              </span>
                              <b className="tabular-nums">{formatValue(p.value)}</b>
                            </span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Eje horizontal */}
                <span />
                <div
                  aria-hidden="true"
                  className="flex pt-2 text-[11px] text-[var(--sr-text-muted,var(--color-text-muted))]"
                >
                  {points.map((p, i) => (
                    <span key={p.key} className="flex-1 truncate text-center">
                      {i % tickStep === 0 || i === n - 1 ? p.axisLabel : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {note && !loading && !error && (
        <p className="mt-5 border-t border-[var(--sr-border-subtle,var(--color-border))] pt-3 text-xs text-[var(--sr-text-muted,var(--color-text-muted))]">
          {note}
        </p>
      )}
    </Card>
  )
}
