import { useEffect, useMemo, useRef, useState } from 'react'

export interface AxisPoint {
  key: string
  axisLabel: string
}

/**
 * Eje X adaptable sin etiquetas cortadas ni spans vacíos:
 * calcula el salto automático según el ancho disponible y mantiene
 * siempre visibles la primera y la última etiqueta.
 */
export function SmartXAxis({
  points,
  align = 'center',
}: {
  points: readonly AxisPoint[]
  align?: 'center' | 'band'
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width
      if (nextWidth && nextWidth > 0) setWidth(nextWidth)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = points.length
  const visibleIndices = useMemo(() => {
    if (n === 0) return [] as number[]
    if (n === 1) return [0]
    const maxLabels = Math.max(2, Math.floor(width / 68))
    if (n <= maxLabels) return Array.from({ length: n }, (_, i) => i)

    const step = Math.max(1, Math.ceil((n - 1) / (maxLabels - 1)))
    const indices: number[] = [0]
    for (let i = step; i < n - 1; i += step) {
      if (n - 1 - i >= Math.ceil(step * 0.55)) {
        indices.push(i)
      }
    }
    indices.push(n - 1)
    return indices
  }, [n, width])

  if (n === 0) return null

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative mt-2 h-5 w-full select-none text-[11px] font-medium text-[var(--sr-text-muted,#8b86a4)]"
    >
      {visibleIndices.map((idx) => {
        const pct =
          n === 1
            ? 50
            : align === 'band'
              ? ((idx + 0.5) / n) * 100
              : (idx / (n - 1)) * 100
        const transform =
          idx === 0 && n > 1
            ? 'translateX(0%)'
            : idx === n - 1 && n > 1
              ? 'translateX(-100%)'
              : 'translateX(-50%)'
        return (
          <span
            key={points[idx].key}
            className="absolute top-0 whitespace-nowrap"
            style={{ left: `${pct}%`, transform }}
          >
            {points[idx].axisLabel}
          </span>
        )
      })}
    </div>
  )
}
