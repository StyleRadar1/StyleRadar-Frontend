import { motion, useReducedMotion } from 'framer-motion'
import type { DistributionChartItem } from './DonutChart'

/** Barras horizontales ordenadas de mayor a menor. */
export function HorizontalBars({
  rows,
  hoverKey,
  onHoverKey,
}: {
  rows: DistributionChartItem[]
  hoverKey: string | null
  onHoverKey: (key: string | null) => void
}) {
  const reduceMotion = useReducedMotion()
  const sorted = [...rows].sort((a, b) => b.count - a.count)

  return (
    <ul className="space-y-3.5">
      {sorted.map((row, idx) => {
        const isHover = hoverKey === row.key
        const dimmed = hoverKey !== null && !isHover
        return (
          <li
            key={row.key}
            tabIndex={0}
            onMouseEnter={() => onHoverKey(row.key)}
            onMouseLeave={() => onHoverKey(null)}
            onFocus={() => onHoverKey(row.key)}
            onBlur={() => onHoverKey(null)}
            className="cursor-pointer rounded-xl p-2 transition-opacity duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-accent,#9d5cff)]"
            style={{ opacity: dimmed ? 0.38 : 1 }}
          >
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-semibold text-[var(--sr-text-primary,#f8fafc)]">
                <i
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                {row.label}
              </span>
              <span className="shrink-0 tabular-nums text-xs text-[var(--sr-text-secondary,#b8b3ce)]">
                <b className="text-[var(--sr-text-primary,#f8fafc)]">
                  {row.count.toLocaleString('es-CO')}
                </b>{' '}
                ({row.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/[.08]">
              <motion.div
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${Math.max(row.percentage, row.count > 0 ? 2 : 0)}%` }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="h-full rounded-full transition-shadow duration-150"
                style={{
                  background: `linear-gradient(90deg, ${row.color}, rgba(255,255,255,0.22) 140%)`,
                  boxShadow: isHover ? `0 0 12px ${row.color}` : undefined,
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
