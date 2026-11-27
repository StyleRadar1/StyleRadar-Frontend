import { useEffect, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { RealDelta } from '../../utils/statsFormat'
import { MetricError, MetricSkeleton } from './MetricState'

export interface KpiCardProps {
  label: string
  value: string
  numericValue?: number
  subtitle?: string
  delta?: RealDelta | null
  accentColor?: string
  icon?: ReactNode
  hero?: boolean
  loading?: boolean
  empty?: boolean
  emptyText?: string
  error?: string | null
  status?: number | null
  onRetry?: () => void
  className?: string
}

function useAnimatedCount(target: number | undefined, active: boolean, reduceMotion: boolean): number | null {
  const [display, setDisplay] = useState<number | null>(() =>
    target !== undefined ? 0 : null,
  )

  useEffect(() => {
    if (target === undefined || !active) return
    if (reduceMotion || typeof requestAnimationFrame === 'undefined') return
    let raf = 0
    const duration = 520
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(target * eased))
      if (progress < 1) {
        raf = requestAnimationFrame(step)
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, active, reduceMotion])

  if (target !== undefined && (reduceMotion || typeof requestAnimationFrame === 'undefined')) {
    return target
  }
  return display
}

export function KpiCard({
  label,
  value,
  numericValue,
  subtitle,
  delta,
  accentColor,
  icon,
  hero = false,
  loading = false,
  empty = false,
  emptyText,
  error = null,
  status = null,
  onRetry,
  className = '',
}: KpiCardProps) {
  const reduceMotion = Boolean(useReducedMotion())
  const animated = useAnimatedCount(numericValue, !loading && !error, reduceMotion)
  const shownValue =
    animated !== null && numericValue !== undefined
      ? animated.toLocaleString('es-CO')
      : value

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`glass-card flex flex-col ${hero ? 'p-8 sm:p-10' : 'p-6'} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--sr-text-primary,#ffffff)]">
          {label}
        </p>
        {icon ? (
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/[.06] text-[var(--sr-accent-text,#c084fc)]"
          >
            {icon}
          </span>
        ) : accentColor ? (
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
        ) : null}
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
              {shownValue}
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
    </motion.section>
  )
}
