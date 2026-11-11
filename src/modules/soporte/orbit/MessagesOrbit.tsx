import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ConversacionDto, MensajeDto } from '../types/chat.dto'
import { ChatGlass } from './ChatGlass'
import { OrbitCanvas } from './OrbitCanvas'
import { Rocket } from './Rocket'
import { useOrbitLayout } from './useOrbitLayout'
import {
  ORBIT_RINGS,
  ORBIT_TILT_RAD,
  type OrbitItem,
  type OrbitLevel,
} from './types'
import './OrbitStyles.css'

interface MessagesOrbitProps {
  conversations: ConversacionDto[]
  selectedId: string | null
  currentUserId: string
  onSelect: (id: string | null) => void
  onRead: (id: string) => void
  onSent: (m: MensajeDto) => void
  onToggleListView?: () => void
  isListView?: boolean
}

export function MessagesOrbit({
  conversations,
  selectedId,
  currentUserId,
  onSelect,
  onRead,
  onSent,
  onToggleListView,
  isListView = false,
}: MessagesOrbitProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 })
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
  )

  // Escuchar preferencia de movimiento reducido
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return
    const sync = () => setPrefersReducedMotion(media.matches)
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  // Medir contenedor dinámicamente
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions({ width, height: Math.max(height, 580) })
        }
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Hook de distribución orbital
  const { items, totalUnread, overflowByLevel } = useOrbitLayout({
    conversations,
    prefersReducedMotion,
  })

  // Estados de animación de vuelo e impacto
  const [targetPoint, setTargetPoint] = useState<{ x: number; y: number } | null>(null)
  const [impactPoint, setImpactPoint] = useState<{ x: number; y: number } | null>(null)
  const [impactedItemId, setImpactedItemId] = useState<string | null>(null)
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const [expandingRing, setExpandingRing] = useState<{ x: number; y: number } | null>(null)
  const [overflowModalLevel, setOverflowModalLevel] = useState<OrbitLevel | null>(null)
  const pendingSelectIdRef = useRef<string | null>(null)

  // Referencia al botón del avatar para devolver foco al cerrar
  const lastActiveAvatarRef = useRef<HTMLButtonElement | null>(null)

  // Derivación declarativa del ítem seleccionado
  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    const match = items.find((i) => i.id === selectedId)
    if (match) return match
    const conv = conversations.find((c) => c.id === selectedId)
    if (conv) {
      return {
        id: conv.id,
        conv,
        orbitLevel: (conv.noLeidos > 0 ? 1 : 2) as OrbitLevel,
        angle: 0,
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        zIndex: 20,
        unreadCount: conv.noLeidos || 0,
        initials: conv.contacto.nombre.slice(0, 2).toUpperCase(),
      }
    }
    return null
  }, [selectedId, items, conversations])

  const isChatOpen = Boolean(selectedId && selectedItem)

  // Iniciar vuelo de la nave hacia el avatar seleccionado
  const handleAvatarClick = useCallback(
    (item: OrbitItem, e: React.MouseEvent<HTMLButtonElement>) => {
      lastActiveAvatarRef.current = e.currentTarget

      if (prefersReducedMotion) {
        onSelect(item.id)
        return
      }

      // Convertir coordenadas del ítem a coordenadas dentro del contenedor
      const cx = dimensions.width / 2
      const cy = dimensions.height / 2
      const targetCanvasX = cx + item.x
      const targetCanvasY = cy + item.y

      pendingSelectIdRef.current = item.id
      setTargetPoint({ x: targetCanvasX, y: targetCanvasY })
    },
    [dimensions, prefersReducedMotion, onSelect],
  )

  // Callback al completarse el impacto de la nave
  const handleImpact = useCallback(
    (point: { x: number; y: number }) => {
      setImpactPoint(point)
      const targetId = pendingSelectIdRef.current
      if (targetId) {
        setImpactedItemId(targetId)
        onSelect(targetId)
      }

      // 1. Temblor de cámara sobrio
      setShakeIntensity(1)
      setTimeout(() => setShakeIntensity(0), 450)

      // 2. Anillo blanco expansivo
      setExpandingRing(point)
      setTimeout(() => setExpandingRing(null), 1000)

      // Quitar rebote del avatar tras 800ms
      setTimeout(() => setImpactedItemId(null), 800)
    },
    [onSelect],
  )

  // Cerrar chat y retornar a la vista centrada
  const handleCloseChat = useCallback(() => {
    pendingSelectIdRef.current = null
    setTargetPoint(null)
    setImpactPoint(null)
    onSelect(null)

    // Devolver el foco al avatar que se seleccionó
    setTimeout(() => {
      lastActiveAvatarRef.current?.focus()
    }, 100)
  }, [onSelect])

  const cx = dimensions.width / 2
  const cy = dimensions.height / 2

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden py-4 select-none"
      aria-label="Sistema solar de mensajes"
    >
      {/* Botón de alternancia de vista (Órbita / Lista accesible) */}
      <div className="absolute top-2 right-4 z-40 flex items-center gap-3">
        {onToggleListView && (
          <button
            type="button"
            onClick={onToggleListView}
            className="flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 font-semibold text-xs tracking-wider text-white shadow-lg backdrop-blur-md transition hover:border-white/50 hover:bg-white/10"
            aria-label={isListView ? 'Ver en modo órbita' : 'Ver como lista simple'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {isListView ? (
                <circle cx="12" cy="12" r="9" />
              ) : (
                <>
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                  <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                </>
              )}
            </svg>
            <span>{isListView ? 'Ver órbita' : 'Ver como lista'}</span>
          </button>
        )}
      </div>

      {/* Contenedor animado de la escena: en escritorio se desplaza (-27% scale .8) cuando el chat se abre */}
      <div
        className={`sr-orbit-scene-wrapper relative flex h-[600px] w-full max-w-[1050px] items-center justify-center ${
          isChatOpen ? 'has-chat-open' : ''
        }`}
      >
        {/* 1. Canvas con órbitas elípticas continuas, estrellas, cometas y partículas de impacto */}
        <OrbitCanvas
          width={dimensions.width}
          height={dimensions.height}
          impactPoint={impactPoint}
          shakeIntensity={shakeIntensity}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* 2. Anillo blanco expansivo sincronizado */}
        {expandingRing && (
          <div
            className="sr-expanding-ring"
            style={{
              left: `${expandingRing.x}px`,
              top: `${expandingRing.y}px`,
            }}
            aria-hidden="true"
          />
        )}

        {/* 3. Nave espacial en vuelo y mira (reticle) */}
        <Rocket
          target={targetPoint}
          onImpact={handleImpact}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* 4. HUB CENTRAL (Sol/Centro del sistema) */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center text-center pointer-events-none"
          style={{ transform: 'translate3d(0, 0, 0)' }}
          aria-hidden="true"
        >
          <p className="text-sm font-light uppercase tracking-[0.3em] text-[#CFC6E0] opacity-90">
            Tus
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(75,31,168,0.7)]">
            Mensajes
          </h1>
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#4B1FA8] px-3.5 py-1 text-xs font-bold tracking-wider text-[#F7F1E4] shadow-[0_0_20px_rgba(75,31,168,0.8)]">
            <span className="h-2 w-2 rounded-full bg-[#D62F6B] animate-ping" />
            <span>{totalUnread} sin leer</span>
          </div>
        </div>

        {/* 5. Etiquetas de Órbitas */}
        {/* Etiqueta Órbita 1 (SIN LEER) */}
        <div
          className="pointer-events-none absolute z-15"
          style={{
            transform: `translate3d(0px, ${-ORBIT_RINGS[1].ry - 18}px, 0) rotate(${ORBIT_TILT_RAD}rad)`,
          }}
          aria-hidden="true"
        >
          <span className="inline-flex items-center gap-1 rounded-full border border-[#D62F6B]/50 bg-[#D62F6B]/20 px-2.5 py-0.5 text-[9px] font-extrabold tracking-widest text-[#D62F6B] shadow-[0_0_12px_rgba(214,47,107,0.4)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D62F6B] animate-pulse" />
            SIN LEER
          </span>
        </div>

        {/* Etiqueta Órbita 3 (ANTIGUOS) */}
        <div
          className="pointer-events-none absolute z-15"
          style={{
            transform: `translate3d(0px, ${ORBIT_RINGS[3].ry + 10}px, 0) rotate(${ORBIT_TILT_RAD}rad)`,
          }}
          aria-hidden="true"
        >
          <span className="inline-flex items-center rounded-full border border-white/20 bg-black/40 px-3 py-0.5 text-[9px] font-bold tracking-widest text-white/50 uppercase">
            ANTIGUOS
          </span>
        </div>

        {/* 6. AVATARES DE CONVERSACIONES EN ÓRBITA */}
        <div className="absolute inset-0 z-25 pointer-events-auto" role="group" aria-label="Órbita de conversaciones">
          {items.map((item) => {
            const isSelected = selectedItem?.id === item.id
            const isImpacted = impactedItemId === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleAvatarClick(item, e)}
                className={`group absolute flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-transform duration-300 focus-visible:outline-none ${
                  isImpacted ? 'animate-spring-bounce' : ''
                }`}
                style={{
                  transform: `translate3d(${cx + item.x}px, ${cy + item.y}px, 0) translate(-50%, -50%) scale(${item.scale})`,
                  opacity: item.opacity,
                  zIndex: isSelected ? 40 : item.zIndex,
                }}
                aria-label={`${item.conv.contacto.nombre}, órbita ${
                  ORBIT_RINGS[item.orbitLevel].label
                }, ${
                  item.unreadCount > 0 ? `${item.unreadCount} sin leer` : 'leído'
                }. ${item.conv.asunto}`}
                aria-current={isSelected ? 'true' : undefined}
              >
                {/* Avatar circular con iniciales */}
                <div
                  className={`relative flex h-12 w-12 items-center justify-center rounded-full font-bold text-xs tracking-wider text-white shadow-xl transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-1 group-focus-visible:ring-4 group-focus-visible:ring-[#B79AF5] ${
                    item.orbitLevel === 1
                      ? 'ring-2 ring-[#D62F6B] shadow-[0_0_18px_rgba(214,47,107,0.7)]'
                      : 'ring-1 ring-white/30'
                  }`}
                  style={{
                    background: item.conv.contacto.tipo === 'TIENDA'
                      ? 'linear-gradient(135deg, #4B1FA8 0%, #7B4DD8 100%)'
                      : item.conv.contacto.tipo === 'FUNDACION'
                        ? 'linear-gradient(135deg, #E69F00 0%, #D62F6B 100%)'
                        : 'linear-gradient(135deg, #2D1452 0%, #6A2F8A 100%)',
                  }}
                >
                  <span>{item.initials}</span>

                  {/* Insignia de no leídos */}
                  {item.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D62F6B] px-1 font-black text-[10px] text-white shadow-[0_0_10px_#D62F6B] ring-2 ring-[#120E1C]">
                      {item.unreadCount}
                    </span>
                  )}
                </div>

                {/* Etiqueta de nombre bajo el avatar */}
                <span className="mt-1 max-w-[85px] truncate rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-sm group-hover:text-white transition">
                  {item.conv.contacto.nombre}
                </span>
              </button>
            )
          })}

          {/* Botones de overflow si hay más de 8 conversaciones en una órbita */}
          {([1, 2, 3] as OrbitLevel[]).map((level) => {
            const overflow = overflowByLevel[level]
            if (!overflow || overflow.length === 0) return null
            const ring = ORBIT_RINGS[level]

            return (
              <button
                key={`overflow-${level}`}
                type="button"
                onClick={() => setOverflowModalLevel(level)}
                className="absolute flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/30 bg-black/60 px-2.5 py-1 text-[11px] font-extrabold text-[#B79AF5] shadow-lg backdrop-blur-md hover:bg-white/15 hover:scale-105 transition"
                style={{
                  transform: `translate3d(${cx + ring.rx * 0.7}px, ${cy + ring.ry * 0.7}px, 0) translate(-50%, -50%)`,
                  zIndex: 35,
                }}
                aria-label={`Ver ${overflow.length} conversaciones adicionales en órbita ${ring.label}`}
              >
                +{overflow.length}
              </button>
            )
          })}
        </div>
      </div>

      {/* 7. CHAT CON EFECTO VIDRIO (GLASS) */}
      {selectedItem && (
        <div
          className={`z-50 w-full transition-all duration-700 ${
            isChatOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          } lg:absolute lg:right-6 lg:top-1/2 lg:w-[460px] lg:-translate-y-1/2`}
        >
          <ChatGlass
            key={selectedItem.conv.id}
            conv={selectedItem.conv}
            me={currentUserId}
            isOpen={isChatOpen}
            impactPos={
              impactPoint
                ? {
                    x: impactPoint.x - (dimensions.width - 480),
                    y: impactPoint.y - dimensions.height / 2 + 300,
                  }
                : null
            }
            onClose={handleCloseChat}
            onRead={onRead}
            onSent={onSent}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      )}

      {/* Modal accesible si hay overflow de conversaciones en una órbita */}
      {overflowModalLevel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Conversaciones en órbita ${ORBIT_RINGS[overflowModalLevel].label}`}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#1A1428] p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-lg">
                Órbita {ORBIT_RINGS[overflowModalLevel].label}
              </h3>
              <button
                type="button"
                onClick={() => setOverflowModalLevel(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Cerrar lista"
              >
                ✕
              </button>
            </div>
            <ul className="mt-3 max-h-72 overflow-y-auto space-y-2">
              {overflowByLevel[overflowModalLevel].map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOverflowModalLevel(null)
                      onSelect(c.id)
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 p-3 text-left hover:bg-white/10 transition"
                  >
                    <div>
                      <p className="font-bold text-sm">{c.contacto.nombre}</p>
                      <p className="text-xs text-[#CFC6E0]">{c.asunto}</p>
                    </div>
                    {c.noLeidos > 0 && (
                      <span className="rounded-full bg-[#D62F6B] px-2 py-0.5 text-xs font-bold text-white">
                        {c.noLeidos}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
