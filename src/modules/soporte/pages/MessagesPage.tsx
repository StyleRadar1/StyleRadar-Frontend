import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { errorMessage } from '@/modules/core/api/errors'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import type { Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { chatService } from '../services/chatService'
import { CONTACTO_LABEL, MAX_MENSAJE, type ConversacionDto, type MensajeDto, type TipoContacto } from '../types/chat.dto'

/** Mientras el squad de ms-chat confirma si habrá tiempo real, se consulta cada 15 s con la pestaña visible. */
const REFRESH_MS = 15_000
const hora = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

const FILTROS: [string, string, TipoContacto[]][] = [
  ['todos', 'Todos', []],
  ['personas', 'Personas', ['VENDEDOR', 'COMPRADOR']],
  ['tiendas', 'Tiendas', ['TIENDA']],
  ['fundaciones', 'Fundaciones', ['FUNDACION']],
]

const VACIO: Record<Role, string> = {
  COMPRADOR: 'Cuando le escribas a quien vende, a una tienda o a una fundación, la conversación aparecerá aquí.',
  ADMIN_ALMACEN: 'Cuando un cliente te escriba desde tu página, lo verás aquí.',
  REPRESENTANTE_FUNDACION: 'Cuando aceptes una donación y coordines la entrega, la conversación con quien dona aparecerá aquí.',
  ADMIN_STYLERADAR: 'El administrador no tiene conversaciones.',
}

/** RF-40 y RF-41 (chat con quien vende y coordinación de la entrega) y RF-73 (chat con la tienda). */
export default function MessagesPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const actual = params.get('c')
  const [filtro, setFiltro] = useState('todos')
  const { data: convs, loading, error, reload, setData } = useResource(chatService.conversations, [] as ConversacionDto[])

  const abrir = (id: string | null) => {
    const n = new URLSearchParams(params)
    if (id) n.set('c', id); else n.delete('c')
    setParams(n)
  }
  const tipos = FILTROS.find(([k]) => k === filtro)?.[2] ?? []
  const lista = convs.filter((c) => !tipos.length || tipos.includes(c.contacto.tipo))
  const conv = convs.find((c) => c.id === actual) ?? null
  const leida = useCallback((id: string) => setData((l) => l.map((c) => (c.id === id ? { ...c, noLeidos: 0 } : c))), [setData])
  const enviado = useCallback((m: MensajeDto) => setData((l) => l.map((c) => (c.id === m.conversacionId ? { ...c, ultimoMensaje: m.texto, actualizadaEn: m.enviadoEn } : c))
    .sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))), [setData])

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-arena">Comunicación</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">Mensajes</h1>
      <p className="mt-3 max-w-2xl text-white/70">Coordina entregas y responde preguntas sin compartir tu número.</p>

      {loading ? <Loading label="Cargando tus conversaciones…" />
        : error ? <div className="mt-8"><ErrorState error={error} onRetry={reload} title="No pudimos cargar tus mensajes" /></div>
        : !convs.length ? <div className="mt-8"><EmptyState title="No hay conversaciones">{VACIO[user?.role ?? 'COMPRADOR']}</EmptyState></div>
        : (
          <div className="mt-8 grid gap-4 md:grid-cols-[320px_1fr]">
            <aside className={actual ? 'hidden md:block' : ''} aria-label="Conversaciones">
              {user?.role === 'COMPRADOR' && (
                <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar conversaciones">
                  {FILTROS.map(([k, label]) => (
                    <button key={k} type="button" aria-pressed={filtro === k} onClick={() => setFiltro(k)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filtro === k ? 'border-arena bg-arena text-grafito' : 'border-white/20'}`}>{label}</button>
                  ))}
                </div>
              )}
              {lista.length ? (
                <ul className="space-y-1">
                  {lista.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => abrir(c.id)} aria-current={c.id === actual ? 'true' : undefined}
                        className={`w-full rounded-xl border p-3 text-left ${c.id === actual ? 'border-arena/60 bg-white/[.06]' : 'border-transparent hover:bg-white/[.04]'}`}>
                        <span className="flex items-center justify-between gap-2">
                          <b className="truncate">{c.contacto.nombre}</b>
                          {c.noLeidos > 0 && <span className="rounded-full bg-violeta px-2 text-[11px] font-bold">{c.noLeidos}<span className="sr-only"> sin leer</span></span>}
                        </span>
                        <span className="block truncate text-xs text-arena">{CONTACTO_LABEL[c.contacto.tipo]} · {c.asunto}</span>
                        <span className="block truncate text-xs text-white/60">{c.ultimoMensaje ?? 'Sin mensajes todavía'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p className="p-3 text-sm text-white/70">No hay conversaciones con este filtro.</p>}
            </aside>

            <div className={actual ? '' : 'hidden md:block'}>
              {conv && user ? <Thread key={conv.id} conv={conv} me={user.id} onBack={() => abrir(null)} onRead={leida} onSent={enviado} />
                : actual ? <EmptyState title="Esa conversación no existe" action={<button type="button" onClick={() => abrir(null)} className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold">Ver mis mensajes</button>}>Puede que ya no tengas acceso a ella.</EmptyState>
                : <EmptyState title="Elige una conversación">Aquí coordinas entregas y respondes preguntas.</EmptyState>}
            </div>
          </div>
        )}
    </section>
  )
}

interface ThreadProps {
  conv: ConversacionDto
  me: string
  onBack: () => void
  onRead: (id: string) => void
  onSent: (m: MensajeDto) => void
}

function Thread({ conv, me, onBack, onRead, onSent }: ThreadProps) {
  const loader = useCallback(() => chatService.messages(conv.id), [conv.id])
  const { data: msgs, loading, error, reload, setData } = useResource(loader, [] as MensajeDto[])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const end = useRef<HTMLLIElement>(null)

  useEffect(() => { if (!loading && !error) onRead(conv.id) }, [loading, error, conv.id, onRead])
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [msgs.length])
  useEffect(() => {
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') reload() }, REFRESH_MS)
    return () => window.clearInterval(t)
  }, [reload])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (sending || !texto.trim()) return
    setSending(true); setSendError('')
    try {
      const m = await chatService.send(conv.id, texto)
      setData((l) => [...l, m])
      onSent(m)
      setTexto('')
    } catch (err) {
      setSendError(errorMessage(err, 'No pudimos enviar el mensaje. Intenta de nuevo.'))
    } finally { setSending(false) }
  }

  return (
    <div className="flex h-[min(70vh,640px)] flex-col rounded-2xl border border-white/10 bg-white/[.03]">
      <header className="flex items-center gap-3 border-b border-white/10 p-4">
        <button type="button" onClick={onBack} className="rounded-lg border border-white/20 px-2.5 py-1 text-sm md:hidden" aria-label="Volver a la lista">←</button>
        <div className="min-w-0">
          <p className="truncate font-semibold">{conv.contacto.nombre}</p>
          <p className="truncate text-xs text-arena">{CONTACTO_LABEL[conv.contacto.tipo]} · {conv.asunto}</p>
        </div>
        {conv.contacto.tipo === 'TIENDA' && <Link to={`/tiendas/${conv.contacto.id}`} className="ml-auto shrink-0 text-sm underline">Ver tienda</Link>}
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && !msgs.length ? <Loading label="Cargando mensajes…" />
          : error && !msgs.length ? <ErrorState error={error} onRetry={reload} title="No pudimos cargar la conversación" />
          : (
            <ol className="space-y-3" aria-label={`Mensajes con ${conv.contacto.nombre}`} aria-live="polite">
              {!msgs.length && <li className="text-center text-sm text-white/60">Escribe tu primer mensaje. Sé claro sobre talla, precio y punto de entrega.</li>}
              {msgs.map((m) => {
                const mio = m.autorId === me
                return (
                  <li key={m.id} className={`flex ${mio ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${mio ? 'bg-violeta' : 'bg-white/10'}`}>
                      <span className="sr-only">{mio ? 'Tú' : conv.contacto.nombre}: </span>
                      <p className="whitespace-pre-wrap break-words text-sm">{m.texto}</p>
                      <time dateTime={m.enviadoEn} className="mt-1 block text-right text-[11px] text-white/60">{hora.format(new Date(m.enviadoEn))}</time>
                    </div>
                  </li>
                )
              })}
              <li ref={end} aria-hidden="true" />
            </ol>
          )}
      </div>

      <form onSubmit={send} className="border-t border-white/10 p-3">
        {sendError && <p role="alert" className="mb-2 text-sm text-[#ffb4b4]">{sendError}</p>}
        <div className="flex items-end gap-2">
          <label htmlFor="chat-texto" className="sr-only">Escribe un mensaje</label>
          <textarea id="chat-texto" rows={1} value={texto} maxLength={MAX_MENSAJE} onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }}
            placeholder="Escribe un mensaje…" aria-describedby="chat-cuenta"
            className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm outline-none focus:border-violeta-claro" />
          <button type="submit" disabled={sending || !texto.trim()} className="rounded-xl bg-violeta px-5 py-3 text-sm font-semibold disabled:opacity-50">
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
        <p id="chat-cuenta" className="mt-1 text-right text-[11px] text-white/45">{texto.length} / {MAX_MENSAJE}</p>
      </form>
    </div>
  )
}
