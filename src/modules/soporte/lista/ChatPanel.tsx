import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/modules/core/api/apiClient'
import { Aviso, BTN_PRINCIPAL, BTN_SECUNDARIO } from '@/modules/core/components/Aviso'
import { ErrorState } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { chatService } from '../services/chatService'
import { connectChatSocket } from '../services/chatSocket'
import { CONTACTO_LABEL, MAX_MENSAJE, type ConversacionDto, type MensajeDto } from '../types/chat.dto'
import { NO_DISPONIBLE, problemaEnvio, TEXTO_LARGO, type ProblemaChat } from '../utils/chatErrors'
import { claveDia, etiquetaDia, horaMensaje } from '../utils/contactos'
import { ContactAvatar } from './ContactAvatar'

const REFRESH_MS = 15_000

interface Props {
  conv: ConversacionDto
  me: string
  onClose: () => void
  onRead: (id: string) => void
  onSent: (m: MensajeDto) => void
  className?: string
}

/** La conversación abierta: mensajes agrupados por día y caja para responder. */
export function ChatPanel({ conv, me, onClose, onRead, onSent, className = '' }: Props) {
  const loader = useCallback(() => chatService.messages(conv.id), [conv.id])
  const { data: msgs, loading, error, reload, setData } = useResource(loader, [] as MensajeDto[])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<ProblemaChat | null>(null)
  const [cerrado, setCerrado] = useState<ProblemaChat | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const largo = texto.length > MAX_MENSAJE
  const noExiste = !!error && error instanceof ApiError && (error.status === 404 || error.status === 403)
  const fin = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const entrada = useRef<HTMLTextAreaElement>(null)

  // Al abrir una conversación sus mensajes quedan leídos
  useEffect(() => { if (!loading && !error) onRead(conv.id) }, [loading, error, conv.id, onRead])
  useEffect(() => {
    if (lista.current) lista.current.scrollTop = lista.current.scrollHeight
  }, [msgs.length])
  useEffect(() => { entrada.current?.focus({ preventScroll: true }) }, [conv.id])
  useEffect(() => {
    return connectChatSocket({
      conversationId: conv.id,
      onStatusChange: setWsConnected,
      onMessage: (incoming) => {
        setData((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]))
      },
    })
  }, [conv.id, setData])
  useEffect(() => {
    if (wsConnected) return
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') reload() }, REFRESH_MS)
    return () => window.clearInterval(t)
  }, [reload, wsConnected])

  const send = async (e?: FormEvent) => {
    e?.preventDefault()
    if (sending || cerrado || !texto.trim() || largo) return
    setSending(true); setSendError(null)
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

  const puedeEnviar = !sending && !cerrado && !!texto.trim() && !largo

  return (
    <section
      aria-label={`Chat con ${conv.contacto.nombre}`}
      className={`flex min-h-0 flex-col overflow-hidden rounded-3xl border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)] shadow-[var(--sr-shadow)] ${className}`}
    >
      <header className="flex items-center gap-3 border-b border-[var(--sr-border-subtle)] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Volver a las conversaciones"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--sr-text-primary)] hover:bg-[var(--sr-surface-raised)] md:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <ContactAvatar contacto={conv.contacto} />
        <div className="min-w-0 flex-1">
          <b className="block truncate text-[15px] text-[var(--sr-text-primary)]">{conv.contacto.nombre}</b>
          <span className="block truncate text-xs text-[var(--sr-text-secondary)]">
            {CONTACTO_LABEL[conv.contacto.tipo]} · #{conv.contacto.id}{conv.asunto ? ` · ${conv.asunto}` : ''}
          </span>
        </div>
      </header>

      <div ref={lista} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {loading && !msgs.length ? (
          <p className="p-6 text-center text-sm text-[var(--sr-text-muted)]">Cargando…</p>
        ) : noExiste ? (
          <Aviso
            tono="info"
            titulo={NO_DISPONIBLE.titulo}
            acciones={<button type="button" onClick={onClose} className={BTN_PRINCIPAL}>Volver a mensajes</button>}
          >
            {NO_DISPONIBLE.texto}
          </Aviso>
        ) : error && !msgs.length ? (
          <ErrorState error={error} onRetry={reload} title="No pudimos cargar la conversación" />
        ) : (
          <>
          {!msgs.length && <p className="p-6 text-center text-sm text-[var(--sr-text-secondary)]">Escribe el primer mensaje.</p>}
          <ol role="list" aria-label={`Mensajes con ${conv.contacto.nombre}`} aria-live="polite" className="flex flex-col gap-1.5">
            {msgs.map((m, i) => {
              const mio = m.autorId === me
              const nuevoDia = i === 0 || claveDia(m.enviadoEn) !== claveDia(msgs[i - 1].enviadoEn)
              return (
                <Fragment key={m.id}>
                  {nuevoDia && (
                    <li role="presentation" className="my-2 self-center rounded-full bg-[var(--sr-surface-raised)] px-3 py-1 text-[11px] font-semibold text-[var(--sr-text-secondary)]">
                      {etiquetaDia(m.enviadoEn)}
                    </li>
                  )}
                  <li className={`flex max-w-[78%] flex-col ${mio ? 'items-end self-end' : 'items-start self-start'}`}>
                    <span className="sr-only">{mio ? 'Tú: ' : `${conv.contacto.nombre}: `}</span>
                    <span
                      className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        mio
                          ? 'rounded-br-md bg-violeta text-white'
                          : 'rounded-bl-md border border-[var(--sr-border-subtle)] bg-[var(--sr-surface-raised)] text-[var(--sr-text-primary)]'
                      }`}
                    >
                      {m.texto}
                    </span>
                    <small className="mt-0.5 px-1 text-[10px] text-[var(--sr-text-muted)]">{horaMensaje(m.enviadoEn)}</small>
                  </li>
                </Fragment>
              )
            })}
          </ol>
          </>
        )}
        <div ref={fin} aria-hidden="true" />
      </div>

      <form onSubmit={send} autoComplete="off" className="border-t border-[var(--sr-border-subtle)] p-3">
        {cerrado && <div className="pb-2"><Aviso tono="info" titulo={cerrado.titulo}>{cerrado.texto}</Aviso></div>}
        {sendError && sendError.tipo !== 'campo' && (
          <div className="pb-2">
            <Aviso
              tono="error"
              titulo={sendError.titulo}
              onCerrar={() => setSendError(null)}
              acciones={
                sendError.tipo === 'sesion' ? <Link to="/login" className={BTN_SECUNDARIO}>Iniciar sesión</Link>
                : sendError.tipo === 'no-existe' ? <button type="button" onClick={onClose} className={BTN_SECUNDARIO}>Volver a mensajes</button>
                : <button type="submit" disabled={sending} className={BTN_PRINCIPAL}>Reintentar</button>
              }
            >
              {sendError.texto}
            </Aviso>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={entrada}
            rows={1}
            value={texto}
            disabled={!!cerrado}
            aria-label="Escribe un mensaje"
            aria-invalid={largo || sendError?.tipo === 'campo'}
            aria-describedby={largo || sendError?.tipo === 'campo' ? 'chat-error' : undefined}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
            placeholder={cerrado ? 'El chat está cerrado' : 'Escribe un mensaje'}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-[var(--sr-border-control)] bg-[var(--sr-surface-raised)] px-4 py-2.5 text-sm text-[var(--sr-text-primary)] placeholder:text-[var(--sr-text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sr-focus)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!puedeEnviar}
            className="h-11 shrink-0 rounded-full bg-violeta px-5 text-sm font-semibold text-white transition hover:bg-violeta-claro disabled:cursor-default disabled:opacity-60"
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
        {(largo || sendError?.tipo === 'campo') && (
          <p id="chat-error" role="alert" className="px-2 pt-1.5 text-xs font-semibold text-[var(--sr-bad)]">{TEXTO_LARGO}</p>
        )}
      </form>
    </section>
  )
}
