import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Aviso, BTN_PRINCIPAL } from '@/modules/core/components/Aviso'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import type { Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { ChatPanel } from '../lista/ChatPanel'
import { ConversationList } from '../lista/ConversationList'
import { chatService } from '../services/chatService'
import {
  type ConversacionDto,
  type MensajeDto,
} from '../types/chat.dto'
import { NO_DISPONIBLE } from '../utils/chatErrors'

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
    <section className="mx-auto max-w-7xl px-4 py-4 md:py-6 bg-transparent border-0 shadow-none overflow-visible">
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
          <Aviso
            tono="info"
            titulo={NO_DISPONIBLE.titulo}
            acciones={
              <button type="button" onClick={() => abrir(null)} className={BTN_PRINCIPAL}>
                Volver a mensajes
              </button>
            }
          >
            {NO_DISPONIBLE.texto}
          </Aviso>
        </div>
      ) : (
        <div className="relative w-full bg-transparent border-0 shadow-none overflow-visible">
          {/* Cabecera */}
          <header className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--sr-text-secondary)] mb-1">
              Comunicación
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-[var(--sr-text-primary)]">
              Mensajes
            </h1>
            <p className="mt-1 max-w-2xl text-xs md:text-sm text-[var(--sr-text-secondary)]">
              Coordina entregas y responde preguntas sin compartir tu número.
            </p>
          </header>

          <div className="grid h-[calc(100dvh-15rem)] min-h-[34rem] gap-4 md:grid-cols-[minmax(20rem,26rem)_1fr]">
            <ConversationList
              conversations={convs}
              selectedId={actual}
              onSelect={abrir}
              className={actual ? 'hidden md:flex' : 'flex'}
            />
            {conv ? (
              <ChatPanel
                key={conv.id}
                conv={conv}
                me={user?.id ?? ''}
                onClose={() => abrir(null)}
                onRead={leida}
                onSent={enviado}
                className={actual ? 'flex' : 'hidden md:flex'}
              />
            ) : (
              <div className="hidden place-items-center rounded-3xl border border-dashed border-[var(--sr-border-subtle)] p-8 text-center md:grid">
                <p className="max-w-xs text-sm text-[var(--sr-text-secondary)]">
                  <b className="mb-1 block text-base text-[var(--sr-text-primary)]">Elige una conversación</b>
                  Toca un chat de la lista para leerlo y responder.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
