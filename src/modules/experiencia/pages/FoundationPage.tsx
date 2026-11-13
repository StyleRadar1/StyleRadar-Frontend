import { useRef, useState } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { errorKind, errorMessage } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { donationService } from '../services/donationService'
import { ESTADO_DONACION_LABEL, SIGUIENTE, type DonationDto, type EstadoDonacion } from '../types/donation.dto'
import { CONSERVACION_LABEL } from '../types/secondhand.dto'
import { formatDay, isoDay } from '../utils/dates'
import './FoundationDashboard.css'

const FILTROS: (EstadoDonacion | 'TODAS')[] = ['TODAS', 'PENDIENTE', 'APROBADA', 'EN_RECOGIDA', 'ENTREGADA', 'RECHAZADA']

const TONE: Record<EstadoDonacion, string> = {
  PENDIENTE: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30',
  APROBADA: 'bg-violeta/15 text-violeta dark:text-violeta-claro border border-violeta/30',
  EN_RECOGIDA: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30',
  ENTREGADA: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30',
  RECHAZADA: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30',
}

const ACCION: Partial<Record<EstadoDonacion, string>> = {
  APROBADA: 'Aceptar',
  RECHAZADA: 'Rechazar',
  EN_RECOGIDA: 'Iniciar recogida',
  ENTREGADA: 'Confirmar recepción',
}

type Pending = { d: DonationDto; to: EstadoDonacion }

/**
 * RF-46, RF-47 y RF-49: Solicitudes de donación de la fundación.
 * Vista visualmente renovada al estilo editorial de StyleRadar.
 */
