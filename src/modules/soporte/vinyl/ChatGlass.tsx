import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/modules/core/api/errors'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { chatService } from '../services/chatService'
import {
  CONTACTO_LABEL,
  MAX_MENSAJE,
  type ConversacionDto,
  type MensajeDto,
  type TipoContacto,
} from '../types/chat.dto'
import { getContactPhoto, getInitials } from './types'

const REFRESH_MS = 15_000
const hora = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

interface ChatGlassProps {
  conv: ConversacionDto
  me: string
  isOpen: boolean
  impactPos?: { x: number; y: number } | null
  onClose: () => void
  onRead: (id: string) => void
  onSent: (m: MensajeDto) => void
  prefersReducedMotion?: boolean
}

export function ChatGlass({
  conv,
  me,
  isOpen,
  impactPos,
  onClose,
  onRead,
  onSent,
  prefersReducedMotion = false,
}: ChatGlassProps) {
  const loader = useCallback(() => chatService.messages(conv.id), [conv.id])
  const { data: msgs, loading, error, reload, setData } = useResource(loader, [] as MensajeDto[])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [lastSentId, setLastSentId] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)

  const endRef = useRef<HTMLLIElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const photoUrl = getContactPhoto(conv.contacto)
  const contactType = conv.contacto.tipo as TipoContacto
  const isPersona = contactType === 'COMPRADOR' || contactType === 'VENDEDOR' || contactType === 'DONANTE' || !contactType
  const isTienda = contactType === 'TIENDA'
  const isFundacion = contactType === 'FUNDACION'

  // Al abrir o cambiar mensajes, marcar como leída
  useEffect(() => {
    if (!loading && !error && isOpen) {
      onRead(conv.id)
    }
  }, [loading, error, conv.id, onRead, isOpen])

  // Desplazamiento automático al final de la lista
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [msgs.length])

  // Foco automático en el input al abrir el chat
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, prefersReducedMotion ? 50 : 350)
      return () => clearTimeout(timer)
    }
  }, [isOpen, prefersReducedMotion])

  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Sondeo periódico de mensajes nuevos
  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible' && isOpen) reload()
    }, REFRESH_MS)
    return () => window.clearInterval(t)
  }, [reload, isOpen])

  // Envío de mensaje
  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (sending || !texto.trim()) return
    setSending(true)
    setSendError('')
    try {
      const m = await chatService.send(conv.id, texto)
      setData((l) => [...l, m])
      setLastSentId(m.id)
      onSent(m)
      setTexto('')
    } catch (err) {
      setSendError(errorMessage(err, 'No pudimos enviar el mensaje. Intenta de nuevo.'))
    } finally {
      setSending(false)
    }
  }

  // Coordenadas relativas para el clip-path circular desde el punto de impacto de la aguja
  const originX = impactPos ? `${Math.round(impactPos.x)}px` : '50%'
  const originY = impactPos ? `${Math.round(impactPos.y)}px` : '50%'

  const clipPathStyle = prefersReducedMotion
    ? undefined
    : isOpen
      ? `circle(160% at ${originX} ${originY})`
      : `circle(0% at ${originX} ${originY})`

  return (
    <div
      ref={containerRef}
      className={`sr-vinyl-chat-glass relative flex h-[min(78vh,680px)] w-full flex-col overflow-hidden rounded-3xl transition-all shadow-2xl ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={{
        clipPath: clipPathStyle,
        transitionDuration: prefersReducedMotion ? '200ms' : '1000ms',
        transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        backdropFilter: 'blur(18px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
      }}
      role="region"
      aria-label={`Chat con ${conv.contacto.nombre}`}
    >
      {/* 1. Cabecera editorial del chat con fotografía real y forma del contacto */}
      <header className="flex items-center gap-3.5 border-b border-white/15 px-5 py-4 bg-black/10">
        {/* Avatar del contacto con su forma geométrica característica */}
        <div
          className={`relative h-11 w-11 shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm tracking-wider text-white shadow-md ${
            isPersona
              ? 'rounded-full border-2 border-[#F4EEE3]'
              : isTienda
              ? 'rounded-xl border-2 border-[#F4EEE3]'
              : 'border-2 border-[#F4EEE3]'
          }`}
          style={{
            clipPath: isFundacion
              ? 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)'
              : undefined,
            backgroundColor: '#2A1A47',
          }}
          aria-hidden="true"
        >
          {photoUrl && !imgError ? (
            <img
              src={photoUrl}
              alt=""
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4B1FA8] to-[#1F1433] text-[#F7F1E4]">
              {getInitials(conv.contacto.nombre)}
            </div>
          )}
        </div>

        {/* Nombre y contexto del chat */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-bold text-base tracking-tight text-[var(--chat-text-primary,#F4EEE3)]">
              {conv.contacto.nombre}
            </h2>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[rgba(183,154,245,0.22)] text-[var(--chat-text-secondary,#CFC6E0)]"
            >
              {CONTACTO_LABEL[conv.contacto.tipo]}
            </span>
          </div>
          <p className="truncate text-xs font-medium text-[var(--chat-text-secondary,#CFC6E0)]">
            {conv.asunto}
          </p>
        </div>

        {/* Enlace opcional a tienda */}
        {conv.contacto.tipo === 'TIENDA' && (
          <Link
            to={`/tiendas/${conv.contacto.id}`}
            className="hidden sm:inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-[var(--chat-text-secondary,#CFC6E0)] hover:border-white/50 hover:text-white transition"
          >
            Ver tienda
          </Link>
        )}

        {/* Botón cerrar X (y atajo Esc) */}
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 hover:border-white/60 hover:bg-white/10 hover:text-white transition focus-visible:outline-2 focus-visible:outline-white"
          aria-label="Cerrar chat"
          title="Cerrar chat (Esc)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      {/* Aviso de seguridad en tratos entre personas */}
      {conv.contacto.tipo !== 'TIENDA' && (
        <div className="border-b border-white/10 bg-white/[.04] px-5 py-2 text-[11px] leading-relaxed text-[var(--chat-text-secondary,#CFC6E0)]">
          Acuerden aquí el lugar y la hora de la entrega. Prefieran siempre sitios públicos concurridos.
        </div>
      )}

      {/* 2. Cuerpo de mensajes */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && !msgs.length ? (
          <Loading label="Cargando mensajes…" />
        ) : error && !msgs.length ? (
          <ErrorState error={error} onRetry={reload} title="No pudimos cargar la conversación" />
        ) : (
          <ol
            className="space-y-3.5"
            aria-label={`Mensajes con ${conv.contacto.nombre}`}
            aria-live="polite"
          >
            {/* Divisor de contexto vinilo */}
            <li className="my-2 flex justify-center" aria-hidden="true">
              <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] font-bold tracking-[.18em] uppercase text-[var(--chat-text-secondary,#CFC6E0)]">
                VINILO · CANAL ACTIVO
              </span>
            </li>

            {!msgs.length && (
              <li className="text-center text-sm py-8 text-[var(--chat-text-secondary,#CFC6E0)]">
                Escribe tu primer mensaje. Sé claro sobre talla, precio y punto de entrega.
              </li>
            )}

            {msgs.map((m) => {
              const mio = m.autorId === me
              const isNew = m.id === lastSentId
              return (
                <li
                  key={m.id}
                  className={`flex ${mio ? 'justify-end' : 'justify-start'} ${
                    isNew ? 'animate-bubble-in' : ''
                  }`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-md ${
                      mio
                        ? 'bg-[var(--chat-bubble-self-bg,#4B1FA8)] text-[var(--chat-bubble-self-fg,#F7F1E4)] rounded-br-xs'
                        : 'bg-[var(--chat-bubble-other-bg,rgba(255,255,255,0.92))] text-[var(--chat-bubble-other-fg,#1F1433)] rounded-bl-xs'
                    }`}
                  >
                    <span className="sr-only">
                      {mio ? 'Tú' : conv.contacto.nombre}:{' '}
                    </span>
                    <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed">
                      {m.texto}
                    </p>
                    <time
                      dateTime={m.enviadoEn}
                      className={`mt-1.5 block text-right text-[10px] font-semibold tracking-wider ${
                        mio ? 'text-[#F7F1E4]/70' : 'text-[#1F1433]/70'
                      }`}
                    >
                      {hora.format(new Date(m.enviadoEn))}
                    </time>
                  </div>
                </li>
              )
            })}
            <li ref={endRef} aria-hidden="true" />
          </ol>
        )}
      </div>

      {/* 3. Formulario de envío */}
      <form onSubmit={send} className="border-t border-white/15 bg-black/15 p-3.5">
        {sendError && (
          <p role="alert" className="mb-2 text-xs font-semibold text-[#FFB4B4]">
            {sendError}
          </p>
        )}
        <div className="flex items-end gap-2.5">
          <label htmlFor="chat-texto" className="sr-only">
            Escribe un mensaje
          </label>
          <textarea
            id="chat-texto"
            ref={textareaRef}
            rows={1}
            value={texto}
            maxLength={MAX_MENSAJE}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder="Escribe un mensaje…"
            aria-describedby="chat-cuenta"
            className="max-h-32 min-h-12 flex-1 resize-y rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-[var(--chat-text-primary,#F4EEE3)] placeholder-white/40 outline-none transition focus:border-[var(--chat-text-secondary,#B79AF5)] focus:ring-1 focus:ring-[var(--chat-text-secondary,#B79AF5)]"
          />
          <button
            type="submit"
            disabled={sending || !texto.trim()}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#D62F6B] to-[#4B1FA8] px-6 py-3 font-bold text-sm text-[#F7F1E4] shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
        <p id="chat-cuenta" className="mt-1.5 text-right text-[11px] font-medium text-[var(--chat-text-secondary,#CFC6E0)]">
          {texto.length} / {MAX_MENSAJE}
        </p>
      </form>
    </div>
  )
}
