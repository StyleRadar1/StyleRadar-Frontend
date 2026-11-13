import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useMapData } from '../hooks/useMapData'
import MapaBogota from './MapaBogota'
import MapCard from './MapCard'
import type { MapPinDto } from '../types/map.dto'

/** Sección del mapa interactivo (Mapbox) para el landing: pines, tarjeta y filtros. */
export default function MapaLanding() {
  const { data: pins, error, loading, reload } = useMapData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const selectedPin = pins.find((p) => p.id === selectedId) ?? null

  const handleSelect = useCallback((pin: MapPinDto | null) => {
    setSelectedId(pin?.id ?? null)
  }, [])

  const handleHover = useCallback((pin: MapPinDto | null) => {
    setHoveredId(pin?.id ?? null)
  }, [])
  const hasError = Boolean(error)

  return (
    <section className="bg-transparent text-[var(--sr-hero-text)] px-4 py-8 sm:px-6 md:py-10" aria-labelledby="lmTitle">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--sr-accent)]">Mapa interactivo</p>
            <h2 id="lmTitle" className="text-2xl font-extrabold leading-tight md:text-3xl text-[var(--sr-hero-text)]">
              El radar en el <span className="text-[var(--sr-accent-text)]">mapa</span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="max-w-[28.75rem] text-sm leading-relaxed text-[var(--sr-hero-text-muted)]">
              Toca una tienda o fundación para ver sus detalles sin salir del mapa.
            </p>
            <Link
              to="/mapa"
              className="flex-shrink-0 rounded-full border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)] text-[var(--sr-hero-text)] px-4 py-2 text-xs font-semibold transition hover:bg-[var(--sr-surface-raised)]"
            >
              Abrir el mapa completo →
            </Link>
          </div>
        </div>

        {hasError || pins.length === 0 ? (
          <div
            className="sr-store-map flex min-h-[16.25rem] items-center justify-center rounded-[1.375rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-xl text-[var(--color-text)]"
            role={hasError ? 'alert' : 'status'}
          >
            <div className="max-w-lg">
              <p className="text-lg font-bold text-[var(--color-text)]">
                {hasError
                  ? 'No pudimos cargar las tiendas y fundaciones.'
                  : loading
                    ? 'Cargando el radar de Bogotá…'
                    : 'Todavía no hay tiendas o fundaciones para mostrar.'}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {hasError
                  ? 'Revisa tu conexión e inténtalo de nuevo.'
                  : 'Puedes abrir el mapa completo para explorar el radar.'}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {hasError && (
                  <button
                    type="button"
                    onClick={reload}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2 text-xs font-bold text-[var(--color-text)] transition hover:bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
                  >
                    Reintentar
                  </button>
                )}
                <Link
                  to="/mapa"
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2 text-xs font-bold text-[var(--color-text)] transition hover:bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
                >
                  Abrir mapa completo →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="sr-store-map relative overflow-hidden rounded-[1.375rem] border border-white/[.14] shadow-[0_20px_50px_rgba(0,0,0,.55)]">
            <MapaBogota
              pins={pins}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={handleSelect}
              onHover={handleHover}
              showControls={true}
              className="h-[min(calc(100dvh-12.1875rem),43.75rem)] min-h-[26.25rem] w-full"
            />
            {selectedPin && <MapCard pin={selectedPin} onClose={() => setSelectedId(null)} />}
          </div>
        )}
      </div>
    </section>
  )
}