export default function FoundationPage() {
  const { data: list, loading, error, reload: load, setData: setList } = useResource(donationService.forMyFoundation, [] as DonationDto[])
  const [filtro, setFiltro] = useState<EstadoDonacion | 'TODAS'>('PENDIENTE')
  const [pending, setPending] = useState<Pending | null>(null)
  const [just, setJust] = useState('')
  const [justErr, setJustErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const inFlight = useRef(false)

  const today = isoDay()
  const blockedReason = (d: DonationDto, to: EstadoDonacion) =>
    to === 'ENTREGADA' && d.logistica.fecha > today
      ? `Podrás confirmarla desde el ${formatDay(d.logistica.fecha)}.`
      : ''

  const open = (d: DonationDto, to: EstadoDonacion) => {
    setJust('')
    setJustErr('')
    setPending({ d, to })
  }

  const run = async () => {
    if (!pending || inFlight.current) return
    if (pending.to === 'RECHAZADA' && just.trim().length < 10) {
      setJustErr('Escribe por qué la rechazas (mínimo 10 caracteres). Se lo enviaremos a quien dona.')
      return
    }
    inFlight.current = true
    setBusy(true)
    setMsg(null)
    try {
      const upd = await donationService.setStatus(pending.d.id, {
        estado: pending.to as Exclude<EstadoDonacion, 'PENDIENTE'>,
        justificacion: pending.to === 'RECHAZADA' ? just.trim() : undefined,
      })
      setList((l) => l.map((x) => (x.id === upd.id ? upd : x)))
      setMsg({
        ok: true,
        text:
          upd.estado === 'ENTREGADA'
            ? `Recepción confirmada. Comprobante ${upd.comprobante?.codigo}.`
            : `«${upd.prenda.titulo}» ahora está ${ESTADO_DONACION_LABEL[upd.estado].toLowerCase()}.`,
      })
      setPending(null)
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) })
      setPending(null)
      if (errorKind(e) === 'conflicto') load()
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const count = (f: EstadoDonacion | 'TODAS') => (f === 'TODAS' ? list.length : list.filter((d) => d.estado === f).length)
  const shown = list.filter((d) => filtro === 'TODAS' || d.estado === filtro)

  return (
    <div className="fnd-donations">
      {/* ── Banner Superior Hero ── */}
      <section className="fnd-hero" aria-label="Cabecera de donaciones">
        <div className="fnd-hero__media" aria-hidden="true">
          <img
            src="/img/fundaciones/abrigo-trabajo.jpg"
            alt="Fondo de donaciones"
          />
        </div>
        <div className="fnd-hero__shade" aria-hidden="true" />

        <div className="fnd-hero__inner">
          <span className="fnd-hero__eyebrow">DONACIONES · GESTIÓN DE IMPACTO</span>
          <h1 className="fnd-hero__title">Solicitudes de donación</h1>
          <p className="fnd-hero__lead">
            Revisa cada prenda, acepta o rechaza con un motivo y confirma cuando la recibas.
            Al confirmar se genera el comprobante para quien donó.
          </p>

          {/* Fila de 4 KPIs resumen */}
          <div className="fnd-hero-kpis" aria-label="Resumen de donaciones">
            <div className="fnd-kpi-card">
              <span className="fnd-kpi-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none stroke-[2]" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </span>
              <div>
                <span className="fnd-kpi-card__value">{list.length}</span>
                <span className="fnd-kpi-card__label">Total solicitudes</span>
              </div>
            </div>

            <div className="fnd-kpi-card">
              <span className="fnd-kpi-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none stroke-[2]" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <div>
                <span className="fnd-kpi-card__value">{count('PENDIENTE')}</span>
                <span className="fnd-kpi-card__label">Pendientes</span>
              </div>
            </div>

            <div className="fnd-kpi-card">
              <span className="fnd-kpi-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none stroke-[2]" aria-hidden="true">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </span>
              <div>
                <span className="fnd-kpi-card__value">{count('EN_RECOGIDA')}</span>
                <span className="fnd-kpi-card__label">En recogida</span>
              </div>
            </div>

            <div className="fnd-kpi-card">
              <span className="fnd-kpi-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none stroke-[2]" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
              <div>
                <span className="fnd-kpi-card__value">{count('ENTREGADA')}</span>
                <span className="fnd-kpi-card__label">Entregadas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contenido de solicitudes ── */}
      <div className="fnd-container">
        {loading ? (
          <Loading label="Cargando solicitudes…" />
        ) : error ? (
          <div className="mt-8">
            <ErrorState error={error} onRetry={load} title="No pudimos cargar las solicitudes" />
          </div>
        ) : (
          <>
            {/* Barra de filtros de estado en píldoras */}
            <div role="group" aria-label="Filtrar por estado" className="fnd-toolbar">
              {FILTROS.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filtro === f}
                  onClick={() => setFiltro(f)}
                  className="fnd-filter-btn"
                >
                  <span>{f === 'TODAS' ? 'Todas' : ESTADO_DONACION_LABEL[f]}</span>
                  <span className="fnd-filter-badge">{count(f)}</span>
                </button>
              ))}
            </div>

            {msg && (
              <p
                role={msg.ok ? 'status' : 'alert'}
                className={`mb-6 rounded-2xl p-4 text-sm font-semibold shadow-sm ${
                  msg.ok
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25'
                    : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/25'
                }`}
              >
                {msg.text}
              </p>
            )}

            {!shown.length ? (
              <EmptyState title="No hay solicitudes en este estado">
                {filtro === 'PENDIENTE'
                  ? 'Cuando alguien te ofrezca una prenda, aparecerá aquí.'
                  : 'Prueba con otro filtro.'}
              </EmptyState>
            ) : (
              <ul className="fnd-donation-list" aria-label="Solicitudes">
                {shown.map((d) => (
                  <li key={d.id} className="fnd-donation-card">
                    <img
                      src={d.fotos[0]}
                      alt=""
                      className="fnd-donation-card__img"
                    />

                    <div className="fnd-donation-card__main">
                      <div className="fnd-donation-card__title-row">
                        <p className="fnd-donation-card__title">
                          {d.prenda.cantidad > 1 ? `${d.prenda.cantidad} × ` : ''}
                          {d.prenda.titulo}
                        </p>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[d.estado]}`}>
                          {ESTADO_DONACION_LABEL[d.estado]}
                        </span>
                      </div>

                      <p className="fnd-donation-card__meta">
                        {d.prenda.categoria} · Talla {d.prenda.talla} · {CONSERVACION_LABEL[d.prenda.conservacion]} · de {d.donante.nombre}
                      </p>

                      <p className="fnd-donation-card__logistics">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current fill-none stroke-[2] flex-shrink-0" aria-hidden="true">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>
                          {d.logistica.modalidad === 'RECOGIDA'
                            ? `Recogida en ${d.logistica.direccion}`
                            : `Entrega en ${d.logistica.puntoNombre ?? 'punto de acopio'}`}
                          {' '}· {formatDay(d.logistica.fecha)}, {d.logistica.franja}
                        </span>
                      </p>

                      {d.justificacion && (
                        <p className="mt-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs text-rose-700 dark:text-rose-300">
                          <strong>Motivo:</strong> {d.justificacion}
                        </p>
                      )}

                      {d.comprobante && (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-current fill-none stroke-[2]" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Comprobante {d.comprobante.codigo} · {formatDay(d.comprobante.emitidoEn)}
                        </p>
                      )}
                    </div>

                    <div className="fnd-donation-card__actions">
                      {SIGUIENTE[d.estado].map((to) => {
                        const why = blockedReason(d, to)
                        const isDanger = to === 'RECHAZADA'
                        const isPrimary = to === 'APROBADA' || to === 'ENTREGADA'
                        return (
                          <div key={to} className="flex flex-col items-end">
                            <button
                              type="button"
                              disabled={!!why || busy}
                              onClick={() => open(d, to)}
                              aria-label={`${ACCION[to]}: ${d.prenda.titulo}`}
                              className={`rounded-full px-4 py-2 text-xs font-bold transition disabled:opacity-50 ${
                                isDanger
                                  ? 'border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40'
                                  : isPrimary
                                  ? 'bg-violeta text-white hover:bg-violeta-hover shadow-sm'
                                  : 'border border-gray-300 text-grafito hover:bg-gray-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10'
                              }`}
                            >
                              {ACCION[to]}
                            </button>
                            {why && (
                              <span className="mt-1 max-w-44 text-right text-[0.6875rem] text-gray-500 dark:text-white/55">
                                {why}
                              </span>
                            )}
                          </div>
                        )
                      })}

                      {!SIGUIENTE[d.estado].length && (
                        <span className="text-xs text-gray-400 dark:text-white/50">Sin acciones</span>
                      )}

                      {/* RF-41: coordinar la entrega con quien dona, sin publicar la dirección */}
                      {(d.estado === 'APROBADA' || d.estado === 'EN_RECOGIDA') && (
                        <ContactButton
                          label="Escribir a quien dona"
                          contacto={{ ...d.donante, tipo: 'DONANTE' }}
                          asunto={`Donación: ${d.prenda.titulo}`}
                          referenciaId={d.id}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!pending}
        busy={busy}
        danger={pending?.to === 'RECHAZADA'}
        onCancel={() => setPending(null)}
        onConfirm={run}
        title={pending ? `${ACCION[pending.to]}: «${pending.d.prenda.titulo}»` : ''}
        confirmLabel={pending ? ACCION[pending.to]! : ''}
      >
        {pending?.to === 'RECHAZADA' ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rjust" className="font-semibold text-white">
              Motivo del rechazo
            </label>
            <textarea
              id="rjust"
              value={just}
              onChange={(e) => {
                setJust(e.target.value)
                setJustErr('')
              }}
              aria-invalid={!!justErr}
              aria-describedby={justErr ? 'rjust-err' : undefined}
              className="min-h-24 rounded-xl border border-white/20 bg-black/20 p-3 text-sm text-white outline-none focus:border-violeta-claro"
            />
            {justErr && (
              <p id="rjust-err" role="alert" className="text-xs text-[#ffb4b4]">
                {justErr}
              </p>
            )}
          </div>
        ) : pending?.to === 'ENTREGADA' ? (
          'Confirma solo si la prenda ya está en tus manos. Se generará el comprobante para quien donó y no se puede deshacer.'
        ) : pending?.to === 'APROBADA' ? (
          'Quien dona recibirá un aviso con la fecha y el lugar que propuso.'
        ) : (
          'Marca que la recogida o entrega ya está en curso.'
        )}
      </ConfirmDialog>
    </div>
  )
}
