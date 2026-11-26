import { useState } from 'react'
import { Card } from '@/modules/core/design-system'
import { MetricError, MetricSkeleton } from './MetricState'

export interface DistributionRow {
  key: string
  label: string
  count: number
  percentage: number
  color: string
}

export interface DistributionCardProps {
  title: string
  subtitle?: string
  centerLabel?: string
  rows: DistributionRow[]
  total: number
  note?: string
  loading?: boolean
  empty?: boolean
  emptyText?: string
  error?: string | null
  status?: number | null
  onRetry?: () => void
  className?: string
}

const RADIUS = 74
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function DistributionCard({
  title,
  subtitle,
  centerLabel = 'Total',
  rows,
  total,
  note,
  loading = false,
  empty = false,
  emptyText,
  error = null,
  status = null,
  onRetry,
  className = '',
}: DistributionCardProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const segments = rows.reduce<
    { row: DistributionRow; length: number; offset: number }[]
  >((acc, row) => {
    const prevEnd = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].length : 0
    const fraction = total > 0 ? row.count / total : 0
    const length = fraction * CIRCUMFERENCE
    acc.push({ row, length, offset: prevEnd })
    return acc
  }, [])

  return (
    <Card className={`p-6 sm:p-7 ${className}`}>
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

      <div className="mt-6">
        {loading ? (
          <MetricSkeleton tall lines={3} />
        ) : error && onRetry ? (
          <MetricError error={error} status={status} onRetry={onRetry} />
        ) : (
          <>
            {empty && emptyText && (
              <p
                role="status"
                className="mb-5 text-sm text-[var(--sr-text-muted,var(--color-text-muted))]"
              >
                {emptyText}
              </p>
            )}

            <div className="grid gap-8 md:grid-cols-[200px_1fr] md:items-center">
              {/* Donut SVG propio con total en el centro */}
              <div className="relative mx-auto h-48 w-48 shrink-0">
                <svg
                  viewBox="0 0 200 200"
                  className="h-full w-full -rotate-90"
                  role="img"
                  aria-label={`${title}: ${total} en total (${rows
                    .map((r) => `${r.label} ${r.count}, ${r.percentage.toFixed(2)}%`)
                    .join('; ')})`}
                >
                  <circle
                    cx="100"
                    cy="100"
                    r={RADIUS}
                    fill="none"
                    stroke="var(--sr-border-subtle, var(--color-border))"
                    strokeWidth="22"
                  />
                  {total > 0 &&
                    segments.map(({ row, length, offset }, idx) => (
                      <circle
                        key={row.key}
                        cx="100"
                        cy="100"
                        r={RADIUS}
                        fill="none"
                        stroke={row.color}
                        strokeWidth={hoverIdx === idx ? 26 : 22}
                        strokeDasharray={`${length} ${CIRCUMFERENCE}`}
                        strokeDashoffset={-offset}
                        className="transition-all duration-200"
                        onMouseEnter={() => setHoverIdx(idx)}
                        onMouseLeave={() => setHoverIdx(null)}
                      >
                        <title>
                          {`${row.label}: ${row.count.toLocaleString('es-CO')} (${row.percentage.toFixed(2)}%)`}
                        </title>
                      </circle>
                    ))}
                </svg>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
                >
                  <span className="text-3xl font-extrabold tabular-nums text-[var(--sr-text-primary,var(--color-text))]">
                    {total.toLocaleString('es-CO')}
                  </span>
                  <span className="mt-0.5 text-xs font-medium text-[var(--sr-text-muted,var(--color-text-muted))]">
                    {centerLabel}
                  </span>
                </div>
              </div>

              {/* Tabla por categoría: marcador, nombre, barra proporcional, cantidad y porcentaje */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--sr-border-subtle,var(--color-border))] text-xs uppercase tracking-[.1em] text-[var(--sr-text-muted,var(--color-text-muted))]">
                      <th className="py-2 pr-3 font-semibold">Estado</th>
                      <th className="hidden py-2 px-3 font-semibold sm:table-cell">Proporción</th>
                      <th className="py-2 px-3 text-right font-semibold">Cantidad</th>
                      <th className="py-2 pl-3 text-right font-semibold">Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={row.key}
                        className={`border-b border-[var(--sr-border-subtle,var(--color-border))]/60 last:border-b-0 transition-colors ${
                          hoverIdx === idx ? 'bg-[var(--color-surface)]/80' : ''
                        }`}
                        onMouseEnter={() => setHoverIdx(idx)}
                        onMouseLeave={() => setHoverIdx(null)}
                      >
                        <td className="py-3 pr-3">
                          <span className="inline-flex items-center gap-2.5 font-medium text-[var(--sr-text-primary,var(--color-text))]">
                            <span
                              aria-hidden="true"
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: row.color }}
                            />
                            {row.label}
                          </span>
                        </td>
                        <td className="hidden w-40 py-3 px-3 sm:table-cell">
                          <div
                            aria-hidden="true"
                            className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--sr-border-subtle,var(--color-border))]"
                          >
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(100, Math.max(0, row.percentage))}%`,
                                backgroundColor: row.color,
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold tabular-nums text-[var(--sr-text-primary,var(--color-text))]">
                          {row.count.toLocaleString('es-CO')}
                        </td>
                        <td className="py-3 pl-3 text-right tabular-nums text-[var(--sr-text-muted,var(--color-text-muted))]">
                          {row.percentage.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
