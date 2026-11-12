import { useState, useRef, useEffect, useMemo } from 'react'
import type { ConversacionDto, MensajeDto } from '../types/chat.dto'
import { VinylCanvas } from './VinylCanvas'
import { Tonearm } from './Tonearm'
import { ConversationAvatar } from './ConversationAvatar'
import { ChatGlass } from './ChatGlass'
import { useVinylLayout } from './useVinylLayout'
import './VinylStyles.css'

interface MessagesVinylProps {
  conversations: ConversacionDto[]
  selectedId: string | null
  currentUserId: string
  onSelect: (id: string | null) => void
  onRead: (id: string) => void
  onSent: (m: MensajeDto) => void
}

export function MessagesVinyl({
  conversations,
  selectedId,
  currentUserId,
  onSelect,
  onRead,
  onSent,
}: MessagesVinylProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState(580)
  const [isHovered, setIsHovered] = useState(false)
  const [impactPos, setImpactPos] = useState<{ x: number; y: number } | null>(null)
  const [overflowTrack, setOverflowTrack] = useState<number | null>(null)

  // Medir ancho responsivo del contenedor
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateSize = () => {
      const w = el.clientWidth
      if (w > 0) {
        // En desktop hasta 620px, en móvil ancho disponible menos padding
        const target = Math.min(620, Math.max(310, w))
        setContainerSize(target)
      }
    }

    updateSize()
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateSize)
      ro.observe(el)
      return () => ro.disconnect()
    }
  }, [])

  // Total de mensajes sin leer para el centro del vinilo
  const totalUnread = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.noLeidos || 0), 0)
  }, [conversations])

  const selectedConv = useMemo(() => {
    if (!selectedId) return null
    return conversations.find((c) => c.id === selectedId) || null
  }, [conversations, selectedId])

  // Hook principal de distribución física y giro
  const { items, overflowMap, selectedItem, rotationRad, avatarSize } = useVinylLayout({
    conversaciones: conversations,
    selectedId,
    containerSize,
    isHovered,
    hasActiveChat: Boolean(selectedConv),
  })

  // Impacto de la aguja sobre el contacto
  const handleNeedleImpact = (coords: { x: number; y: number }) => {
    setImpactPos(coords)
  }

  // Cierre de chat
  const handleCloseChat = () => {
    setImpactPos(null)
    onSelect(null)
  }

  // Coordenada por defecto del punto de impacto si aún no ha disparado el callback
  const effectiveImpactPos = useMemo(() => {
    if (impactPos) return impactPos
    if (selectedItem) {
      return {
        x: containerSize / 2 + selectedItem.x,
        y: containerSize / 2 + selectedItem.y,
      }
    }
    return null
  }, [impactPos, selectedItem, containerSize])

  return (
    <div
      ref={containerRef}
      className="relative w-full flex flex-col items-center justify-center my-4 overflow-visible"
    >
      <div className="relative w-full flex flex-col lg:flex-row items-center justify-center gap-8 min-h-[580px]">
        {/* ESCENARIO DEL VINILO */}
        <div
          className={`sr-vinyl-disc-container relative shrink-0 transition-transform duration-700 ease-out select-none ${
            selectedConv ? 'lg:-translate-x-8 lg:scale-[0.90]' : 'scale-100'
          }`}
          style={{
            width: `${containerSize}px`,
            height: `${containerSize}px`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 1. Canvas del Disco de Vinilo (Fondo radial, surcos, luz cónica y galleta central) */}
          <VinylCanvas
            size={containerSize}
            rotationRad={rotationRad}
            totalUnread={totalUnread}
          />

          {/* 2. Lista accesible de contactos en el vinilo */}
          <aside
            role="complementary"
            aria-label="Conversaciones"
            className="absolute inset-0 pointer-events-none"
          >
            <ul role="list" className="contents">
              {items.map((item) => (
                <li key={item.id} role="listitem" className="contents">
                  <ConversationAvatar
                    item={item}
                    isSelected={item.id === selectedId}
                    size={avatarSize}
                    onClick={() => {
                      if (item.id === selectedId) {
                        handleCloseChat()
                      } else {
                        onSelect(item.id)
                      }
                    }}
                  />
                </li>
              ))}
            </ul>
          </aside>

          {/* 3. Indicadores de Desborde (+N) para surcos con más de 12 contactos */}
          {([1, 2, 3] as const).map((trackLevel) => {
            const overflow = overflowMap[trackLevel]
            if (!overflow || overflow.length === 0) return null
            return (
              <div
                key={`overflow-${trackLevel}`}
                className="absolute z-20"
                style={{
                  top: '12%',
                  right: trackLevel === 1 ? '18%' : trackLevel === 2 ? '12%' : '6%',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOverflowTrack(trackLevel)}
                  aria-label={`Ver ${overflow.length} conversaciones adicionales en el surco ${trackLevel}`}
                  className="rounded-full bg-[#D62F6B] text-white text-xs font-black px-2.5 py-1 shadow-lg hover:scale-110 active:scale-95 transition"
                >
                  +{overflow.length}
                </button>
              </div>
            )
          })}

          {/* 4. Brazo Fonocaptor Telescópico (Tonearm) */}
          <Tonearm
            size={containerSize}
            selectedItem={selectedItem}
            onImpact={handleNeedleImpact}
          />
        </div>

        {/* MODAL DE OVERFLOW (Si un surco supera 12 contactos) */}
        {overflowTrack !== null && overflowMap[overflowTrack as 1 | 2 | 3] && (
          <div
            role="dialog"
            aria-label="Más conversaciones"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-[#150E27]/95 p-5 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-base">Conversaciones adicionales</h3>
                <button
                  type="button"
                  onClick={() => setOverflowTrack(null)}
                  className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                  aria-label="Cerrar lista adicional"
                >
                  ✕
                </button>
              </div>
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {overflowMap[overflowTrack as 1 | 2 | 3].map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOverflowTrack(null)
                        onSelect(c.id)
                      }}
                      className="w-full text-left p-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] transition flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{c.contacto.nombre}</p>
                        <p className="text-xs text-[#CFC6E0] truncate">{c.asunto}</p>
                      </div>
                      {c.noLeidos > 0 && (
                        <span className="ml-2 rounded-full bg-[#D62F6B] px-2 py-0.5 text-[11px] font-bold">
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

        {/* VENTANA DE CHAT CRISTAL TRANSLÚCIDO */}
        {selectedConv && (
          <div className="w-full lg:w-[460px] xl:w-[500px] shrink-0 z-30 transition-all">
            <ChatGlass
              key={`vinyl-chat-${selectedConv.id}`}
              conv={selectedConv}
              me={currentUserId}
              isOpen={Boolean(selectedConv)}
              impactPos={effectiveImpactPos}
              onClose={handleCloseChat}
              onRead={onRead}
              onSent={onSent}
            />
          </div>
        )}
      </div>
    </div>
  )
}
