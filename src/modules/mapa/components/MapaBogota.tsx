import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './mapa.css'
import type { MapFilter, MapPinDto } from '../types/map.dto'
import { filterPins, calcBounds } from '../utils/mapUtils'

/* ── Token ── */
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
const hasToken = !!MAPBOX_TOKEN

/* ── Iconos SVG para los pines ── */
const BAG_ICON = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#FFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`
const HEART_ICON = `<svg viewBox="0 0 24 24" width="13" height="13" fill="#262626" stroke="#262626" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`

interface Props {
  pins: MapPinDto[]
  selectedId?: string | null
  hoveredId?: string | null
  filter?: MapFilter
  onSelect?: (pin: MapPinDto | null) => void
  onHover?: (pin: MapPinDto | null) => void
  /** Mostrar controles de filtro y leyenda dentro del mapa */
  showControls?: boolean
  /** Clase CSS extra para el contenedor */
  className?: string
}

export default function MapaBogota({
  pins,
  selectedId = null,
  hoveredId = null,
  filter = 'todos',
  onSelect,
  onHover,
  showControls = true,
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  const [internalFilter, setInternalFilter] = useState<MapFilter>(filter)
  const [legendExpanded, setLegendExpanded] = useState(false)

  const activeFilter = showControls ? internalFilter : filter

  const visiblePins = useMemo(() => filterPins(pins, activeFilter), [pins, activeFilter])

  /* ── Crear pin DOM ── */
  const createPinEl = useCallback((pin: MapPinDto): HTMLElement => {
    const el = document.createElement('button')
    el.className = `sr-mb-pin${pin.tipo === 'fundacion' ? ' found' : ''}`
    el.setAttribute('aria-label', pin.name)
    el.setAttribute('tabindex', '0')
    el.setAttribute('data-id', pin.id)

    const shape = document.createElement('i')
    shape.className = `sr-pin-shape ${pin.tipo === 'tienda' ? 'store' : 'found'}`

    const ico = document.createElement('span')
    ico.className = 'sr-pin-ico'
    ico.innerHTML = pin.tipo === 'tienda' ? BAG_ICON : HEART_ICON
    shape.appendChild(ico)

    el.appendChild(shape)
    return el
  }, [])

  /* ── Mini card HTML (hover popup) ── */
  const miniCardHTML = useCallback((pin: MapPinDto): string => {
    const isFound = pin.tipo === 'fundacion'
    const meta = pin.rating
      ? `★ ${pin.rating}${pin.d ? ` · a ${pin.d}` : ''}`
      : pin.d || pin.dir
    return `
      <div class="sr-mini-card" role="tooltip">
        <div class="sr-mc-head">
          <span class="sr-mc-badge ${isFound ? 'fundacion' : 'tienda'}">
            ${isFound ? 'Fundación' : `Tienda · ${pin.cat}`}
          </span>
          <span class="sr-mc-barrio">${pin.barrio}</span>
        </div>
        <h4 class="sr-mc-title">${pin.name}</h4>
        <p class="sr-mc-sub">${meta}</p>
        <div class="sr-mc-hint">
          <span>Clic para ver detalles</span>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    `
  }, [])

  /* ── Inicializar mapa ── */
  useEffect(() => {
    if (!hasToken || !containerRef.current || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-74.08, 4.65],
      zoom: 11,
      pitch: 45,
      bearing: -10,
      attributionControl: true,
      logoPosition: 'bottom-right',
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right')

    map.on('load', () => {
      // Agregar terreno DEM
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      })
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })

      // Encuadrar
      if (pins.length) {
        const bounds = calcBounds(pins)
        map.fitBounds(bounds as [[number, number], [number, number]], {
          padding: { top: 60, bottom: 90, left: 65, right: 65 },
          maxZoom: 13,
          duration: 0,
        })
      }
    })

    // Clic en área vacía cierra selección
    map.on('click', (e) => {
      const target = e.originalEvent.target as HTMLElement | null
      if (target?.closest?.('.sr-mb-pin')) return
      onSelect?.(null)
    })

    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Sincronizar marcadores con pins visibles ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const currentIds = new Set(visiblePins.map((p) => p.id))
    const existing = markersRef.current

    // Quitar marcadores que ya no son visibles
    existing.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove()
        existing.delete(id)
      }
    })

    // Agregar nuevos marcadores
    for (const pin of visiblePins) {
      if (existing.has(pin.id)) continue

      const el = createPinEl(pin)

      // Hover → popup mini
      el.addEventListener('mouseenter', () => {
        onHover?.(pin)
        if (popupRef.current) popupRef.current.remove()
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: [0, -30],
          className: 'sr-mb-mini-popup',
          maxWidth: '280px',
        })
          .setLngLat(pin.lngLat)
          .setHTML(miniCardHTML(pin))
          .addTo(map)
        popupRef.current = popup
      })

      el.addEventListener('mouseleave', () => {
        onHover?.(null)
        if (popupRef.current) {
          popupRef.current.remove()
          popupRef.current = null
        }
      })

      // Clic → seleccionar
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        if (popupRef.current) {
          popupRef.current.remove()
          popupRef.current = null
        }
        onSelect?.(pin)
        map.flyTo({ center: pin.lngLat, zoom: 14.5, pitch: 50, duration: 800 })
      })

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(pin.lngLat)
        .addTo(map)

      existing.set(pin.id, marker)
    }
  }, [visiblePins, createPinEl, miniCardHTML, onSelect, onHover])

  /* ── Highlight del pin seleccionado ── */
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      el.classList.toggle('is-selected', id === selectedId)
    })
  }, [selectedId])

  /* ── Highlight del pin en hover (desde burbujas) ── */
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      el.classList.toggle('is-hovered', id === hoveredId)
    })
  }, [hoveredId])

  /* ── FlyTo desde selección externa ── */
  useEffect(() => {
    if (!selectedId || !mapRef.current) return
    const pin = pins.find((p) => p.id === selectedId)
    if (pin) {
      mapRef.current.flyTo({ center: pin.lngLat, zoom: 14.5, pitch: 50, duration: 800 })
    }
  }, [selectedId, pins])

  /* ── Re-fit al cambiar filtro ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !visiblePins.length) return
    const bounds = calcBounds(visiblePins)
    map.fitBounds(bounds as [[number, number], [number, number]], {
      padding: { top: 60, bottom: 90, left: 65, right: 65 },
      maxZoom: 13,
      duration: 600,
    })
  }, [activeFilter, visiblePins])

  /* ── Escape cierra selección ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSelect?.(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onSelect])

  /* ── Sin token: render fallback ── */
  if (!hasToken) {
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-white/10 bg-white/[.04] p-8 text-center ${className}`}>
        <div>
          <p className="text-lg font-semibold">Mapa no disponible</p>
          <p className="mt-2 text-sm text-white/60">
            Agrega tu token de Mapbox en <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">.env.local</code> como{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">VITE_MAPBOX_TOKEN=pk.xxx</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Contenedor del mapa */}
      <div ref={containerRef} className="h-full w-full rounded-2xl" style={{ minHeight: 400 }} />

      {/* Leyenda + filtros */}
      {showControls && (
        <div className={`sr-map-legend ${legendExpanded ? 'is-expanded' : ''}`}>
          <button
            type="button"
            className="sr-leg-toggle-btn"
            onClick={() => setLegendExpanded(!legendExpanded)}
            aria-expanded={legendExpanded}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Leyenda
          </button>
          <div className="sr-leg-content" style={{ display: legendExpanded ? 'block' : 'none' }}>
            <div className="mt-2 flex flex-col gap-2 text-xs">
              {/* Tiendas */}
              <label className="flex cursor-pointer items-center gap-2">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-sm border-2 border-white"
                  style={{ background: '#48119A', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }}
                />
                <span>Tiendas aliadas</span>
                <input
                  type="checkbox"
                  className="ml-auto accent-violeta"
                  checked={activeFilter !== 'fundaciones'}
                  onChange={() =>
                    setInternalFilter((f) =>
                      f === 'todos' ? 'fundaciones' : f === 'fundaciones' ? 'todos' : 'fundaciones'
                    )
                  }
                />
              </label>
              {/* Fundaciones */}
              <label className="flex cursor-pointer items-center gap-2">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white"
                  style={{ background: '#E8DCCB', outline: '1.5px dashed rgba(255,255,255,.85)', outlineOffset: '1.5px' }}
                />
                <span>Fundaciones</span>
                <input
                  type="checkbox"
                  className="ml-auto accent-violeta"
                  checked={activeFilter !== 'tiendas'}
                  onChange={() =>
                    setInternalFilter((f) =>
                      f === 'todos' ? 'tiendas' : f === 'tiendas' ? 'todos' : 'tiendas'
                    )
                  }
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
