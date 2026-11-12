import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatCOP } from '@/modules/core/utils/format'
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
      {/* Foto del punto */}
      <div className={`lm-photo${isFound ? ' is-tall' : ''}`}>
        {pin.photo ? <img src={pin.photo} alt={pin.name} loading="lazy" /> : <span className="lm-photo-empty">{pin.name.charAt(0)}</span>}
        <span className="lm-photo-fade" aria-hidden="true" />
        <span className={`lm-photo-badge${isFound ? ' is-found' : ''}`}>
          {isFound ? '♥ Fundación' : `● ${pin.cat}`}
        </span>
      </div>

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

      <h3 className="text-base font-bold leading-tight text-[var(--color-text)]">{pin.name}</h3>
      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{pin.barrio} · a {pin.d}</p>

      {/* Info */}
      <dl className="mt-3 space-y-1 text-xs">
        <div className="flex gap-2">
          <dt className="text-[var(--color-text-muted)]">Dirección</dt>
          <dd className="text-[var(--color-text)]">{pin.dir}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-[var(--color-text-muted)]">Horario</dt>
          <dd className="text-[var(--color-text)]">{pin.hours}</dd>
        </div>
        {pin.rating && (
          <div className="flex gap-2">
            <dt className="text-[var(--color-text-muted)]">Calificación</dt>
            <dd className="text-[var(--color-text)]">★ {pin.rating} ({pin.reviews} reseñas)</dd>
          </div>
        )}
      </dl>

      {pin.desc && <p className="mt-2 text-xs leading-snug text-[var(--color-text-muted)]">{pin.desc}</p>}

      {/* Tienda: vista previa de productos */}
      {!isFound && pin.products && pin.products.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Lo que ofrece</p>
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {pin.products.slice(0, 3).map((p) => (
              <li key={p.id} className="min-w-0">
                <img
                  src={p.imagen}
                  alt={p.nombre}
                  loading="lazy"
                  className="aspect-[4/5] w-full rounded-lg object-cover bg-[var(--color-surface)] border border-[var(--color-border)]"
                />
                <p className="mt-1 truncate text-[11px] font-semibold text-[var(--color-text)]">{p.nombre}</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">{formatCOP(p.precio)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fundación: qué acepta */}
      {isFound && pin.accepts && pin.accepts.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Recibe</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {pin.accepts.map((a) => (
              <span key={a} className="rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2.5 py-0.5 text-xs text-[var(--color-text)]">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Fundación: stats */}
      {isFound && pin.stats && (
        <div className="mt-4 flex gap-4 text-center text-xs">
          <div>
            <div className="text-base font-bold text-[var(--color-text)]">{pin.stats[0].toLocaleString('es-CO')}</div>
            <div className="text-[var(--color-text-muted)]">Prendas</div>
          </div>
          <div>
            <div className="text-base font-bold text-[var(--color-text)]">{pin.stats[1].toLocaleString('es-CO')}</div>
            <div className="text-[var(--color-text-muted)]">Donaciones</div>
          </div>
          <div>
            <div className="text-base font-bold text-[var(--color-text)]">{pin.stats[2]}</div>
            <div className="text-[var(--color-text-muted)]">Voluntarios</div>
          </div>
        </div>
      )}

      {/* Acción */}
      <Link
        to={pin.href}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-on-accent)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] shadow-md"
      >
        {isFound ? 'Conocer la fundación' : 'Ver tienda'}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </div>
  )
}
