import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/modules/core/api/apiClient'
import { Aviso, BTN_PRINCIPAL, BTN_SECUNDARIO } from '@/modules/core/components/Aviso'
import { ErrorState } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { chatService } from '../services/chatService'
import {
  MAX_MENSAJE,
  type ConversacionDto,
  type MensajeDto,
  type TipoContacto,
} from '../types/chat.dto'
import { NO_DISPONIBLE, problemaEnvio, TEXTO_LARGO, type ProblemaChat } from '../utils/chatErrors'
import { getContactPhoto, getInitials } from './types'

const REFRESH_MS = 15_000
const hora = new Intl.DateTimeFormat('es-CO', {
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
}

export function ChatGlass({
  conv,
  me,
  isOpen,
  impactPos,
  onClose,
  onRead,
  onSent,
}: ChatGlassProps) {
  const loader = useCallback(() => chatService.messages(conv.id), [conv.id])
  const { data: msgs, loading, error, reload, setData } = useResource(loader, [] as MensajeDto[])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<ProblemaChat | null>(null)
  const [cerrado, setCerrado] = useState<ProblemaChat | null>(null)
  const [imgError, setImgError] = useState(false)
  const largo = texto.length > MAX_MENSAJE
  const noExiste = !!error && error instanceof ApiError && (error.status === 404 || error.status === 403)

  const chatRef = useRef<HTMLDivElement>(null)
  const msgsContainerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const photoUrl = getContactPhoto(conv.contacto)
  const contactType = conv.contacto.tipo as TipoContacto
  const isPersona = contactType === 'COMPRADOR' || contactType === 'VENDEDOR' || contactType === 'DONANTE' || !contactType
  const isTienda = contactType === 'TIENDA'
  const shapeClass = isPersona ? 'persona' : isTienda ? 'tienda' : 'fundacion'
  const contactLabel = isTienda ? 'Tienda' : contactType === 'FUNDACION' ? 'Fundación' : 'Vende'
  const subtitle = conv.asunto ? `${contactLabel} · ${conv.asunto}` : contactLabel

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
        inputRef.current?.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Animación de revelado circular clip-path desde el punto de impacto
  useEffect(() => {
    const el = chatRef.current
    if (!el || !isOpen || typeof window === 'undefined') return

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduced || !el.animate) return

    const r = el.getBoundingClientRect()
    const ox = impactPos ? impactPos.x - r.left : r.width / 2
    const oy = impactPos ? impactPos.y - r.top : r.height / 2
    const R = Math.max(
      Math.hypot(ox, oy),
      Math.hypot(r.width - ox, oy),
      Math.hypot(ox, r.height - oy),
      Math.hypot(r.width - ox, r.height - oy)
    ) + 30

    el.animate(
      [
        { clipPath: `circle(0px at ${ox}px ${oy}px)`, opacity: 0 },
        { clipPath: `circle(${R}px at ${ox}px ${oy}px)`, opacity: 1 },
      ],
      { duration: 1000, easing: 'cubic-bezier(.2,.8,.2,1)' }
    )
  }, [isOpen, impactPos])

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
    if (sending || cerrado || !texto.trim() || largo) return
    setSending(true)
    setSendError(null)
    try {
      const m = await chatService.send(conv.id, texto)
      setData((l) => [...l, m])
      onSent(m)
      setTexto('')
    } catch (err) {
      const p = problemaEnvio(err)
      if (p.tipo === 'cerrado') setCerrado(p)
      else setSendError(p)
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      ref={chatRef}
      className={`chat ${isOpen ? 'open' : ''}`}
      role="region"
      aria-label={`Chat con ${conv.contacto.nombre}`}
    >
      <div className="panel">
        {/* Cabecera idéntica a la referencia */}
        <header className="ph">
          <span className={`av ${shapeClass}`} aria-hidden="true">
            {photoUrl && !imgError ? (
              <img
                src={photoUrl}
                alt=""
                draggable={false}
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="av-fallback flex h-full w-full items-center justify-center bg-[#4B1FA8] font-bold text-sm text-[#F4EEE3]">
                {getInitials(conv.contacto.nombre)}
              </span>
            )}
          </span>

          <div className="grow">
            <b>{conv.contacto.nombre}</b>
            <span className="sb">{subtitle}</span>
          </div>

          <button
            type="button"
            className="x"
            onClick={onClose}
            aria-label="Cerrar chat"
            title="Cerrar chat (Esc)"
          >
            ✕
          </button>
        </header>

        {/* Mensajes idénticos a la referencia */}
        <div className="msgs" ref={msgsContainerRef}>
          <span className="seen">VISTO · PISTA DE VISTOS</span>

          {loading && !msgs.length ? (
            <div className="p-4 text-center text-xs opacity-60">Cargando…</div>
          ) : noExiste ? (
            <Aviso
              tono="info"
              titulo={NO_DISPONIBLE.titulo}
              acciones={
                <button type="button" onClick={onClose} className={BTN_PRINCIPAL}>
                  Volver a mensajes
                </button>
              }
            >
              {NO_DISPONIBLE.texto}
            </Aviso>
          ) : error && !msgs.length ? (
            <ErrorState error={error} onRetry={reload} title="No pudimos cargar la conversación" />
          ) : (
            <ol
              role="list"
              aria-label={`Mensajes con ${conv.contacto.nombre}`}
              aria-live="polite"
              className="contents"
            >
              {msgs.map((m) => {
                const mio = m.autorId === me
                return (
                  <li
                    key={m.id}
                    className={`b ${mio ? 'me' : 'them'}`}
                  >
                    <span className="sr-only">
                      {mio ? 'Tú: ' : `${conv.contacto.nombre}: `}
                    </span>
                    <span>{m.texto}</span>
                    <small>{hora.format(new Date(m.enviadoEn))}</small>
                  </li>
                )
              })}
            </ol>
          )}
          <div ref={endRef} aria-hidden="true" />
        </div>

        {/* Caja de entrada idéntica a la referencia */}
        <form onSubmit={send} autoComplete="off">
          {cerrado && (
            <div className="px-3.5 pt-2">
              <Aviso tono="info" titulo={cerrado.titulo}>
                {cerrado.texto}
              </Aviso>
            </div>
          )}
          {sendError && sendError.tipo !== 'campo' && (
            <div className="px-3.5 pt-2">
              <Aviso
                tono="error"
                titulo={sendError.titulo}
                onCerrar={() => setSendError(null)}
                acciones={
                  sendError.tipo === 'sesion' ? (
                    <Link to="/login" className={BTN_SECUNDARIO}>Iniciar sesión</Link>
                  ) : sendError.tipo === 'no-existe' ? (
                    <button type="button" onClick={onClose} className={BTN_SECUNDARIO}>Volver a mensajes</button>
                  ) : (
                    <button type="submit" disabled={sending} className={BTN_PRINCIPAL}>Reintentar</button>
                  )
                }
              >
                {sendError.texto}
              </Aviso>
            </div>
          )}
          <div className="cp">
            <input
              id="msg"
              ref={inputRef}
              type="text"
              value={texto}
              disabled={!!cerrado}
              aria-invalid={largo || sendError?.tipo === 'campo'}
              aria-describedby="chat-glass-error"
              onChange={(e) => setTexto(e.target.value)}
              placeholder={cerrado ? 'El chat está cerrado' : 'Escribe un mensaje'}
              aria-label="Escribe un mensaje"
            />
            <button
              type="submit"
              disabled={sending || !!cerrado || !texto.trim() || largo}
              className="btn-send"
              style={{
                opacity: texto.trim() && !cerrado && !largo ? 1 : 0.65,
                cursor: texto.trim() && !cerrado && !largo ? 'pointer' : 'default',
              }}
            >
              {sending ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
          {(largo || sendError?.tipo === 'campo') && (
            <p id="chat-glass-error" role="alert" className="px-3.5 pb-2 text-xs font-semibold text-[#FF8DB5]">
              {TEXTO_LARGO}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
