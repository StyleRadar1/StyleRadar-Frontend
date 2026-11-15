import { useContext, useEffect, useRef, useState } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { Link } from 'react-router-dom'
import { errorKind, errorMessage, fieldErrors } from '@/modules/core/api/errors'
import { mockSessionUser } from '@/modules/core/api/mock'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { ErrorToast, FieldError } from '@/modules/core/components/ErrorFeedback'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { chatService } from '@/modules/soporte/services/chatService'
import { secondHandService } from '../services/secondHandService'
import { ESTADO_PUBLICACION_LABEL, type ListingDto } from '../types/secondhand.dto'

type Action = { listing: ListingDto; to: 'VENDIDA' | 'RETIRADA' }
type BuyerOption = { id: string; nombre: string }

const STATUS_BADGE: Record<string, { cls: string; icon: React.ReactNode }> = {
  DISPONIBLE: {
    cls: 'bg-[var(--color-success-bg,rgba(30,107,58,0.15))] text-[var(--color-success-text,#144a27)] border border-[var(--color-success-border,#1e6b3a)]',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  AVAILABLE: {
    cls: 'bg-[var(--color-success-bg,rgba(30,107,58,0.15))] text-[var(--color-success-text,#144a27)] border border-[var(--color-success-border,#1e6b3a)]',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  VENDIDA: {
    cls: 'bg-[var(--color-warning-bg,rgba(217,119,6,0.15))] text-[var(--color-warning-text,#92400e)] border border-[var(--color-warning-border,#d97706)]',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0">
        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
      </svg>
    ),
  },
  SOLD: {
    cls: 'bg-[var(--color-warning-bg,rgba(217,119,6,0.15))] text-[var(--color-warning-text,#92400e)] border border-[var(--color-warning-border,#d97706)]',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0">
        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
      </svg>
    ),
  },
  RETIRADA: {
    cls: 'bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
  },
  RETIRED: {
    cls: 'bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
  },
}

