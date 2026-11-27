import type { DistributionChartItem } from './DonutChart'

/**
 * Gráfico Waffle 10×10 (100 celdas = 1 % cada una).
 * Sin backdrop-filter en las celdas por rendimiento.
 */
export function WaffleChart({
  rows,
  hoverKey,
  onHoverKey,
}: {
  rows: DistributionChartItem[]
  hoverKey: string | null
  onHoverKey: (key: string | null) => void
}) {
  // Asigna exactamente 100 celdas redondeando por mayor resto
  const counts = rows.map((r) => {
    const exact = r.percentage
    return { row: r, floor: Math.floor(exact), rem: exact - Math.floor(exact) }
  })
  let assigned = counts.reduce((s, c) => s + c.floor, 0)
  const byRem = [...counts].sort((a, b) => b.rem - a.rem)
  for (let i = 0; assigned < 100 && i < byRem.length; i++) {
    byRem[i].floor += 1
    assigned += 1
  }

  const cells: (DistributionChartItem | null)[] = []
  for (const item of counts) {
    for (let i = 0; i < item.floor && cells.length < 100; i++) {
      cells.push(item.row)
    }
  }
  while (cells.length < 100) cells.push(null)

  return (
    <div
      className="mx-auto grid w-full max-w-[220px] grid-cols-10 gap-1"
      role="img"
      aria-label={`Waffle 10 por 10: ${rows
        .map((r) => `${r.label} ${r.percentage.toFixed(1)}%`)
        .join(', ')}`}
    >
      {cells.map((cell, idx) => {
        if (!cell) {
          return (
            <span
              key={idx}
              aria-hidden="true"
              className="aspect-square rounded-[4px] bg-white/[.06]"
            />
          )
        }
        const isHover = hoverKey === cell.key
        const dimmed = hoverKey !== null && !isHover
        return (
          <span
            key={idx}
            onMouseEnter={() => onHoverKey(cell.key)}
            onMouseLeave={() => onHoverKey(null)}
            className="aspect-square cursor-pointer rounded-[4px] transition-opacity duration-150"
            style={{
              backgroundColor: cell.color,
              opacity: dimmed ? 0.25 : 1,
              boxShadow: isHover ? '0 0 0 1.5px rgba(255,255,255,0.75)' : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
