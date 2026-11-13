import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './mapa.css'
import type { MapFilter, MapPinDto } from '../types/map.dto'
import { filterPins, calcBounds } from '../utils/mapUtils'
import { MAPBOX_TOKEN } from '../config'

/* ── Token ── */
const hasToken = !!MAPBOX_TOKEN

type ViewMode = 'normal' | '3d'

/** Un solo estilo para las dos vistas: en «Normal» se oculta la imagen satelital y queda el mapa oscuro con calles. */
const MAP_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12'

/** Aplica la vista: satélite + edificios/relieve en 3D; mapa oscuro plano en normal. */
function applyViewMode(map: mapboxgl.Map, mode: ViewMode) {
  try {
    if (map.getLayer('satellite')) {
      map.setLayoutProperty('satellite', 'visibility', mode === '3d' ? 'visible' : 'none')
    }
  } catch {
    /* Ignorar si la capa satelital no está lista */
  }

  try {
    if (mode === '3d') {
      if (!map.getLayer('sr-3d-buildings') && map.getSource('composite')) {
        map.addLayer({
          id: 'sr-3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 12,
          paint: {
            'fill-extrusion-color': '#2b2838',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.78,
          },
        })
      } else if (map.getLayer('sr-3d-buildings')) {
        map.setLayoutProperty('sr-3d-buildings', 'visibility', 'visible')
      }
    } else if (map.getLayer('sr-3d-buildings')) {
      map.setLayoutProperty('sr-3d-buildings', 'visibility', 'none')
    }
  } catch {
    /* Ignorar si la capa de edificios 3D no está disponible */
  }

  try {
    if (mode === '3d') {
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        })
      }
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.3 })
    } else {
      map.setTerrain(null)
    }
  } catch {
    /* Ignorar si el terreno DEM no está disponible */
  }
}

const pitchFor = (mode: ViewMode) => (mode === '3d' ? 55 : 0)

/* ── Iconos SVG para los pines ── */
const BAG_ICON = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#FFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`
const HEART_ICON = `<svg viewBox="0 0 24 24" width="13" height="13" fill="#262626" stroke="#262626" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`

