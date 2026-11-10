import { useMemo, useState } from 'react'
import type { MapPinDto } from '../types/map.dto'
import { sortByDistance } from '../utils/mapUtils'

interface Props {
  pins: MapPinDto[]
  selectedId: string | null
  onSelect: (pin: MapPinDto) => void
  onHover: (pin: MapPinDto | null) => void
}

/** Burbuja redonda con la foto del punto; si no hay foto o falla, muestra la inicial. */
function BubbleAvatar({ pin }: { pin: MapPinDto }) {
  const [failed, setFailed] = useState(false)
  const isFound = pin.tipo === 'fundacion'
  const ring = isFound ? 'ring-arena' : 'ring-violeta'
  if (pin.photo && !failed) {
    return (
      <img
        src={pin.photo}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-14 w-14 flex-shrink-0 rounded-full object-cover ring-2 ${ring}`}
      />
    )
  }
  return (
    <div
      className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold ring-2 ${ring} ${
        isFound ? 'bg-arena text-grafito' : 'bg-violeta text-white'
      }`}
    >
      {pin.name.charAt(0)}
    </div>
  )
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
            <BubbleAvatar pin={pin} />

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
