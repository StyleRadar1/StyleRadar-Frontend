import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Badge, Button } from '@/modules/core/design-system'
import { Loading, ErrorState, EmptyState } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { errorKind } from '@/modules/core/api/errors'
import { Aviso } from '@/modules/core/components/errores'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { PayerEmailForm, PAYMENT_INIT_ERROR_MSG } from '../components/PayerEmailForm'
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
    setLoading(true)
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
    pendiente: 'Tu pago continúa pendiente de confirmación.',
    rechazado: 'El pago no fue aprobado. Puedes intentarlo nuevamente.',
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-16 text-center">
      <span className="text-5xl">{icons[result.status]}</span>
      <h1 className="mt-4 text-3xl font-extrabold">{result.status === 'aprobado' ? '¡Listo!' : 'Pago pendiente'}</h1>
      <p role="status" className="mt-2 text-white/70">{messages[result.status]}</p>
      <Card className="mx-auto mt-8 max-w-sm text-left">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-white/50">Orden</dt><dd className="font-mono">{result.orderId}</dd>
          <dt className="text-white/50">Plan</dt><dd>{result.planName}</dd>
          <dt className="text-white/50">Monto</dt><dd className="font-mono">{formatCOP(result.amount)}</dd>
          {result.payerEmail && <><dt className="text-white/50">Pagador</dt><dd className="truncate">{result.payerEmail}</dd></>}
          {result.method && <><dt className="text-white/50">Método</dt><dd>{result.method}</dd></>}
          <dt className="text-white/50">Estado</dt><dd><Badge tone={result.status === 'aprobado' ? 'violeta' : 'arena'}>{result.status}</Badge></dd>
        </dl>


      </Card>
      <Link to="/planes" className="mt-6 inline-block text-sm font-semibold text-arena underline">Ver mis planes</Link>
    </section>
  )
}

/* ─── Subcomponente: tarjeta de plan ─── */
function PlanCard({
  plan,
  currentPlan,
  defaultEmail,
  busy,
  errorMessage,
  onSelect,
}: {
  plan: PlanDto
  currentPlan: string | null
  defaultEmail: string
  busy: boolean
  errorMessage: string | null
  onSelect: (p: PlanDto, payerEmail?: string) => void
}) {
  const isCurrent = currentPlan === plan.id
  return (
    <Card className={`relative flex flex-col ${plan.highlighted ? 'border-violeta ring-2 ring-violeta/30' : ''}`}>
      {plan.highlighted && (
        <Badge tone="violeta">Única opción de pago · Recomendado</Badge>
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
          <>
            {plan.id === 'plus' && (
              <p role="status" className="mb-2 text-xs font-semibold text-arena">
                Ya tienes Radar+ activo.
              </p>
            )}
            <Button variant="secundario" className="w-full" disabled>Plan actual</Button>
          </>
        ) : plan.price === 0 ? (
          <Button variant="secundario" className="w-full" onClick={() => onSelect(plan)}>
            Usar gratis
          </Button>
        ) : (
          <PayerEmailForm
            defaultEmail={defaultEmail}
            submitLabel="Suscribirme"
            busyLabel="Preparando el pago…"
            busy={busy}
            errorMessage={errorMessage}
            onSubmit={(payerEmail) => onSelect(plan, payerEmail)}
          />
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
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<AvisoPlan | null>(null)

  // El plan de la persona se lee de un único lugar: useUserPlan (el mismo que usan /planes y los candados).
  const { plan: userPlan } = useUserPlan(user?.role === 'COMPRADOR')
  const currentPlan = userPlan === 'RADAR_PLUS' ? 'plus' : userPlan === 'RADAR' ? 'free' : null

  // Solo opciones de comprador (Radar gratuito y Radar+ única opción de pago; sin tienda ni fundación)
  const buyerPlans = plans.filter((p) => p.id === 'free' || p.id === 'plus')

  useEffect(() => {
    if (user && user.role !== 'COMPRADOR') {
      if (user.role === 'ADMIN_ALMACEN') {
        navigate('/tienda/suscripcion', { replace: true })
      } else if (user.role === 'ADMIN_STYLERADAR') {
        navigate('/admin/pagos', { replace: true })
      } else {
        navigate('/planes', { replace: true })
      }
    }
  }, [user, navigate])

  const handleSelect = useCallback(async (plan: PlanDto, payerEmail?: string) => {
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
    setBusy(true)
    setCheckoutError(null)
    setAviso(null)
    try {
      await planService.createCheckout(plan.id, payerEmail)
      // En producción aquí se redirige al initPoint de Mercado Pago.
      // En mock mostramos el resultado simulado.
      navigate(`/pago/resultado?orden=MOCK_ORDER_OK`)
    } catch (e) {
      const a = avisoDePlan(e, PAYMENT_INIT_ERROR_MSG)
      setAviso(a)
      setCheckoutError(a.texto || PAYMENT_INIT_ERROR_MSG)
      // 409: se vuelve a leer el plan para que la pantalla muestre el estado real.
      if (a.refrescar) window.dispatchEvent(new Event(PLAN_CHANGED))
    } finally {
      setBusy(false)
    }
  }, [user, navigate])

  // Si venimos del login y hay intención guardada, limpiar
  useEffect(() => {
    if (user) {
      const intent = planService.readIntent()
      if (intent) {
        planService.clearIntent()
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
      ) : buyerPlans.length === 0 ? (
        <EmptyState title="No hay planes disponibles" />
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {buyerPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlan}
              defaultEmail={user?.email ?? ''}
              busy={busy}
              errorMessage={plan.id === 'plus' ? checkoutError : null}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Aviso de cumplimiento normativo y derecho de retracto en compras electrónicas */}
      <div className="mt-12 rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)]/30 p-5 text-center text-xs text-[var(--color-text-muted)] space-y-2">
        <p>
          🔒 Transacciones seguras procesadas en pesos colombianos (COP) con IVA incluido a través de pasarelas de pago certificadas.
        </p>
        <p>
          Al contratar un plan o adquirir prendas a través de Style Radar, aplicas a las garantías legales de la Ley 1480 de 2011 y al{' '}
          <Link to="/legal/devoluciones-garantias" className="font-semibold text-[var(--color-text)] underline hover:text-[var(--color-accent)]">
            Derecho de Retracto dentro de los 5 días hábiles
          </Link>{' '}
          siguientes a la entrega. Consulta nuestros{' '}
          <Link to="/legal/terminos" className="font-semibold text-[var(--color-text)] underline hover:text-[var(--color-accent)]">
            Términos y Condiciones
          </Link>{' '}
          y nuestra{' '}
          <Link to="/legal/datos-personales" className="font-semibold text-[var(--color-text)] underline hover:text-[var(--color-accent)]">
            Política de Datos
          </Link>
          .
        </p>
      </div>

      {busy && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <Loading label="Preparando el pago…" />
        </div>
      )}
    </section>
  )
}
