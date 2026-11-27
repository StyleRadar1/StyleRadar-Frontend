import { motion, useReducedMotion } from 'framer-motion'

export interface DistributionChartItem {
  key: string
  label: string
  count: number
  percentage: number
  color: string
}

const RADIUS = 74
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function DonutChart({
  title,
  centerLabel = 'Total',
  rows,
  total,
  hoverKey,
  onHoverKey,
}: {
  title: string
  centerLabel?: string
  rows: DistributionChartItem[]
  total: number
  hoverKey: string | null
  onHoverKey: (key: string | null) => void
}) {
  const reduceMotion = useReducedMotion()
  const activeRow = hoverKey ? rows.find((r) => r.key === hoverKey) ?? null : null

  const segments = rows.reduce<
    { row: DistributionChartItem; length: number; offset: number }[]
  >((acc, row) => {
    const prevEnd = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].length : 0
    const fraction = total > 0 ? row.count / total : 0
    const length = fraction * CIRCUMFERENCE
    acc.push({ row, length, offset: prevEnd })
    return acc
  }, [])

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative mx-auto h-48 w-48 shrink-0"
    >
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label={`${title}: ${total} en total (${rows
          .map((r) => `${r.label} ${r.count}, ${r.percentage.toFixed(1)}%`)
          .join('; ')})`}
      >
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="22"
        />
        {total > 0 &&
          segments.map(({ row, length, offset }) => {
            const isHover = hoverKey === row.key
            const dimmed = hoverKey !== null && !isHover
            return (
              <circle
                key={row.key}
                cx="100"
                cy="100"
                r={RADIUS}
                fill="none"
                stroke={row.color}
                strokeWidth={isHover ? 26 : 22}
                strokeDasharray={`${length} ${CIRCUMFERENCE}`}
                strokeDashoffset={-offset}
                opacity={dimmed ? 0.3 : 1}
                className="cursor-pointer transition-all duration-200"
                style={{
                  filter: isHover ? `drop-shadow(0 0 8px ${row.color})` : undefined,
                }}
                onMouseEnter={() => onHoverKey(row.key)}
                onMouseLeave={() => onHoverKey(null)}
              />
            )
          })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <span className="text-3xl font-extrabold tabular-nums text-[var(--sr-text-primary,#f8fafc)]">
          {(activeRow ? activeRow.count : total).toLocaleString('es-CO')}
        </span>
        <span className="mt-0.5 line-clamp-2 text-[11px] font-semibold uppercase tracking-[.1em] text-[var(--sr-text-muted,#8b86a4)]">
          {activeRow ? `${activeRow.percentage.toFixed(1)}% · ${activeRow.label}` : centerLabel}
        </span>
      </div>
    </motion.div>
  )
}
