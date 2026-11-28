import { useState, useMemo, useRef, useEffect, useCallback, useContext } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { isStoreSuspended, STORE_SUB_CHANGED } from '@/modules/transacciones/services/storeSubscriptionService'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind } from '@/modules/core/api/errors'
import { Aviso, BTN_PRINCIPAL, BTN_SECUNDARIO, type TonoAviso } from '@/modules/core/components/Aviso'
import { alertService, LIMITE_PLAN } from '@/modules/soporte/services/alertService'
import type { BusquedaGuardadaDto } from '@/modules/soporte/types/notification.dto'
import { ParaTiFeed } from '@/modules/identidad/components/ParaTiSections'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { ItemCard } from '../components/ItemCard'
import { ItemGridSkeleton } from '../components/ItemCardSkeleton'
import { useItems } from '../hooks/useItems'
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

const PRICE_SLIDER_MIN = 0
const PRICE_SLIDER_MAX = 600000
const PRICE_SLIDER_STEP = 10000
const formatPesos = (n: number) => `$${n.toLocaleString('es-CO')}`

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
  const [debouncedTexto, setDebouncedTexto] = useState(params.get('q') ?? '')
  const [orden, setOrden] = useState<OrdenCatalogo>(() => normOrdenParam(params.get('orden')))

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTexto(texto)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [texto])

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
  const [precioMinCustom, setPrecioMinCustom] = useState<number | null>(null)
  const [precioMaxCustom, setPrecioMaxCustom] = useState<number | null>(null)
  const [filtroOrigen, setFiltroOrigen] = useState<string>(params.get('origen') ?? 'Todos')
  const [filtroMarca, setFiltroMarca] = useState<string>(params.get('marca') ?? 'Todas')
  const [filtroColor, setFiltroColor] = useState<string>(params.get('color') ?? 'Todos')
  const [filtroEstilo, setFiltroEstilo] = useState<string>(params.get('estilo') ?? 'Todos')

  const hasCustomPrecio = precioMinCustom !== null || precioMaxCustom !== null
  const hasPrecioFilter = filtroPrecio !== 0 || hasCustomPrecio

  const precioLabelActual = useMemo(() => {
    if (hasCustomPrecio) {
      const minV = precioMinCustom ?? PRICE_SLIDER_MIN
      const maxV = precioMaxCustom ?? PRICE_SLIDER_MAX
      if (minV <= PRICE_SLIDER_MIN && maxV >= PRICE_SLIDER_MAX) return 'Cualquier precio'
      if (minV <= PRICE_SLIDER_MIN) return `Hasta ${formatPesos(maxV)}`
      if (maxV >= PRICE_SLIDER_MAX) return `Más de ${formatPesos(minV)}`
      return `${formatPesos(minV)} a ${formatPesos(maxV)}`
    }
    return PRECIOS_PRESETS[filtroPrecio]?.label ?? 'Cualquier precio'
  }, [hasCustomPrecio, precioMinCustom, precioMaxCustom, filtroPrecio])

  const CATEGORIAS_CONFIG: { id: CategoriaId; label: string; panelTitle: string; count: number }[] = useMemo(() => [
    { id: 'tipo', label: 'Tipo de prenda', panelTitle: 'Tipo de prenda', count: filtroTipo !== 'Todos' ? 1 : 0 },
    { id: 'talla', label: 'Talla', panelTitle: 'Talla disponible', count: filtroTalla !== 'Todas' ? 1 : 0 },
    { id: 'precio', label: 'Precio', panelTitle: 'Rango de precio', count: hasPrecioFilter ? 1 : 0 },
    { id: 'origen', label: 'Origen', panelTitle: 'Origen', count: filtroOrigen !== 'Todos' ? 1 : 0 },
    { id: 'marca', label: 'Marca', panelTitle: 'Marca', count: filtroMarca !== 'Todas' ? 1 : 0 },
    { id: 'color', label: 'Color', panelTitle: 'Color', count: filtroColor !== 'Todos' ? 1 : 0 },
    { id: 'estilo', label: 'Estilo', panelTitle: 'Estilo', count: filtroEstilo !== 'Todos' ? 1 : 0 },
  ], [filtroTipo, filtroTalla, hasPrecioFilter, filtroOrigen, filtroMarca, filtroColor, filtroEstilo])

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
    if (hasPrecioFilter) count++
    if (filtroOrigen !== 'Todos') count++
    if (filtroMarca !== 'Todas') count++
    if (filtroColor !== 'Todos') count++
    if (filtroEstilo !== 'Todos') count++
    return count
  }, [filtroTipo, filtroTalla, hasPrecioFilter, filtroOrigen, filtroMarca, filtroColor, filtroEstilo])

  // Filtros combinados para el hook
  const activeFilters = useMemo<ItemFiltersDto>(() => {
    const selectedPreset = PRECIOS_PRESETS[filtroPrecio]
    const precioMin = hasCustomPrecio
      ? (precioMinCustom !== null && precioMinCustom > PRICE_SLIDER_MIN ? precioMinCustom : undefined)
      : selectedPreset?.min
    const precioMax = hasCustomPrecio
      ? (precioMaxCustom !== null && precioMaxCustom < PRICE_SLIDER_MAX ? precioMaxCustom : undefined)
      : selectedPreset?.max
    return {
      texto: debouncedTexto.trim() || undefined,
      tipo: filtroTipo !== 'Todos' ? filtroTipo : undefined,
      talla: filtroTalla !== 'Todas' ? filtroTalla : undefined,
      tipoTalla: filtroTalla !== 'Todas' ? (filtroTipoTalla ?? undefined) : undefined,
      precioMin,
      precioMax,
      origen: filtroOrigen !== 'Todos' ? filtroOrigen : undefined,
      marca: filtroMarca !== 'Todas' ? filtroMarca : undefined,
      color: filtroColor !== 'Todos' ? filtroColor : undefined,
      estilo: filtroEstilo !== 'Todos' ? filtroEstilo : undefined,
      lat: orden === 'DISTANCIA' ? coords?.lat : undefined,
      lng: orden === 'DISTANCIA' ? coords?.lng : undefined,
      orden,
    }
  }, [debouncedTexto, filtroTipo, filtroTalla, filtroTipoTalla, filtroPrecio, hasCustomPrecio, precioMinCustom, precioMaxCustom, filtroOrigen, filtroMarca, filtroColor, filtroEstilo, coords, orden])

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
    setDebouncedTexto(termino)
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
    setDebouncedTexto(q)
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
    const nombre = texto.trim() || (filtroTipo !== 'Todos' ? `${filtroTipo}${filtroColor !== 'Todos' ? ` ${filtroColor}` : ''}` : 'Catálogo completo')
    const filtros: Record<string, unknown> = {}
    const extraTerms: string[] = []
    if (texto.trim()) extraTerms.push(texto.trim())

    // ms-usuarios (GuardarBusquedaRequestDTO) solo acepta TipoPrenda TOP/BOTTOM/FOOTWEAR
    if (filtroTipo !== 'Todos') {
      const tNorm = filtroTipo.toLowerCase()
      if (['saco', 'chaqueta', 'buzo', 'suéter', 'sueter', 'camisa', 'camiseta', 'top', 'superior'].includes(tNorm)) {
        filtros.garmentType = 'TOP'
      } else if (['pantalón', 'pantalon', 'falda', 'bottom', 'inferior'].includes(tNorm)) {
        filtros.garmentType = 'BOTTOM'
      } else if (['calzado', 'footwear', 'shoes', 'tenis', 'zapatos'].includes(tNorm)) {
        filtros.garmentType = 'FOOTWEAR'
      } else {
        extraTerms.push(filtroTipo)
      }
    }
    if (filtroColor !== 'Todos') filtros.color = filtroColor
    // ms-usuarios (Talla enum) solo acepta XS, S, M, L, XL, XXL
    if (filtroTalla !== 'Todas') {
      const tallaUpper = filtroTalla.trim().toUpperCase()
      if (['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(tallaUpper)) {
        filtros.size = tallaUpper
      } else {
        extraTerms.push(`Talla ${filtroTalla}`)
      }
    }
    if (filtroMarca !== 'Todas') filtros.brand = filtroMarca
    if (extraTerms.length > 0) filtros.query = extraTerms.join(' ')
    if (precioMinCustom != null) filtros.minPrice = precioMinCustom
    if (precioMaxCustom != null) filtros.maxPrice = precioMaxCustom

    try {
      const b =
        busqueda?.nombre === nombre
          ? busqueda
          : await alertService.saveSearch(nombre, `${filtrosActivosCount} filtros · orden ${orden}`, filtros)
      setBusqueda(b)
      try {
        await activarAlerta(b)
      } catch (alertErr) {
        if (alertErr instanceof ApiError && alertErr.status === 422) {
          setAvisoBusqueda({
            tono: 'alerta',
            titulo: `Guardamos «${b.nombre}»`,
            texto: 'Tu búsqueda quedó guardada, pero la alerta automática aún se está sincronizando. Puedes activarla en unos segundos.',
            accion: 'reintentar',
          })
          return
        }
        setAvisoBusqueda(avisoDeError(alertErr))
      }
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
    setPrecioMinCustom(null)
    setPrecioMaxCustom(null)
    setFiltroOrigen('Todos')
    setFiltroMarca('Todas')
    setFiltroColor('Todos')
    setFiltroEstilo('Todos')
    setTexto('')
    setDebouncedTexto('')
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
    setPrecioMinCustom(null)
    setPrecioMaxCustom(null)
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
      case 'precio': {
        const sliderMinVal = hasCustomPrecio
          ? (precioMinCustom ?? PRICE_SLIDER_MIN)
          : (PRECIOS_PRESETS[filtroPrecio]?.min ?? PRICE_SLIDER_MIN)
        const sliderMaxVal = hasCustomPrecio
          ? (precioMaxCustom ?? PRICE_SLIDER_MAX)
          : (PRECIOS_PRESETS[filtroPrecio]?.max ?? PRICE_SLIDER_MAX)
        const leftPct = ((sliderMinVal - PRICE_SLIDER_MIN) / (PRICE_SLIDER_MAX - PRICE_SLIDER_MIN)) * 100
        const rightPct = 100 - ((sliderMaxVal - PRICE_SLIDER_MIN) / (PRICE_SLIDER_MAX - PRICE_SLIDER_MIN)) * 100
        const maxLeftPct = 100 - rightPct

        return (
          <div className="space-y-3">
            <div className="max-w-md px-1">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-[0.6875rem] font-semibold text-[var(--color-text-muted)]">Rango</span>
                <span className="text-[0.75rem] font-bold text-[var(--sr-acento-primario,var(--color-accent))]">
                  {precioLabelActual}
                </span>
              </div>
              <div className="sr-filter-range-track">
                <div
                  className="sr-filter-range-bar"
                  style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
                />
                <div className="sr-filter-range-thumb" style={{ left: `${leftPct}%` }} />
                <div className="sr-filter-range-thumb" style={{ left: `${maxLeftPct}%` }} />
                <input
                  type="range"
                  aria-label="Precio mínimo"
                  min={PRICE_SLIDER_MIN}
                  max={PRICE_SLIDER_MAX}
                  step={PRICE_SLIDER_STEP}
                  value={sliderMinVal}
                  onChange={(e) => {
                    const nextMin = Math.min(Number(e.target.value), sliderMaxVal - PRICE_SLIDER_STEP)
                    setFiltroPrecio(0)
                    setPrecioMinCustom(nextMin)
                    setPrecioMaxCustom(sliderMaxVal)
                  }}
                  className="sr-filter-range-input"
                />
                <input
                  type="range"
                  aria-label="Precio máximo"
                  min={PRICE_SLIDER_MIN}
                  max={PRICE_SLIDER_MAX}
                  step={PRICE_SLIDER_STEP}
                  value={sliderMaxVal}
                  onChange={(e) => {
                    const nextMax = Math.max(Number(e.target.value), sliderMinVal + PRICE_SLIDER_STEP)
                    setFiltroPrecio(0)
                    setPrecioMinCustom(sliderMinVal)
                    setPrecioMaxCustom(nextMax)
                  }}
                  className="sr-filter-range-input"
                />
              </div>
            </div>
            <div className="sr-filter-chips-grid">
              {PRECIOS_PRESETS.map((preset, idx) => {
                if (idx === 0) return null
                const isSelected = !hasCustomPrecio && filtroPrecio === idx
                return (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setPrecioMinCustom(null)
                      setPrecioMaxCustom(null)
                      setFiltroPrecio(isSelected ? 0 : idx)
                    }}
                    className={`sr-filter-chip ${isSelected ? 'sr-filter-chip--selected' : ''}`}
                  >
                    <span>{preset.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      }
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
                  onClick={() => {
                    setTexto('')
                    setDebouncedTexto('')
                    const next = new URLSearchParams(params)
                    next.delete('q')
                    setParams(next)
                  }}
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
            {hasPrecioFilter && (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-semibold text-[var(--color-text)]">
                {precioLabelActual}
                <button type="button" onClick={() => { setFiltroPrecio(0); setPrecioMinCustom(null); setPrecioMaxCustom(null) }} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-full" aria-label="Quitar filtro de precio">
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
