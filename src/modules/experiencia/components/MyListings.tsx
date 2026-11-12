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

const TONE = { DISPONIBLE: 'bg-[#9be3b4]/15 text-[#9be3b4]', VENDIDA: 'bg-arena/20 text-arena', RETIRADA: 'bg-white/10 text-white/60' }

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

  if (loading) return <Loading label="Cargando tus publicaciones…" />
  if (error) return <ErrorState error={error} onRetry={load} title="No pudimos cargar tus publicaciones" />
  if (!list.length) return <EmptyState title="Aún no tienes publicaciones" action={<Link to="/segunda-mano/publicar" className="rounded-xl bg-violeta px-5 py-3 text-sm font-semibold">Vender una prenda</Link>}>Publica una prenda que ya no uses y dale una segunda vida.</EmptyState>

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
          <li key={l.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-3">
            <img src={l.fotos[0]} alt="" className="h-20 w-16 rounded-lg bg-arena object-cover" />
            <div className="min-w-40 flex-1">
              <p className="font-semibold">{l.titulo}</p>
              <p className="text-sm text-white/65">{formatCOP(l.precio)} · Talla {l.talla}</p>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[l.estado]}`}>{ESTADO_PUBLICACION_LABEL[l.estado]}</span>
            </div>
            {l.estado === 'DISPONIBLE' ? (
              <div className="flex flex-wrap gap-2">
                <Link to={`/segunda-mano/${l.id}/editar`} className="rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold" aria-label={`Editar ${l.titulo}`}>Editar</Link>
                <button type="button" disabled={busy} onClick={() => openAction(l, 'VENDIDA')} className="rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold" aria-label={`Marcar ${l.titulo} como vendida`}>Marcar vendida</button>
                <button type="button" disabled={busy} onClick={() => openAction(l, 'RETIRADA')} className="rounded-xl px-3 py-2 text-sm font-semibold text-[#ffb4b4]" aria-label={`Retirar ${l.titulo}`}>Retirar</button>
              </div>
            ) : <p className="text-xs text-white/50">{l.estado === 'VENDIDA' ? 'Vendida: ya no se puede cambiar.' : 'Retirada: ya no se muestra.'}</p>}
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
              <label htmlFor={buyers.length ? 'sell-buyer' : 'sell-buyer-id'} className="block text-sm font-semibold text-blanco">
                ¿A quién se la vendiste?
              </label>
              {buyers.length > 0 && (
                <select
                  id="sell-buyer"
                  value={selectedBuyer}
                  aria-invalid={!!buyerError}
                  aria-describedby={buyerError ? 'sell-buyer-err' : undefined}
                  onChange={(e) => { setSelectedBuyer(e.target.value); setBuyerError('') }}
                  className="mt-1.5 w-full rounded-xl border border-white/20 bg-black/25 px-3 py-2.5 text-sm text-blanco outline-none focus:border-violeta-claro"
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
                  className="mt-2 w-full rounded-xl border border-white/20 bg-black/25 px-3 py-2.5 text-sm text-blanco outline-none focus:border-violeta-claro"
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
