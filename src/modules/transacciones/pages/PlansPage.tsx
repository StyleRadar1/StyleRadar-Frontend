import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { formatCOP } from '@/modules/core/utils/format'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { useUserPlan } from '../hooks/useUserPlan'
import { userPlanService } from '../services/userPlanService'
import { PLAN_LABEL, PLANES, type PlanInfo, type PlanUsuario } from '../types/plan.dto'

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
      return <button type="button" onClick={() => setCambio(id)} className={`mt-auto rounded-xl px-5 py-3 text-sm font-semibold ${p.destacado ? 'bg-violeta' : 'border border-white/25'}`}>Cambiar a {p.nombre}</button>
    }
    if (user.role === 'ADMIN_ALMACEN' && p.id === 'TIENDA') {
      return <Link to="/tienda/suscripcion" className="mt-auto block rounded-xl border border-white/25 px-5 py-3 text-center text-sm font-semibold">Ver mi suscripción</Link>
    }
    return null
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-arena">Planes</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">Un plan para cada quien</h1>
      <p className="mt-3 max-w-2xl text-white/70">Mirar el catálogo, el mapa y las playlists es gratis. Paga solo si quieres más, y cancela cuando quieras.</p>
      {comprador && plan && <p className="mt-4 text-sm">Tu plan actual: <b>{PLAN_LABEL[plan]}</b></p>}
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mt-4 rounded-xl p-3 text-sm ${msg.ok ? 'bg-[#9be3b4]/10 text-[#9be3b4]' : 'bg-[#ff8a8a]/10 text-[#ffb4b4]'}`}>{msg.text}</p>}

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Planes">
        {PLANES.map((p) => (
          <li key={p.id} aria-label={p.nombre} className={`relative flex flex-col rounded-2xl border p-6 ${p.destacado ? 'border-violeta bg-gradient-to-b from-violeta/35 to-white/[.03]' : 'border-white/10 bg-white/[.03]'}`}>
            {p.destacado && !(comprador && plan === p.id) && <span className="absolute right-4 top-4 rounded-full bg-violeta px-3 py-1 text-[11px] font-semibold">Más elegido</span>}
            {comprador && plan === p.id && <span className="absolute right-4 top-4 rounded-full bg-arena px-3 py-1 text-[11px] font-semibold text-grafito">Tu plan</span>}
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-lavanda">{p.para}</p>
            <h2 className="mt-2 text-2xl font-bold">{p.nombre}</h2>
            <p className="mt-3 text-3xl font-extrabold">{p.precio ? formatCOP(p.precio) : '$0'} <small className="text-sm font-medium text-white/60">{p.periodo}</small></p>
            <p className="mt-1 min-h-10 text-sm text-arena">{p.nota}</p>
            <ul className="mb-6 mt-5 space-y-2 text-sm text-white/80">
              {p.incluye.map((i) => <li key={i} className="flex gap-2"><span aria-hidden="true" className="text-arena">✓</span>{i}</li>)}
            </ul>
            {accion(p)}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-white/55">Precios en pesos colombianos. Las tiendas pasan por una verificación antes de aparecer en el radar.</p>

      <ConfirmDialog open={!!cambio} busy={busy} onCancel={() => setCambio(null)} onConfirm={cambiar}
        title={`¿Cambiar a ${cambio ? PLAN_LABEL[cambio] : ''}?`} confirmLabel="Cambiar plan">
        {cambio === 'RADAR_PLUS' ? `Pagarás ${formatCOP(14900)} al mes. Puedes cancelar la renovación cuando quieras.` : 'Perderás el probador con tu foto y las alertas y la wishlist sin límite.'}
      </ConfirmDialog>
    </section>
  )
}
