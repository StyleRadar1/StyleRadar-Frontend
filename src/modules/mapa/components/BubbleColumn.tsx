import { useEffect, useMemo, useRef, useState } from 'react'
import type { MapPinDto } from '../types/map.dto'
import { sortByDistance } from '../utils/mapUtils'

interface Props {
  pins: MapPinDto[]
  selectedId: string | null
  onSelect: (pin: MapPinDto) => void
  onHover: (pin: MapPinDto | null) => void
}

/** Burbuja redonda con la foto del punto; si no hay foto o falla, muestra la inicial. */
function BubbleAvatar({ pin, active }: { pin: MapPinDto; active: boolean }) {
  const [failed, setFailed] = useState(false)
  const isFound = pin.tipo === 'fundacion'
  const ring = isFound ? 'ring-arena' : 'ring-violeta'
  const size = active ? 'h-[72px] w-[72px] ring-[3px]' : 'h-[50px] w-[50px] ring-2'
  if (pin.photo && !failed) {
    return (
      <img
        src={pin.photo}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`flex-shrink-0 rounded-full object-cover shadow-[0_12px_28px_rgba(0,0,0,.6)] transition-all duration-300 ${size} ${ring}`}
      />
    )
  }
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full text-base font-bold shadow-[0_12px_28px_rgba(0,0,0,.6)] transition-all duration-300 ${size} ${ring} ${
        isFound ? 'bg-arena text-grafito' : 'bg-violeta text-white'
      }`}
    >
      {pin.name.charAt(0)}
    </div>
  )
}

/**
 * Burbujas con foto en arco (hero del mapa): el nombre queda a la izquierda de cada foto,
 * la burbuja activa crece y la columna se curva hacia el mapa. Sin panel: las burbujas flotan.
 */
export default function BubbleColumn({ pins, selectedId, onSelect, onHover }: Props) {
  const sorted = useMemo(() => sortByDistance(pins), [pins])
  const rootRef = useRef<HTMLDivElement>(null)

  /* Rueda del mouse sobre las burbujas: pasa a la tienda anterior o siguiente.
     En los extremos deja de capturar la rueda para que la página siga desplazándose. */
  const latest = useRef({ sorted, selectedId, onSelect })
  latest.current = { sorted, selectedId, onSelect }
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let lastStep = 0
    const onWheel = (e: WheelEvent) => {
      const { sorted: list, selectedId: sel, onSelect: select } = latest.current
      if (!list.length || Math.abs(e.deltaY) < 4) return
      const dir = e.deltaY > 0 ? 1 : -1
      const idx = list.findIndex((p) => p.id === sel)
      const next = idx === -1 ? (dir > 0 ? 0 : list.length - 1) : idx + dir
      if (next < 0 || next >= list.length) return
      e.preventDefault()
      const now = Date.now()
      if (now - lastStep < 280) return
      lastStep = now
      select(list[next])
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  if (!sorted.length) {
    return (
      <div className="flex items-center justify-center p-8 text-center text-sm text-white/50">
        No hay puntos en este filtro.
      </div>
    )
  }

  const n = sorted.length

  return (
    <div ref={rootRef} className="sr-bubbles relative">
      <div className="flex flex-col gap-1.5 py-2 pr-10">
        {sorted.map((pin, i) => {
          const isFound = pin.tipo === 'fundacion'
          const isActive = pin.id === selectedId
          const dx = n > 1 ? Math.round(Math.sin((Math.PI * i) / (n - 1)) * 40) : 0
          return (
            <button
              key={pin.id}
              type="button"
              style={{ ['--dx' as string]: `${-dx}px` }}
              className="group flex items-center justify-end gap-3 text-right transition-transform duration-300 lg:[transform:translateX(var(--dx))]"
              onClick={() => onSelect(pin)}
              onMouseEnter={() => onHover(pin)}
              onMouseLeave={() => onHover(null)}
              aria-pressed={isActive}
            >
              <div className="min-w-0">
                <p className={`truncate font-semibold transition-all ${isActive ? 'text-base text-white' : 'text-[13px] text-white/85 group-hover:text-white'}`}>
                  {pin.name}
                </p>
                <p className="truncate text-xs text-white/60">
                  {isFound ? 'Fundación' : pin.cat} · {pin.barrio} · {pin.d}
                </p>
              </div>
              <BubbleAvatar pin={pin} active={isActive} />
            </button>
          )
        })}
      </div>

      {/* Indicador de posición */}
      <div aria-hidden="true" className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
        {sorted.map((pin) => (
          <span
            key={pin.id}
            className={`block rounded-full transition-all ${pin.id === selectedId ? 'h-2.5 w-2.5 bg-white' : 'h-1.5 w-1.5 bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}
