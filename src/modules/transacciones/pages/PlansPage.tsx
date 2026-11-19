import { Link, useNavigate } from 'react-router-dom'
import { formatCOP } from '@/modules/core/utils/format'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { BuyerRenewalStatusCard } from '../components/BuyerRenewalStatusCard'
import { CancelSubscriptionButton } from '../components/CancelSubscriptionButton'
import { PlanDegradedBanner } from '../components/PlanDegradedBanner'
import { useUserPlan } from '../hooks/useUserPlan'
import { COMPARATIVA, PLAN_LABEL, PLANES, REGLAS, type PlanInfo } from '../types/plan.dto'

const REGISTRO: Record<string, [string, string]> = {
  RADAR: ['/registro', 'Crear cuenta gratis'],
  RADAR_PLUS: ['/registro?plan=radar-plus', 'Empezar con Radar+'],
  TIENDA: ['/registro?tipo=tienda', 'Registrar mi tienda'],
  FUNDACION: ['/registro?tipo=fundacion', 'Registrar mi fundación'],
}

const formatFechaVigencia = (iso?: string) =>
  iso
    ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : '9 de diciembre de 2026'

/** P7 · Planes: lo que ofrece StyleRadar y lo que incluye cada plan (RF-100 y RF-101 para el comprador). */
export default function PlansPage() {
  const { user } = useAuth()
  const comprador = user?.role === 'COMPRADOR'
  const { plan, details } = useUserPlan(comprador)
  const navigate = useNavigate()

  const visiblePlans = user
    ? PLANES.filter((p) => {
        if (comprador) return p.id === 'RADAR' || p.id === 'RADAR_PLUS'
        if (user.role === 'ADMIN_ALMACEN') return p.id === 'TIENDA'
        if (user.role === 'REPRESENTANTE_FUNDACION') return p.id === 'FUNDACION'
        return false
      })
    : PLANES

  const fechaFinRadarPlus = formatFechaVigencia(details?.periodEndsAt ?? details?.proximoCobro)

  const accion = (p: PlanInfo) => {
    if (!user) {
      const [to, label] = REGISTRO[p.id]
      return (
        <Link
          to={to}
          className={`mt-auto block rounded-xl px-5 py-3 text-center text-sm font-semibold ${
            p.destacado ? 'bg-violeta text-blanco' : 'border border-white/25'
          }`}
        >
          {label}
        </Link>
      )
    }
    if (comprador) {
      if (p.id === 'RADAR') {
        if (plan === 'RADAR') {
          return (
            <p className="mt-auto rounded-xl border border-arena/50 px-5 py-3 text-center text-sm font-semibold text-arena">
              Tu plan actual
            </p>
          )
        }
        return (
          <p className="mt-auto rounded-xl border border-white/20 px-5 py-3 text-center text-xs text-white/50">
            Incluido en tu cuenta
          </p>
        )
      }
      if (p.id === 'RADAR_PLUS') {
        if (plan === 'RADAR_PLUS') {
          return (
            <div className="mt-auto space-y-2">
              <p className="rounded-xl border border-arena/50 px-5 py-2 text-center text-xs font-semibold text-arena">
                Tu plan actual
              </p>
              <CancelSubscriptionButton
                tipo="comprador"
                status="RADAR_PLUS"
                renewalEnabled={details?.renewalEnabled !== false}
                fechaFin={fechaFinRadarPlus}
              />
            </div>
          )
        }
        return (
          <button
            type="button"
            onClick={() => navigate('/suscripcion')}
            className="mt-auto rounded-xl bg-violeta px-5 py-3 text-sm font-semibold text-blanco"
          >
            Activar Radar+
          </button>
        )
      }
    }
    if (user.role === 'ADMIN_ALMACEN' && p.id === 'TIENDA') {
      return (
        <Link
          to="/tienda/suscripcion"
          className="mt-auto block rounded-xl border border-white/25 px-5 py-3 text-center text-sm font-semibold"
        >
          Ver mi suscripción
        </Link>
      )
    }
    if (user.role === 'REPRESENTANTE_FUNDACION' && p.id === 'FUNDACION') {
      return (
        <p className="mt-auto rounded-xl border border-arena/50 px-5 py-3 text-center text-sm font-semibold text-arena">
          Plan de tu organización
        </p>
      )
    }
    return null
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 bg-transparent text-[var(--sr-hero-text)]">
      <PlanDegradedBanner />
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-violeta-claro">Planes</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[var(--sr-hero-text)] md:text-5xl">
        Un plan para cada quien
      </h1>
      <p className="mt-3 max-w-2xl text-[var(--sr-hero-text-muted)]">
        Mirar el catálogo, el mapa y las playlists es gratis. Paga solo si quieres más, y cancela cuando quieras.
      </p>

      {user?.role === 'ADMIN_STYLERADAR' && (
        <div className="mt-6 rounded-2xl border border-white/20 bg-white/[.04] p-6 text-center text-sm text-white/80">
          Como administrador de StyleRadar no requieres una suscripción comercial. Gestiona la plataforma desde el panel de control.
        </div>
      )}

      {comprador && plan && (
        <p className="mt-4 text-sm text-[var(--sr-hero-text)]">
          Tu plan actual: <b>{PLAN_LABEL[plan]}</b>
        </p>
      )}

      <BuyerRenewalStatusCard />

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Planes">
        {visiblePlans.map((p) => (
          <li
            key={p.id}
            aria-label={p.nombre}
            data-plan-actual={comprador && plan === p.id}
            tabIndex={-1}
            className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur-xl ${
              p.destacado
                ? 'border-violeta bg-[var(--sr-surface)]/80 shadow-lg shadow-purple-900/20'
                : 'border-[var(--sr-border-subtle)] bg-[var(--sr-surface)]/60'
            }`}
          >
            {p.destacado && !(comprador && plan === p.id) && (
              <span className="absolute right-4 top-4 rounded-full bg-violeta px-3 py-1 text-[11px] font-semibold text-white">
                Más elegido
              </span>
            )}
            {comprador && plan === p.id && (
              <span className="absolute right-4 top-4 rounded-full bg-arena px-3 py-1 text-[11px] font-semibold text-grafito">
                Tu plan
              </span>
            )}
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--sr-hero-text-muted)]">{p.para}</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--sr-hero-text)]">{p.nombre}</h2>
            <p className="mt-3 text-3xl font-extrabold text-[var(--sr-hero-text)]">
              {p.precio ? formatCOP(p.precio) : '$0'}{' '}
              <small className="text-sm font-medium text-[var(--sr-hero-text-muted)]">{p.periodo}</small>
            </p>
            <p className="mt-1 min-h-10 text-sm text-[var(--sr-hero-text-muted)]">{p.nota}</p>
            <ul className="mb-6 mt-5 space-y-2 text-sm text-[var(--sr-hero-text)]">
              {p.incluye.map((i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden="true" className="text-violeta-claro">✓</span>
                  {i}
                </li>
              ))}
            </ul>
            {accion(p)}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-[var(--sr-hero-text-muted)]">
        Precios en pesos colombianos. Las tiendas pasan por una verificación antes de aparecer en el radar.
      </p>

      {(!user || comprador) && (
        <>
          <h2 className="mt-14 text-2xl font-bold">Radar y Radar+, lado a lado</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[520px] text-left text-sm">
              <caption className="sr-only">Comparación de los planes Radar y Radar+</caption>
              <thead className="bg-white/[.04] text-[11px] uppercase tracking-[.14em] text-lavanda">
                <tr>
                  <th scope="col" className="p-4 font-bold">Qué incluye</th>
                  <th scope="col" className="p-4 font-bold">Radar</th>
                  <th scope="col" className="p-4 font-bold text-arena">Radar+</th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIVA.map(([que, radar, plus]) => (
                  <tr key={que} className="border-t border-white/10">
                    <th scope="row" className="p-4 font-semibold">{que}</th>
                    <td className="p-4 text-white/75">{radar}</td>
                    <td className="p-4">{plus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="mt-14 text-2xl font-bold">Reglas de los planes</h2>
      <p className="mt-2 text-sm text-white/60">
        Condiciones generales del servicio de suscripciones y transacciones de StyleRadar.
      </p>
      <ol className="mt-5 grid gap-3 md:grid-cols-2" aria-label="Reglas de los planes">
        {REGLAS.map(([titulo, texto], i) => (
          <li key={titulo} className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
            <p className="font-semibold"><span className="mr-2 text-arena">{i + 1}.</span>{titulo}</p>
            <p className="mt-1 text-sm text-white/70">{texto}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
