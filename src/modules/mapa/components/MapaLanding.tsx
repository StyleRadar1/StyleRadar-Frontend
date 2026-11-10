import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useMapData } from '../hooks/useMapData'
import MapaBogota from './MapaBogota'
import MapCard from './MapCard'
import type { MapPinDto } from '../types/map.dto'

/** Sección del mapa interactivo (Mapbox) para el landing: pines, tarjeta y filtros. */
export default function MapaLanding() {
  const { data: pins } = useMapData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const selectedPin = pins.find((p) => p.id === selectedId) ?? null

  const handleSelect = useCallback((pin: MapPinDto | null) => {
    setSelectedId(pin?.id ?? null)
  }, [])

  const handleHover = useCallback((pin: MapPinDto | null) => {
    setHoveredId(pin?.id ?? null)
  }, [])

  if (pins.length === 0) return null

  return (
    <section className="bg-[#1c1c1c] px-4 py-8 sm:px-6 md:py-10" aria-labelledby="lmTitle">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-lavanda">Mapa interactivo</p>
            <h2 id="lmTitle" className="text-2xl font-extrabold leading-tight md:text-3xl">
              El radar en el <span className="text-lavanda">mapa</span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="max-w-[460px] text-sm leading-relaxed text-lavanda">
              Toca una tienda o fundación para ver sus detalles sin salir del mapa.
            </p>
            <Link
              to="/mapa"
              className="flex-shrink-0 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold transition hover:bg-white/10"
            >
              Abrir el mapa completo →
            </Link>
          </div>
        </div>

        <div className="sr-store-map relative overflow-hidden rounded-[22px] border border-white/[.14] shadow-[0_20px_50px_rgba(0,0,0,.55)]">
          <MapaBogota
            pins={pins}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={handleSelect}
            onHover={handleHover}
            showControls={true}
            className="h-[min(calc(100dvh-195px),700px)] min-h-[420px] w-full"
          />
          {selectedPin && <MapCard pin={selectedPin} onClose={() => setSelectedId(null)} />}
        </div>
      </div>
    </section>
  )
}
