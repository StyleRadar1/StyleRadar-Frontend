import { useEffect, useMemo, useRef, useState } from 'react'
import type { MapPinDto } from '../types/map.dto'
import { sortByDistance } from '../utils/mapUtils'

interface Props {
  pins: MapPinDto[]
  selectedId: string | null
  hoveredId?: string | null
  onSelect: (pin: MapPinDto) => void
  onHover: (pin: MapPinDto | null) => void
}

/** Burbuja redonda con la foto del punto e insignia de tienda/fundación; si falla, muestra la inicial. */
function BubbleAvatar({ pin }: { pin: MapPinDto }) {
  const [failed, setFailed] = useState(false)
  const isStore = pin.tipo === 'tienda'

  return (
    <div className="sr-bubble-avatar-wrap">
      <div className={`sr-bubble-avatar ${pin.tipo}`}>
        {pin.photo && !failed ? (
          <img
            src={pin.photo}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className="sr-bubble-img"
          />
        ) : (
          <div className={`sr-bubble-ph ${pin.tipo}`}>
            <span>{pin.name.charAt(0)}</span>
          </div>
        )}
      </div>
      <span className={`sr-bubble-badge ${pin.tipo}`} aria-hidden="true">
        {isStore ? (
          <svg
            viewBox="0 0 24 24"
            width="10"
            height="10"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="10"
            height="10"
            fill="#262626"
            stroke="#262626"
            strokeWidth="1.2"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        )}
      </span>
    </div>
  )
}

/**
 * Carrusel de burbujas en arco (portado del prototipo HTML):
 * - En escritorio centra verticalmente el punto focal en el viewport y aplica curvatura en arco,
 *   escala progresiva y opacidad según la distancia al elemento activo.
 * - Incluye insignia de bolsa (tienda) o corazón (fundación) y dots verticales a la derecha.
 */
export default function BubbleColumn({
  pins,
  selectedId,
  hoveredId = null,
  onSelect,
  onHover,
}: Props) {
  const sorted = useMemo(() => sortByDistance(pins), [pins])
  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewportHeight, setViewportHeight] = useState(460)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 900 : false,
  )

  /* Medir altura del viewport y detectar modo móvil */
  useEffect(() => {
    const updateMetrics = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 900)
      }
      if (viewportRef.current && viewportRef.current.clientHeight > 0) {
        setViewportHeight(viewportRef.current.clientHeight)
      }
    }
    updateMetrics()
    window.addEventListener('resize', updateMetrics)
    return () => window.removeEventListener('resize', updateMetrics)
  }, [])

  /* Rueda del mouse sobre las burbujas: pasa a la tienda anterior o siguiente */
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
      if (now - lastStep < 220) return
      lastStep = now
      select(list[next])
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  if (!sorted.length) {
    return (
      <div className="sr-bubbles flex items-center justify-center p-8 text-center text-sm text-[#B9B9CA]">
        No hay puntos en este filtro.
      </div>
    )
  }

  const selectedIndex = sorted.findIndex((p) => p.id === selectedId)
  // Si aún no hay un punto seleccionado por clic, destacamos visualmente el segundo ítem (ej. Luna Store)
  // igual que en el prototipo para que el arco tenga foco central inmediato.
  const focalIndex = selectedIndex >= 0 ? selectedIndex : Math.min(1, sorted.length - 1)

  const itemHeight = 92
  const centerTargetY = viewportHeight / 2 - (focalIndex * itemHeight + itemHeight / 2)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!sorted.length) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      const nextIdx = Math.min(sorted.length - 1, focalIndex + 1)
      onSelect(sorted[nextIdx])
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevIdx = Math.max(0, focalIndex - 1)
      onSelect(sorted[prevIdx])
    }
  }

  return (
    <div
      ref={rootRef}
      className="sr-bubbles relative flex h-full flex-col justify-center"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={viewportRef}
        className="sr-bubbles-viewport"
        aria-label="Burbujas de tiendas y fundaciones"
      >
        <div
          className="sr-bubbles-track"
          style={
            isMobile
              ? undefined
              : { transform: `translateY(${Math.round(centerTargetY)}px)` }
          }
        >
          {sorted.map((pin, i) => {
            const isStore = pin.tipo === 'tienda'
            const isFocal = i === focalIndex
            const isHovered = pin.id === hoveredId
            const absDelta = Math.abs(i - focalIndex)

            let scale = 1.0
            let opacity = 1.0
            let arcOffset = -22

            if (absDelta === 0) {
              scale = 1.0
              opacity = 1.0
              arcOffset = -22
            } else if (absDelta === 1) {
              scale = 0.84
              opacity = 0.74
              arcOffset = -6
            } else if (absDelta === 2) {
              scale = 0.7
              opacity = 0.46
              arcOffset = 14
            } else {
              scale = 0.58
              opacity = 0.22
              arcOffset = 30
            }

            const itemStyle: React.CSSProperties | undefined = isMobile
              ? undefined
              : {
                  transform: `translateX(${arcOffset}px) scale(${scale})`,
                  opacity,
                }

            return (
              <button
                key={pin.id}
                type="button"
                data-id={pin.id}
                data-idx={i}
                style={itemStyle}
                className={`sr-bubble-item ${pin.tipo} ${isFocal ? 'is-active' : ''} ${
                  isHovered ? 'is-hovered' : ''
                }`}
                onClick={() => onSelect(pin)}
                onMouseEnter={() => onHover(pin)}
                onMouseLeave={() => onHover(null)}
                aria-pressed={pin.id === selectedId}
                aria-current={isFocal ? 'true' : 'false'}
              >
                <div className="sr-bubble-info">
                  <span className="sr-bubble-name">{pin.name}</span>
                  <span className="sr-bubble-sub">
                    <span className={`sr-bubble-type-tag ${pin.tipo}`}>
                      {isStore ? 'Tienda' : 'Fundación'}
                    </span>
                    <span className="sr-bubble-dot-sep">·</span>
                    <span className="sr-bubble-barrio">{pin.barrio}</span>
                    {pin.d ? <span className="sr-bubble-dist">· {pin.d}</span> : null}
                  </span>
                </div>
                <BubbleAvatar pin={pin} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Indicador de puntos / dots a la derecha */}
      <div
        className="sr-bubbles-dots"
        role="tablist"
        aria-label="Indicadores de posición"
      >
        {sorted.map((pin, i) => {
          const isFocal = i === focalIndex
          return (
            <span
              key={pin.id}
              role="tab"
              aria-selected={isFocal}
              aria-label={`Ir a ${pin.name}`}
              onClick={() => onSelect(pin)}
              className={`sr-bubble-dot-indicator ${isFocal ? 'is-active' : ''}`}
            />
          )
        })}
      </div>
    </div>
  )
}
