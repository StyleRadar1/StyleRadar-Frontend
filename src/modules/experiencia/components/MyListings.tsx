import { useRef, useState } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { Link } from 'react-router-dom'
import { errorKind, errorMessage } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { secondHandService } from '../services/secondHandService'
import { ESTADO_PUBLICACION_LABEL, type ListingDto } from '../types/secondhand.dto'

type Action = { listing: ListingDto; to: 'VENDIDA' | 'RETIRADA' }
const TONE = { DISPONIBLE: 'bg-[#9be3b4]/15 text-[#9be3b4]', VENDIDA: 'bg-arena/20 text-arena', RETIRADA: 'bg-white/10 text-white/60' }

/** RF-37 a RF-39: el dueño ve solo las acciones que permite el estado de cada prenda. */
export function MyListings() {
  const { data: list, loading, error, reload: load, setData: setList } = useResource(secondHandService.mine, [] as ListingDto[])
  const [action, setAction] = useState<Action | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const inFlight = useRef(false)


  const run = async () => {
    if (!action || inFlight.current) return
    inFlight.current = true; setBusy(true); setMsg(null)
    try {
      const upd = await secondHandService.setStatus(action.listing.id, { estado: action.to })
      setList((l) => l.map((x) => (x.id === upd.id ? upd : x)))
      setMsg({ ok: true, text: action.to === 'VENDIDA' ? `«${upd.titulo}» quedó como vendida.` : `Retiraste «${upd.titulo}» de Segunda vida.` })
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) })
      if (errorKind(e) === 'conflicto') load()
    } finally { inFlight.current = false; setBusy(false); setAction(null) }
  }

  if (loading) return <Loading label="Cargando tus publicaciones…" />
  if (error) return <ErrorState error={error} onRetry={load} title="No pudimos cargar tus publicaciones" />
  if (!list.length) return <EmptyState title="Aún no tienes publicaciones" action={<Link to="/segunda-mano/publicar" className="rounded-xl bg-violeta px-5 py-3 text-sm font-semibold">Vender una prenda</Link>}>Publica una prenda que ya no uses y dale una segunda vida.</EmptyState>

  return (
    <div>
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mb-4 rounded-xl p-3 text-sm ${msg.ok ? 'bg-[#9be3b4]/10 text-[#9be3b4]' : 'bg-[#ff8a8a]/10 text-[#ffb4b4]'}`}>{msg.text}</p>}
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
                <button type="button" disabled={busy} onClick={() => setAction({ listing: l, to: 'VENDIDA' })} className="rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold" aria-label={`Marcar ${l.titulo} como vendida`}>Marcar vendida</button>
                <button type="button" disabled={busy} onClick={() => setAction({ listing: l, to: 'RETIRADA' })} className="rounded-xl px-3 py-2 text-sm font-semibold text-[#ffb4b4]" aria-label={`Retirar ${l.titulo}`}>Retirar</button>
              </div>
            ) : <p className="text-xs text-white/50">{l.estado === 'VENDIDA' ? 'Vendida: ya no se puede cambiar.' : 'Retirada: ya no se muestra.'}</p>}
          </li>
        ))}
      </ul>
      <ConfirmDialog open={!!action} busy={busy} danger={action?.to === 'RETIRADA'} onCancel={() => setAction(null)} onConfirm={run}
        title={action?.to === 'VENDIDA' ? '¿Marcar como vendida?' : '¿Retirar la publicación?'} confirmLabel={action?.to === 'VENDIDA' ? 'Marcar vendida' : 'Retirar'}>
        {action?.to === 'VENDIDA' ? `«${action?.listing.titulo}» dejará de aparecer como disponible. No se puede deshacer.` : `«${action?.listing.titulo}» dejará de verse en Segunda vida.`}
      </ConfirmDialog>
    </div>
  )
}