interface Props {
  pins: MapPinDto[]
  selectedId?: string | null
  hoveredId?: string | null
  filter?: MapFilter
  onFilterChange?: (filter: MapFilter) => void
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
  filter,
  onFilterChange,
  onSelect,
  onHover,
  showControls = true,
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapLoadedRef = useRef(false)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  const [internalFilter, setInternalFilter] = useState<MapFilter>(filter ?? 'todos')
  const [legendExpanded, setLegendExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('normal')
  const [mapLoadError, setMapLoadError] = useState(false)
  const viewModeRef = useRef<ViewMode>('normal')

  const activeFilter = filter !== undefined ? filter : internalFilter

  const updateFilter = useCallback(
    (next: MapFilter) => {
      setInternalFilter(next)
      onFilterChange?.(next)
    },
    [onFilterChange],
  )

  const storesActive = activeFilter === 'todos' || activeFilter === 'tiendas'
  const foundsActive = activeFilter === 'todos' || activeFilter === 'fundaciones'
  const activeTypesCount = (storesActive ? 1 : 0) + (foundsActive ? 1 : 0)

  const handleToggleType = useCallback(
    (tipo: 'tienda' | 'fundacion') => {
      if (tipo === 'tienda') {
        if (storesActive && foundsActive) {
          updateFilter('fundaciones')
        } else if (storesActive && !foundsActive) {
          updateFilter('todos')
        } else {
          updateFilter('todos')
        }
      } else {
        if (foundsActive && storesActive) {
          updateFilter('tiendas')
        } else if (foundsActive && !storesActive) {
          updateFilter('todos')
        } else {
          updateFilter('todos')
        }
      }
    },
    [storesActive, foundsActive, updateFilter],
  )

  const visiblePins = useMemo(() => filterPins(pins, activeFilter), [pins, activeFilter])

  /* ── Encuadrar todos los puntos visibles ("Ver toda Bogotá") ── */
  const fitAllVisiblePins = useCallback(
    (animate = true) => {
      const map = mapRef.current
      if (!map) return
      const targetList = visiblePins.length ? visiblePins : pins
      if (!targetList.length) return
      const bounds = calcBounds(targetList)
      map.fitBounds(bounds as [[number, number], [number, number]], {
        padding: { top: 64, bottom: 95, left: 68, right: 68 },
        maxZoom: 13.2,
        pitch: 0,
        bearing: 0,
        duration: animate ? 850 : 0,
      })
    },
    [visiblePins, pins],
  )

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
    mapLoadedRef.current = false

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-74.063, 4.648],
      zoom: 12.2,
      pitch: pitchFor(viewModeRef.current),
      bearing: 0,
      attributionControl: false,
      logoPosition: 'bottom-left',
    })

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }),
      'top-right',
    )
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('style.load', () => {
      mapLoadedRef.current = true
      setMapLoadError(false)
      applyViewMode(map, viewModeRef.current)
    })

    const loadTimeout = window.setTimeout(() => {
      if (!mapLoadedRef.current) {
        setMapLoadError(true)
      }
    }, 12000)

    map.on('error', (event) => {
      // Si el estilo base ya cargó, nunca bloquear el mapa por errores de tiles secundarios (ej. DEM / satélite en 3D)
      if (mapLoadedRef.current) return
      const status = (event as { error?: { status?: number; message?: string } }).error?.status
      const message = event.error?.message ?? ''
      if (status === 401 || /invalid.*token|access token/i.test(message)) {
        setMapLoadError(true)
      }
    })

    map.on('load', () => {
      mapLoadedRef.current = true
      window.clearTimeout(loadTimeout)
      setMapLoadError(false)

      if (pins.length) {
        const bounds = calcBounds(pins)
        map.fitBounds(bounds as [[number, number], [number, number]], {
          padding: { top: 64, bottom: 95, left: 68, right: 68 },
          maxZoom: 13.2,
          duration: 0,
        })
      }
    })

    map.on('click', (e) => {
      const target = e.originalEvent.target as HTMLElement | null
      if (target?.closest?.('.sr-mb-pin')) return
      onSelect?.(null)
    })

    mapRef.current = map

    return () => {
      window.clearTimeout(loadTimeout)
      mapLoadedRef.current = false
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

    existing.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove()
        existing.delete(id)
      }
    })

    for (const pin of visiblePins) {
      if (existing.has(pin.id)) continue

      const el = createPinEl(pin)

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

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        if (popupRef.current) {
          popupRef.current.remove()
          popupRef.current = null
        }
        onSelect?.(pin)
        map.flyTo({
          center: pin.lngLat,
          zoom: 14.5,
          pitch: pitchFor(viewModeRef.current),
          duration: 800,
        })
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
      mapRef.current.flyTo({
        center: pin.lngLat,
        zoom: 14.5,
        pitch: pitchFor(viewModeRef.current),
        duration: 800,
      })
    }
  }, [selectedId, pins])

  /* ── Re-fit al cambiar filtro ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !visiblePins.length) return
    const bounds = calcBounds(visiblePins)
    map.fitBounds(bounds as [[number, number], [number, number]], {
      padding: { top: 64, bottom: 95, left: 68, right: 68 },
      maxZoom: 13.2,
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

  /* ── Cambio de vista normal / 3D (igual que en el prototipo) ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map || viewModeRef.current === viewMode) return
    viewModeRef.current = viewMode
    applyViewMode(map, viewMode)
    if (viewMode === '3d') {
      map.easeTo({
        pitch: 55,
        bearing: -90,
        duration: 1400,
      })
    } else {
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 700,
      })
    }
  }, [viewMode])

  const handleToggle3D = () => {
    setViewMode((prev) => (prev === '3d' ? 'normal' : '3d'))
  }

  const handleResetBogota = () => {
    if (viewMode === '3d') {
      setViewMode('normal')
    }
    onSelect?.(null)
    fitAllVisiblePins(true)
  }

  /* ── Sin token: render fallback ── */
  if (!hasToken) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-white/10 bg-white/[.04] p-8 text-center ${className}`}
      >
        <div>
          <p className="text-lg font-semibold">Mapa no disponible</p>
          <p className="mt-2 text-sm text-white/60">
            Agrega tu token de Mapbox en{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">.env.local</code> como{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
              VITE_MAPBOX_TOKEN=pk.xxx
            </code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Contenedor del mapa */}
      <div
        ref={containerRef}
        className="h-full w-full rounded-[1.5rem] bg-[#171a20]"
        style={{ minHeight: 380 }}
      />

      {mapLoadError && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center rounded-[1.5rem] border border-white/10 bg-[#171a20] p-8 text-center"
          role="alert"
        >
          <div className="max-w-md">
            <p className="text-lg font-semibold">No se pudo cargar el mapa</p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Revisa la conexión y que{' '}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                VITE_MAPBOX_TOKEN
              </code>{' '}
              sea válido en{' '}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">.env.local</code>.
              Después, recarga la página.
            </p>
          </div>
        </div>
      )}

      {/* Barra superior izquierda del prototipo: [ Vista 3D ] + [ Ver toda Bogotá ] */}
      <div className="sr-map-top-bar" role="group" aria-label="Controles de cámara del mapa">
        <button
          type="button"
          className={`sr-map-ctrl-pill sr-map-view-btn ${viewMode === '3d' ? 'is-3d' : ''}`}
          onClick={handleToggle3D}
          aria-pressed={viewMode === '3d'}
          aria-label="Alternar vista 3D y aérea"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="sr-map-vlabel">
            {viewMode === '3d' ? 'Vista aérea' : 'Vista 3D'}
          </span>
        </button>

        <button
          type="button"
          className="sr-map-ctrl-pill sr-map-reset-btn"
          onClick={handleResetBogota}
          aria-label="Ver toda Bogotá (encuadrar todos los puntos)"
          title="Ver toda Bogotá"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Ver toda Bogotá</span>
        </button>
      </div>

      {/* Leyenda y filtro interactivo en esquina inferior izquierda (como en el prototipo) */}
      {showControls && (
        <div
          className={`sr-map-legend ${legendExpanded ? 'is-expanded' : ''}`}
          role="region"
          aria-label="Leyenda y filtro del mapa"
        >
          <button
            type="button"
            className="sr-leg-toggle-btn"
            onClick={() => setLegendExpanded(!legendExpanded)}
            aria-expanded={legendExpanded}
            aria-label="Mostrar opciones de filtro"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span className="sr-leg-toggle-txt">Filtros</span>
            <span className="sr-leg-badge-count">{activeTypesCount}/2</span>
          </button>

          <div className="sr-leg-content">
            <span className="sr-leg-caption">Mostrar en el mapa:</span>
            <div className="sr-leg-group" role="group" aria-label="Filtrar por tipo de lugar">
              <button
                type="button"
                className={`sr-leg-item ${storesActive ? 'is-active' : ''}`}
                aria-pressed={storesActive}
                onClick={() => handleToggleType('tienda')}
                title="Mostrar u ocultar tiendas"
              >
                <i className="sr-leg-icon store" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="11"
                    height="11"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </i>
                <span className="sr-leg-name">Tiendas</span>
                <span className="sr-leg-check" aria-hidden="true">
                  ✓
                </span>
              </button>

              <button
                type="button"
                className={`sr-leg-item ${foundsActive ? 'is-active' : ''}`}
                aria-pressed={foundsActive}
                onClick={() => handleToggleType('fundacion')}
                title="Mostrar u ocultar fundaciones de ropa usada"
              >
                <i className="sr-leg-icon found" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="11"
                    height="11"
                    fill="none"
                    stroke="#262626"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </i>
                <span className="sr-leg-name">Fundaciones (ropa usada)</span>
                <span className="sr-leg-check" aria-hidden="true">
                  ✓
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
