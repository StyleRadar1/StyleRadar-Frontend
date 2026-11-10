import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { MapPinDto } from '../types/map.dto'

interface Props {
  pin: MapPinDto
  onClose: () => void
}

/** Tarjeta flotante de detalle del pin seleccionado. */
export default function MapCard({ pin, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const isFound = pin.tipo === 'fundacion'

  /* Clic fuera cierra */
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (!panelRef.current?.contains(target as Node) && !target?.closest?.('.sr-mb-pin')) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [onClose])

  /* Escape cierra */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={panelRef}
      className="lm-pane is-open"
      role="dialog"
      aria-label={`Detalle de ${pin.name}`}
    >
      {/* Botón cerrar */}
      <button
        type="button"
        className="lm-close"
        onClick={onClose}
        aria-label="Cerrar"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Badge de tipo */}
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
        isFound
          ? 'bg-arena/20 text-arena'
          : 'bg-violeta/20 text-violeta-claro'
      }`}>
        {isFound ? '♥ Fundación' : `● ${pin.cat}`}
      </span>

      <h3 className="mt-3 text-lg font-bold leading-tight">{pin.name}</h3>
      <p className="mt-1 text-sm text-white/60">{pin.barrio} · a {pin.d}</p>

      {/* Info */}
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="text-white/40">Dirección</dt>
          <dd className="text-white/80">{pin.dir}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-white/40">Horario</dt>
          <dd className="text-white/80">{pin.hours}</dd>
        </div>
        {pin.rating && (
          <div className="flex gap-2">
            <dt className="text-white/40">Calificación</dt>
            <dd className="text-white/80">★ {pin.rating} ({pin.reviews} reseñas)</dd>
          </div>
        )}
      </dl>

      {pin.desc && <p className="mt-3 text-sm text-white/70">{pin.desc}</p>}

      {/* Fundación: qué acepta */}
      {isFound && pin.accepts && pin.accepts.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Recibe</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {pin.accepts.map((a) => (
              <span key={a} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Fundación: stats */}
      {isFound && pin.stats && (
        <div className="mt-4 flex gap-4 text-center text-xs">
          <div>
            <div className="text-base font-bold">{pin.stats[0].toLocaleString('es-CO')}</div>
            <div className="text-white/40">Prendas</div>
          </div>
          <div>
            <div className="text-base font-bold">{pin.stats[1].toLocaleString('es-CO')}</div>
            <div className="text-white/40">Donaciones</div>
          </div>
          <div>
            <div className="text-base font-bold">{pin.stats[2]}</div>
            <div className="text-white/40">Voluntarios</div>
          </div>
        </div>
      )}

      {/* Acción */}
      <Link
        to={pin.href}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violeta px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-[#5a16c0]"
      >
        {isFound ? 'Conocer la fundación' : 'Ver tienda'}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </div>
  )
}
