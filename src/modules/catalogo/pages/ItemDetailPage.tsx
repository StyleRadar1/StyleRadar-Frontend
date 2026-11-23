import { useState, useCallback, useMemo, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Loading } from '@/modules/core/components/Status'
import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { env } from '@/configs/env'
import { errorKind } from '@/modules/core/api/errors'
import { Aviso, BTN_PRINCIPAL, BTN_SECUNDARIO, type TonoAviso } from '@/modules/core/components/Aviso'
import { alertService, LIMITE_PLAN } from '@/modules/soporte/services/alertService'
import { formatCOP } from '@/modules/core/utils/format'
import { useResource } from '@/modules/core/hooks/useResource'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { tiendaContacto } from '@/modules/soporte/utils/contacts'
import { ItemCard } from '../components/ItemCard'
import { SizeGuideModal } from '../components/SizeGuideModal'
import { extractAvailableTallasFromInventory, itemService } from '../services/itemService'
import { ITEMS } from '../mocks/items'
import { getStoreIdByName } from '../services/storePublicService'
import type { ItemResponseDto } from '../types/item.dto'
import './ItemDetailPage.css'

type Accion = 'reintentar-alerta' | 'reservar' | 'planes' | 'login' | 'ver-alertas'
interface AvisoPrenda { tono: TonoAviso; titulo: string; texto: string; accion?: Accion }

/** Error al crear la alerta de una prenda (ms-notificaciones): texto fijo, nunca el del servidor. */
function avisoAlerta(e: unknown): AvisoPrenda {
  const status = e instanceof ApiError ? e.status : 0
  if (status === 409) return { tono: 'info', titulo: 'Ya tienes una alerta para esta prenda', texto: 'Te avisamos cuando llegue.', accion: 'ver-alertas' }
  if (status === 422 && e instanceof ApiError && e.code === LIMITE_PLAN) {
    return { tono: 'alerta', titulo: 'Llegaste al límite de alertas', texto: 'Con el plan Radar puedes tener hasta 3 alertas activas. Con Radar+ no hay límite.', accion: 'planes' }
  }
  if (status === 422) return { tono: 'info', titulo: 'Esta prenda ya tiene unidades', texto: 'Puedes reservarla ahora.', accion: 'reservar' }
  return general(e, 'No pudimos crear la alerta', 'reintentar-alerta')
}

/** Error al reservar (ms-inventario): 409 es que ya no hay unidades de esa talla. */
function avisoReserva(e: unknown): AvisoPrenda {
  const status = e instanceof ApiError ? e.status : 0
  if (status === 409) return { tono: 'error', titulo: 'Ya no quedan unidades en esa talla', texto: 'Prueba con otra.' }
  return general(e, 'No pudimos reservar la prenda')
}

