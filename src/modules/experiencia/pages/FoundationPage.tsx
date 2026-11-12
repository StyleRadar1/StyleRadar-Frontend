import { useRef, useState } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { errorKind, errorMessage } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { ErrorBanner, ErrorToast, FieldError } from '@/modules/core/components/ErrorFeedback'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { donationService } from '../services/donationService'
import { ESTADO_DONACION_LABEL, SIGUIENTE, type DonationDto, type EstadoDonacion } from '../types/donation.dto'
import { CONSERVACION_LABEL } from '../types/secondhand.dto'
import { formatDay, isoDay } from '../utils/dates'

const FILTROS: (EstadoDonacion | 'TODAS')[] = ['TODAS', 'PENDIENTE', 'APROBADA', 'EN_RECOGIDA', 'ENTREGADA', 'RECHAZADA']
const TONE: Record<EstadoDonacion, string> = {
  PENDIENTE: 'bg-arena/20 text-arena', APROBADA: 'bg-violeta-claro/25 text-white', EN_RECOGIDA: 'bg-lavanda/25 text-white',
  ENTREGADA: 'bg-[#9be3b4]/15 text-[#9be3b4]', RECHAZADA: 'bg-white/10 text-white/60',
}
const ACCION: Partial<Record<EstadoDonacion, string>> = { APROBADA: 'Aceptar', RECHAZADA: 'Rechazar', EN_RECOGIDA: 'Iniciar recogida', ENTREGADA: 'Confirmar recepción' }

type Pending = { d: DonationDto; to: EstadoDonacion }

