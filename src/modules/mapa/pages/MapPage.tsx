import { useState, useCallback, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loading, ErrorState, EmptyState } from '@/modules/core/components/Status'
import { useMapData } from '../hooks/useMapData'
import MapaBogota from '../components/MapaBogota'
import MapCard from '../components/MapCard'
import BubbleColumn from '../components/BubbleColumn'
import type { MapPinDto, MapFilter } from '../types/map.dto'
import { filterPins } from '../utils/mapUtils'

export default function MapPage() {
  const [searchParams] = useSearchParams()
  const tiendaParam = searchParams.get('tienda')
  const { data: pins, loading, error, reload } = useMapData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [filter, setFilter] = useState<MapFilter>('todos')

  useEffect(() => {
    if (tiendaParam && pins.length) {
      const match = pins.find((p) => p.id.toLowerCase() === tiendaParam.toLowerCase())
      if (match) setSelectedId(match.id)
    }
  }, [tiendaParam, pins])

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
    <div className="sr-map-page-shell px-4 py-4 sm:px-6">
      <div className="sr-map-layout-wrap">
        {/* Fila superior con botón VOLVER tipo píldora */}
        <div className="sr-map-top-nav">
          <Link to="/" className="sr-map-back-btn" aria-label="Volver al inicio">
            <span aria-hidden="true">←</span>
            <span>Volver</span>
          </Link>
        </div>

        {/* Hero principal: Mapa (~63%) + Carrusel de burbujas en arco (~37%) */}
        <div className="sr-map-hero sr-store-map">
          <div className="sr-map-hero-main">
            <MapaBogota
              pins={pins}
              selectedId={selectedId}
              hoveredId={hoveredId}
              filter={filter}
              onFilterChange={setFilter}
              onSelect={handleSelect}
              onHover={handleHover}
              showControls={true}
              className="h-full w-full"
            />
            {selectedPin && (
              <MapCard
                pin={selectedPin}
                onClose={() => setSelectedId(null)}
              />
            )}
          </div>

          <aside className="sr-map-hero-side" aria-label="Tiendas y fundaciones aliadas">
            <div className="sr-bubbles-header">
              <span className="sr-bubbles-kicker">Moda local · Bogotá</span>
              <h1 className="sr-bubbles-title">Tiendas y fundaciones</h1>
            </div>

            <BubbleColumn
              pins={visiblePins}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={handleBubbleSelect}
              onHover={handleHover}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