/** RF-37 a RF-39: el dueño ve solo las acciones que permite el estado de cada prenda. */
export function MyListings() {
  const user = useContext(AuthContext)?.user ?? null
  const { data: list, loading, error, reload: load, setData: setList } = useResource(secondHandService.mine, [] as ListingDto[])
  const [buyers, setBuyers] = useState<BuyerOption[]>([])
  const [action, setAction] = useState<Action | null>(null)
  const [selectedBuyer, setSelectedBuyer] = useState('')
  const [customBuyerId, setCustomBuyerId] = useState('')
  const [buyerError, setBuyerError] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'warn' | 'bad'; text: string; sub?: string } | null>(null)
  const inFlight = useRef(false)

  useEffect(() => {
    let active = true
    chatService.conversations().then((convs) => {
      if (!active) return
      const seen = new Map<string, BuyerOption>()
      for (const c of convs) {
        if ((c.contacto.tipo === 'COMPRADOR' || c.contacto.tipo === 'VENDEDOR') && !seen.has(c.contacto.id)) {
          seen.set(c.contacto.id, { id: c.contacto.id, nombre: c.contacto.nombre })
        }
      }
      setBuyers([...seen.values()])
    }).catch(() => { /* si falla la carga de chats, igual puede ingresar el ID numérico del comprador */ })
    return () => { active = false }
  }, [])

  const openAction = (listing: ListingDto, to: 'VENDIDA' | 'RETIRADA') => {
    setSelectedBuyer('')
    setCustomBuyerId('')
    setBuyerError('')
    setAction({ listing, to })
  }

  const run = async () => {
    if (!action || inFlight.current) return
    const sellerId = user?.id ?? mockSessionUser()?.id ?? ''
    if (action.to === 'VENDIDA') {
      const compradorId = selectedBuyer === '__otro__' || !buyers.length ? customBuyerId.trim() : selectedBuyer.trim()
      if (!compradorId) {
        setBuyerError('Elige a la persona que te la compró.')
        const targetId = selectedBuyer === '__otro__' || !buyers.length ? 'sell-buyer-id' : 'sell-buyer'
        window.setTimeout(() => document.getElementById(targetId)?.focus(), 0)
        return
      }
      if (compradorId === sellerId) {
        setBuyerError('No puedes seleccionarte a ti mismo como comprador.')
        return
      }

      inFlight.current = true; setBusy(true); setMsg(null); setBuyerError('')
      try {
        const upd = await secondHandService.sell(action.listing.id, sellerId, compradorId)
        setList((l) => l.map((x) => (x.id === upd.id ? upd : x)))
        setMsg({ tone: 'ok', text: `«${upd.titulo}» quedó como vendida.` })
        setAction(null)
      } catch (e) {
        const k = errorKind(e)
        const campos = fieldErrors(e)
        if (k === 'datos' || campos.compradorId) {
          setBuyerError(campos.compradorId ?? 'Elige a la persona que te la compró.')
        } else if (k === 'conflicto') {
          setMsg({ tone: 'warn', text: 'Esta prenda ya se vendió o donó.', sub: 'Actualizamos tus publicaciones.' })
          setAction(null)
          load()
        } else {
          setMsg({ tone: 'bad', text: errorMessage(e) })
          setAction(null)
        }
      } finally {
        inFlight.current = false; setBusy(false)
      }
      return
    }

    inFlight.current = true; setBusy(true); setMsg(null)
    try {
      const upd = await secondHandService.setStatus(action.listing.id, { estado: action.to })
      setList((l) => l.map((x) => (x.id === upd.id ? upd : x)))
      setMsg({ tone: 'ok', text: `Retiraste «${upd.titulo}» de Segunda vida.` })
      setAction(null)
    } catch (e) {
      const k = errorKind(e)
      if (k === 'conflicto') {
        setMsg({ tone: 'warn', text: 'Esta prenda ya no estaba disponible.', sub: 'Actualizamos tus publicaciones.' })
        load()
      } else {
        setMsg({ tone: 'bad', text: errorMessage(e) })
      }
      setAction(null)
    } finally {
      inFlight.current = false; setBusy(false)
    }
  }

  const handlePassToDonation = async (listing: ListingDto) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setMsg(null)
    try {
      const upd = await secondHandService.passToDonation(listing.id)
      setList((l) => l.map((x) => (x.id === upd.id ? upd : x)))
      setMsg({ tone: 'ok', text: `«${upd.titulo}» pasó a la Vitrina de Donaciones ($0 COP).` })
    } catch (e) {
      setMsg({ tone: 'bad', text: errorMessage(e) })
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  if (loading) return <Loading label="Cargando tus publicaciones…" />
  if (error) return <ErrorState error={error} onRetry={load} title="No pudimos cargar tus publicaciones" />
  if (!list.length) return <EmptyState title="Aún no tienes publicaciones" action={<Link to="/segunda-mano/publicar" className="rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-5 py-3 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]">Vender una prenda</Link>}>Publica una prenda que ya no uses y dale una segunda vida.</EmptyState>

  return (
    <div>
      <div className="mb-4">
        <ErrorToast
          open={!!msg}
          tone={msg?.tone === 'ok' ? 'ok' : msg?.tone === 'warn' ? 'warn' : 'bad'}
          icon={msg?.tone === 'ok' ? 'ok' : msg?.tone === 'warn' ? 'refresh' : undefined}
          title={msg?.text ?? ''}
          subtitle={msg?.sub}
          onClose={() => setMsg(null)}
        />
      </div>
      <ul className="space-y-3" aria-label="Mis publicaciones">
        {list.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <img src={l.fotos[0]} alt="" className="h-20 w-16 rounded-lg bg-[var(--color-surface-subtle)] object-cover" />
            <div className="min-w-40 flex-1">
              <p className="font-semibold text-[var(--color-text)]">{l.titulo}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{formatCOP(l.precio)} · Talla {l.talla}</p>
              <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${(STATUS_BADGE[l.estado] || STATUS_BADGE.DISPONIBLE).cls}`}>
                {(STATUS_BADGE[l.estado] || STATUS_BADGE.DISPONIBLE).icon}
                <span>{ESTADO_PUBLICACION_LABEL[l.estado] || l.estado}</span>
              </span>
            </div>
            {l.estado === 'DISPONIBLE' ? (
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/segunda-mano/${l.id}/editar`}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-3 py-2 text-sm font-semibold hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
                  aria-label={`Editar ${l.titulo}`}
                >
                  Editar
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openAction(l, 'VENDIDA')}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-3 py-2 text-sm font-semibold hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
                  aria-label={`Marcar ${l.titulo} como vendida`}
                >
                  Marcar vendida
                </button>
                {!l.esDonacion && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handlePassToDonation(l)}
                    className="rounded-xl border border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 px-3 py-2 text-sm font-semibold transition-colors"
                    aria-label={`Pasar ${l.titulo} a donación`}
                  >
                    Pasar a donación
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openAction(l, 'RETIRADA')}
                  className="rounded-xl border border-[var(--color-border-subtle,transparent)] px-3 py-2 text-sm font-semibold text-[var(--color-danger-text,#ff8a8a)] hover:bg-[var(--color-danger-bg,rgba(220,38,38,0.1))] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
                  aria-label={`Retirar ${l.titulo}`}
                >
                  Retirar
                </button>
              </div>
            ) : <p className="text-xs text-[var(--color-text-muted)]">{l.estado === 'VENDIDA' ? 'Vendida: ya no se puede cambiar.' : 'Retirada: ya no se muestra.'}</p>}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!action}
        busy={busy}
        danger={action?.to === 'RETIRADA'}
        onCancel={() => setAction(null)}
        onConfirm={run}
        title={action?.to === 'VENDIDA' ? 'Marcar como vendida' : '¿Retirar la publicación?'}
        confirmLabel={action?.to === 'VENDIDA' ? 'Confirmar venta' : 'Retirar'}
      >
        {action?.to === 'VENDIDA' ? (
          <div className="space-y-3">
            <p>«{action.listing.titulo}» ({formatCOP(action.listing.precio)}) dejará de aparecer como disponible. No se puede deshacer.</p>
            <div>
              <label htmlFor={buyers.length ? 'sell-buyer' : 'sell-buyer-id'} className="block text-sm font-semibold text-[var(--color-text)]">
                ¿A quién se la vendiste?
              </label>
              {buyers.length > 0 && (
                <select
                  id="sell-buyer"
                  value={selectedBuyer}
                  aria-invalid={!!buyerError}
                  aria-describedby={buyerError ? 'sell-buyer-err' : undefined}
                  onChange={(e) => { setSelectedBuyer(e.target.value); setBuyerError('') }}
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="">Elige la persona compradora</option>
                  {buyers.map((b) => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                  <option value="__otro__">Otro comprador (ingresar ID)</option>
                </select>
              )}
              {(selectedBuyer === '__otro__' || buyers.length === 0) && (
                <input
                  id="sell-buyer-id"
                  inputMode="numeric"
                  value={customBuyerId}
                  placeholder="ID numérico de quien te compró"
                  aria-invalid={!!buyerError}
                  aria-describedby={buyerError ? 'sell-buyer-err' : undefined}
                  onChange={(e) => { setCustomBuyerId(e.target.value); setBuyerError('') }}
                  className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                />
              )}
              <FieldError id="sell-buyer-err" message={buyerError} />
            </div>
          </div>
        ) : (
          `«${action?.listing.titulo}» dejará de verse en Segunda vida.`
        )}
      </ConfirmDialog>
    </div>
  )
}
