import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Badge, Button } from '@/modules/core/design-system'
import { Loading, ErrorState, EmptyState } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { errorKind } from '@/modules/core/api/errors'
import { Aviso } from '@/modules/core/components/errores'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { usePlans } from '../hooks/usePlans'
import { useUserPlan } from '../hooks/useUserPlan'
import { planService } from '../services/planService'
import { userPlanService } from '../services/userPlanService'
import type { PlanDto, CheckoutResultDto } from '../types/plan.dto'
import { PagoRechazado } from '../components/PagoRechazado'
import { PLAN_CHANGED } from '../services/userPlanService'
import { avisoDePlan, TEXTOS_PLAN, type AvisoPlan } from '../utils/erroresPlan'

/* ─── Subcomponente: resultado del pago ─── */
function CheckoutResult() {
  const [params] = useSearchParams()
  const orderId = params.get('orden') ?? 'MOCK_ORDER_OK'
  const [result, setResult] = useState<CheckoutResultDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    planService.getCheckoutResult(orderId)
      .then((r) => {
        // RF-100: solo un pago aprobado activa el plan; si no, la persona conserva el que tenía.
        if (r.status === 'aprobado' && r.planName === 'Radar+') userPlanService.activatePaid('RADAR_PLUS')
        setResult(r)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) return <Loading label="Consultando el estado del pago…" />
  // 404: no hay suscripción ni orden con ese número.
  if (error && errorKind(error) === 'no-existe') {
    return (
      <section className="mx-auto max-w-lg px-4 py-16">
        <Aviso tono="info" titulo={TEXTOS_PLAN.sinSuscripcion.titulo}
          accion={<Link to="/planes" className="rounded-xl bg-violeta px-4 py-2 text-sm font-semibold text-blanco">Ver planes</Link>}>
          {TEXTOS_PLAN.sinSuscripcion.texto}
        </Aviso>
      </section>
    )
  }
  if (error) return <ErrorState error={error} title="No pudimos consultar el pago" />
  if (!result) return <EmptyState title="Sin resultado" />

  // Mercado Pago no aprobó el pago: pantalla del plan con Reintentar. No se muestran datos del medio de pago.
  if (result.status === 'rechazado') {
    const reintentar = result.planName === 'Tienda aliada' ? '/tienda/suscripcion' : '/suscripcion'
    return (
      <PagoRechazado
        detalle={<p className="text-xs text-[var(--sr-tx-2)]">{result.planName} · {formatCOP(result.amount)} · cobro $0</p>}
        acciones={<>
          <Link to={reintentar} className="rounded-xl bg-violeta px-5 py-3 text-sm font-semibold text-blanco">Reintentar pago</Link>
          <Link to="/planes" className="rounded-xl border border-[color-mix(in_srgb,var(--sr-tx)_25%,transparent)] px-5 py-3 text-sm font-semibold text-[var(--sr-tx)]">Ver planes</Link>
        </>}
      />
    )
  }

  const icons: Record<string, string> = { aprobado: '✅', pendiente: '⏳', rechazado: '❌' }
  const messages: Record<string, string> = {
    aprobado: '¡Tu pago fue aprobado! Ya tienes acceso a todos los beneficios de tu plan.',
    pendiente: 'Tu pago está pendiente. Si elegiste Efecty, acércate a un punto autorizado para completar el pago.',
    rechazado: 'El pago fue rechazado. Puedes intentarlo de nuevo con otro medio.',
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-16 text-center">
      <span className="text-5xl">{icons[result.status]}</span>
      <h1 className="mt-4 text-3xl font-extrabold">{result.status === 'aprobado' ? '¡Listo!' : result.status === 'pendiente' ? 'Pago pendiente' : 'Pago rechazado'}</h1>
      <p className="mt-2 text-white/70">{messages[result.status]}</p>
      <Card className="mx-auto mt-8 max-w-sm text-left">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-white/50">Orden</dt><dd className="font-mono">{result.orderId}</dd>
          <dt className="text-white/50">Plan</dt><dd>{result.planName}</dd>
          <dt className="text-white/50">Monto</dt><dd className="font-mono">{formatCOP(result.amount)}</dd>
          {result.method && <><dt className="text-white/50">Método</dt><dd>{result.method}</dd></>}
          <dt className="text-white/50">Estado</dt><dd><Badge tone={result.status === 'aprobado' ? 'violeta' : 'arena'}>{result.status}</Badge></dd>
        </dl>
      </Card>
      <Link to="/planes" className="mt-6 inline-block text-sm font-semibold text-arena underline">Ver mis planes</Link>
    </section>
  )
}

/* ─── Subcomponente: tarjeta de plan ─── */
function PlanCard({ plan, currentPlan, onSelect }: { plan: PlanDto; currentPlan: string | null; onSelect: (p: PlanDto) => void }) {
  const isCurrent = currentPlan === plan.id
  return (
    <Card className={`relative flex flex-col ${plan.highlighted ? 'border-violeta ring-2 ring-violeta/30' : ''}`}>
      {plan.highlighted && (
        <Badge tone="violeta" >Recomendado</Badge>
      )}
      <h3 className="mt-3 text-2xl font-extrabold">{plan.name}</h3>
      <p className="mt-1 text-3xl font-extrabold">
        {plan.price === 0 ? 'Gratis' : <>{formatCOP(plan.price)}<span className="text-base font-normal text-white/50">/mes</span></>}
      </p>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-white/80">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-0.5 text-green-400">✓</span>{f}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        {isCurrent ? (
          <Button variant="secundario" className="w-full" disabled>Plan actual</Button>
        ) : (
          <Button variant={plan.highlighted ? 'primario' : 'secundario'} className="w-full" onClick={() => onSelect(plan)}>
            {plan.price === 0 ? 'Usar gratis' : 'Suscribirme'}
          </Button>
        )}
      </div>
    </Card>
  )
}

/* ─── Página principal ─── */
export default function CheckoutPage() {
  const [params] = useSearchParams()
  const isResult = params.has('orden')

  if (isResult) return <CheckoutResult />

  return <PlansSelector />
}

function PlansSelector() {
  const { data: plans, loading, error, reload } = usePlans()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [aviso, setAviso] = useState<AvisoPlan | null>(null)

  // El plan de la persona se lee de un único lugar: useUserPlan (el mismo que usan /planes y los candados).
  const { plan: userPlan } = useUserPlan(user?.role === 'COMPRADOR')
  const currentPlan = userPlan === 'RADAR_PLUS' ? 'plus' : userPlan === 'RADAR' ? 'free' : null

  const handleSelect = useCallback(async (plan: PlanDto) => {
    if (plan.price === 0) return // Radar es gratis, no requiere checkout

    if (!user) {
      // Sin sesión: guardar intención y redirigir a login
      planService.saveIntent({
        planId: plan.id,
        accountType: 'COMPRADOR',
        returnPath: `/suscripcion`,
      })
      navigate('/login')
      return
    }

    // Con sesión: crear checkout mock
    setBusy(true); setAviso(null)
    try {
      await planService.createCheckout(plan.id)
      // En producción aquí se redirige al initPoint de Mercado Pago.
      // En mock mostramos el resultado simulado.
      navigate(`/pago/resultado?orden=MOCK_ORDER_OK`)
    } catch (e) {
      const a = avisoDePlan(e, 'No pudimos iniciar el pago. Intenta de nuevo.')
      setAviso(a)
      // 409: se vuelve a leer el plan para que la pantalla muestre el estado real.
      if (a.refrescar) window.dispatchEvent(new Event(PLAN_CHANGED))
    } finally {
      setBusy(false)
    }
  }, [user, navigate])

  // Si venimos del login y hay intención guardada, mostrar aviso
  useEffect(() => {
    if (user) {
      const intent = planService.readIntent()
      if (intent) {
        planService.clearIntent()
        // Podrían auto-redirigir al checkout aquí
      }
    }
  }, [user])

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <Badge tone="violeta">Planes</Badge>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Elige tu plan</h1>
        <p className="mx-auto mt-3 max-w-lg text-white/70">
          Descubre moda local en Bogotá. Empieza gratis o desbloquea todo con Radar+.
        </p>
      </div>

      {aviso && (
        <div className="mx-auto mt-8 max-w-xl">
          <Aviso tono={aviso.tono} titulo={aviso.titulo}>{aviso.texto}</Aviso>
        </div>
      )}

      {loading ? (
        <Loading label="Cargando planes…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : plans.length === 0 ? (
        <EmptyState title="No hay planes disponibles" />
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} currentPlan={currentPlan} onSelect={handleSelect} />
          ))}
        </div>
      )}

      {busy && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <Loading label="Preparando el pago…" />
        </div>
      )}
    </section>
  )
}
