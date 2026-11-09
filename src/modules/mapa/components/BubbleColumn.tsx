import { useMemo } from 'react'
import type { MapPinDto } from '../types/map.dto'
import { sortByDistance } from '../utils/mapUtils'

interface Props {
  pins: MapPinDto[]
  selectedId: string | null
  onSelect: (pin: MapPinDto) => void
  onHover: (pin: MapPinDto | null) => void
}

/** Columna de burbujas con foto y nombre de cada punto, como en el prototipo. */
export default function BubbleColumn({ pins, selectedId, onSelect, onHover }: Props) {
  const sorted = useMemo(() => sortByDistance(pins), [pins])

  if (!sorted.length) {
    return (
      <div className="flex items-center justify-center p-8 text-center text-sm text-white/50">
        No hay puntos en este filtro.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-4">
      {sorted.map((pin) => {
        const isFound = pin.tipo === 'fundacion'
        const isActive = pin.id === selectedId
        return (
          <button
            key={pin.id}
            type="button"
            className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition
              ${isActive
                ? 'border-violeta bg-violeta/15 shadow-[0_0_16px_rgba(72,17,154,.4)]'
                : 'border-white/10 bg-white/[.04] hover:border-white/25 hover:bg-white/[.08]'
              }`}
            onClick={() => onSelect(pin)}
            onMouseEnter={() => onHover(pin)}
            onMouseLeave={() => onHover(null)}
            aria-pressed={isActive}
          >
            {/* Avatar / placeholder */}
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                isFound ? 'bg-arena text-grafito' : 'bg-violeta text-white'
              }`}
            >
              {pin.name.charAt(0)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{pin.name}</p>
              <p className="truncate text-xs text-white/50">
                {isFound ? 'Fundación' : pin.cat} · {pin.barrio} · {pin.d}
              </p>
            </div>

            {/* Flecha */}
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="flex-shrink-0 text-white/30 transition group-hover:text-white/70"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