/** RF-46, RF-47 y RF-49: solicitudes de la fundación, decisión y confirmación con comprobante. */
export default function FoundationPage() {
  const { data: list, loading, error, reload: load, setData: setList } = useResource(donationService.forMyFoundation, [] as DonationDto[])
  const [filtro, setFiltro] = useState<EstadoDonacion | 'TODAS'>('PENDIENTE')
  const [pending, setPending] = useState<Pending | null>(null)
  const [just, setJust] = useState('')
  const [justErr, setJustErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'warn' | 'bad'; text: string; sub?: string } | null>(null)
  const [permError, setPermError] = useState(false)
  const inFlight = useRef(false)


  const today = isoDay()
  const blockedReason = (d: DonationDto, to: EstadoDonacion) => to === 'ENTREGADA' && d.logistica.fecha > today ? `Podrás confirmarla desde el ${formatDay(d.logistica.fecha)}.` : ''

  const open = (d: DonationDto, to: EstadoDonacion) => { setJust(''); setJustErr(''); setPending({ d, to }) }
  const run = async () => {
    if (!pending || inFlight.current) return
    if (pending.to === 'RECHAZADA' && just.trim().length < 10) {
      setJustErr('Escribe por qué la rechazas (mínimo 10 caracteres). Se lo enviaremos a quien dona.')
      window.setTimeout(() => document.getElementById('rjust')?.focus(), 0)
      return
    }
    inFlight.current = true; setBusy(true); setMsg(null); setPermError(false)
    try {
      const upd = await donationService.setStatus(pending.d.id, { estado: pending.to as Exclude<EstadoDonacion, 'PENDIENTE'>, justificacion: pending.to === 'RECHAZADA' ? just.trim() : undefined })
      setList((l) => l.map((x) => (x.id === upd.id ? upd : x)))
      setMsg({ tone: 'ok', text: upd.estado === 'ENTREGADA' ? `Recepción confirmada. Comprobante ${upd.comprobante?.codigo}.` : `«${upd.prenda.titulo}» ahora está ${ESTADO_DONACION_LABEL[upd.estado].toLowerCase()}.` })
      setPending(null)
    } catch (e) {
      const kind = errorKind(e)
      if (kind === 'conflicto') {
        setMsg({ tone: 'warn', text: 'Otra fundación ya la reclamó', sub: 'Actualizamos la lista.' })
        setPending(null)
        load()
      } else if (kind === 'permiso') {
        setPermError(true)
        setPending(null)
      } else {
        setMsg({ tone: 'bad', text: errorMessage(e) })
        setPending(null)
      }
    } finally { inFlight.current = false; setBusy(false) }
  }

  const isLoadPermError = !!error && errorKind(error) === 'permiso'

  const count = (f: EstadoDonacion | 'TODAS') => (f === 'TODAS' ? list.length : list.filter((d) => d.estado === f).length)
  const shown = list.filter((d) => filtro === 'TODAS' || d.estado === filtro)

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-arena">Fundación</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">Solicitudes de donación</h1>
      <p className="mt-3 max-w-2xl text-white/70">Revisa cada prenda, acepta o rechaza con un motivo y confirma cuando la recibas. Al confirmar se genera el comprobante para quien donó.</p>

      {loading ? <Loading label="Cargando solicitudes…" />
        : isLoadPermError ? (
          <ErrorBanner className="mt-8" tone="warn" icon="lock" title="No tienes permiso para hacer esto">
            Solo la persona representante puede reclamar donaciones.
          </ErrorBanner>
        )
        : error ? <div className="mt-8"><ErrorState error={error} onRetry={load} title="No pudimos cargar las solicitudes" /></div> : (<>
        <div role="group" aria-label="Filtrar por estado" className="mt-8 flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button key={f} type="button" aria-pressed={filtro === f} onClick={() => setFiltro(f)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${filtro === f ? 'border-arena bg-arena text-grafito' : 'border-white/20'}`}>
              {f === 'TODAS' ? 'Todas' : ESTADO_DONACION_LABEL[f]} <span className="opacity-70">{count(f)}</span></button>
          ))}
        </div>
        {permError && (
          <ErrorBanner className="mt-4" tone="warn" icon="lock" title="No tienes permiso para hacer esto">
            Solo la persona representante puede reclamar donaciones.
          </ErrorBanner>
        )}
        <ErrorToast
          open={!!msg}
          tone={msg?.tone ?? 'ok'}
          icon={msg?.tone === 'warn' ? 'refresh' : msg?.tone === 'ok' ? 'ok' : 'warn'}
          title={msg?.text ?? ''}
          subtitle={msg?.sub}
          onClose={() => setMsg(null)}
        />

        <div className="mt-6">
          {!shown.length ? <EmptyState title="No hay solicitudes en este estado">{filtro === 'PENDIENTE' ? 'Cuando alguien te ofrezca una prenda, aparecerá aquí.' : 'Prueba con otro filtro.'}</EmptyState> : (
            <ul className="space-y-3" aria-label="Solicitudes">
              {shown.map((d) => (
                <li key={d.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <div className="flex flex-wrap gap-4">
                    <img src={d.fotos[0]} alt="" className="h-24 w-20 rounded-lg bg-arena object-cover" />
                    <div className="min-w-48 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{d.prenda.cantidad > 1 ? `${d.prenda.cantidad} × ` : ''}{d.prenda.titulo}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[d.estado]}`}>{ESTADO_DONACION_LABEL[d.estado]}</span>
                      </div>
                      <p className="text-sm text-white/65">{d.prenda.categoria} · Talla {d.prenda.talla} · {CONSERVACION_LABEL[d.prenda.conservacion]} · de {d.donante.nombre}</p>
                      <p className="mt-1 text-sm text-white/65">{d.logistica.modalidad === 'RECOGIDA' ? `Recogida en ${d.logistica.direccion}` : `Entrega en ${d.logistica.puntoNombre ?? 'punto de acopio'}`} · {formatDay(d.logistica.fecha)}, {d.logistica.franja}</p>
                      {d.justificacion && <p className="mt-1 text-sm text-white/65">Motivo: {d.justificacion}</p>}
                      {d.comprobante && <p className="mt-1 text-sm text-[#9be3b4]">Comprobante {d.comprobante.codigo} · {formatDay(d.comprobante.emitidoEn)}</p>}
                    </div>
                    <div className="flex flex-wrap items-start gap-2">
                      {SIGUIENTE[d.estado].map((to) => {
                        const why = blockedReason(d, to)
                        return (
                          <div key={to} className="flex flex-col items-end">
                            <button type="button" disabled={!!why || busy} onClick={() => open(d, to)} aria-label={`${ACCION[to]}: ${d.prenda.titulo}`}
                              className={`rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-50 ${to === 'RECHAZADA' ? 'text-[#ffb4b4]' : to === 'APROBADA' || to === 'ENTREGADA' ? 'bg-violeta' : 'border border-white/20'}`}>{ACCION[to]}</button>
                            {why && <span className="mt-1 max-w-44 text-right text-[11px] text-white/55">{why}</span>}
                          </div>
                        )
                      })}
                      {!SIGUIENTE[d.estado].length && <span className="text-xs text-white/50">Sin acciones</span>}
                      {/* RF-41: coordinar la entrega con quien dona, sin publicar la dirección */}
                      {(d.estado === 'APROBADA' || d.estado === 'EN_RECOGIDA') && (
                        <ContactButton label="Escribir a quien dona" contacto={{ ...d.donante, tipo: 'DONANTE' }} asunto={`Donación: ${d.prenda.titulo}`} referenciaId={d.id} />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </>)}

      <ConfirmDialog open={!!pending} busy={busy} danger={pending?.to === 'RECHAZADA'} onCancel={() => setPending(null)} onConfirm={run}
        title={pending ? `${ACCION[pending.to]}: «${pending.d.prenda.titulo}»` : ''} confirmLabel={pending ? ACCION[pending.to]! : ''}>
        {pending?.to === 'RECHAZADA' ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rjust" className="font-semibold text-white">Motivo del rechazo</label>
            <textarea id="rjust" value={just} onChange={(e) => { setJust(e.target.value); setJustErr('') }} aria-invalid={!!justErr} aria-describedby={justErr ? 'rjust-err' : undefined}
              className="min-h-24 rounded-xl border border-white/20 bg-black/20 p-3 text-sm text-white outline-none focus:border-violeta-claro" />
            <FieldError id="rjust-err" message={justErr} />
          </div>
        ) : pending?.to === 'ENTREGADA' ? 'Confirma solo si la prenda ya está en tus manos. Se generará el comprobante para quien donó y no se puede deshacer.'
          : pending?.to === 'APROBADA' ? 'Quien dona recibirá un aviso con la fecha y el lugar que propuso.'
          : 'Marca que la recogida o entrega ya está en curso.'}
      </ConfirmDialog>
    </section>
  )
}
