import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { formatCOP } from '@/modules/core/utils/format'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { RADAR_PLUS_PRICE } from '../constants/plansByRole'
import { deriveSubscriptionStatus } from '../mappers/paymentsMappers'
import { getTryOnPhotoUses, userPlanService } from '../services/userPlanService'
import { PLANES, PLAN_LIMITS, type MiPlanDto, type PlanUsuario } from '../types/plan.dto'
import { formatFechaEsCO } from '../utils/fechas'
import { getSubscriptionBadgeClass } from '../utils/subscriptionBadge'

/** «Radar+» con el «+» resaltado. */
function NombrePlan({ nombre }: { nombre: string }) {
  if (!nombre.endsWith('+')) return <>{nombre}</>
  return (
    <>
      {nombre.slice(0, -1)}
      <span className="text-violeta-claro">+</span>
    </>
  )
}

function Fecha({ label, valor, nota }: { label: string; valor: string; nota?: string }) {
  return (
    <div className="sr-glass-card flex flex-1 items-center gap-4 rounded-3xl border px-7 py-6">
      <Calendar aria-hidden="true" className="h-8 w-8 shrink-0 text-[var(--sr-accent-text,#c084fc)]" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--sr-hero-text-muted)]">{label}</p>
        <p className="mt-1.5 text-2xl font-extrabold text-[var(--sr-hero-text)]">{valor}</p>
        {nota && <p className="mt-1.5 text-sm text-[var(--sr-hero-text-muted)]">{nota}</p>}
      </div>
    </div>
  )
}

/**
 * Cancelar Radar+. ms-pagos solo apaga la renovación (POST /subscriptions/{id}/cancel): el plan sigue hasta el fin
 * del periodo pagado y ese día vuelve a Radar. Si ya estaba apagada, el diálogo solo lo explica.
 */
