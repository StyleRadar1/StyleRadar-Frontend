import { useState, useCallback, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loading, ErrorState, EmptyState } from '@/modules/core/components/Status'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorMessage } from '@/modules/core/api/errors'
import { Aviso, BTN_PRINCIPAL, BTN_SECUNDARIO, type TonoAviso } from '@/modules/core/components/Aviso'
import { env } from '@/configs/env'
import { mapService } from '../services/mapService'
import { useMapData } from '../hooks/useMapData'
import MapaBogota from '../components/MapaBogota'
import MapCard from '../components/MapCard'
import BubbleColumn from '../components/BubbleColumn'
import { CATEGORIAS_ALMACEN, type MapPinDto, type MapFilter } from '../types/map.dto'
import { BARRIOS_BOGOTA, centroBarrio, filterPins, formatDistanciaKm, RADIO_KM, type Ubicacion } from '../utils/mapUtils'

const TEXTO_RADIO = `El radio va de ${RADIO_KM.min} a ${RADIO_KM.max} km.`

export default function MapPage() {
  const [searchParams] = useSearchParams()
  const tiendaParam = searchParams.get('tienda') || searchParams.get('fundacion')
  const { data: pins, loading, error, reload } = useMapData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [filter, setFilter] = useState<MapFilter>('todos')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [pinsFiltrados, setPinsFiltrados] = useState<MapPinDto[] | null>(null)

  // Cerca de mí (ms-geolocalización): 400 sin ubicación, 422 radio fuera de rango, 404 tienda retirada
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null)
  const [radio, setRadio] = useState<number>(RADIO_KM.inicial)
  const [cercanos, setCercanos] = useState<string[] | null>(null)
  const [pideUbicacion, setPideUbicacion] = useState(false)
  const [ubicacionError, setUbicacionError] = useState('')
  const [radioError, setRadioError] = useState('')
  const [aviso, setAviso] = useState<{ tono: TonoAviso; titulo: string; texto: string } | null>(null)
  const [retirados, setRetirados] = useState<string[]>([])
  const [distancias, setDistancias] = useState<Record<string, number>>({})

  const activePins = pinsFiltrados ?? pins

  useEffect(() => {
    if (tiendaParam && activePins.length) {
      const match = activePins.find((p) => p.id.toLowerCase() === tiendaParam.toLowerCase())
      if (match) setSelectedId(match.id)
    }
  }, [tiendaParam, activePins])

  const categorias = useMemo(() => {
    return CATEGORIAS_ALMACEN.map((c) => {
      const match = pins.find(
        (p) => p.tipo === 'tienda' && p.categoriaId && p.cat.toLowerCase() === c.nombre.toLowerCase(),
      )
      return { id: match?.categoriaId || c.id, nombre: c.nombre }
    })
  }, [pins])

  const barrios = useMemo(
    () =>
      [
        ...new Set([
          ...pins.map((p) => p.barrio).filter((b): b is string => Boolean(b)),
          ...Object.keys(BARRIOS_BOGOTA),
        ]),
      ].sort(),
    [pins],
  )
  const vigentes = activePins.filter((p) => !retirados.includes(p.id))
  const porCategoria = categoriaId
    ? vigentes.filter((p) => p.tipo === 'tienda' && (!p.categoriaId || p.categoriaId === categoriaId))
    : vigentes
  const enRadio = cercanos ? porCategoria.filter((p) => cercanos.includes(p.id)) : porCategoria
  const selectedRaw = enRadio.find((p) => p.id === selectedId) ?? null
  const selectedPin = selectedRaw && distancias[selectedRaw.id] !== undefined
    ? { ...selectedRaw, d: `${formatDistanciaKm(distancias[selectedRaw.id])} de ti` } : selectedRaw
  const visiblePins = filterPins(enRadio, filter, categoriaId || undefined)

  const cambiarCategoria = useCallback(async (nextCategoriaId: string) => {
    setCategoriaId(nextCategoriaId)
    setAviso(null)
    if (!env.useMocks) {
      try {
        const res = await mapService.getAll({
          categoriaId: nextCategoriaId || undefined,
          ...(ubicacion ? { lat: ubicacion.lat, lng: ubicacion.lng, radioKm: radio } : {}),
        })
        setPinsFiltrados(res)
      } catch (e) {
        const status = e instanceof ApiError ? e.status : 0
        setAviso({
          tono: 'error',
          titulo: 'No pudimos filtrar por categoría',
          texto: e instanceof ApiError && e.code
            ? errorMessage(e)
            : status === 0
              ? 'Revisa tu internet e intenta de nuevo.'
              : 'Intenta en unos minutos.',
        })
      }
    }
  }, [ubicacion, radio])

  const buscar = useCallback(async (u: Ubicacion | null, km: number) => {
    setAviso(null); setRadioError('')
    try {
      const ids = await mapService.nearby(u, km, categoriaId || undefined)
      setCercanos(ids)
      if (u && !env.useMocks) {
        const updated = await mapService.getAll({
          lat: u.lat,
          lng: u.lng,
          radioKm: km,
          categoriaId: categoriaId || undefined,
        }).catch(() => null)
        if (updated) setPinsFiltrados(updated)
      }
      setPideUbicacion(false)
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0
      if (e instanceof ApiError && e.code === 'COORDENADA_FUERA_DE_RANGO') {
        setAviso({ tono: 'error', titulo: 'Ubicación inválida', texto: errorMessage(e) })
        return
      }
      if (status === 400) { setPideUbicacion(true); return }
      if (status === 422) {
        setRadioError(e instanceof ApiError && e.code === 'RADIO_INVALIDO' ? errorMessage(e) : TEXTO_RADIO)
        setRadio(RADIO_KM.inicial)
        return
      }
      setAviso({
        tono: 'error',
        titulo: 'No pudimos buscar tiendas cercanas',
        texto: e instanceof ApiError && e.code
          ? errorMessage(e)
          : status === 0
            ? 'Revisa tu internet e intenta de nuevo.'
            : 'Intenta en unos minutos.',
      })
    }
  }, [categoriaId])

  const usarMiUbicacion = () => {
    setUbicacionError('')
    if (!('geolocation' in navigator)) { setUbicacionError('Tu navegador no comparte la ubicación. Elige un barrio.'); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => { const u = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setUbicacion(u); buscar(u, radio) },
      () => setUbicacionError('No pudimos usar tu ubicación. Elige un barrio.'),
      { timeout: 10000, maximumAge: 300000 },
    )
  }

  const elegirBarrio = (barrio: string) => {
    const u = centroBarrio(pins, barrio)
    if (!u) return
    setUbicacion(u); buscar(u, radio)
  }

  const cambiarRadio = (valor: number) => {
    // El control no deja salir del rango; si el servidor igual responde 422, se avisa y se vuelve al inicial
    const km = Math.min(RADIO_KM.max, Math.max(RADIO_KM.min, Math.round(valor) || RADIO_KM.inicial))
    setRadio(km)
    if (ubicacion) buscar(ubicacion, km)
  }

  const quitarCercania = () => {
    setCercanos(null); setUbicacion(null); setPideUbicacion(false); setRadioError(''); setPinsFiltrados(null)
  }

  const handleSelect = useCallback((pin: MapPinDto | null) => {
    setSelectedId(pin?.id ?? null)
    if (!pin || !ubicacion || pin.tipo !== 'tienda') return
    mapService.distance(pin.id, ubicacion)
      .then((km) => setDistancias((d) => ({ ...d, [pin.id]: km })))
      .catch((e) => {
        if (!(e instanceof ApiError) || e.status !== 404) return
        // La tienda ya no existe: se cierra la tarjeta y se quita del mapa
        setSelectedId((id) => (id === pin.id ? null : id))
        setRetirados((l) => [...l, pin.id])
        setAviso({ tono: 'info', titulo: 'Esta tienda ya no está en el mapa', texto: 'Actualizamos el mapa.' })
      })
  }, [ubicacion])

  const handleHover = useCallback((pin: MapPinDto | null) => {
    setHoveredId(pin?.id ?? null)
  }, [])

  const handleBubbleSelect = useCallback((pin: MapPinDto) => {
    handleSelect(pin)
  }, [handleSelect])

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
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="categoria-mapa" className="sr-only">Categoría de tienda</label>
            <select
              id="categoria-mapa"
              aria-label="Filtrar por categoría"
              value={categoriaId}
              onChange={(e) => cambiarCategoria(e.target.value)}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold uppercase tracking-[.12em] text-[var(--color-text)]"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>

            {ubicacion ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <label htmlFor="radio-km" className="text-[var(--color-text)]">Radio de búsqueda: <b>{radio} km</b></label>
                <input id="radio-km" type="range" min={RADIO_KM.min} max={RADIO_KM.max} step={1} value={radio}
                  onChange={(e) => cambiarRadio(Number(e.target.value))} aria-describedby="radio-ayuda" className="w-40 accent-violeta" />
                <span id="radio-ayuda" className={radioError ? 'text-[var(--color-danger-text,#ff8a8a)]' : 'text-[var(--color-text-muted)]'} role={radioError ? 'alert' : undefined}>{radioError || TEXTO_RADIO}</span>
                <button type="button" onClick={quitarCercania} className={BTN_SECUNDARIO}>Ver todas</button>
              </div>
            ) : (
              <button type="button" onClick={() => (ubicacion ? buscar(ubicacion, radio) : setPideUbicacion(true))} className={BTN_PRINCIPAL}>Cerca de mí</button>
            )}
          </div>
        </div>

        {/* 400 · sin ubicación: se pide, sin error técnico */}
        {pideUbicacion && (
          <Aviso tono="info" className="mb-4" titulo="¿Dónde estás?" onCerrar={() => setPideUbicacion(false)}
            acciones={<>
              <button type="button" onClick={usarMiUbicacion} className={BTN_PRINCIPAL}>Usar mi ubicación</button>
              <label className="sr-only" htmlFor="barrio-mapa">Elegir localidad</label>
              <select id="barrio-mapa" defaultValue="" onChange={(e) => elegirBarrio(e.target.value)}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold uppercase tracking-[.12em] text-[var(--color-text)]">
                <option value="" disabled>Elegir localidad</option>
                {barrios.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </>}>
            <p>Comparte tu ubicación o elige una localidad para ver las tiendas cercanas.</p>
            {ubicacionError && <p className="mt-1 text-[var(--color-danger-text,#ff8a8a)]">{ubicacionError}</p>}
          </Aviso>
        )}

        {aviso && <Aviso tono={aviso.tono} className="mb-4" titulo={aviso.titulo} onCerrar={() => setAviso(null)}>{aviso.texto}</Aviso>}
        {cercanos && !enRadio.length && (
          <Aviso tono="info" className="mb-4" titulo={`No hay tiendas a menos de ${radio} km`}>
            {radio < RADIO_KM.max ? 'Amplía el radio de búsqueda o elige otro barrio.' : 'Elige otro barrio o mira todas las tiendas.'}
          </Aviso>
        )}

        {/* Hero principal: Mapa (~63%) + Carrusel de burbujas en arco (~37%) */}
        <div className="sr-map-hero sr-store-map">
          <div className="sr-map-hero-main">
            <MapaBogota
              pins={enRadio}
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
