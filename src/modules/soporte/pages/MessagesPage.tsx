import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import type { Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { MessagesOrbit } from '../orbit/MessagesOrbit'
import { ChatGlass } from '../orbit/ChatGlass'
import { chatService } from '../services/chatService'
import {
  CONTACTO_LABEL,
  type ConversacionDto,
  type MensajeDto,
  type TipoContacto,
} from '../types/chat.dto'

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

export default function MessagesPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const actual = params.get('c')
  const [filtro, setFiltro] = useState('todos')
  const [viewMode, setViewMode] = useState<'orbit' | 'list'>('orbit')

  const { data: convs, loading, error, reload, setData } = useResource(
    chatService.conversations,
    [] as ConversacionDto[],
  )

  const abrir = (id: string | null) => {
    const n = new URLSearchParams(params)
    if (id) n.set('c', id)
    else n.delete('c')
    setParams(n)
  }

  const tipos = FILTROS.find(([k]) => k === filtro)?.[2] ?? []
  const lista = convs.filter((c) => !tipos.length || tipos.includes(c.contacto.tipo))
  const conv = convs.find((c) => c.id === actual) ?? null

  const leida = useCallback(
    (id: string) => setData((l) => l.map((c) => (c.id === id ? { ...c, noLeidos: 0 } : c))),
    [setData],
  )

  const enviado = useCallback(
    (m: MensajeDto) =>
      setData((l) =>
        l
          .map((c) =>
            c.id === m.conversacionId
              ? { ...c, ultimoMensaje: m.texto, actualizadaEn: m.enviadoEn }
              : c,
          )
          .sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn)),
      ),
    [setData],
  )

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {loading ? (
        <Loading label="Cargando tus conversaciones…" />
      ) : error ? (
        <div className="mt-8">
          <ErrorState error={error} onRetry={reload} title="No pudimos cargar tus mensajes" />
        </div>
      ) : !convs.length ? (
        <div className="mt-8">
          <EmptyState title="No hay conversaciones">
            {VACIO[user?.role ?? 'COMPRADOR']}
          </EmptyState>
        </div>
      ) : actual && !conv ? (
        <div className="mt-8">
          <EmptyState
            title="Esa conversación no existe"
            action={
              <button
                type="button"
                onClick={() => abrir(null)}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Ver mis mensajes
              </button>
            }
          >
            Puede que ya no tengas acceso a ella.
          </EmptyState>
        </div>
      ) : (
        <div className="relative w-full">
          {/* Encabezado accesible superior con selector de vista */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#CFC6E0]">
                Comunicación
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl text-white">
                Mensajes
              </h1>
              <p className="mt-1 max-w-2xl text-xs md:text-sm text-white/70">
                Coordina entregas y responde preguntas sin compartir tu número.
              </p>
            </div>

            {/* Selector de vista: Órbita cósmica / Lista clásica accesible */}
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/30 p-1 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setViewMode('orbit')}
                aria-pressed={viewMode === 'orbit'}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition min-h-[44px] ${
                  viewMode === 'orbit'
                    ? 'bg-[#4B1FA8] text-white shadow-[0_0_16px_rgba(75,31,168,0.7)]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-15 12 12)" />
                </svg>
                <span>Vista Órbita</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition min-h-[44px] ${
                  viewMode === 'list'
                    ? 'bg-[#4B1FA8] text-white shadow-[0_0_16px_rgba(75,31,168,0.7)]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                  <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                </svg>
                <span>Vista Lista</span>
              </button>
            </div>
          </div>

          {/* VISTA 1: SISTEMA ÓRBITA */}
          {viewMode === 'orbit' && (
            <div className="w-full">
              <MessagesOrbit
                conversations={lista}
                selectedId={actual}
                currentUserId={user?.id ?? ''}
                onSelect={abrir}
                onRead={leida}
                onSent={enviado}
                onToggleListView={() => setViewMode('list')}
                isListView={false}
              />
            </div>
          )}

          {/* VISTA 2 (O ESTRUCTURA ACCESIBLE SEMÁNTICA PARA LECTORES DE PANTALLA Y TESTS):
              Proporciona el panel complementario estándar con roles y listitems */}
          <div className={viewMode === 'list' ? 'mt-6 grid gap-6 md:grid-cols-[320px_1fr]' : 'sr-only'}>
            <aside
              role="complementary"
              aria-label="Conversaciones"
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md"
            >
              {user?.role === 'COMPRADOR' && (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar conversaciones">
                  {FILTROS.map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={filtro === k}
                      onClick={() => setFiltro(k)}
                      className={`min-h-[38px] rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                        filtro === k
                          ? 'border-[#B79AF5] bg-[#4B1FA8] text-white shadow-md'
                          : 'border-white/20 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {lista.length ? (
                <ul className="space-y-1.5" role="list">
                  {lista.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => abrir(c.id)}
                        aria-current={c.id === actual ? 'true' : undefined}
                        className={`w-full rounded-2xl border p-3.5 text-left transition min-h-[44px] ${
                          c.id === actual
                            ? 'border-[#B79AF5] bg-white/[.09] shadow-md'
                            : 'border-transparent hover:bg-white/[.05]'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <b className="truncate text-sm text-white">{c.contacto.nombre}</b>
                          {c.noLeidos > 0 && (
                            <span className="rounded-full bg-[#D62F6B] px-2 py-0.5 text-[11px] font-black text-white shadow-[0_0_8px_#D62F6B]">
                              {c.noLeidos}
                              <span className="sr-only"> sin leer</span>
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-[#CFC6E0] mt-0.5">
                          {CONTACTO_LABEL[c.contacto.tipo]} · {c.asunto}
                        </span>
                        <span className="block truncate text-xs text-white/60 mt-0.5">
                          {c.ultimoMensaje ?? 'Sin mensajes todavía'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-3 text-sm text-white/70">No hay conversaciones con este filtro.</p>
              )}
            </aside>

            {/* Hilo de conversación en vista lista */}
            <div className={viewMode === 'list' ? 'block' : 'hidden'}>
              {conv && user ? (
                <ChatGlass
                  key={`list-chat-${conv.id}`}
                  conv={conv}
                  me={user.id}
                  isOpen={true}
                  onClose={() => abrir(null)}
                  onRead={leida}
                  onSent={enviado}
                />
              ) : (
                <EmptyState title="Elige una conversación">
                  Aquí coordinas entregas y respondes preguntas.
                </EmptyState>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
