import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { formatCOP } from '@/modules/core/utils/format'
import { PARA_TI_SIZE } from '@/modules/identidad/components/ParaTiSections'
import { feedService } from '@/modules/identidad/services/feedService'
import { TEXTOS_FEED, type FeedItemDto, type RecommendationsPageDto } from '@/modules/identidad/types/feed.dto'

const ANCHO = 150
const ALTO = 200
const DISTANCIA = 60
const VISIBLE_MS = 500
const MAX_IMAGENES = 14

interface Huella {
  id: number
  x: number
  y: number
  foto: string
  prenda: FeedItemDto
}

const OCULTA = { opacity: 0, filter: 'blur(10px)', scale: 0.5 }
const VISIBLE = { opacity: 1, filter: 'blur(0px)', scale: 1 }
const TRANSICION = {
  opacity: { duration: 0.35, ease: [0.25, 1, 0.5, 1] as const },
  filter: { duration: 0.35, ease: [0.25, 1, 0.5, 1] as const },
  scale: { type: 'spring' as const, visualDuration: 0.35, bounce: 0.12 },
}

export function RecomendadosTrail({ userId }: { userId: string }) {
  const [data, setData] = useState<RecommendationsPageDto | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [huellas, setHuellas] = useState<Huella[]>([])
  const [abierta, setAbierta] = useState<Huella | null>(null)
  const [activaId, setActivaId] = useState<number | null>(null)
  const [anchoZona, setAnchoZona] = useState(0)
  const reducir = useReducedMotion()

  const zonaRef = useRef<HTMLDivElement>(null)
  const ultimoPunto = useRef<{ x: number; y: number } | null>(null)
  const siguiente = useRef(0)
  const contador = useRef(0)
  const ultimaId = useRef<number | null>(null)
  const nacimientos = useRef(new Map<number, number>())
  const temporizadores = useRef(new Map<number, number>())

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(false)
    try {
      setData(await feedService.getRecommendations(userId, { page: 0, size: PARA_TI_SIZE }))
    } catch {
      setError(true)
    } finally {
      setCargando(false)
    }
  }, [userId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const prendas = useMemo(() => (data?.content ?? []).filter((p) => Boolean(p.photos?.[0])), [data])

  useEffect(() => {
    prendas.forEach((p) => {
      const img = new Image()
      img.src = p.photos?.[0] ?? ''
    })
  }, [prendas])

  useEffect(() => {
    const timers = temporizadores.current
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [])

  const retirar = useCallback((id: number) => {
    const nacio = nacimientos.current.get(id) ?? performance.now()
    const resta = Math.max(0, nacio + VISIBLE_MS - performance.now())
    const t = window.setTimeout(() => {
      temporizadores.current.delete(id)
      nacimientos.current.delete(id)
      setHuellas((prev) => prev.filter((h) => h.id !== id))
    }, resta)
    temporizadores.current.set(id, t)
  }, [])

  const soltarUltima = useCallback(() => {
    if (ultimaId.current !== null) {
      retirar(ultimaId.current)
      ultimaId.current = null
      setActivaId(null)
    }
  }, [retirar])

  const handleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (abierta || prendas.length === 0 || !zonaRef.current) return
    const rect = zonaRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const previo = ultimoPunto.current
    if (previo && Math.hypot(x - previo.x, y - previo.y) < DISTANCIA) return
    ultimoPunto.current = { x, y }

    const prenda = prendas[siguiente.current % prendas.length]
    siguiente.current += 1
    const id = ++contador.current
    nacimientos.current.set(id, performance.now())
    soltarUltima()
    ultimaId.current = id
    setActivaId(id)
    setHuellas((prev) => {
      const nuevas = [...prev, { id, x, y, foto: prenda.photos?.[0] ?? '', prenda }]
      return nuevas.length > MAX_IMAGENES ? nuevas.slice(nuevas.length - MAX_IMAGENES) : nuevas
    })
  }

  const handleLeave = () => {
    if (abierta) return
    ultimoPunto.current = null
    soltarUltima()
  }

  const cerrarInfo = useCallback(() => {
    setAbierta(null)
    ultimoPunto.current = null
    soltarUltima()
  }, [soltarUltima])

  useEffect(() => {
    if (!abierta) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrarInfo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abierta, cerrarInfo])

  const infoALaIzquierda = abierta ? abierta.x + ANCHO / 2 + 300 > anchoZona : false

  const encabezado = (
    <div className="sr-trail-texto">
      <p className="sr-inicio-kicker">Selección destacada</p>
      <h2 id="trail-titulo" className="sr-inicio-featured__title">ELEGIDO PARA TU TALLA</h2>
      <Link to="/catalogo" className="sr-inicio-enlace sr-trail-enlace">
        Ver todo el catálogo →
      </Link>
      <div className="sr-trail-etiquetas">
        <span className="sr-trail-etiqueta">Según tu perfil de estilo</span>
        <span className="sr-trail-separador" aria-hidden="true" />
        <span className="sr-trail-etiqueta sr-trail-etiqueta--suave">Recomendado para ti</span>
      </div>
      <p className="sr-trail-estado" role="status">
        {cargando
          ? 'Cargando tus recomendaciones…'
          : error
            ? TEXTOS_FEED.catalogoCaido
            : prendas.length === 0
              ? data?.message || TEXTOS_FEED.sinPreferencias
              : data?.message || 'Recomendaciones generadas según tu perfil.'}
      </p>
      {error && (
        <button type="button" onClick={cargar} className="sr-inicio-boton-secundario sr-trail-accion">
          Reintentar
        </button>
      )}
      {!cargando && !error && prendas.length === 0 && (
        <Link to="/perfil" className="sr-inicio-boton-secundario sr-trail-accion">
          Actualizar mi perfil
        </Link>
      )}
    </div>
  )

  return (
    <section className="sr-inicio-bloque sr-trail" aria-labelledby="trail-titulo">
      <div
        ref={zonaRef}
        className="sr-trail-zona"
        onPointerMove={handleMove}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse') handleMove(e)
        }}
        onPointerLeave={handleLeave}
      >
        {encabezado}

        <AnimatePresence>
          {huellas.map((h, i) => {
            const activa = h.id === activaId || abierta?.id === h.id
            return (
              <motion.button
                key={h.id}
                type="button"
                aria-label={`Ver información de ${h.prenda.name}`}
                tabIndex={activa ? 0 : -1}
                className={`sr-trail-imagen ${activa ? 'sr-trail-imagen--activa' : ''}`}
                style={{
                  left: h.x - ANCHO / 2,
                  top: h.y - ALTO / 2,
                  width: ANCHO,
                  height: ALTO,
                  zIndex: 10 + i,
                  backgroundImage: `url("${h.foto}")`,
                }}
                initial={reducir ? { opacity: 0 } : OCULTA}
                animate={reducir ? { opacity: 1 } : VISIBLE}
                exit={reducir ? { opacity: 0 } : OCULTA}
                transition={TRANSICION}
                onClick={() => {
                  if (!activa) return
                  const t = temporizadores.current.get(h.id)
                  if (t) {
                    window.clearTimeout(t)
                    temporizadores.current.delete(h.id)
                  }
                  ultimaId.current = h.id
                  setActivaId(h.id)
                  setAnchoZona(zonaRef.current?.clientWidth ?? 0)
                  setAbierta(h)
                }}
              />
            )
          })}
        </AnimatePresence>

        <AnimatePresence>
          {abierta && (
            <motion.div
              key={`info-${abierta.id}`}
              role="dialog"
              aria-label={abierta.prenda.name}
              className="sr-trail-info"
              style={{
                top: Math.max(8, abierta.y - ALTO / 2),
                left: infoALaIzquierda ? undefined : abierta.x + ANCHO / 2 + 16,
                right: infoALaIzquierda ? anchoZona - (abierta.x - ANCHO / 2) + 16 : undefined,
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
              onPointerMove={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={cerrarInfo} className="sr-trail-info__cerrar" aria-label="Cerrar">
                ×
              </button>
              <p className="sr-trail-info__nombre">{abierta.prenda.name}</p>
              <p className="sr-trail-info__meta">
                {abierta.prenda.brand ? `${abierta.prenda.brand} · ` : ''}
                {formatCOP(abierta.prenda.price)}
              </p>
              {abierta.prenda.reason?.trim() && (
                <p className="sr-trail-info__motivo">Por qué: {abierta.prenda.reason}</p>
              )}
              {(abierta.prenda.availableSizes?.length ?? 0) > 0 && (
                <p className="sr-trail-info__tallas">Tallas: {abierta.prenda.availableSizes?.join(', ')}</p>
              )}
              <Link to={`/catalogo/${abierta.prenda.itemId}`} className="sr-inicio-cta sr-trail-info__cta">
                Ver prenda
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
