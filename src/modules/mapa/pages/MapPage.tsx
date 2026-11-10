import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loading, ErrorState, EmptyState } from '@/modules/core/components/Status'
import { useMapData } from '../hooks/useMapData'
import MapaBogota from '../components/MapaBogota'
import MapCard from '../components/MapCard'
import BubbleColumn from '../components/BubbleColumn'
import type { MapPinDto, MapFilter } from '../types/map.dto'
import { filterPins } from '../utils/mapUtils'

export default function MapPage() {
  const { data: pins, loading, error, reload } = useMapData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [filter, setFilter] = useState<MapFilter>('todos')

  const selectedPin = pins.find((p) => p.id === selectedId) ?? null
  const visiblePins = filterPins(pins, filter)

  const handleSelect = useCallback((pin: MapPinDto | null) => {
    setSelectedId(pin?.id ?? null)
  }, [])

  const handleHover = useCallback((pin: MapPinDto | null) => {
    setHoveredId(pin?.id ?? null)
  }, [])

  const handleBubbleSelect = useCallback((pin: MapPinDto) => {
    setSelectedId(pin.id)
  }, [])

  /* ── Estados ── */
  if (loading) return <div className="p-8"><Loading label="Cargando el mapa…" /></div>
  if (error) return <div className="p-8"><ErrorState error={error} onRetry={reload} /></div>
  if (!pins.length) {
    return (
      <div className="p-8">
        <EmptyState title="Sin puntos en el mapa">
          <p>Aún no hay tiendas ni fundaciones registradas.</p>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver
        </Link>
        <div className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Moda local · Bogotá</span>
          <h1 className="text-lg font-bold leading-tight">Tiendas y fundaciones</h1>
        </div>

        {/* Filtros */}
        <div className="flex gap-1 rounded-full border border-white/10 bg-white/[.04] p-1">
          {(['todos', 'tiendas', 'fundaciones'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                filter === f
                  ? 'bg-violeta text-white shadow'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Hero: mapa + burbujas */}
      <div className="sr-store-map flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Mapa ~63% */}
        <div className="relative flex-1 lg:flex-[63]">
          <MapaBogota
            pins={pins}
            selectedId={selectedId}
            hoveredId={hoveredId}
            filter={filter}
            onSelect={handleSelect}
            onHover={handleHover}
            showControls={false}
            className="h-full w-full"
          />
          {/* Tarjeta flotante */}
          {selectedPin && (
            <MapCard
              pin={selectedPin}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>

        {/* Columna de burbujas ~37% */}
        <aside className="w-full flex-shrink-0 border-t border-white/10 bg-grafito/50 backdrop-blur lg:w-[37%] lg:border-l lg:border-t-0">
          <div className="px-4 pt-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
              {visiblePins.length} {visiblePins.length === 1 ? 'punto' : 'puntos'}
            </span>
          </div>
          <BubbleColumn
            pins={visiblePins}
            selectedId={selectedId}
            onSelect={handleBubbleSelect}
            onHover={handleHover}
          />
        </aside>
      </div>
    </div>
  )
}