function general(e: unknown, titulo: string, accion?: Accion): AvisoPrenda {
  const kind = errorKind(e)
  if (kind === 'sesion') return { tono: 'info', titulo: 'Inicia sesión para continuar', texto: 'Así guardamos tu alerta o tu reserva.', accion: 'login' }
  if (kind === 'sin-conexion') return { tono: 'error', titulo: 'Se perdió la conexión', texto: 'Revisa tu internet e intenta de nuevo.', accion }
  return { tono: 'error', titulo, texto: 'Intenta más tarde.', accion }
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  const isBuyer = auth?.user?.role === 'BUYER'

  const [tallaSeleccionada, setTallaSeleccionada] = useState<string>('')
  const [guiaTallasAbierta, setGuiaTallasAbierta] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [guardadoPlaylist, setGuardadoPlaylist] = useState(false)
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null)
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null)
  const [indiceImagen, setIndiceImagen] = useState(0)
  const [zoomActivo, setZoomActivo] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [prevId, setPrevId] = useState(id)
  const [descripcionExpandida, setDescripcionExpandida] = useState(false)
  const [aviso, setAviso] = useState<AvisoPrenda | null>(null)
  const [ocupado, setOcupado] = useState<'alerta' | 'reserva' | null>(null)
  /** Tallas que el inventario dijo que se agotaron (409 al reservar). */
  const [agotadas, setAgotadas] = useState<string[]>([])

  if (id !== prevId) {
    setPrevId(id)
    setImagenSeleccionada(null)
    setIndiceImagen(0)
    setZoomActivo(false)
  }

  // Carga de la prenda principal, tallas desde inventario y similares (SR-RF-16)
  const loader = useCallback(async () => {
    if (!id) throw new ApiError(404, 'Prenda no especificada.')
    const [prendaData, similaresData] = await Promise.all([
      itemService.getById(id),
      itemService.getSimilar(id).catch(() => [] as ItemResponseDto[]),
    ])
    let tallas = prendaData.tallas
    if (!env.useMocks && tallas.length === 0) {
      try {
        const inv = await apiClient.get<any>(`/api/v1/inventario/prenda/${encodeURIComponent(id)}`).then((r) => r.data)
        const extraidas = extractAvailableTallasFromInventory(inv)
        if (extraidas.length > 0) tallas = extraidas
      } catch {
        // Mantiene tallas vacías si inventario no responde
      }
    }
    return {
      prenda: { ...prendaData, tallas },
      similares: similaresData.filter((x) => x.id !== prendaData.id).slice(0, 10),
    }
  }, [id])

  const { data, loading, error, reload: recargar } = useResource<{
    prenda: ItemResponseDto | null
    similares: ItemResponseDto[]
  }>(loader, { prenda: null, similares: [] })

  const prenda = data.prenda
  const similares = data.similares

  // Accesibilidad: cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/catalogo')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  // 403 y 404 se ven igual: la prenda no existe o no está disponible para esta persona
  const noExiste = !!error && (errorKind(error) === 'no-existe' || errorKind(error) === 'permiso')

  // ¿Ya sigo esta prenda (y talla)? Así el botón dice «Cancelar seguimiento» en lugar de pedir otra alerta
  const [seguimiento, setSeguimiento] = useState<string | null>(null)
  const prendaId = prenda?.id
  useEffect(() => {
    if (!prendaId || !isBuyer) return
    let activo = true
    alertService.check(prendaId, tallaSeleccionada || undefined).then((r) => { if (activo) setSeguimiento(r.suscrita && r.alertaId ? r.alertaId : null) })
    return () => { activo = false }
  }, [prendaId, tallaSeleccionada, isBuyer])

  const crearAlerta = async () => {
    if (!prenda || ocupado) return
    setOcupado('alerta'); setAviso(null)
    try {
      const a = await alertService.createAlert(prenda.id, prenda.nombre, prenda.tienda, tallaSeleccionada || undefined)
      setSeguimiento(a.id)
      setAviso({ tono: 'exito', titulo: 'Te avisaremos cuando llegue', texto: 'La encuentras en «Mis búsquedas y alertas».', accion: 'ver-alertas' })
    } catch (e) {
      // 409: ya la sigues; el botón pasa a «Cancelar seguimiento»
      if (e instanceof ApiError && e.status === 409) alertService.check(prenda.id, tallaSeleccionada || undefined).then((r) => { if (r.suscrita && r.alertaId) setSeguimiento(r.alertaId) })
      setAviso(avisoAlerta(e))
    } finally { setOcupado(null) }
  }

  const cancelarSeguimiento = async () => {
    if (!prenda || ocupado || seguimiento === null) return
    setOcupado('alerta'); setAviso(null)
    try {
      await alertService.cancelAlert(seguimiento)
      setSeguimiento(null)
      setAviso({ tono: 'info', titulo: 'Cancelaste el seguimiento', texto: 'Ya no te avisaremos cuando llegue esta prenda.' })
    } catch (e) {
      setAviso(avisoAlerta(e))
    } finally { setOcupado(null) }
  }

  const reservar = async () => {
    if (!prenda || ocupado) return
    if (!tallaSeleccionada) { setAviso({ tono: 'info', titulo: 'Elige tu talla', texto: 'Así reservamos la unidad correcta en la tienda.' }); return }
    setOcupado('reserva'); setAviso(null)
    try {
      await itemService.reserve(prenda.id, tallaSeleccionada)
      setAviso({ tono: 'exito', titulo: `Reservamos tu talla ${tallaSeleccionada}`, texto: `Tienes 15 minutos para recogerla en ${prenda.tienda}.` })
    } catch (e) {
      const a = avisoReserva(e)
      if (e instanceof ApiError && e.status === 409) { setAgotadas((l) => [...l, tallaSeleccionada]); setTallaSeleccionada('') }
      setAviso(a)
    } finally { setOcupado(null) }
  }

  const accionAviso = (a: AvisoPrenda) => {
    switch (a.accion) {
      case 'reintentar-alerta': return <button type="button" disabled={!!ocupado} onClick={crearAlerta} className={BTN_PRINCIPAL}>Reintentar</button>
      case 'reservar': return <button type="button" disabled={!!ocupado} onClick={reservar} className={BTN_PRINCIPAL}>Reservar en tienda</button>
      case 'planes': return <Link to="/planes" className={BTN_PRINCIPAL}>Ver Radar+</Link>
      case 'login': return <Link to="/login" className={BTN_PRINCIPAL}>Iniciar sesión</Link>
      case 'ver-alertas': return <Link to="/alertas" className={BTN_SECUNDARIO}>Ver mis alertas</Link>
      default: return undefined
    }
  }

  const handleGuardar = () => {
    setGuardado((prev) => !prev)
    setMensajeFeedback(guardado ? 'Prenda retirada de tus favoritos' : '¡Prenda guardada en tus favoritos!')
    setTimeout(() => setMensajeFeedback(null), 3000)
  }

  const handleGuardarPlaylist = () => {
    setGuardadoPlaylist((prev) => !prev)
    setMensajeFeedback(
      guardadoPlaylist ? 'Prenda retirada de tu playlist.' : '¡Prenda guardada en tu playlist de estilo!'
    )
    setTimeout(() => setMensajeFeedback(null), 3000)
  }

  // Navegación entre prendas del catálogo
  const { prevItem, nextItem } = useMemo(() => {
    if (!prenda || !env.useMocks) return { prevItem: null, nextItem: null }
    const currentIndex = ITEMS.findIndex((it) => it.id === prenda.id)
    const validIndex = currentIndex >= 0 ? currentIndex : 0
    const prevIdx = validIndex > 0 ? validIndex - 1 : ITEMS.length - 1
    const nextIdx = validIndex < ITEMS.length - 1 ? validIndex + 1 : 0
    return {
      prevItem: ITEMS[prevIdx] || null,
      nextItem: ITEMS[nextIdx] || null,
    }
  }, [prenda])

  // Galería multi-ángulo: hasta 5 fotos (SR-RF-51)
  const imagenesDisponibles = useMemo(() => {
    if (!prenda) return []
    const fuente = prenda.imagenes?.length ? prenda.imagenes : prenda.fotografias
    if (fuente && fuente.length > 0) {
      return fuente.slice(0, 5)
    }
    const list: string[] = [prenda.imagen]
    if (prenda.imagenSecundaria && !list.includes(prenda.imagenSecundaria)) {
      list.push(prenda.imagenSecundaria)
    }
    if (prenda.recorte && !list.includes(prenda.recorte)) {
      list.push(prenda.recorte)
    }
    return list.filter(Boolean).slice(0, 5)
  }, [prenda])

  const ANGLE_LABELS = ['Frontal', 'Detalle', 'Espalda', 'Look completo', 'Vista adicional']

  const imagenActiva = imagenSeleccionada ?? (imagenesDisponibles[indiceImagen] || prenda?.imagen || '')

  const seleccionarFoto = (url: string, index: number) => {
    setImagenSeleccionada(url)
    setIndiceImagen(index)
  }

  const anteriorFoto = () => {
    if (imagenesDisponibles.length <= 1) return
    const nextIdx = indiceImagen > 0 ? indiceImagen - 1 : imagenesDisponibles.length - 1
    setIndiceImagen(nextIdx)
    setImagenSeleccionada(imagenesDisponibles[nextIdx])
  }

  const siguienteFoto = () => {
    if (imagenesDisponibles.length <= 1) return
    const nextIdx = indiceImagen < imagenesDisponibles.length - 1 ? indiceImagen + 1 : 0
    setIndiceImagen(nextIdx)
    setImagenSeleccionada(imagenesDisponibles[nextIdx])
  }

  const handleMouseMoveZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomActivo) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 text-[var(--color-text)]">
      {/* Barra superior / Migas de pan + botón Cerrar */}
      <nav className="mb-6 flex items-center justify-between text-xs text-[var(--color-text-muted)]" aria-label="Migas de pan">
        <div className="flex items-center gap-2">
          <Link to="/catalogo" className="hover:text-[var(--color-text)] transition font-medium">Catálogo</Link>
          <span>/</span>
          {prenda && (
            <>
              <Link to={`/catalogo?estilo=${encodeURIComponent(prenda.estilo)}`} className="hover:text-[var(--color-text)] transition font-medium">
                {prenda.estilo}
              </Link>
              <span>/</span>
              <span className="truncate text-[var(--color-text)] max-w-xs">{prenda.nombre}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {prevItem && nextItem && (
            <div className="flex items-center gap-1 mr-2" aria-label="Navegar prendas">
              <Link
                to={`/catalogo/${prevItem.id}`}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--sr-border-subtle,var(--color-border))] text-xs font-bold text-[var(--color-text)] hover:bg-[var(--sr-surface-raised,var(--color-surface-raised))] transition"
                aria-label={`Prenda anterior: ${prevItem.nombre}`}
                title={`Prenda anterior: ${prevItem.nombre}`}
              >
                ‹
              </Link>
              <Link
                to={`/catalogo/${nextItem.id}`}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--sr-border-subtle,var(--color-border))] text-xs font-bold text-[var(--color-text)] hover:bg-[var(--sr-surface-raised,var(--color-surface-raised))] transition"
                aria-label={`Prenda siguiente: ${nextItem.nombre}`}
                title={`Prenda siguiente: ${nextItem.nombre}`}
              >
                ›
              </Link>
            </div>
          )}

          <Link
            to="/catalogo"
            aria-label="Cerrar y volver al catálogo"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sr-border-subtle,var(--color-border))] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--sr-surface-raised,var(--color-surface-raised))] hover:text-[var(--color-text)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))]"
          >
            <span>✕</span>
            <span className="hidden sm:inline">Cerrar</span>
          </Link>
        </div>
      </nav>

      {/* Estados de carga o error */}
      {loading && <Loading label="Cargando detalles de la prenda..." />}

      {noExiste && (
        <Aviso tono="info" titulo="Esta prenda ya no está disponible." acciones={<Link to="/catalogo" className={BTN_PRINCIPAL}>Volver al catálogo</Link>}>
          Puede que la tienda la haya retirado del catálogo.
        </Aviso>
      )}

      {!!error && !noExiste && (
        <Aviso tono="error" titulo="No pudimos cargar la prenda" acciones={<button type="button" onClick={recargar} className={BTN_PRINCIPAL}>Reintentar</button>}>
          {errorKind(error) === 'sin-conexion' ? 'Revisa tu internet e intenta de nuevo.' : 'Intenta en unos minutos.'}
        </Aviso>
      )}

      {mensajeFeedback && (
        <div role="status" className="mb-6 rounded-xl border border-[var(--color-success-border,rgba(16,185,129,0.3))] bg-[var(--color-success-bg,rgba(16,185,129,0.1))] p-3.5 text-xs text-[var(--color-success-text,#10b981)] flex items-center gap-2 shadow-sm animate-in fade-in">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{mensajeFeedback}</span>
        </div>
      )}

      {prenda && (
        <div className="space-y-14">
          {/* ======================================================== */}
          {/* TARJETA HERO DEL PRODUCTO (3 COLUMNAS EN ESCRITORIO)     */}
          {/* ======================================================== */}
          <article className="sr-detail-hero-card p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              
              {/* ---------------------------------------------------- */}
              {/* COLUMNA CENTRO: Galería Multi-Ángulo (hasta 4 fotos) */}
              {/* Desktop: Col 6 centro | Tablet: Top ancho completo   */}
              {/* Mobile: Primero en el orden visual (order-1)        */}
              {/* ---------------------------------------------------- */}
              <div className="flex flex-col items-center justify-center md:col-span-2 lg:col-span-6 md:order-1 lg:order-2 order-1">
                {/* Etiqueta superior editorial con aura de marca */}
                <div className="mb-3 text-center z-10">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] px-3.5 py-1 text-[11px] font-bold tracking-wider text-[var(--sr-acento-primario,var(--color-accent))] shadow-sm backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-ping" />
                    <span>{prenda.tienda === 'Segunda mano' ? 'MODA CIRCULAR BOGOTÁ' : 'DISEÑO INDEPENDIENTE BOGOTÁ'}</span>
                    {prenda.barrio && (
                      <>
                        <span className="text-[var(--color-text-muted)]">·</span>
                        <span className="text-[var(--color-text)] uppercase">{prenda.barrio}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Contenedor interactivo de la foto con aura y zoom */}
                <div
                  className={`group/stage relative w-full max-w-[24.5rem] sm:max-w-[27rem] aspect-[3/4] flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-300 ${
                    zoomActivo ? 'cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  onClick={() => setZoomActivo((prev) => !prev)}
                  onMouseMove={handleMouseMoveZoom}
                  onMouseLeave={() => setZoomActivo(false)}
                >
                  {/* Fondo difuminado de la misma imagen activa */}
                  <img
                    src={imagenActiva || prenda.imagen}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none absolute inset-0 h-full w-full scale-[1.4] object-cover opacity-60 blur-[36px] saturate-[1.25]"
                  />
                  {/* Gradiente radial de luz editorial */}
                  <div
                    className="pointer-events-none absolute inset-0 bg-radial from-transparent via-[var(--sr-superficie,var(--color-surface))]/40 to-[var(--sr-superficie,var(--color-surface))]/80"
                    aria-hidden="true"
                  />

                  {/* Contador de vistas / Ángulo actual */}
                  <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/15 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                      {indiceImagen + 1}/{imagenesDisponibles.length} · {ANGLE_LABELS[indiceImagen] || `Ángulo ${indiceImagen + 1}`}
                    </span>
                  </div>

                  {/* Botón de inspeccionar textura / Zoom */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setZoomActivo((prev) => !prev)
                    }}
                    className="absolute top-3 right-3 z-30 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold text-white/90 hover:text-white hover:bg-black/90 backdrop-blur-md border border-white/15 transition shadow-sm"
                    title={zoomActivo ? 'Desactivar zoom' : 'Inspeccionar textura / Zoom'}
                    aria-label={zoomActivo ? 'Desactivar zoom' : 'Inspeccionar textura / Zoom'}
                  >
                    <span>{zoomActivo ? '✕' : '🔍'}</span>
                    <span className="hidden sm:inline">{zoomActivo ? 'Cerrar zoom' : 'Zoom textura'}</span>
                  </button>

                  {/* Flechas de navegación para cambiar ángulo (si hay más de 1 imagen) */}
                  {imagenesDisponibles.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          anteriorFoto()
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-lg font-bold text-white hover:bg-black/90 hover:scale-110 active:scale-95 transition backdrop-blur-md border border-white/20 shadow-lg"
                        aria-label="Ver ángulo anterior"
                        title="Ángulo anterior"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          siguienteFoto()
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-lg font-bold text-white hover:bg-black/90 hover:scale-110 active:scale-95 transition backdrop-blur-md border border-white/20 shadow-lg"
                        aria-label="Ver ángulo siguiente"
                        title="Ángulo siguiente"
                      >
                        ›
                      </button>
                    </>
                  )}

                  {/* Prenda activa completa: con zoom interactivo o presentación hero */}
                  <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden p-3">
                    <img
                      src={imagenActiva || prenda.imagen}
                      alt={`${prenda.nombre} - ${ANGLE_LABELS[indiceImagen] || 'vista de prenda'}`}
                      style={
                        zoomActivo
                          ? {
                              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                              transform: 'scale(2.3)',
                              transition: 'transform 100ms ease-out',
                            }
                          : undefined
                      }
                      className={`max-h-[92%] max-w-[92%] w-auto h-auto object-contain sr-hero-image-animate drop-shadow-2xl transition-all duration-300 ${
                        zoomActivo ? 'brightness-105' : 'group-hover/stage:scale-[1.02]'
                      }`}
                    />
                  </div>

                  {/* Indicador de puntos (dots) en la parte inferior de la imagen */}
                  {imagenesDisponibles.length > 1 && (
                    <div className="absolute bottom-3 inset-x-0 z-30 flex items-center justify-center gap-1.5 pointer-events-none">
                      {imagenesDisponibles.map((_, dotIdx) => (
                        <span
                          key={dotIdx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            dotIdx === indiceImagen ? 'w-5 bg-[var(--color-accent)]' : 'w-1.5 bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Sombra elíptica en el suelo */}
                <div className="sr-hero-shadow" aria-hidden="true" />

                {/* Franja de Miniaturas de los 4 Ángulos */}
                {imagenesDisponibles.length > 1 && (
                  <div className="mt-3 w-full max-w-[24.5rem] sm:max-w-[27rem] z-20">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <span>ÁNGULOS DE LA PRENDA</span>
                        <span className="rounded bg-[var(--color-accent)]/20 px-1.5 py-0.5 text-[9px] font-black text-[var(--color-accent)]">
                          {imagenesDisponibles.length} VISTAS
                        </span>
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">Toca para cambiar</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2.5" role="tablist" aria-label="Ángulos y vistas de la prenda">
                      {imagenesDisponibles.map((imgUrl, idx) => {
                        const isActive = (imagenActiva === imgUrl) || (indiceImagen === idx)
                        const angleLabel = ANGLE_LABELS[idx] || `Vista ${idx + 1}`
                        return (
                          <button
                            key={imgUrl + idx}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-label={`Ver vista ${idx + 1}: ${angleLabel}`}
                            onClick={() => seleccionarFoto(imgUrl, idx)}
                            className={`group/thumb relative flex flex-col items-center rounded-xl p-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))] ${
                              isActive
                                ? 'ring-2 ring-[var(--sr-acento-primario,var(--color-accent))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] shadow-md -translate-y-0.5'
                                : 'border border-[var(--sr-border-subtle,var(--color-border))] opacity-75 hover:opacity-100 hover:border-[var(--color-accent)]/50'
                            }`}
                          >
                            <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-black/20">
                              <img src={imgUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105" />
                            </div>
                            <span className={`mt-1 text-[9px] font-bold tracking-tight truncate max-w-full ${
                              isActive ? 'text-[var(--sr-acento-primario,var(--color-accent))]' : 'text-[var(--color-text-muted)]'
                            }`}>
                              {angleLabel}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ---------------------------------------------------- */}
              {/* COLUMNA IZQUIERDA: Información del producto (~28%)   */}
              {/* Desktop: Col 3 izq | Tablet: Col 1 | Mobile: order-2 */}
              {/* ---------------------------------------------------- */}
              <div className="flex flex-col justify-between md:col-span-1 lg:col-span-3 md:order-2 lg:order-1 order-2 sr-hero-col-left">
                <div>
                  {/* a) Marca o tienda en pequeño, mayúsculas, letter-spacing y color de acento */}
                  <Link
                    to={`/tiendas/${getStoreIdByName(prenda.tienda)}`}
                    className="text-xs font-bold uppercase tracking-[.22em] text-[var(--sr-acento-primario,var(--color-accent))] hover:underline inline-flex items-center gap-1"
                    title={`Ver tienda ${prenda.tienda}`}
                  >
                    <span>{prenda.tienda}</span>
                    <span aria-hidden="true">→</span>
                  </Link>

                  {/* b) Nombre del producto grande, en mayúsculas, en 2 líneas como máximo */}
                  <h1 className="mt-1.5 text-2xl sm:text-3xl lg:text-[1.75rem] font-black uppercase tracking-tight text-[var(--color-text)] leading-tight line-clamp-2">
                    {prenda.nombre}
                  </h1>

                  {/* Precio final */}
                  <div className="mt-3">
                    <p className="text-2xl font-black text-[var(--sr-acento-primario,var(--color-accent))]">
                      {formatCOP(prenda.precio)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)] font-medium">Precio final · IVA incluido (COP)</p>
                  </div>

                  {/* c) Descripción corta (3-5 líneas) con "Leer más" (si existe en los datos) */}
                  {prenda.descripcion && (
                    <div className="mt-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
                      <p className={descripcionExpandida ? '' : 'line-clamp-4'}>
                        {prenda.descripcion}
                      </p>
                      <button
                        type="button"
                        onClick={() => setDescripcionExpandida((prev) => !prev)}
                        className="mt-1.5 inline-block text-xs font-semibold text-[var(--sr-acento-primario,var(--color-accent))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))] rounded"
                      >
                        {descripcionExpandida ? 'Leer menos' : 'Leer más'}
                      </button>
                    </div>
                  )}

                  {/* Tarjeta de disponibilidad en tienda real (RF-22) */}
                  <div className="mt-6 rounded-2xl border border-white/15 dark:border-white/10 bg-white/50 dark:bg-white/[0.04] p-4 text-xs text-[var(--color-text)] backdrop-blur-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success-bg,rgba(16,185,129,0.15))] border border-[var(--color-success-border,rgba(16,185,129,0.3))] px-2.5 py-0.5 text-[0.625rem] font-bold text-[var(--color-success-text,#10b981)]">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Disponible hoy
                      </span>
                      <span className="font-semibold text-[var(--color-text)]">Disponibilidad en tienda real</span>
                    </div>
                    <p className="mt-1 text-[var(--color-text-muted)] text-[0.6875rem] leading-relaxed">
                      Disponible hoy para entrega o retiro inmediato en <strong>{prenda.tienda}</strong>{prenda.barrio ? ` (${prenda.barrio})` : ''}.
                    </p>
                    {/* RF-73: Contactar a la tienda */}
                    <ContactButton
                      className="mt-3 w-full"
                      label="Enviar mensaje a la tienda"
                      contacto={tiendaContacto(prenda.tienda)}
                      asunto={prenda.nombre}
                      referenciaId={prenda.id}
                    />
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* COLUMNA DERECHA: Selectores de Talla y Color (~28%)   */}
              {/* Desktop: Col 3 der | Tablet: Col 2 | Mobile: order-3 */}
              {/* ---------------------------------------------------- */}
              <div className="flex flex-col justify-between md:col-span-1 lg:col-span-3 md:order-3 lg:order-3 order-3 sr-hero-col-right">
                <div>
                  {/* a) TALLA como título con letter-spacing y chips redondos */}
                  {prenda.tallas && prenda.tallas.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-[0.6875rem] font-bold uppercase tracking-[.18em] text-[var(--color-text-muted)]">
                        <div className="flex items-center gap-2">
                          <span>TALLA</span>
                          <button
                            type="button"
                            onClick={() => setGuiaTallasAbierta(true)}
                            className="text-[var(--color-accent)] hover:underline capitalize font-semibold tracking-normal text-[11px]"
                          >
                            📏 Guía de tallas
                          </button>
                        </div>
                        {tallaSeleccionada && (
                          <span className="text-[var(--sr-acento-primario,var(--color-accent))] font-bold text-xs lowercase first-letter:uppercase">
                            Talla elegida: {tallaSeleccionada}
                          </span>
                        )}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Tallas disponibles">
                        {prenda.tallas.map((talla) => {
                          const isSelected = tallaSeleccionada === talla
                          const isAgotada = agotadas.includes(talla)
                          return (
                            <button
                              key={talla}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              disabled={isAgotada}
                              aria-label={isAgotada ? `${talla}, agotada` : talla}
                              onClick={() => setTallaSeleccionada(isSelected ? '' : talla)}
                              className={`h-10 w-10 rounded-full border text-xs font-bold transition flex items-center justify-center disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))] ${
                                isSelected
                                  ? 'border-purple-400 bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] text-white shadow-[0_4px_14px_rgba(139,92,246,0.45)] scale-105'
                                  : 'border-white/15 dark:border-white/15 bg-white/5 dark:bg-white/5 text-[var(--color-text)] hover:border-purple-400/50 hover:bg-white/10'
                              }`}
                            >
                              {talla}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* b) COLOR como título y muestra de color */}
                  {prenda.color && (
                    <div className="mt-6">
                      <span className="block text-[0.6875rem] font-bold uppercase tracking-[.18em] text-[var(--color-text-muted)]">
                        COLOR
                      </span>
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-[var(--sr-acento-primario,var(--color-accent))] p-0.5 bg-[var(--sr-surface-raised,var(--color-surface-raised))] shadow-sm">
                            <img
                              src={prenda.recorte || prenda.imagen}
                              alt={prenda.color}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="text-[0.625rem] font-semibold text-[var(--color-text)]">
                            {prenda.color}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* c) Botones de acción principales */}
                  <div className="mt-8 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {/* Botón secundario Favorito (solo borde, con corazón) */}
                      <button
                        type="button"
                        onClick={handleGuardar}
                        aria-pressed={guardado}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-xs font-bold backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))] ${
                          guardado
                            ? 'border-purple-400 bg-purple-500/20 text-purple-300 shadow-[0_2px_12px_rgba(168,85,247,0.25)]'
                            : 'border-white/15 dark:border-white/15 bg-white/5 dark:bg-white/5 text-[var(--color-text)] hover:bg-white/10 hover:border-purple-400/40'
                        }`}
                      >
                        <svg
                          className={`h-4 w-4 ${guardado ? 'fill-[var(--color-danger,#ef4444)] text-[var(--color-danger,#ef4444)]' : 'fill-none text-current'}`}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        <span>Favorito</span>
                      </button>

                      {/* Botón primario Ver tienda (morado suave con glow) */}
                      <Link
                        to={`/tiendas/${getStoreIdByName(prenda.tienda)}`}
                        className="flex-1 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#A78BFA] via-[#8B5CF6] to-[#7C3AED] px-6 py-3 text-xs font-bold text-white shadow-[0_4px_20px_-2px_rgba(139,92,246,0.5)] border border-white/20 transition-all hover:from-[#B49BFB] hover:to-[#8B5CF6] hover:shadow-[0_6px_25px_-2px_rgba(139,92,246,0.65)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))]"
                      >
                        Ver tienda
                      </Link>
                    </div>

                    {/* Botón secundario Guardar en playlist */}
                    <button
                      type="button"
                      onClick={handleGuardarPlaylist}
                      aria-pressed={guardadoPlaylist}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))] ${
                        guardadoPlaylist
                          ? 'border-purple-400 bg-purple-500/20 text-purple-300 shadow-[0_2px_12px_rgba(168,85,247,0.25)]'
                          : 'border-white/15 dark:border-white/15 bg-white/5 dark:bg-white/5 text-[var(--color-text)] hover:bg-white/10 hover:border-purple-400/40'
                      }`}
                    >
                      <span>📑</span>
                      <span>{guardadoPlaylist ? 'En tu playlist de estilo' : 'Guardar en playlist'}</span>
                    </button>

                    {/* Enlace directo para probarse la prenda en el probador virtual / maniquí (RF-24 / RF-57) */}
                    {prenda.noDisponibleEnProbador || /^(Calzado|Tenis|Zapatos|Botas|Accesorio|Cinturón|Bufanda|Bolso|Gorra|Gafas|Chaqueta|Abrigo|Gabardina)$/i.test(prenda.tipo || '') ? (
                      <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-2.5 text-center text-xs text-[var(--color-text-muted)]">
                        La prenda no está disponible o no admite prueba virtual.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Link
                          to={`/probador?prenda=${prenda.id}&talla=${tallaSeleccionada || prenda.tallas[0] || 'M'}&color=${encodeURIComponent(prenda.color || 'default')}`}
                          aria-label="Probarme esta prenda en el probador - Probar en el maniquí"
                          className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-400/60 px-4 py-2.5 text-xs font-semibold text-[var(--color-text)] transition backdrop-blur-md shadow-[0_2px_12px_rgba(168,85,247,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))]"
                        >
                          <span>✨ Probar en el maniquí</span>
                        </Link>
                        <Link
                          to={`/probador/avanzado?prenda=${prenda.id}&talla=${encodeURIComponent(tallaSeleccionada || prenda.tallas[0] || 'M')}`}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-violeta/40 bg-violeta/15 hover:bg-violeta/25 px-4 py-2 text-xs font-semibold text-[var(--color-text)] transition"
                        >
                          <span>📷 Probar con tu foto (IA)</span>
                        </Link>
                      </div>
                    )}

                    {/* Reserva en tienda (ms-inventario) y alerta de disponibilidad (ms-notificaciones) */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button type="button" onClick={reservar} disabled={!!ocupado} className={`${BTN_PRINCIPAL} flex-1`}>
                        {ocupado === 'reserva' ? 'Reservando…' : 'Reservar en tienda'}
                      </button>
                      <button type="button" onClick={seguimiento === null ? crearAlerta : cancelarSeguimiento} disabled={!!ocupado} className={`${BTN_SECUNDARIO} flex-1`}>
                        {ocupado === 'alerta' ? (seguimiento === null ? 'Creando alerta…' : 'Cancelando…') : seguimiento === null ? 'Avisarme cuando llegue' : 'Cancelar seguimiento'}
                      </button>
                    </div>
                    {aviso && (
                      <Aviso tono={aviso.tono} className="mt-1" titulo={aviso.titulo} acciones={accionAviso(aviso)} onCerrar={() => setAviso(null)}>
                        {aviso.texto}
                      </Aviso>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* FRANJA INFERIOR: Atributos reales con iconos redondos */}
            {/* ---------------------------------------------------- */}
            <div className="mt-12 pt-8 border-t border-[var(--sr-border-subtle,var(--color-border))]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {/* 1. Tienda */}
                <Link
                  to={`/tiendas/${getStoreIdByName(prenda.tienda)}`}
                  className="group flex flex-col items-center gap-2"
                  title={`Ver tienda ${prenda.tienda}`}
                >
                  <div className="h-12 w-12 rounded-full border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] flex items-center justify-center text-[var(--sr-acento-primario,var(--color-accent))] shadow-sm group-hover:border-[var(--color-accent)] transition">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">TIENDA</p>
                    <p className="text-xs font-bold text-[var(--color-text)] truncate max-w-[8.125rem] group-hover:text-[var(--color-accent)] group-hover:underline">
                      {prenda.tienda} →
                    </p>
                  </div>
                </Link>

                {/* 2. Barrio */}
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] flex items-center justify-center text-[var(--sr-acento-primario,var(--color-accent))] shadow-sm">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">SECTOR</p>
                    <p className="text-xs font-bold text-[var(--color-text)]">{prenda.barrio || 'Bogotá'}</p>
                  </div>
                </div>

                {/* 3. Distancia */}
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] flex items-center justify-center text-[var(--sr-acento-primario,var(--color-accent))] shadow-sm">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">CERCANÍA</p>
                    <p className="text-xs font-bold text-[var(--color-text)]">
                      {prenda.distanciaKm > 0 ? `a ${prenda.distanciaKm.toLocaleString('es-CO', { maximumFractionDigits: 2 })} km` : 'Bogotá'}
                    </p>
                  </div>
                </div>

                {/* 4. Estilo */}
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] flex items-center justify-center text-[var(--sr-acento-primario,var(--color-accent))] shadow-sm">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">ESTILO</p>
                    <p className="text-xs font-bold text-[var(--color-text)]">{prenda.estilo}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* ======================================================== */}
          {/* SECCIÓN PRENDAS SIMILARES (RF-16)                        */}
          {/* ======================================================== */}
          {similares.length > 0 && (
            <div className="border-t border-[var(--sr-border-subtle,var(--color-border))] pt-10">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--sr-acento-primario,var(--color-accent))]">Recomendaciones</span>
                  <h2 className="mt-1 text-2xl font-bold text-[var(--color-text)]">Prendas similares</h2>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Otras opciones disponibles con tipo o estilo compatible.
                  </p>
                </div>
                <Link to={`/catalogo?estilo=${encodeURIComponent(prenda.estilo)}`} className="text-xs font-semibold text-[var(--sr-acento-primario,var(--color-accent))] hover:underline">
                  Ver todas →
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(10.625rem,1fr))]">
                {similares.map((sim) => (
                  <ItemCard key={sim.id} item={sim} />
                ))}
              </div>
            </div>
          )}
          {/* Modal de guía de tallas */}
          <SizeGuideModal
            isOpen={guiaTallasAbierta}
            onClose={() => setGuiaTallasAbierta(false)}
            tipoPrenda={prenda.tipo}
          />
        </div>
      )}
    </section>
  )
}
