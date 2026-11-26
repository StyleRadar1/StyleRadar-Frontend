import { Card } from '@/modules/core/design-system'
import type { RealDelta } from '../../utils/statsFormat'
import { MetricError, MetricSkeleton } from './MetricState'

export interface KpiCardProps {
  label: string
  value: string
  subtitle?: string
  delta?: RealDelta | null
  accentColor?: string
  hero?: boolean
  loading?: boolean
  empty?: boolean
  emptyText?: string
  error?: string | null
  status?: number | null
  onRetry?: () => void
  className?: string
}

export function KpiCard({
  label,
  value,
  subtitle,
  delta,
  accentColor,
  hero = false,
  loading = false,
  empty = false,
  emptyText,
  error = null,
  status = null,
  onRetry,
  className = '',
}: KpiCardProps) {
  return (
    <Card className={`flex flex-col ${hero ? 'p-8 sm:p-10' : 'p-6'} ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--sr-text-muted,var(--color-text-muted))]">
          {label}
        </p>
        {accentColor && (
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
        )}
      </div>

      <div className={hero ? 'mt-5' : 'mt-3'}>
        {loading ? (
          <MetricSkeleton lines={2} />
        ) : error && onRetry ? (
          <MetricError error={error} status={status} onRetry={onRetry} />
        ) : (
          <>
            <p
              className={`font-extrabold tabular-nums tracking-tight text-[var(--sr-text-primary,var(--color-text))] ${
                hero ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-4xl'
              }`}
            >
              {value}
            </p>

            {delta && (
              <p
                className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
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
                <span className="sr-only">
                  {delta.direction === 'up'
                    ? 'Subió'
                    : delta.direction === 'down'
                      ? 'Bajó'
                      : 'Sin cambio'}{' '}
                </span>
                {delta.label}
              </p>
            )}

            {empty && emptyText ? (
              <p
                role="status"
                className="mt-2 text-sm text-[var(--sr-text-muted,var(--color-text-muted))]"
              >
                {emptyText}
              </p>
            ) : subtitle ? (
              <p className="mt-2 text-sm text-[var(--sr-text-muted,var(--color-text-muted))]">
                {subtitle}
              </p>
            ) : null}
          </>
        )}
      </div>
    </Card>
  )
}
