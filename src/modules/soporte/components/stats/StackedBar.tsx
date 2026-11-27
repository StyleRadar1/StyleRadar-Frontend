import { motion, useReducedMotion } from 'framer-motion'
import type { DistributionChartItem } from './DonutChart'

/** Barra apilada al 100 % dividida por proporción de cada categoría. */
export function StackedBar({
  rows,
  hoverKey,
  onHoverKey,
}: {
  rows: DistributionChartItem[]
  hoverKey: string | null
  onHoverKey: (key: string | null) => void
}) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="space-y-3 py-3">
      <div
        className="flex h-10 w-full overflow-hidden rounded-full border border-white/15 bg-white/[.05] p-0.5"
        role="img"
        aria-label={rows.map((r) => `${r.label}: ${r.percentage.toFixed(1)}%`).join(', ')}
      >
        {rows.map((row) => {
          if (row.percentage <= 0) return null
          const isHover = hoverKey === row.key
          const dimmed = hoverKey !== null && !isHover
          return (
            <motion.div
              key={row.key}
              tabIndex={0}
              initial={reduceMotion ? false : { flexGrow: 0 }}
              animate={{ flexGrow: row.percentage }}
              transition={{ duration: 0.35 }}
              onMouseEnter={() => onHoverKey(row.key)}
              onMouseLeave={() => onHoverKey(null)}
              onFocus={() => onHoverKey(row.key)}
              onBlur={() => onHoverKey(null)}
              className="relative flex h-full min-w-[6px] cursor-pointer items-center justify-center overflow-hidden first:rounded-l-full last:rounded-r-full outline-none transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-white"
              style={{
                flexBasis: 0,
                backgroundColor: row.color,
                opacity: dimmed ? 0.32 : 1,
                boxShadow: isHover ? `inset 0 0 0 1.5px rgba(255,255,255,0.75)` : undefined,
              }}
            >
              {row.percentage >= 14 && (
                <span className="truncate px-2 text-[11px] font-bold tabular-nums text-white drop-shadow">
                  {row.percentage.toFixed(0)}%
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