function CancelarRadarPlus({ renovacion, fin }: { renovacion: boolean; fin: string }) {
  const [abierto, setAbierto] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmar = async () => {
    if (!renovacion) { setAbierto(false); return }
    setOcupado(true)
    setError(null)
    try {
      await userPlanService.setRenewal(false)
      setAbierto(false)
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'No fue posible cancelar Radar+. Intenta de nuevo.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setError(null); setAbierto(true) }}
        className="w-full rounded-2xl border border-rose-400/40 bg-rose-500/10 px-6 py-4 text-base font-bold text-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-500/20"
      >
        Cancelar suscripción
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-rose-300">{error}</p>}
      <ConfirmDialog
        open={abierto}
        title={renovacion ? '¿Cancelar Radar+?' : 'Tu suscripción ya está cancelada'}
        confirmLabel={renovacion ? 'Cancelar suscripción' : 'Entendido'}
        cancelLabel={renovacion ? 'Conservar Radar+' : 'Cerrar'}
        danger={renovacion}
        busy={ocupado}
        onConfirm={() => { void confirmar() }}
        onCancel={() => setAbierto(false)}
      >
        <p className="text-left text-sm text-[var(--sr-text-primary,var(--color-text))]">
          {renovacion
            ? <>No se te volverá a cobrar. Conservas los beneficios de Radar+ hasta el <strong>{fin}</strong> y ese día vuelves al plan Radar gratis.</>
            : <>Radar+ no se renovará. Sigues con sus beneficios hasta el <strong>{fin}</strong> y ese día vuelves automáticamente al plan Radar gratis.</>}
        </p>
      </ConfirmDialog>
    </>
  )
}

/**
 * /planes para el comprador con sesión: solo su plan actual. Tarjeta grande a la izquierda;
 * a la derecha las fechas y la acción (cancelar Radar+ o pasarse a Radar+ desde el plan gratis).
 */
export function BuyerCurrentPlan({ plan, details }: { plan: PlanUsuario; details: MiPlanDto | null }) {
  const { user } = useAuth()
  const info = PLANES.find((p) => p.id === plan)
  if (!info) return null

  const esPlus = plan === 'RADAR_PLUS'
  const estado = details?.estado ?? 'ACTIVA'
  const renovacion = details?.renewalEnabled !== false
  const finRaw = details?.fechaFin ?? details?.proximoCobro ?? details?.periodEndsAt ?? null
  const inicio = formatFechaEsCO(details?.fechaInicio ?? null)
  const fin = formatFechaEsCO(finRaw)
  const derivado = deriveSubscriptionStatus(estado, { autoRenewal: renovacion, endDate: finRaw })
  const pendiente = esPlus && derivado.status === 'PENDIENTE'
  const yaTuvoPlus = details?.estado === 'SUSPENDIDA' || details?.estado === 'VENCIDA'
  const usos = getTryOnPhotoUses(user?.id ?? 'u-1')

  let estadoBadge: ReactNode
  let nota: string
  let accion: ReactNode
  if (esPlus) {
    estadoBadge = (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${getSubscriptionBadgeClass(derivado.status, renovacion)}`}>
        <span aria-hidden="true">●</span>
        {derivado.label}
      </span>
    )
    nota = pendiente
      ? 'Tu pago está pendiente de confirmación.'
      : renovacion
        ? `Se renueva automáticamente por ${formatCOP(RADAR_PLUS_PRICE)}.`
        : 'No se renovará: ese día vuelves al plan Radar.'
    accion = pendiente || derivado.status !== 'ACTIVA' ? null : <CancelarRadarPlus renovacion={renovacion} fin={fin ?? 'el final del periodo'} />
  } else {
    estadoBadge = (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-arena/50 px-2.5 py-0.5 text-xs font-bold text-arena">
        Gratis para todos
      </span>
    )
    // ms-pagos devuelve el plan Radar mientras el pago de Radar+ está pendiente: no se ofrece pagar de nuevo
    const pagoPendiente = details?.estado === 'PENDIENTE'
    nota = pagoPendiente
      ? 'Tu pago de Radar+ está pendiente de confirmación. Te avisamos cuando quede activo.'
      : 'Con Radar+ tienes 50 usos al mes del probador con tu foto y alertas cuando vuelve tu talla.'
    accion = pagoPendiente ? (
      <p className="rounded-2xl border border-arena/50 px-6 py-4 text-center text-base font-bold text-arena">Suscripción pendiente</p>
    ) : (
      <Link
        to="/suscripcion"
        className="group flex items-center justify-center rounded-2xl bg-violeta px-6 py-4 text-base font-bold text-white shadow-lg shadow-purple-900/40 transition hover:-translate-y-0.5 hover:bg-violeta-claro"
      >
        {yaTuvoPlus ? 'Renovar a Radar' : 'Pásate a Radar'}
        <span aria-hidden="true" className="text-2xl font-black leading-none text-arena transition group-hover:scale-125">+</span>
        <span className="sr-only">+</span>
      </Link>
    )
  }

  return (
    <section aria-label="Tu plan actual" className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <article
        aria-label={info.nombre}
        data-plan-actual="true"
        className={`sr-glass-card relative flex flex-col rounded-3xl border p-8 ${
          esPlus ? 'outline outline-1 -outline-offset-1 outline-violeta/70' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-arena px-3 py-1 text-[11px] font-semibold text-grafito">Tu plan</span>
          {estadoBadge}
        </div>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[.18em] text-[var(--sr-hero-text-muted)]">{info.para}</p>
        <h2 className="mt-1 text-5xl font-extrabold tracking-tight text-[var(--sr-hero-text)]">
          <NombrePlan nombre={info.nombre} />
        </h2>
        <p className="mt-4 text-4xl font-extrabold text-[var(--sr-hero-text)]">
          {info.precio ? formatCOP(info.precio) : '$0'}{' '}
          <small className="text-base font-medium text-[var(--sr-hero-text-muted)]">{info.periodo}</small>
        </p>
        <p className="mt-2 text-[var(--sr-hero-text-muted)]">{info.nota}</p>
        <ul className="mt-6 space-y-2.5 text-[var(--sr-hero-text)]">
          {info.incluye.map((i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true" className="text-violeta-claro">✓</span>
              {i}
            </li>
          ))}
        </ul>
        {esPlus && !pendiente && (
          <p className="mt-6 text-sm font-semibold text-arena">
            Usos del probador con foto propia: {Math.max(0, PLAN_LIMITS.probadorFoto - usos)} de {PLAN_LIMITS.probadorFoto} disponibles
          </p>
        )}
      </article>

      <div className="flex flex-col gap-4">
        {esPlus ? (
          <>
            <Fecha label="Activa desde" valor={pendiente ? 'Pendiente' : inicio ?? 'Sin fecha'} />
            <Fecha
              label={derivado.status === 'CANCELADA' || derivado.status === 'VENCIDA' ? 'Finalizó el' : 'Vigente hasta'}
              valor={pendiente ? 'Pendiente' : fin ?? 'Sin fecha'}
              nota={nota}
            />
          </>
        ) : (
          <>
            <Fecha label="Activa desde" valor="Siempre activo" nota="Es el plan con el que empieza toda cuenta." />
            <Fecha label="Vigente hasta" valor="Sin vencimiento" nota="No tiene fecha de corte ni cobros." />
          </>
        )}
        {!esPlus && <p className="px-1 text-sm text-[var(--sr-hero-text-muted)]">{nota}</p>}
        {accion && <div>{accion}</div>}
      </div>
    </section>
  )
}

/** Misma forma que BuyerCurrentPlan mientras llega el plan, para que la página no salte. */
export function BuyerCurrentPlanSkeleton() {
  const barra = 'animate-pulse rounded-lg bg-white/10'
  return (
    <section aria-label="Cargando tu plan" aria-busy="true" className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="sr-glass-card flex flex-col gap-4 rounded-3xl border p-8">
        <div className={`${barra} h-6 w-40`} />
        <div className={`${barra} h-12 w-48`} />
        <div className={`${barra} h-10 w-56`} />
        <div className={`${barra} h-4 w-2/3`} />
        <div className={`${barra} mt-4 h-4 w-1/2`} />
        <div className={`${barra} h-4 w-3/5`} />
        <div className={`${barra} h-4 w-2/5`} />
      </div>
      <div className="flex flex-col gap-4">
        <div className="sr-glass-card flex flex-1 items-center rounded-3xl border px-7 py-6"><div className={`${barra} h-10 w-3/4`} /></div>
        <div className="sr-glass-card flex flex-1 items-center rounded-3xl border px-7 py-6"><div className={`${barra} h-10 w-3/4`} /></div>
        <div className={`${barra} h-14 w-full rounded-2xl`} />
      </div>
      <p className="sr-only" role="status">Cargando tu plan…</p>
    </section>
  )
}
