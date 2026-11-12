import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { formatCOP } from '@/modules/core/utils/format'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { useUserPlan } from '../hooks/useUserPlan'
import { userPlanService } from '../services/userPlanService'
import { COMPARATIVA, PLAN_LABEL, PLANES, REGLAS, type PlanInfo, type PlanUsuario } from '../types/plan.dto'

const REGISTRO: Record<string, [string, string]> = {
  RADAR: ['/registro', 'Crear cuenta gratis'],
  RADAR_PLUS: ['/registro?plan=radar-plus', 'Empezar con Radar+'],
  TIENDA: ['/registro?tipo=tienda', 'Registrar mi tienda'],
  FUNDACION: ['/registro?tipo=fundacion', 'Registrar mi fundación'],
}
const esPlanUsuario = (id: string): id is PlanUsuario => id === 'RADAR' || id === 'RADAR_PLUS'

/** P7 · Planes: lo que ofrece StyleRadar y lo que incluye cada plan (RF-100 y RF-101 para el comprador). */
export default function PlansPage() {
  const { user } = useAuth()
  const comprador = user?.role === 'COMPRADOR'
  const { plan } = useUserPlan(comprador)
  const navigate = useNavigate()
  const [cambio, setCambio] = useState<PlanUsuario | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const cambiar = async () => {
    if (!cambio || busy) return
    setBusy(true); setMsg(null)
    try {
      const r = await userPlanService.change(cambio)
      setMsg({ ok: true, text: r.plan === 'RADAR_PLUS' ? 'Listo: ya tienes Radar+. Los candados desaparecen.' : 'Volviste al plan Radar. Los beneficios de Radar+ quedan con candado.' })
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e, 'No pudimos cambiar tu plan. Intenta de nuevo.') })
    } finally { setBusy(false); setCambio(null) }
  }

  const accion = (p: PlanInfo) => {
    if (!user) {
      const [to, label] = REGISTRO[p.id]
      return <Link to={to} className={`mt-auto block rounded-xl px-5 py-3 text-center text-sm font-semibold ${p.destacado ? 'bg-violeta' : 'border border-white/25'}`}>{label}</Link>
    }
    if (comprador && esPlanUsuario(p.id)) {
      const id = p.id
      if (!plan) return null
      if (plan === id) return <p className="mt-auto rounded-xl border border-arena/50 px-5 py-3 text-center text-sm font-semibold text-arena">Plan actual</p>
      // Subir a Radar+ pasa por el pago (/suscripcion); bajar a Radar solo pide confirmación.
      return <button type="button" onClick={() => (id === 'RADAR_PLUS' ? navigate('/suscripcion') : setCambio(id))} className={`mt-auto rounded-xl px-5 py-3 text-sm font-semibold ${p.destacado ? 'bg-violeta' : 'border border-white/25'}`}>Cambiar a {p.nombre}</button>
    }
    if (user.role === 'ADMIN_ALMACEN' && p.id === 'TIENDA') {
      return <Link to="/tienda/suscripcion" className="mt-auto block rounded-xl border border-white/25 px-5 py-3 text-center text-sm font-semibold">Ver mi suscripción</Link>
    }
    return null
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 bg-transparent text-[var(--sr-hero-text)]">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-violeta-claro">Planes</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[var(--sr-hero-text)] md:text-5xl">
          Un plan para cada quien
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--sr-hero-text-muted)]">
          Mirar el catálogo, el mapa y las playlists es gratis. Paga solo si quieres más, y cancela cuando quieras.
        </p>
        {comprador && plan && <p className="mt-4 text-sm text-[var(--sr-hero-text)]">Tu plan actual: <b>{PLAN_LABEL[plan]}</b></p>}
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mt-4 rounded-xl p-3 text-sm ${msg.ok ? 'bg-[#9be3b4]/10 text-[#9be3b4]' : 'bg-[#ff8a8a]/10 text-[#ffb4b4]'}`}>{msg.text}</p>}

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Planes">
          {PLANES.map((p) => (
            <li
              key={p.id}
              aria-label={p.nombre}
              className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur-xl ${
                p.destacado
                  ? 'border-violeta bg-[var(--sr-surface)]/80 shadow-lg shadow-purple-900/20'
                  : 'border-[var(--sr-border-subtle)] bg-[var(--sr-surface)]/60'
              }`}
            >
              {p.destacado && !(comprador && plan === p.id) && <span className="absolute right-4 top-4 rounded-full bg-violeta px-3 py-1 text-[11px] font-semibold text-white">Más elegido</span>}
              {comprador && plan === p.id && <span className="absolute right-4 top-4 rounded-full bg-arena px-3 py-1 text-[11px] font-semibold text-grafito">Tu plan</span>}
              <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--sr-hero-text-muted)]">{p.para}</p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--sr-hero-text)]">{p.nombre}</h2>
              <p className="mt-3 text-3xl font-extrabold text-[var(--sr-hero-text)]">
                {p.precio ? formatCOP(p.precio) : '$0'}{' '}
                <small className="text-sm font-medium text-[var(--sr-hero-text-muted)]">{p.periodo}</small>
              </p>
              <p className="mt-1 min-h-10 text-sm text-[var(--sr-hero-text-muted)]">{p.nota}</p>
              <ul className="mb-6 mt-5 space-y-2 text-sm text-[var(--sr-hero-text)]">
                {p.incluye.map((i) => <li key={i} className="flex gap-2"><span aria-hidden="true" className="text-violeta-claro">✓</span>{i}</li>)}
              </ul>
              {accion(p)}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-[var(--sr-hero-text-muted)]">Precios en pesos colombianos. Las tiendas pasan por una verificación antes de aparecer en el radar.</p>

        <h2 className="mt-14 text-2xl font-bold text-[var(--sr-hero-text)]">Radar y Radar+, lado a lado</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)]/40 backdrop-blur-xl">
          <table className="w-full min-w-[520px] text-left text-sm">
            <caption className="sr-only">Comparación de los planes Radar y Radar+</caption>
            <thead className="bg-[var(--sr-surface-raised)]/60 text-[11px] uppercase tracking-[.14em] text-[var(--sr-hero-text-muted)]">
              <tr><th scope="col" className="p-4 font-bold">Qué incluye</th><th scope="col" className="p-4 font-bold">Radar</th><th scope="col" className="p-4 font-bold text-[var(--sr-accent)]">Radar+</th></tr>
            </thead>
            <tbody>
              {COMPARATIVA.map(([que, radar, plus]) => (
                <tr key={que} className="border-t border-[var(--sr-border-subtle)]">
                  <th scope="row" className="p-4 font-semibold text-[var(--sr-hero-text)]">{que}</th>
                  <td className="p-4 text-[var(--sr-hero-text-muted)]">{radar}</td>
                  <td className="p-4 text-[var(--sr-hero-text)]">{plus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-14 text-2xl font-bold text-[var(--sr-hero-text)]">Reglas de los planes</h2>
        <p className="mt-2 text-sm text-[var(--sr-hero-text-muted)]">Provisionales: falta validarlas con el squad de Transacciones (ms-pagos-suscripciones).</p>
        <ol className="mt-5 grid gap-3 md:grid-cols-2" aria-label="Reglas de los planes">
          {REGLAS.map(([titulo, texto], i) => (
            <li key={titulo} className="rounded-2xl border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)]/60 p-5 backdrop-blur-xl">
              <p className="font-semibold text-[var(--sr-hero-text)]"><span className="mr-2 text-violeta-claro">{i + 1}.</span>{titulo}</p>
              <p className="mt-1 text-sm text-[var(--sr-hero-text-muted)]">{texto}</p>
            </li>
          ))}
        </ol>

        <ConfirmDialog open={!!cambio} busy={busy} onCancel={() => setCambio(null)} onConfirm={cambiar}
          title={`¿Cambiar a ${cambio ? PLAN_LABEL[cambio] : ''}?`} confirmLabel="Cambiar plan">
          Perderás el probador con tu foto y las alertas y la wishlist sin límite.
        </ConfirmDialog>
    </section>
  )
}
