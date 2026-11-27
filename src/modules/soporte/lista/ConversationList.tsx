import { useMemo, useState } from 'react'
import { CONTACTO_LABEL, type ConversacionDto, type TipoContacto } from '../types/chat.dto'
import { etiquetaLista } from '../utils/contactos'
import { ContactAvatar } from './ContactAvatar'

type Filtro = 'todos' | 'sin-leer' | 'personas' | 'tiendas' | 'fundaciones'

const FILTROS: { id: Filtro; label: string; ver: (c: ConversacionDto) => boolean }[] = [
  { id: 'todos', label: 'Todos', ver: () => true },
  { id: 'sin-leer', label: 'Sin leer', ver: (c) => c.noLeidos > 0 },
  { id: 'personas', label: 'Personas', ver: (c) => esPersona(c.contacto.tipo) },
  { id: 'tiendas', label: 'Tiendas', ver: (c) => c.contacto.tipo === 'TIENDA' },
  { id: 'fundaciones', label: 'Fundaciones', ver: (c) => c.contacto.tipo === 'FUNDACION' },
]

function esPersona(t: TipoContacto) {
  return t === 'COMPRADOR' || t === 'VENDEDOR' || t === 'DONANTE'
}

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

interface Props {
  conversations: ConversacionDto[]
  selectedId: string | null
  onSelect: (id: string) => void
  className?: string
}

export function ConversationList({ conversations, selectedId, onSelect, className = '' }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [q, setQ] = useState('')

  const totalSinLeer = useMemo(() => conversations.reduce((n, c) => n + c.noLeidos, 0), [conversations])
  // Solo se ofrecen los filtros que tienen algo: una tienda que solo recibe personas no necesita «Fundaciones»
  const filtros = useMemo(
    () => FILTROS.filter((f) => f.id === 'todos' || f.id === 'sin-leer' || conversations.some(f.ver)),
    [conversations],
  )
  const lista = useMemo(() => {
    const ver = FILTROS.find((f) => f.id === filtro)?.ver ?? (() => true)
    const buscado = sinTildes(q.trim())
    return conversations.filter(
      (c) => ver(c) && (!buscado || sinTildes(`${c.contacto.nombre} ${c.asunto} ${c.ultimoMensaje ?? ''}`).includes(buscado)),
    )
  }, [conversations, filtro, q])

  return (
    <aside
      aria-label="Conversaciones"
      className={`flex min-h-0 flex-col overflow-hidden rounded-3xl border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)] shadow-[var(--sr-shadow)] ${className}`}
    >
      <div className="space-y-3 border-b border-[var(--sr-border-subtle)] p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold tracking-tight text-[var(--sr-text-primary)]">Conversaciones</h2>
          <span className="text-xs font-semibold text-[var(--sr-text-secondary)]">
            {totalSinLeer ? `${totalSinLeer} sin leer` : 'Al día'}
          </span>
        </div>

        <label className="relative block">
          <span className="sr-only">Buscar en tus conversaciones</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sr-text-muted)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o mensaje"
            className="w-full rounded-full border border-[var(--sr-border-control)] bg-[var(--sr-surface-raised)] py-2.5 pl-10 pr-4 text-sm text-[var(--sr-text-primary)] placeholder:text-[var(--sr-text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sr-focus)]"
          />
        </label>

        <div role="group" aria-label="Filtrar conversaciones" className="flex flex-wrap gap-1.5">
          {filtros.map((f) => {
            const activo = f.id === filtro
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={activo}
                onClick={() => setFiltro(f.id)}
                className={`min-h-11 rounded-full px-4 py-1.5 text-xs font-semibold transition sm:min-h-9 sm:px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sr-focus)] ${
                  activo
                    ? 'bg-violeta text-white'
                    : 'border border-[var(--sr-border-control)] text-[var(--sr-text-secondary)] hover:bg-[var(--sr-surface-raised)]'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="p-8 text-center text-sm text-[var(--sr-text-secondary)]">
          {q ? `No encontramos «${q.trim()}» en tus conversaciones.` : 'Nada por aquí con ese filtro.'}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-[var(--sr-border-subtle)] overflow-y-auto overscroll-contain">
          {lista.map((c) => {
            const activa = c.id === selectedId
            const sinLeer = c.noLeidos > 0
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={activa ? 'true' : undefined}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--sr-focus)] ${
                    activa ? 'bg-violeta/15' : 'hover:bg-[var(--sr-surface-raised)]'
                  }`}
                >
                  <ContactAvatar contacto={c.contacto} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <b className={`truncate text-sm ${sinLeer ? 'font-extrabold' : 'font-semibold'} text-[var(--sr-text-primary)]`}>{c.contacto.nombre}</b>
                      <time dateTime={c.actualizadaEn} className={`shrink-0 text-[11px] ${sinLeer ? 'font-bold text-[var(--sr-accent-text)]' : 'text-[var(--sr-text-muted)]'}`}>
                        {etiquetaLista(c.actualizadaEn)}
                      </time>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-semibold uppercase tracking-wide text-[var(--sr-accent-text)]">
                      {CONTACTO_LABEL[c.contacto.tipo]}{c.asunto ? ` · ${c.asunto}` : ''}
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${sinLeer ? 'text-[var(--sr-text-primary)]' : 'text-[var(--sr-text-secondary)]'}`}>
                        {c.ultimoMensaje ?? 'Abre la conversación para ver los mensajes'}
                      </span>
                      {sinLeer && (
                        <span
                          aria-label={`${c.noLeidos} sin leer`}
                          className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-violeta px-1.5 text-[11px] font-bold text-white"
                        >
                          {c.noLeidos > 99 ? '99+' : c.noLeidos}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
