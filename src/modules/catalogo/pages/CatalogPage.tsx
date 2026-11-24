import { useState, useMemo, useRef, useEffect, useCallback, useContext } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatCOP } from '@/modules/core/utils/format'
import { isStoreSuspended, STORE_SUB_CHANGED } from '@/modules/transacciones/services/storeSubscriptionService'
import { env } from '@/configs/env'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind, errorMessage } from '@/modules/core/api/errors'
import { Aviso, BTN_PRINCIPAL, BTN_SECUNDARIO, type TonoAviso } from '@/modules/core/components/Aviso'
import { ErrorBanner } from '@/modules/core/components/ErrorFeedback'
import { alertService, LIMITE_PLAN } from '@/modules/soporte/services/alertService'
import type { BusquedaGuardadaDto } from '@/modules/soporte/types/notification.dto'
import { ParaTiFeed, PARA_TI_SIZE } from '@/modules/identidad/components/ParaTiSections'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { feedService, motivoDe } from '@/modules/identidad/services/feedService'
import { usuarioService } from '@/modules/identidad/services/usuarioService'
import { TEXTOS_FEED, type FeedItemDto, type RecommendationsPageDto } from '@/modules/identidad/types/feed.dto'
import type { PerfilDto } from '@/modules/identidad/types/usuario.dto'
import { ItemCard } from '../components/ItemCard'
import { ItemGridSkeleton } from '../components/ItemCardSkeleton'
import { useItems } from '../hooks/useItems'
import { ITEMS } from '../mocks/items'
import {
  COLORES_UNIFICADOS,
  ESTILOS_UNIFICADOS,
  MARCAS_TIENDAS_UNIFICADAS,
  ORDENES_UNIFICADOS,
  TALLAS_POR_TIPO,
  TIPOS_PRENDA_UNIFICADOS,
  type ItemFiltersDto,
  type ItemResponseDto,
  type OrdenCatalogo,
  type TipoTalla,
} from '../types/item.dto'
import './CatalogPage.css'

// Tipos de prenda unificados (12)
const TIPOS_PRENDA = ['Todos', ...TIPOS_PRENDA_UNIFICADOS] as const

// Tallas disponibles agrupadas por tipo de talla (SR-RF-10)
const GRUPOS_TALLAS: { id: TipoTalla; label: string; tallas: readonly string[] }[] = [
  { id: 'ROPA', label: 'Ropa', tallas: TALLAS_POR_TIPO.ROPA },
  { id: 'PANTALON', label: 'Pantalón', tallas: TALLAS_POR_TIPO.PANTALON },
  { id: 'CALZADO', label: 'Calzado', tallas: TALLAS_POR_TIPO.CALZADO },
  { id: 'UNICA', label: 'Talla única', tallas: TALLAS_POR_TIPO.UNICA },
]

// Presets de precio (SR-RF-11)
const PRECIOS_PRESETS = [
  { label: 'Cualquier precio', min: undefined, max: undefined },
  { label: 'Hasta $100.000', min: undefined, max: 100000 },
  { label: '$100.000 a $250.000', min: 100000, max: 250000 },
  { label: '$250.000 a $400.000', min: 250000, max: 400000 },
  { label: 'Más de $400.000', min: 400000, max: undefined },
]

// Origen de prendas
const ORIGENES = [
  { id: 'Todos', label: 'Todos' },
  { id: 'tiendas', label: 'Tiendas del radar' },
  { id: 'segunda-mano', label: 'Segunda mano' },
]

// Coordenadas de referencia por zona de Bogotá para calcular lat/lng cuando no se comparte GPS
const ZONAS_BOGOTA_COORDS: Record<string, { lat: number; lng: number }> = {
  Chapinero: { lat: 4.6433, lng: -74.0628 },
  'Zona G': { lat: 4.6525, lng: -74.056 },
  Chicó: { lat: 4.6766, lng: -74.0504 },
  Usaquén: { lat: 4.6974, lng: -74.0305 },
  Teusaquillo: { lat: 4.6256, lng: -74.0722 },
  Suba: { lat: 4.7431, lng: -74.0886 },
  Kennedy: { lat: 4.62, lng: -74.1534 },
}

// Marcas o tiendas del radar (11 tiendas unificadas, SR-RF-12)
const MARCAS = ['Todas', ...MARCAS_TIENDAS_UNIFICADAS] as const

// Colores disponibles unificados (8 colores, SR-RF-09)
const COLORES = ['Todos', ...COLORES_UNIFICADOS] as const

const COLOR_SWATCH: Record<string, string> = {
  Negro: '#18181b',
  Blanco: '#ffffff',
  Gris: '#9ca3af',
  Azul: '#2563eb',
  Café: '#78350f',
  Beige: '#d6c3a5',
  Crudo: '#f3ead8',
  Plata: '#cbd5e1',
}

// Los cinco estilos unificados de StyleRadar (SR-RF-13)
const ESTILOS = ['Todos', ...ESTILOS_UNIFICADOS] as const

// Opciones de ordenamiento unificadas (SR-RF-14, SR-RF-15)
const OPCIONES_ORDEN = ORDENES_UNIFICADOS

function normOrdenParam(raw: string | null): OrdenCatalogo {
  const up = (raw ?? '').toUpperCase().trim()
  if (up === 'DISTANCIA' || up === 'CERCA' || up === 'CERCANIA') return 'DISTANCIA'
  if (up === 'REPUTACION' || up === 'REP') return 'REPUTACION'
  return 'RECIENTES'
}

/** Aviso al guardar la búsqueda: qué pasó y qué botón lo resuelve. */
interface AvisoBusqueda { tono: TonoAviso; titulo: string; texto: string; accion?: 'reintentar' | 'planes' | 'login' | 'ver' }

/** Texto seguro para un error al guardar la búsqueda o activar su alerta. */
function avisoDeError(e: unknown): AvisoBusqueda {
  const status = e instanceof ApiError ? e.status : 0
  if (status === 422 && e instanceof ApiError && e.code === LIMITE_PLAN) {
    return { tono: 'alerta', titulo: 'Guardamos tu búsqueda, pero sin alerta', texto: 'Con el plan Radar puedes tener hasta 3 alertas activas. Con Radar+ no hay límite.', accion: 'planes' }
  }
  // ms-notificaciones todavía no recibe la búsqueda recién creada en ms-usuarios
  if (status === 422) return { tono: 'alerta', titulo: 'Tu búsqueda todavía se está guardando', texto: 'Intenta crear la alerta en unos segundos.', accion: 'reintentar' }
  if (status === 409) return { tono: 'info', titulo: 'Ya tienes una alerta para esto', texto: 'La encuentras en «Mis búsquedas y alertas».', accion: 'ver' }
  const kind = errorKind(e)
  if (kind === 'sesion') return { tono: 'info', titulo: 'Inicia sesión para guardar tus búsquedas', texto: 'Así te avisamos cuando llegue lo que buscas.', accion: 'login' }
  if (kind === 'sin-conexion') return { tono: 'error', titulo: 'Se perdió la conexión', texto: 'Revisa tu internet e intenta de nuevo.', accion: 'reintentar' }
  return { tono: 'error', titulo: 'No pudimos guardar la búsqueda', texto: 'Intenta en unos minutos.', accion: 'reintentar' }
}

