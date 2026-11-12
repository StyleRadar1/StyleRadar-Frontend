import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import type { Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { MessagesVinyl } from '../vinyl/MessagesVinyl'
import { chatService } from '../services/chatService'
import {
  type ConversacionDto,
  type MensajeDto,
} from '../types/chat.dto'

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
          {/* Cabecera idéntica a la referencia aprobada */}
          <header className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--s-ink2,#CFC6E0)] mb-1">
              Comunicación
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-[var(--s-ink,#F4EEE3)]">
              Mensajes
            </h1>
            <p className="mt-1 max-w-2xl text-xs md:text-sm text-[var(--s-ink2,#CFC6E0)]">
              Coordina entregas y responde preguntas sin compartir tu número.
            </p>
          </header>

          {/* EL VINILO ES LA ÚNICA VISTA (sin filtros ni selector de vista) */}
          <MessagesVinyl
            conversations={convs}
            selectedId={actual}
            currentUserId={user?.id ?? ''}
            onSelect={abrir}
            onRead={leida}
            onSent={enviado}
          />
        </div>
      )}
    </section>
  )
}