export default function CatalogPage() {
  const [params, setParams] = useSearchParams()

  // Estados de búsqueda y orden
  const [texto, setTexto] = useState(params.get('q') ?? '')
  const [orden, setOrden] = useState<OrdenCatalogo>(() => normOrdenParam(params.get('orden')))

  // Menús desplegables
  const [menuFiltrosAbierto, setMenuFiltrosAbierto] = useState(false)
  const [menuOrdenAbierto, setMenuOrdenAbierto] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const ordenRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const hoverOpenedCatRef = useRef<CategoriaId | null>(null)

  type CategoriaId = 'tipo' | 'talla' | 'precio' | 'origen' | 'marca' | 'color' | 'estilo'

  // Categoría activa en la barra horizontal de filtros
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaId>('tipo')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimerRef.current = window.setTimeout(() => {
      setMenuFiltrosAbierto(false)
      hoverOpenedCatRef.current = null
      closeTimerRef.current = null
    }, 180)
  }, [cancelClose])

  useEffect(() => () => cancelClose(), [cancelClose])

  const openCategory = useCallback(
    (id: CategoriaId, viaHover = false) => {
      cancelClose()
      setMenuOrdenAbierto(false)
      setMostrarSugerencias(false)
      setCategoriaActiva(id)
      setMenuFiltrosAbierto(true)
      hoverOpenedCatRef.current = viaHover ? id : null
    },
    [cancelClose]
  )

  // Filtros del catálogo
  const [filtroTipo, setFiltroTipo] = useState<string>(params.get('tipo') ?? 'Todos')
  const [filtroTalla, setFiltroTalla] = useState<string>(params.get('talla') ?? 'Todas')
  const [filtroTipoTalla, setFiltroTipoTalla] = useState<TipoTalla | null>(() => {
    const t = params.get('talla')
    return t ? (GRUPOS_TALLAS.find((g) => g.tallas.includes(t))?.id ?? null) : null
  })
  const [filtroPrecio, setFiltroPrecio] = useState<number>(0)
  const [filtroOrigen, setFiltroOrigen] = useState<string>(params.get('origen') ?? 'Todos')
  const [filtroMarca, setFiltroMarca] = useState<string>(params.get('marca') ?? 'Todas')
  const [filtroColor, setFiltroColor] = useState<string>(params.get('color') ?? 'Todos')
  const [filtroEstilo, setFiltroEstilo] = useState<string>(params.get('estilo') ?? 'Todos')

  const CATEGORIAS_CONFIG: { id: CategoriaId; label: string; panelTitle: string; count: number }[] = useMemo(() => [
    { id: 'tipo', label: 'Tipo de prenda', panelTitle: 'Tipo de prenda', count: filtroTipo !== 'Todos' ? 1 : 0 },
    { id: 'talla', label: 'Talla', panelTitle: 'Talla disponible', count: filtroTalla !== 'Todas' ? 1 : 0 },
    { id: 'precio', label: 'Precio', panelTitle: 'Rango de precio', count: filtroPrecio !== 0 ? 1 : 0 },
    { id: 'origen', label: 'Origen', panelTitle: 'Origen', count: filtroOrigen !== 'Todos' ? 1 : 0 },
    { id: 'marca', label: 'Marca', panelTitle: 'Marca', count: filtroMarca !== 'Todas' ? 1 : 0 },
    { id: 'color', label: 'Color', panelTitle: 'Color', count: filtroColor !== 'Todos' ? 1 : 0 },
    { id: 'estilo', label: 'Estilo', panelTitle: 'Estilo', count: filtroEstilo !== 'Todos' ? 1 : 0 },
  ], [filtroTipo, filtroTalla, filtroPrecio, filtroOrigen, filtroMarca, filtroColor, filtroEstilo])

  // Guardar búsqueda y su alerta (RF-28 y RF-30)
  const [busqueda, setBusqueda] = useState<BusquedaGuardadaDto | null>(null)
  const [avisoBusqueda, setAvisoBusqueda] = useState<AvisoBusqueda | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Ordenar por cercanía (DISTANCIA) necesita lat y lng (400 del catálogo si no hay ubicación)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [pideUbicacion, setPideUbicacion] = useState(false)
  const [mostrarZonasUbicacion, setMostrarZonasUbicacion] = useState(false)
  const [ubicacionError, setUbicacionError] = useState('')

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuFiltrosAbierto &&
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        cancelClose()
        setMenuFiltrosAbierto(false)
        hoverOpenedCatRef.current = null
      }
      if (ordenRef.current && !ordenRef.current.contains(event.target as Node)) {
        setMenuOrdenAbierto(false)
      }
    }
    if (menuFiltrosAbierto || menuOrdenAbierto) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuFiltrosAbierto, menuOrdenAbierto, cancelClose])

  // Cerrar con Escape y devolver foco al tab activo
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && menuFiltrosAbierto) {
        event.preventDefault()
        cancelClose()
        setMenuFiltrosAbierto(false)
        hoverOpenedCatRef.current = null
        const activeIdx = CATEGORIAS_CONFIG.findIndex((c) => c.id === categoriaActiva)
        tabRefs.current[activeIdx >= 0 ? activeIdx : 0]?.focus()
      }
    }
    if (menuFiltrosAbierto) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuFiltrosAbierto, cancelClose, categoriaActiva, CATEGORIAS_CONFIG])

  const handleCerrarFiltros = () => {
    cancelClose()
    setMenuFiltrosAbierto(false)
    hoverOpenedCatRef.current = null
  }

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const total = CATEGORIAS_CONFIG.length
    let nextIndex = index

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIndex = (index + 1) % total
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIndex = (index - 1 + total) % total
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = total - 1
    } else {
      return
    }

    const nextCat = CATEGORIAS_CONFIG[nextIndex]
    openCategory(nextCat.id, false)
    tabRefs.current[nextIndex]?.focus()
  }

  // Contador de filtros activos (excluyendo defaults)
  const filtrosActivosCount = useMemo(() => {
    let count = 0
    if (filtroTipo !== 'Todos') count++
    if (filtroTalla !== 'Todas') count++
    if (filtroPrecio !== 0) count++
    if (filtroOrigen !== 'Todos') count++
    if (filtroMarca !== 'Todas') count++
    if (filtroColor !== 'Todos') count++
    if (filtroEstilo !== 'Todos') count++
    return count
  }, [filtroTipo, filtroTalla, filtroPrecio, filtroOrigen, filtroMarca, filtroColor, filtroEstilo])

  // Filtros combinados para el hook
  const activeFilters = useMemo<ItemFiltersDto>(() => {
    const selectedPreset = PRECIOS_PRESETS[filtroPrecio]
    return {
      texto: texto.trim() || undefined,
      tipo: filtroTipo !== 'Todos' ? filtroTipo : undefined,
      talla: filtroTalla !== 'Todas' ? filtroTalla : undefined,
      tipoTalla: filtroTalla !== 'Todas' ? (filtroTipoTalla ?? undefined) : undefined,
      precioMin: selectedPreset?.min,
      precioMax: selectedPreset?.max,
      origen: filtroOrigen !== 'Todos' ? filtroOrigen : undefined,
      marca: filtroMarca !== 'Todas' ? filtroMarca : undefined,
      color: filtroColor !== 'Todos' ? filtroColor : undefined,
      estilo: filtroEstilo !== 'Todos' ? filtroEstilo : undefined,
      lat: orden === 'DISTANCIA' ? coords?.lat : undefined,
      lng: orden === 'DISTANCIA' ? coords?.lng : undefined,
      orden,
    }
  }, [texto, filtroTipo, filtroTalla, filtroTipoTalla, filtroPrecio, filtroOrigen, filtroMarca, filtroColor, filtroEstilo, coords, orden])

  const user = useContext(AuthContext)?.user
  const isBuyer = user?.role === 'BUYER'
  const [vistaCatalogo, setVistaCatalogo] = useState<'todas' | 'para-ti'>('todas')

  const { items, loading, error, status, code: itemsErrorCode } = useItems(activeFilters)
  const [storeSubTick, setStoreSubTick] = useState(0)

  useEffect(() => {
    const onSubChanged = () => setStoreSubTick((v) => v + 1)
    window.addEventListener(STORE_SUB_CHANGED, onSubChanged)
    return () => window.removeEventListener(STORE_SUB_CHANGED, onSubChanged)
  }, [])

  const sinUbicacion = coords === null
  const mostrarPideUbicacion =
    sinUbicacion && (pideUbicacion || (orden === 'DISTANCIA' && (status === 400 || itemsErrorCode === 'UBICACION_REQUERIDA')))

  // Deduplicación garantizada por ID e imagen al construir la lista de la grilla (queda el primero)
  // RF-99: oculta prendas de tiendas con suscripción SUSPENDIDA y actualiza conteos
  const uniqueItems = useMemo(() => {
    void storeSubTick
    const map = new Map<string, ItemResponseDto>()
    const imageToId = new Map<string, string>()
    for (const it of items) {
      if (isStoreSuspended(it.tienda)) continue
      if (it.imagen && imageToId.has(it.imagen)) {
        const originalId = imageToId.get(it.imagen)
        if (import.meta.env.DEV) {
          console.warn(
            `[StyleRadar Catálogo] Prenda excluida de la grilla por imagen duplicada: ID "${it.id}" ("${it.nombre}") comparte imagen con ID "${originalId}" ("${it.imagen}").`
          )
        }
        continue
      }
      if (!map.has(it.id)) {
        map.set(it.id, it)
        if (it.imagen) {
          imageToId.set(it.imagen, it.id)
        }
      }
    }
    return Array.from(map.values())
  }, [items, storeSubTick])

  // Historial de búsquedas recientes y sugerencias predictivas (Fase 3: M6)
  const [busquedasRecientes, setBusquedasRecientes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sr_recent_searches')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setMostrarSugerencias(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const guardarBusquedaReciente = (query: string) => {
    const q = query.trim()
    if (!q) return
    setBusquedasRecientes((prev) => {
      const filtradas = [q, ...prev.filter((b) => b.toLowerCase() !== q.toLowerCase())].slice(0, 5)
      try {
        localStorage.setItem('sr_recent_searches', JSON.stringify(filtradas))
      } catch {
        // safe fallback
      }
      return filtradas
    })
  }

  const limpiarBusquedasRecientes = () => {
    setBusquedasRecientes([])
    try {
      localStorage.removeItem('sr_recent_searches')
    } catch {
      // safe fallback
    }
  }

  const aplicarBusquedaRapida = (termino: string) => {
    setTexto(termino)
    guardarBusquedaReciente(termino)
    setMostrarSugerencias(false)
    const next = new URLSearchParams(params)
    next.set('q', termino)
    setParams(next)
  }

  // Manejo de búsqueda
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMostrarSugerencias(false)
    const q = texto.trim()
    if (q) guardarBusquedaReciente(q)
    const next = new URLSearchParams(params)
    if (q) next.set('q', q); else next.delete('q')
    setParams(next)
  }

  const handleCambiarOrden = (nuevoOrden: OrdenCatalogo) => {
    // Sin ubicación (lat/lng) no hay desde dónde medir: se pide antes de ordenar por DISTANCIA (400 en back)
    if (nuevoOrden === 'DISTANCIA' && sinUbicacion) {
      setPideUbicacion(true)
      setMostrarZonasUbicacion(false)
      setUbicacionError('')
      return
    }
    setPideUbicacion(false)
    setMostrarZonasUbicacion(false)
    setOrden(nuevoOrden)
    const next = new URLSearchParams(params)
    if (nuevoOrden && nuevoOrden !== 'RECIENTES') next.set('orden', nuevoOrden); else next.delete('orden')
    setParams(next)
  }

  const activarDistanciaConCoords = (nextCoords: { lat: number; lng: number }) => {
    setCoords(nextCoords)
    setPideUbicacion(false)
    setMostrarZonasUbicacion(false)
    setOrden('DISTANCIA')
    const next = new URLSearchParams(params)
    next.set('orden', 'DISTANCIA')
    setParams(next)
  }

  const usarMiUbicacion = () => {
    setUbicacionError('')
    if (!('geolocation' in navigator)) {
      setUbicacionError('Tu navegador no comparte la ubicación. Elige tu zona.')
      setMostrarZonasUbicacion(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => activarDistanciaConCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setUbicacionError('No pudimos usar tu ubicación. Elige una zona de Bogotá.')
        setMostrarZonasUbicacion(true)
      },
      { timeout: 10000, maximumAge: 300000 },
    )
  }

  // Guardar búsqueda y activar su alerta
  const activarAlerta = async (b: BusquedaGuardadaDto) => {
    try {
      const actual = b.alerta ? b : await alertService.setSearchAlert(b.id, true)
      setBusqueda(actual)
      setAvisoBusqueda({ tono: 'exito', titulo: `Guardamos «${actual.nombre}»`, texto: 'Te avisaremos cuando llegue una prenda que coincida.', accion: 'ver' })
    } catch (e) {
      setAvisoBusqueda(avisoDeError(e))
    }
  }

  const guardar = async () => {
    const nombre = texto.trim() || 'Catálogo completo'
    try {
      const b = busqueda?.nombre === nombre ? busqueda : await alertService.saveSearch(nombre, `${filtrosActivosCount} filtros · orden ${orden}`)
      setBusqueda(b)
      await activarAlerta(b)
    } catch (e) {
      setAvisoBusqueda(avisoDeError(e))
    }
  }

  const handleGuardarBusqueda = async () => {
    if (guardando) return
    setGuardando(true); setAvisoBusqueda(null)
    try { await guardar() } finally { setGuardando(false) }
  }

  // Limpiar todos los filtros
  const handleResetFiltros = () => {
    setFiltroTipo('Todos')
    setFiltroTalla('Todas')
    setFiltroTipoTalla(null)
    setFiltroPrecio(0)
    setFiltroOrigen('Todos')
    setFiltroMarca('Todas')
    setFiltroColor('Todos')
    setFiltroEstilo('Todos')
    setTexto('')
    setParams(new URLSearchParams())
  }

  // Quitar solo el filtro de la categoría actualmente desplegada
  const handleLimpiarCategoriaActual = () => {
    switch (categoriaActiva) {
      case 'tipo':
        setFiltroTipo('Todos')
        break
      case 'talla':
        setFiltroTalla('Todas')
        setFiltroTipoTalla(null)
        break
      case 'precio':
        setFiltroPrecio(0)
        break
      case 'origen':
        setFiltroOrigen('Todos')
        break
      case 'marca':
        setFiltroMarca('Todas')
        break
      case 'color':
        setFiltroColor('Todos')
        break
      case 'estilo':
        setFiltroEstilo('Todos')
        break
    }
  }

  const hayAlgunFiltro = filtrosActivosCount > 0 || texto.trim().length > 0
  const mostrarPerchero = isBuyer && !hayAlgunFiltro
  const vistaActiva = isBuyer && !hayAlgunFiltro ? vistaCatalogo : 'todas'

  const opcionOrdenActual = OPCIONES_ORDEN.find((op) => op.id === orden)

  const renderOpcionesCategoria = () => {
    switch (categoriaActiva) {
      case 'tipo':
        return (
          <div className="sr-filter-chips-grid">
            {TIPOS_PRENDA.filter((t) => t !== 'Todos').map((t) => {
              const isSelected = filtroTipo === t
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setFiltroTipo(isSelected ? 'Todos' : t)}
                  className={`sr-filter-chip ${isSelected ? 'sr-filter-chip--selected' : ''}`}
                >
                  <span>{t}</span>
                </button>
              )
            })}
          </div>
        )
      case 'talla':
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GRUPOS_TALLAS.map((grupo) => (
              <div key={grupo.id}>
                <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {grupo.label}
                </p>
                <div className="sr-filter-chips-grid">
                  {grupo.tallas.map((sz) => {
                    const isSelected =
                      filtroTalla === sz &&
                      (filtroTipoTalla
                        ? filtroTipoTalla === grupo.id
                        : GRUPOS_TALLAS.find((g) => g.tallas.includes(sz))?.id === grupo.id)
                    return (
                      <button
                        key={`${grupo.id}-${sz}`}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          if (isSelected) {
                            setFiltroTalla('Todas')
                            setFiltroTipoTalla(null)
                          } else {
                            setFiltroTalla(sz)
                            setFiltroTipoTalla(grupo.id)
                          }
                        }}
                        className={`sr-filter-chip ${isSelected ? 'sr-filter-chip--selected' : ''}`}
                      >
                        <span>{sz}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      case 'precio':
        return (
          <div className="space-y-3">
            <div className="max-w-md px-1">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-[0.6875rem] font-semibold text-[var(--color-text-muted)]">Rango</span>
                <span className="text-[0.75rem] font-bold text-[var(--sr-acento-primario,var(--color-accent))]">
                  {PRECIOS_PRESETS[filtroPrecio]?.label ?? 'Cualquier precio'}
                </span>
              </div>
              <div className="sr-filter-range-track" aria-hidden="true">
                <div
                  className="sr-filter-range-bar"
                  style={{
                    left: filtroPrecio === 0 ? '0%' : filtroPrecio === 1 ? '0%' : filtroPrecio === 2 ? '25%' : filtroPrecio === 3 ? '58%' : '78%',
                    right: filtroPrecio === 0 ? '0%' : filtroPrecio === 1 ? '75%' : filtroPrecio === 2 ? '42%' : filtroPrecio === 3 ? '18%' : '0%',
                  }}
                />
                <div
                  className="sr-filter-range-thumb"
                  style={{
                    left: filtroPrecio === 0 ? '0%' : filtroPrecio === 1 ? '0%' : filtroPrecio === 2 ? '25%' : filtroPrecio === 3 ? '58%' : '78%',
                  }}
                />
                <div
                  className="sr-filter-range-thumb"
                  style={{
                    left: filtroPrecio === 0 ? '100%' : filtroPrecio === 1 ? '25%' : filtroPrecio === 2 ? '58%' : filtroPrecio === 3 ? '82%' : '100%',
                  }}
                />
              </div>
            </div>
            <div className="sr-filter-chips-grid">
              {PRECIOS_PRESETS.map((preset, idx) => {
                if (idx === 0) return null
                const isSelected = filtroPrecio === idx
                return (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setFiltroPrecio(isSelected ? 0 : idx)}
                    className={`sr-filter-chip ${isSelected ? 'sr-filter-chip--selected' : ''}`}
                  >
                    <span>{preset.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      case 'origen':
        return (
          <div className="sr-filter-chips-grid">
            {ORIGENES.filter((orig) => orig.id !== 'Todos').map((orig) => {
              const isSelected = filtroOrigen === orig.id
              return (
                <button
                  key={orig.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setFiltroOrigen(isSelected ? 'Todos' : orig.id)}
                  className={`sr-filter-chip ${isSelected ? 'sr-filter-chip--selected' : ''}`}
                >
                  <span>{orig.label}</span>
                </button>
              )
            })}
          </div>
        )
      case 'marca':
        return (
          <div className="sr-filter-chips-grid">
            {MARCAS.filter((m) => m !== 'Todas' && !isStoreSuspended(m)).map((m) => {
              const isSelected = filtroMarca === m
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setFiltroMarca(isSelected ? 'Todas' : m)}
                  className={`sr-filter-chip ${isSelected ? 'sr-filter-chip--selected' : ''}`}
                >
                  <span>{m}</span>
                </button>
              )
            })}
          </div>
        )
      case 'color':
        return (
          <div className="sr-filter-chips-grid">
            {COLORES.filter((c) => c !== 'Todos').map((c) => {
              const isSelected = filtroColor === c
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setFiltroColor(isSelected ? 'Todos' : c)}
                  className={`sr-filter-chip ${isSelected ? 'sr-filter-chip--selected' : ''}`}
                >
                  <span
                    className="sr-filter-color-swatch"
                    style={{ backgroundColor: COLOR_SWATCH[c] ?? '#9ca3af' }}
                    aria-hidden="true"
                  />
                  <span>{c}</span>
                </button>
              )
            })}
          </div>
        )
      case 'estilo':
        return (
          <div className="sr-filter-chips-grid">
            {ESTILOS.filter((st) => st !== 'Todos').map((st) => {
              const isSelected = filtroEstilo === st
              return (
                <button
                  key={st}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setFiltroEstilo(isSelected ? 'Todos' : st)}
                  className={`sr-filter-chip ${isSelected ? 'sr-filter-chip--selected' : ''}`}
                >
                  <span>{st}</span>
                </button>
              )
            })}
          </div>
        )
    }
  }

  return (
    <div className="sr-catalog-page min-h-screen px-4 py-8 sm:px-8 selection:bg-[var(--color-accent)] selection:text-[var(--color-text-on-accent)]">
      <section className="mx-auto max-w-6xl">
        {/* Migas de pan */}
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Link to="/" className="hover:text-[var(--color-text)]">← Volver</Link>
          <span>·</span>
          <span>Inicio</span>
          <span>/</span>
          <span className="text-[var(--color-text)]">Catálogo</span>
        </div>

        {/* Encabezado del catálogo */}
        <div className="mb-6">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[.2em] text-[var(--color-text-muted)]">
            Catálogo
          </span>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--color-text)] md:text-5xl">
            Todas las prendas
          </h1>
        </div>

        {/* Barra de búsqueda interactiva con historial y sugerencias predictivas */}
        <div ref={searchContainerRef} className="relative mb-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={texto}
                onFocus={() => setMostrarSugerencias(true)}
                onChange={(e) => {
                  setTexto(e.target.value)
                  setMostrarSugerencias(true)
                }}
                placeholder="Busca «camisa blanca manga larga talla M», «blazer», «cuero»…"
                aria-label="Buscar prendas"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3.5 pl-11 pr-10 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none backdrop-blur-xl focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              />
              {texto && (
                <button
                  type="button"
                  onClick={() => setTexto('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                  aria-label="Borrar texto"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-[var(--color-accent)] px-7 text-sm font-bold text-[var(--color-text-on-accent)] shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              Buscar
            </button>
          </form>

          {/* Menú de sugerencias e historial de búsquedas recientes */}
          {mostrarSugerencias && (
            <div
              className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl backdrop-blur-2xl text-[var(--color-text)] animate-in fade-in zoom-in-95 duration-150"
              role="region"
              aria-label="Sugerencias de búsqueda"
            >
              {/* Búsquedas recientes si existen */}
              {busquedasRecientes.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Búsquedas recientes
                    </span>
                    <button
                      type="button"
                      onClick={limpiarBusquedasRecientes}
                      className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-rose-500 transition"
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {busquedasRecientes.map((reciente) => (
                      <button
                        key={reciente}
                        type="button"
                        onClick={() => aplicarBusquedaRapida(reciente)}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition flex items-center gap-1.5"
                      >
                        <span>{reciente}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tendencias en Bogotá */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  Tendencias en tiendas de Bogotá
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Blazer oversize', 'Chaqueta de nylon', 'Hoodie', 'Jean ancho', 'Segunda mano', 'Urbano'].map((trend) => (
                    <button
                      key={trend}
                      type="button"
                      onClick={() => aplicarBusquedaRapida(trend)}
                      className="rounded-xl bg-[var(--color-surface-raised)]/60 px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-accent)] hover:text-[var(--color-text-on-accent)] transition"
                    >
                      {trend}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BARRA HORIZONTAL DE FILTROS CON DESPLIEGUE AL PASAR EL CURSOR + ACCIONES DERECHA */}
        <div ref={toolbarRef} className="sr-filter-toolbar relative z-30 mb-6">
          <div className="sr-filter-toolbar-row">
            {/* IZQUIERDA: "Filtros" o "× Limpiar (N)" + divisor */}
            <div className="flex shrink-0 items-center gap-3">
              {filtrosActivosCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    handleResetFiltros()
                    handleCerrarFiltros()
                  }}
                  className="sr-filter-clear-pill"
                  aria-label="Limpiar todos los filtros"
                >
                  <span aria-hidden="true">×</span>
                  <span>Limpiar ({filtrosActivosCount})</span>
                </button>
              ) : (
                <span className="sr-filter-lead">
                  <svg className="h-4 w-4 text-[var(--sr-acento-primario,var(--color-accent))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  <span>Filtros</span>
                </span>
              )}
              <span className="sr-filter-bar-divider" aria-hidden="true" />
            </div>

            {/* CENTRO: Categorías horizontales (se despliegan al pasar el cursor o tocar) */}
            <div
              role="tablist"
              aria-orientation="horizontal"
              aria-label="Categorías de filtro"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              className="sr-filter-bar-tabs"
            >
              {CATEGORIAS_CONFIG.map((cat, index) => {
                const isOpen = menuFiltrosAbierto && categoriaActiva === cat.id
                return (
                  <button
                    key={cat.id}
                    ref={(el) => {
                      tabRefs.current[index] = el
                    }}
                    id={`filter-tab-${cat.id}`}
                    role="tab"
                    type="button"
                    aria-selected={isOpen}
                    aria-expanded={isOpen}
                    aria-controls="catalogo-panel-filtros"
                    onMouseEnter={() => openCategory(cat.id, true)}
                    onFocus={() => cancelClose()}
                    onClick={() => {
                      if (menuFiltrosAbierto && categoriaActiva === cat.id && hoverOpenedCatRef.current !== cat.id) {
                        handleCerrarFiltros()
                      } else {
                        openCategory(cat.id, false)
                      }
                    }}
                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                    className={`sr-filter-bar-tab ${isOpen ? 'sr-filter-bar-tab--open' : ''}`}
                  >
                    <span>{cat.label}</span>
                    {cat.count > 0 && (
                      <span
                        className="sr-filter-active-dot"
                        role="status"
                        aria-label={`Filtro activo en ${cat.label}`}
                      />
                    )}
                    <svg
                      className={`h-3 w-3 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : 'opacity-70'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )
              })}
            </div>

            {/* DERECHA: Guardar búsqueda + Ordenar */}
            <div className="flex shrink-0 items-center gap-2.5">
              <button
                type="button"
                onClick={handleGuardarBusqueda}
                disabled={guardando}
                className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:opacity-60"
                title="Guardar esta búsqueda en tu perfil para recibir avisos"
              >
                <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>{guardando ? 'Guardando…' : 'Guardar búsqueda'}</span>
              </button>

              <div className="relative shrink-0" ref={ordenRef}>
                <button
                  type="button"
                  onClick={() => {
                    handleCerrarFiltros()
                    setMenuOrdenAbierto((prev) => !prev)
                  }}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                    menuOrdenAbierto
                      ? 'border-[var(--color-accent)] bg-[var(--color-surface-raised)] text-[var(--color-text)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]'
                  }`}
                  aria-expanded={menuOrdenAbierto}
                  aria-label="Ordenar resultados"
                >
                  <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Ordenar:
                  </span>
                  <span className="text-[var(--color-text)] text-xs">
                    {opcionOrdenActual?.label ?? 'Más recientes'}
                  </span>
                  <svg
                    className={`h-3 w-3 shrink-0 text-[var(--color-text-muted)] transition-transform ${menuOrdenAbierto ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {menuOrdenAbierto && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1.5 shadow-2xl backdrop-blur-2xl z-40 animate-in fade-in zoom-in-95 duration-100 text-[var(--color-text)]">
                    {OPCIONES_ORDEN.map((op) => {
                      const isSelected = orden === op.id
                      return (
                        <button
                          key={op.id}
                          type="button"
                          onClick={() => {
                            handleCambiarOrden(op.id)
                            setMenuOrdenAbierto(false)
                          }}
                          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                            isSelected
                              ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)] font-bold'
                              : 'text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]'
                          }`}
                        >
                          <span>{op.label}</span>
                          {isSelected && (
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PANEL DESPLEGABLE COMPLETO CON PUENTE INVISIBLE DE HOVER */}
          {menuFiltrosAbierto && (
            <div
              className="sr-filter-mega-wrap"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              <div
                id="catalogo-panel-filtros"
                role="tabpanel"
                aria-labelledby={`filter-tab-${categoriaActiva}`}
                className="sr-filter-mega-card"
              >
                <div key={categoriaActiva} className="sr-filter-tabpanel-content">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="sr-filter-mega-title">
                      {CATEGORIAS_CONFIG.find((c) => c.id === categoriaActiva)?.panelTitle}
                    </h3>
                    <button
                      type="button"
                      onClick={handleCerrarFiltros}
                      className="rounded-lg p-1 text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))]"
                      aria-label="Cerrar filtros"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  {renderOpcionesCategoria()}
                </div>

                <div className="sr-filter-mega-footer">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {filtrosActivosCount === 0
                      ? 'Sin filtros aplicados'
                      : filtrosActivosCount === 1
                        ? '1 filtro aplicado'
                        : `${filtrosActivosCount} filtros aplicados`}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleLimpiarCategoriaActual}
                      disabled={(CATEGORIAS_CONFIG.find((c) => c.id === categoriaActiva)?.count ?? 0) === 0}
                      className="sr-filter-btn-secondary disabled:opacity-45 disabled:pointer-events-none"
                    >
                      Quitar este filtro
                    </button>
                    <button
                      type="button"
                      onClick={handleCerrarFiltros}
                      className="sr-filter-btn-primary"
                    >
                      Aplicar filtros
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CHIPS DE FILTROS ACTIVOS (para remover rápido) */}
        {filtrosActivosCount > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[0.6875rem] text-[var(--color-text-muted)]">Filtros aplicados:</span>
            {filtroTipo !== 'Todos' && (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-semibold text-[var(--color-text)]">
                Tipo: {filtroTipo}
                <button type="button" onClick={() => setFiltroTipo('Todos')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-full" aria-label="Quitar filtro de tipo">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroTalla !== 'Todas' && (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-semibold text-[var(--color-text)]">
                Talla: {filtroTalla}{filtroTipoTalla ? ` (${GRUPOS_TALLAS.find((g) => g.id === filtroTipoTalla)?.label ?? ''})` : ''}
                <button type="button" onClick={() => { setFiltroTalla('Todas'); setFiltroTipoTalla(null) }} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-full" aria-label="Quitar filtro de talla">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroPrecio !== 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-semibold text-[var(--color-text)]">
                {PRECIOS_PRESETS[filtroPrecio].label}
                <button type="button" onClick={() => setFiltroPrecio(0)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-full" aria-label="Quitar filtro de precio">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroOrigen !== 'Todos' && (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-semibold text-[var(--color-text)]">
                {ORIGENES.find((o) => o.id === filtroOrigen)?.label}
                <button type="button" onClick={() => setFiltroOrigen('Todos')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-full" aria-label="Quitar filtro de origen">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroMarca !== 'Todas' && (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-semibold text-[var(--color-text)]">
                Marca: {filtroMarca}
                <button type="button" onClick={() => setFiltroMarca('Todas')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-full" aria-label="Quitar filtro de marca">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroColor !== 'Todos' && (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-semibold text-[var(--color-text)]">
                Color: {filtroColor}
                <button type="button" onClick={() => setFiltroColor('Todos')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-full" aria-label="Quitar filtro de color">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroEstilo !== 'Todos' && (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-semibold text-[var(--color-text)]">
                Estilo: {filtroEstilo}
                <button type="button" onClick={() => setFiltroEstilo('Todos')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-full" aria-label="Quitar filtro de estilo">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFiltros}
              className="text-xs text-[var(--color-danger-text,#ef4444)] hover:underline font-semibold ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* 400 · ordenar por cercanía sin ubicación: se pide lat/lng antes, sin error técnico */}
        {mostrarPideUbicacion && (
          <Aviso tono="info" className="mb-6" titulo="Activa tu ubicación para ordenar por cercanía" onCerrar={() => setPideUbicacion(false)}
            acciones={<>
              <button type="button" onClick={usarMiUbicacion} className={BTN_PRINCIPAL}>Usar mi ubicación</button>
              <button type="button" onClick={() => setMostrarZonasUbicacion((prev) => !prev)} className={BTN_SECUNDARIO}>Elegir barrio</button>
            </>}>
            <p>Comparte tu ubicación GPS o selecciona una zona de referencia en Bogotá.</p>
            {mostrarZonasUbicacion && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(ZONAS_BOGOTA_COORDS).map(([zona, c]) => (
                  <button
                    key={zona}
                    type="button"
                    onClick={() => activarDistanciaConCoords(c)}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-accent)]"
                  >
                    {zona}
                  </button>
                ))}
              </div>
            )}
            {ubicacionError && <p className="mt-1 text-[var(--color-danger-text,#ffb4b4)]">{ubicacionError}</p>}
          </Aviso>
        )}

        {/* Guardar búsqueda: éxito, 409, 422 (aún se guarda o límite del plan) y fallas del servicio */}
        {avisoBusqueda && (
          <Aviso tono={avisoBusqueda.tono} className="mb-6" titulo={avisoBusqueda.titulo} onCerrar={() => setAvisoBusqueda(null)}
            acciones={avisoBusqueda.accion === 'reintentar' ? <button type="button" disabled={guardando} onClick={handleGuardarBusqueda} className={BTN_PRINCIPAL}>Reintentar</button>
              : avisoBusqueda.accion === 'planes' ? <Link to="/planes" className={BTN_PRINCIPAL}>Ver Radar+</Link>
              : avisoBusqueda.accion === 'login' ? <Link to="/login" className={BTN_PRINCIPAL}>Iniciar sesión</Link>
              : avisoBusqueda.accion === 'ver' ? <Link to="/alertas" className={BTN_SECUNDARIO}>Ver mis búsquedas</Link> : undefined}>
            {avisoBusqueda.texto}
          </Aviso>
        )}

        {/* BLOQUE 1 · PERCHERO DE RECOMENDADOS PARA TI (SR-RF-06) — se pliega suavemente al filtrar */}
        <div
          className={`sr-rack-collapse ${mostrarPerchero ? '' : 'sr-rack-collapse--hidden'}`}
          aria-hidden={!mostrarPerchero}
        >
          <div className="sr-rack-collapse__inner">
            {isBuyer && <RecommendedHangingRack key={user.id} userId={String(user.id)} />}
          </div>
        </div>

        {/* BLOQUE 2 · CATÁLOGO COMPLETO (SR-RF-07 a 15) Y «PARA TI» (SR-RF-05) */}
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
            {isBuyer && !hayAlgunFiltro ? (
              <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Vistas del catálogo">
                <button
                  type="button"
                  role="tab"
                  aria-selected={vistaActiva === 'todas'}
                  onClick={() => setVistaCatalogo('todas')}
                  className={`rounded-xl px-3.5 py-1.5 text-sm font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                    vistaActiva === 'todas'
                      ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Todas las prendas ({uniqueItems.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={vistaActiva === 'para-ti'}
                  onClick={() => setVistaCatalogo('para-ti')}
                  className={`rounded-xl px-3.5 py-1.5 text-sm font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                    vistaActiva === 'para-ti'
                      ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Para ti
                </button>
              </div>
            ) : (
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
                Prendas encontradas ({uniqueItems.length})
              </h2>
            )}
            {vistaActiva === 'todas' && (
              <span className="text-xs text-[var(--color-text-muted)] font-mono">
                {orden === 'DISTANCIA' ? 'Ordenado por cercanía' : `Orden: ${opcionOrdenActual?.label ?? 'Más recientes'}`}
              </span>
            )}
          </div>

          {vistaActiva === 'para-ti' && isBuyer ? (
            <ParaTiFeed key={user.id} userId={String(user.id)} showHeader={false} />
          ) : (
            <>
              {error && !mostrarPideUbicacion && (
                <div role="alert" className="my-8 rounded-xl border border-[var(--color-danger-border,rgba(239,68,68,0.3))] bg-[var(--color-danger-bg,rgba(239,68,68,0.1))] p-4 text-sm text-[var(--color-danger-text,#ef4444)] flex items-center gap-2">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <ItemGridSkeleton count={8} />
              ) : uniqueItems.length ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(10.625rem,1fr))]">
                  {uniqueItems.map((it) => (
                    <ItemCard key={it.id} item={it} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center backdrop-blur-xl text-[var(--color-text)] shadow-sm">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  {hayAlgunFiltro ? (
                    <>
                      <h3 className="text-lg font-bold text-[var(--color-text)]">No encontramos prendas con esos filtros</h3>
                      <p className="mt-2 text-xs text-[var(--color-text-muted)] max-w-md mx-auto leading-relaxed">
                        Prueba cambiando el tipo de prenda, ajustando la ubicación o eliminando algún filtro.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFiltros}
                        className="mt-6 rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-xs font-bold text-[var(--color-text-on-accent)] hover:brightness-110 shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                      >
                        Quitar filtros
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-[var(--color-text)]">Aún no hay prendas en el catálogo</h3>
                      <p className="mt-2 text-xs text-[var(--color-text-muted)] max-w-md mx-auto leading-relaxed">
                        Todavía no hay prendas publicadas disponibles en este momento. Vuelve pronto para explorar nuevas colecciones.
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

/* ============================================================================
 * Perchero interactivo con «Recomendado para ti» (SR-RF-06)
 * ============================================================================ */

const MOCK_CUTOUT_BY_ID = new Map(
  ITEMS.filter((it): it is ItemResponseDto & { recorte: string } => Boolean(it.recorte)).map((it) => [it.id, it])
)

const feedErrorText = (e: unknown) =>
  e instanceof ApiError && e.status === 503 ? TEXTOS_FEED.catalogoCaido : errorMessage(e)

function HangerBackSvg({ bajada = 0 }: { bajada?: number }) {
  const bajadaSvg = (bajada ?? 0) * 19.2
  const vbHeight = 60 + bajadaSvg

  return (
    <svg
      className="sr-rack-hanger sr-rack-hanger--back"
      viewBox={`0 0 160 ${vbHeight}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sr-wire-grad-back" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e2ea" />
          <stop offset="45%" stopColor="#8c8c98" />
          <stop offset="100%" stopColor="#26262e" />
        </linearGradient>
      </defs>
      {/* Tramo trasero del lazo metálico que pasa por detrás de la barra */}
      <path
        d="M68 20 C68 12, 71 5, 80 4"
        stroke="url(#sr-wire-grad-back)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ShoulderHangerFrontSvg({ bajada = 0 }: { bajada?: number }) {
  const bajadaSvg = (bajada ?? 0) * 19.2
  const vbHeight = 60 + bajadaSvg

  return (
    <svg
      className="sr-rack-hanger sr-rack-hanger--shoulder"
      viewBox={`0 0 160 ${vbHeight}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sr-wire-grad-front" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#b4b4c0" />
          <stop offset="70%" stopColor="#5a5a66" />
          <stop offset="100%" stopColor="#1a1a20" />
        </linearGradient>
        <linearGradient id="sr-wood-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7a4620" />
          <stop offset="25%" stopColor="#b87b44" />
          <stop offset="50%" stopColor="#d49458" />
          <stop offset="75%" stopColor="#b87b44" />
          <stop offset="100%" stopColor="#7a4620" />
        </linearGradient>
      </defs>
      {/* Tramo frontal del lazo: corona sobre la barra y desciende por delante */}
      <path
        d="M80 4 C88 5, 89 13, 85 19 C82 22, 80 23, 80 27"
        stroke="url(#sr-wire-grad-front)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Cuello del gancho que entra en la madera: se alarga con la bajada */}
      <line
        x1="80"
        y1="26"
        x2="80"
        y2={31 + bajadaSvg}
        stroke="url(#sr-wire-grad-front)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Hombros de madera curvos y remache: bajan juntos */}
      <g transform={`translate(0, ${bajadaSvg})`}>
        <path
          d="M16 48 C40 40, 64 30, 80 28 C96 30, 120 40, 144 48 C146 49, 144 53, 141 53 C118 46, 96 37, 80 36 C64 37, 42 46, 19 53 C16 53, 14 49, 16 48 Z"
          fill="url(#sr-wood-grad)"
          stroke="#4a250a"
          strokeWidth="0.8"
        />
        {/* Detalle de remache central en el cuello */}
        <circle cx="80" cy="30" r="2.2" fill="#d4d4dc" stroke="#262626" strokeWidth="0.6" />
      </g>
    </svg>
  )
}

function ClipsHangerFrontSvg({ bajada = 0 }: { bajada?: number }) {
  const bajadaSvg = (bajada ?? 0) * 19.2
  const vbHeight = 60 + bajadaSvg

  return (
    <svg
      className="sr-rack-hanger sr-rack-hanger--clips"
      viewBox={`0 0 160 ${vbHeight}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sr-clips-rod-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#c8c8d2" />
          <stop offset="70%" stopColor="#5a5a66" />
          <stop offset="100%" stopColor="#222228" />
        </linearGradient>
      </defs>
      {/* Tramo frontal del lazo */}
      <path
        d="M80 4 C88 5, 89 13, 85 19 C82 22, 80 23, 80 27"
        stroke="url(#sr-wire-grad-front)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Cuello del gancho */}
      <line
        x1="80"
        y1="26"
        x2="80"
        y2={31 + bajadaSvg}
        stroke="url(#sr-wire-grad-front)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Barra horizontal metálica con topes */}
      <g transform={`translate(0, ${bajadaSvg})`}>
        <rect
          x="24"
          y="29"
          width="112"
          height="4"
          rx="2"
          fill="url(#sr-clips-rod-grad)"
          stroke="#33333a"
          strokeWidth="0.6"
        />
        {/* Topes en los extremos de la barra */}
        <circle cx="24" cy="31" r="2.5" fill="#44444e" />
        <circle cx="136" cy="31" r="2.5" fill="#44444e" />
      </g>
    </svg>
  )
}

function HangerClipsFront() {
  return (
    <div className="sr-rack-clips-layer" aria-hidden="true">
      {/* Pinza izquierda */}
      <svg className="sr-rack-clip sr-rack-clip--left" viewBox="0 0 16 28" fill="none">
        <rect x="3" y="1" width="10" height="26" rx="2" fill="#a0a0ab" stroke="#222228" strokeWidth="1" />
        <line x1="4" y1="12" x2="12" y2="12" stroke="#222228" strokeWidth="1.5" />
        <rect x="2" y="18" width="12" height="8" rx="1.5" fill="#44444e" stroke="#111116" strokeWidth="0.8" />
      </svg>
      {/* Pinza derecha */}
      <svg className="sr-rack-clip sr-rack-clip--right" viewBox="0 0 16 28" fill="none">
        <rect x="3" y="1" width="10" height="26" rx="2" fill="#a0a0ab" stroke="#222228" strokeWidth="1" />
        <line x1="4" y1="12" x2="12" y2="12" stroke="#222228" strokeWidth="1.5" />
        <rect x="2" y="18" width="12" height="8" rx="1.5" fill="#44444e" stroke="#111116" strokeWidth="0.8" />
      </svg>
    </div>
  )
}

function RecommendedHangingRack({ userId }: { userId: string }) {
  const [data, setData] = useState<RecommendationsPageDto | null>(null)
  const [perfil, setPerfil] = useState<PerfilDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})
  const versionRef = useRef(0)
  const dragStartX = useRef<number | null>(null)
  const dragDeltaX = useRef<number>(0)
  const didDrag = useRef<boolean>(false)

  const cargar = useCallback(async () => {
    const v = ++versionRef.current
    setLoading(true)
    setError('')
    try {
      const r = await feedService.getRecommendations(userId, { page: 0, size: PARA_TI_SIZE })
      if (v !== versionRef.current) return
      setData(r)
      setActiveIndex(0)
      if (r.content.some((i) => !i.reason?.trim())) {
        const p = await usuarioService.get(userId).catch(() => null)
        if (v === versionRef.current) setPerfil(p)
      }
    } catch (e) {
      if (v === versionRef.current) setError(feedErrorText(e))
    } finally {
      if (v === versionRef.current) setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const items = useMemo<FeedItemDto[]>(() => data?.content ?? [], [data])
  const total = items.length
  const safeActiveIndex = total > 0 ? activeIndex % total : 0

  const moveBy = useCallback(
    (delta: number) => {
      if (total <= 1) return
      setActiveIndex((prev) => (prev + delta + total) % total)
    },
    [total]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      moveBy(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      moveBy(1)
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX
    dragDeltaX.current = 0
    didDrag.current = false
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return
    dragDeltaX.current = e.clientX - dragStartX.current
    if (Math.abs(dragDeltaX.current) > 10) {
      didDrag.current = true
    }
  }

  const handlePointerEnd = () => {
    if (dragStartX.current === null) return
    const dx = dragDeltaX.current
    dragStartX.current = null
    dragDeltaX.current = 0
    if (Math.abs(dx) > 36) {
      moveBy(dx < 0 ? 1 : -1)
    }
  }

  const visibleGarments = useMemo(() => {
    return items
      .map((item, index) => {
        let offset = index - safeActiveIndex
        if (total > 2) {
          if (offset > total / 2) offset -= total
          if (offset < -total / 2) offset += total
        }
        return { item, index, offset }
      })
      .filter(({ offset }) => offset >= -3 && offset <= 3)
  }, [safeActiveIndex, items, total])

  const header = (
    <header className="sr-rack-header">
      <span className="sr-rack-kicker">Según tu perfil de estilo</span>
      <span className="sr-rack-divider" aria-hidden="true" />
      <h2 id="recomendado-titulo" className="sr-rack-kicker sr-rack-kicker--muted m-0">
        Recomendado para ti
      </h2>
    </header>
  )

  if (loading) {
    return (
      <section className="sr-rack-section" aria-labelledby="recomendado-titulo">
        {header}
        <div className="px-4 sm:px-6">
          <ItemGridSkeleton count={4} />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="sr-rack-section" aria-labelledby="recomendado-titulo">
        {header}
        <div className="sr-rack-empty-box">
          <ErrorBanner
            tone="warn"
            icon="refresh"
            title={error}
            actions={
              <button
                type="button"
                onClick={cargar}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:border-[var(--color-accent)]"
              >
                Reintentar
              </button>
            }
          />
        </div>
      </section>
    )
  }

  if (data?.generalWithoutPreferences || total === 0) {
    return (
      <section className="sr-rack-section" aria-labelledby="recomendado-titulo">
        {header}
        <div className="sr-rack-empty-box">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center text-sm text-[var(--color-text)]">
            <p>{data?.message || TEXTOS_FEED.sinPreferencias}</p>
            <Link to="/perfil" className="mt-3 inline-block font-semibold text-[var(--color-accent)] underline">
              Actualizar mi perfil
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const featured = items[safeActiveIndex] ?? items[0]
  const motivoFeatured = motivoDe(featured, perfil)

  return (
    <section
      className="sr-rack-section"
      aria-labelledby="recomendado-titulo"
      onKeyDown={handleKeyDown}
    >
      {header}
      {data?.message && (
        <p className="sr-rack-status" role="status">
          {data.message}
        </p>
      )}

      {/* Barra metálica horizontal fina + prendas colgadas */}
      <div
        className="sr-rack-viewport"
        tabIndex={0}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Perchero interactivo de prendas recomendadas para ti"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
      >
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => moveBy(-1)}
              aria-label="Prenda recomendada anterior"
              className="sr-rack-nav-btn sr-rack-nav-btn--prev"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => moveBy(1)}
              aria-label="Siguiente prenda recomendada"
              className="sr-rack-nav-btn sr-rack-nav-btn--next"
            >
              ›
            </button>
          </>
        )}

        {/* Tramo trasero de los lazos de los ganchos (z-index por detrás de la barra) */}
        <div className="sr-rack-stage sr-rack-stage--back" aria-hidden="true">
          {visibleGarments.map(({ item, offset, index }) => {
            const mockMeta = env.useMocks ? MOCK_CUTOUT_BY_ID.get(item.itemId) : undefined
            const bajada = mockMeta?.bajada ?? 0
            return (
              <div
                key={`back-${item.itemId}`}
                data-offset={offset}
                className="sr-rack-item sr-rack-item--back"
                style={
                  {
                    '--rack-delay': `${(index * 0.42) % 2.5}s`,
                    '--bajada': `${bajada}rem`,
                  } as React.CSSProperties
                }
              >
                <div className="sr-rack-sway">
                  <div className="sr-rack-sway-inner">
                    <HangerBackSvg bajada={bajada} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Barra metálica horizontal de lado a lado */}
        <div className="sr-rack-bar" aria-hidden="true" />

        {/* Prendas colgadas */}
        <div className="sr-rack-stage">
          {visibleGarments.map(({ item, index, offset }) => {
            const isCenter = offset === 0
            const mockMeta = env.useMocks ? MOCK_CUTOUT_BY_ID.get(item.itemId) : undefined
            const isClips = mockMeta ? mockMeta.tipoGancho === 'pinzas' : item.garmentType === 'BOTTOM'
            const bajada = mockMeta?.bajada ?? 0
            const anclaY = mockMeta?.anclaY ?? (isClips ? 0 : 0.05)
            const photoUrl = item.photos?.[0] ?? ''
            const showBrokenFallback = failedImages[item.itemId] || (!mockMeta && !photoUrl)

            return (
              <button
                key={item.itemId}
                type="button"
                data-offset={offset}
                aria-pressed={isCenter}
                aria-label={item.name}
                onClick={() => {
                  if (didDrag.current) {
                    didDrag.current = false
                    return
                  }
                  setActiveIndex(index)
                }}
                className="sr-rack-item"
                style={
                  {
                    '--rack-delay': `${(index * 0.42) % 2.5}s`,
                    '--ancla-y': anclaY,
                    '--bajada': `${bajada}rem`,
                  } as React.CSSProperties
                }
              >
                <div className="sr-rack-sway">
                  <div className="sr-rack-sway-inner">
                    {isClips ? (
                      <ClipsHangerFrontSvg bajada={bajada} />
                    ) : (
                      <ShoulderHangerFrontSvg bajada={bajada} />
                    )}

                    {mockMeta ? (
                      <div className="sr-rack-garment-cutout">
                        <img
                          src={mockMeta.recorte}
                          alt={item.name}
                          draggable={false}
                          className="sr-rack-cutout-img"
                        />
                        {isClips && <HangerClipsFront />}
                      </div>
                    ) : (
                      <div className="sr-rack-garment-card">
                        {isClips && <HangerClipsFront />}
                        {showBrokenFallback ? (
                          <div className="sr-rack-card-fallback">
                            <span>{item.brand || 'StyleRadar'}</span>
                          </div>
                        ) : (
                          <img
                            src={photoUrl}
                            alt={item.name}
                            draggable={false}
                            className="sr-rack-card-img"
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [item.itemId]: true }))
                            }
                          />
                        )}
                      </div>
                    )}

                    <span className="sr-rack-hover-title" aria-hidden="true">
                      {item.name}
                    </span>
                  </div>
                </div>

                <div className="sr-rack-shadow" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Detalle inferior de la prenda recomendada + motivo (SR-RF-06) + botón "Ver prenda" */}
      <div className="sr-rack-footer">
        <p className="sr-rack-title">{featured.name}</p>
        <p className="sr-rack-meta">
          {featured.brand ? `${featured.brand} · ` : ''}{formatCOP(featured.price)}
        </p>
        {motivoFeatured && (
          <p className="sr-rack-reason">Por qué: {motivoFeatured}</p>
        )}

        <Link
          to={`/catalogo/${featured.itemId}`}
          className="sr-rack-cta"
        >
          Ver prenda
        </Link>
      </div>
    </section>
  )
}
