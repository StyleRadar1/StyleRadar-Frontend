import { useCallback, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { env } from '@/configs/env'
import { ApiError } from '@/modules/core/api/apiClient'
import { Badge, Button, Card } from '@/modules/core/design-system'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { cerrarSesionYVolverAlInicio } from '@/modules/identidad/states/salida'
import { PayerEmailForm, PAYMENT_INIT_ERROR_MSG } from '../components/PayerEmailForm'
import { STORE_SUBSCRIPTION_PRICE } from '../constants/plansByRole'
import { useStoreSubscription } from '../hooks/useStoreSubscription'
import { STORE_PLAN } from '../mocks/plans'
import { storeSubscriptionService } from '../services/storeSubscriptionService'
import type { CheckoutResultDto } from '../types/plan.dto'
import { isSubscriptionAlreadyExistsError, SUBSCRIPTION_ALREADY_EXISTS_MSG } from '../utils/erroresPlan'
import { isValidNit } from '../utils/validation'

export const STORE_ALREADY_SUBSCRIBED_MSG = SUBSCRIPTION_ALREADY_EXISTS_MSG
export const STORE_PENDING_PAYMENT_MSG =
  'Tu pago está pendiente de confirmación. Las funcionalidades se habilitarán cuando sea aprobado'
export const STORE_REJECTED_PAYMENT_MSG =
  'El pago no fue aprobado. Puedes intentarlo nuevamente'
export const STORE_NIT_INVALID_MSG =
  'Ingresa un NIT válido de 9 dígitos'

/**
 * RF-67: Paso obligatorio inmediatamente después del registro del almacén.
 * Presenta la única suscripción disponible para almacenes (sin comparar planes),
 * solicita el correo del pagador y continúa a Mercado Pago.
 */
export default function StoreActivateSubscriptionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data, loading, error, reload } = useStoreSubscription()

  const [paying, setPaying] = useState(false)
  const [gatewayError, setGatewayError] = useState<string | null>(null)
  const [conflictError, setConflictError] = useState(false)
  const [lastResult, setLastResult] = useState<CheckoutResultDto | null>(null)
  const [lastEmail, setLastEmail] = useState<string>(user?.email ?? '')
  const [nit, setNit] = useState('')
  const [nitError, setNitError] = useState<string | null>(null)

  const orderParam = params.get('orden')
  const estadoParam = params.get('estado')
  const motivoGuard = params.get('motivo')

  const handleContinueToPayment = useCallback(
    async (payerEmail: string) => {
      const cleanNit = nit.trim()
      if (!isValidNit(cleanNit)) {
        setNitError(STORE_NIT_INVALID_MSG)
        return
      }
      setNitError(null)
      setPaying(true)
      setGatewayError(null)
      setConflictError(false)
      setLastEmail(payerEmail)
      try {
        const mockOrder =
          orderParam === 'MOCK_STORE_PENDING' || estadoParam === 'pendiente'
            ? 'MOCK_STORE_PENDING'
            : orderParam === 'MOCK_STORE_FAIL' || estadoParam === 'rechazado'
              ? 'MOCK_STORE_FAIL'
              : 'MOCK_STORE_OK'
        const res = await storeSubscriptionService.activateFromOnboarding(
          payerEmail,
          mockOrder,
          cleanNit,
        )
        if (res.redirectTo) {
          window.location.assign(res.redirectTo)
          return
        }
        setLastResult(res.result ?? null)
        reload()
      } catch (err) {
        if (isSubscriptionAlreadyExistsError(err) || (err instanceof ApiError && err.status === 403)) {
          setConflictError(true)
          reload()
        } else if (err instanceof ApiError && err.status === 400) {
          setGatewayError(err.message.replace(/\.$/, ''))
        } else {
          setGatewayError(PAYMENT_INIT_ERROR_MSG)
        }
      } finally {
        setPaying(false)
      }
    },
    [nit, orderParam, estadoParam, reload],
  )

  if (loading && !data) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12">
        <Loading label="Cargando suscripción del almacén…" />
      </section>
    )
  }

  if (error && !data) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12">
        <ErrorState error={error} onRetry={reload} title="No pudimos cargar la suscripción del almacén" />
      </section>
    )
  }

  const sub = data?.subscription
  const payments = data?.payments ?? []
  const hasPendingPayment =
    payments.some((p) => p.status === 'pendiente') ||
    lastResult?.status === 'pendiente' ||
    estadoParam === 'pendiente'

  const alreadyActiveOrPending =
    conflictError ||
    ((sub?.status === 'ACTIVA' ||
      (!env.useMocksPagos && sub?.status === 'PENDIENTE' && !data?.sinSuscripcion) ||
      payments.some((p) => p.status === 'pendiente')) &&
      !lastResult)

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 text-[var(--sr-text-primary,var(--color-text))]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge tone="violeta">Paso obligatorio · Almacén aliado</Badge>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            Activa la suscripción de tu almacén
          </h1>
          <p className="mt-1.5 text-sm text-[var(--sr-text-secondary,var(--color-text-muted))]">
            Para habilitar la gestión de tu tienda y publicar tu catálogo en StyleRadar, completa la suscripción única de almacén aliado.
          </p>
        </div>
        <button
          type="button"
          onClick={cerrarSesionYVolverAlInicio}
          className="rounded-xl border border-[var(--sr-border,var(--color-border))] px-3.5 py-2 text-xs font-semibold text-[var(--sr-text-secondary,var(--color-text-muted))] hover:bg-[var(--sr-surface-raised,var(--color-surface-raised))]"
        >
          Cerrar sesión
        </button>
      </div>

      {motivoGuard && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 rounded-2xl border border-[var(--sr-accent,var(--color-accent))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] p-4 text-sm"
        >
          <p className="font-semibold">Acceso restringido hasta activar tu suscripción</p>
          <p className="mt-1 text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">
            Mientras tu suscripción no esté activa, las funciones de gestión y publicación del catálogo permanecen bloqueadas.
          </p>
        </div>
      )}

      {/* FA-01 (403): ya tiene suscripción activa o pago pendiente */}
      {alreadyActiveOrPending && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 rounded-2xl border border-[var(--sr-border,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] p-5"
        >
          <p className="text-base font-bold">{STORE_ALREADY_SUBSCRIBED_MSG}</p>
          <p className="mt-1 text-sm text-[var(--sr-text-secondary,var(--color-text-muted))]">
            No se generará otro cobro duplicado. Puedes consultar el detalle actual de tu suscripción.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/tienda/suscripcion"
              className="inline-flex items-center rounded-xl bg-[var(--sr-accent,var(--color-accent))] px-4 py-2.5 text-xs font-bold text-[var(--color-text-on-accent,#ffffff)]"
            >
              Ver estado de la suscripción
            </Link>
            {sub?.status === 'ACTIVA' && (
              <Link
                to="/mi-tienda"
                className="inline-flex items-center rounded-xl border border-[var(--sr-border,var(--color-border))] px-4 py-2.5 text-xs font-semibold"
              >
                Ir a Mi tienda
              </Link>
            )}
          </div>
        </div>
      )}

      {/* FA-05: Pago pendiente de confirmación al regresar */}
      {hasPendingPayment && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-2xl border border-[var(--sr-accent,var(--color-accent))]/50 bg-[var(--sr-surface,var(--color-surface))] p-5"
        >
          <div className="flex items-center gap-2">
            <Badge tone="lavanda">PENDIENTE</Badge>
            <h2 className="text-lg font-bold">Pago en verificación</h2>
          </div>
          <p className="mt-2 text-sm">{STORE_PENDING_PAYMENT_MSG}</p>
          <div className="mt-4">
            <Link
              to="/tienda/suscripcion"
              className="inline-flex items-center rounded-xl border border-[var(--sr-border,var(--color-border))] px-4 py-2 text-xs font-semibold hover:bg-[var(--sr-surface-raised,var(--color-surface-raised))]"
            >
              Consultar estado en mi suscripción
            </Link>
          </div>
        </div>
      )}

      {/* Resultado aprobado tras completar el pago */}
      {lastResult?.status === 'aprobado' && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-2xl border border-[var(--sr-accent,var(--color-accent))] bg-[var(--sr-surface,var(--color-surface))] p-6"
        >
          <Badge tone="violeta">ACTIVA</Badge>
          <h2 className="mt-2 text-2xl font-extrabold">¡Suscripción activa!</h2>
          <p className="mt-1 text-sm text-[var(--sr-text-secondary,var(--color-text-muted))]">
            El pago fue aprobado por Mercado Pago. Ya tienes acceso completo a la gestión de tu almacén y a la publicación del catálogo.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => navigate('/mi-tienda')}>Ir a gestionar mi tienda</Button>
            <Link
              to="/tienda/suscripcion"
              className="inline-flex items-center rounded-xl border border-[var(--sr-border,var(--color-border))] px-4 py-2.5 text-xs font-semibold"
            >
              Ver detalle de suscripción
            </Link>
          </div>
        </div>
      )}

      {/* FA-03: Pago rechazado */}
      {lastResult?.status === 'rechazado' && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 rounded-2xl border border-[var(--color-danger-border,rgba(239,68,68,0.4))] bg-[var(--color-danger-bg,rgba(239,68,68,0.12))] p-5 text-[var(--color-danger-text,#ffb4b4)]"
        >
          <p className="text-base font-bold">{STORE_REJECTED_PAYMENT_MSG}</p>
          <p className="mt-1 text-xs opacity-90">
            Tu suscripción aún no está activa. Confirma el correo del pagador abajo para generar un nuevo intento en Mercado Pago.
          </p>
        </div>
      )}

      {/* Tarjeta de suscripción única de almacén + PayerEmailForm */}
      {!alreadyActiveOrPending && lastResult?.status !== 'aprobado' && (
        <Card className="border border-[var(--sr-border,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--sr-border,var(--color-border))] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--sr-text-secondary,var(--color-text-muted))]">
                Suscripción única para almacenes
              </p>
              <h2 className="mt-1 text-2xl font-extrabold">{STORE_PLAN.name}</h2>
            </div>
            <p className="text-3xl font-extrabold">
              {formatCOP(STORE_SUBSCRIPTION_PRICE)}{' '}
              <span className="text-sm font-normal text-[var(--sr-text-secondary,var(--color-text-muted))]">
                / mes
              </span>
            </p>
          </div>

          <ul className="my-5 space-y-2 text-sm text-[var(--sr-text-secondary,var(--color-text-muted))]">
            {STORE_PLAN.features.map((feat) => (
              <li key={feat} className="flex items-start gap-2">
                <span aria-hidden="true" className="font-bold text-[var(--sr-accent,var(--color-accent))]">
                  ✓
                </span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>

          <div className="mb-4 rounded-xl border border-[var(--sr-border,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))]/40 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span>Total a pagar</span>
              <strong className="font-mono text-sm">{formatCOP(STORE_SUBSCRIPTION_PRICE)}</strong>
            </div>
            <div className="mt-1 flex items-center justify-between text-[var(--sr-text-secondary,var(--color-text-muted))]">
              <span>Método de pago</span>
              <span>Mercado Pago</span>
            </div>
          </div>

          <div className="border-t border-[var(--sr-border,var(--color-border))] pt-5 space-y-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label
                htmlFor="store-nit-input"
                className="text-xs font-semibold uppercase tracking-wider text-[var(--sr-text-secondary,var(--color-text-muted))]"
              >
                NIT del almacén <span aria-hidden="true" className="text-[var(--color-accent)]">*</span>
              </label>
              <input
                id="store-nit-input"
                name="nit"
                type="text"
                maxLength={9}
                value={nit}
                disabled={paying}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 9)
                  setNit(val)
                  if (nitError && isValidNit(val)) setNitError(null)
                }}
                placeholder="Ej. 900123456 (9 dígitos)"
                aria-required="true"
                aria-invalid={!!nitError}
                aria-describedby={nitError ? 'store-nit-error' : 'store-nit-hint'}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-[var(--sr-text-primary,var(--color-text))] bg-[var(--sr-surface,var(--color-surface))] placeholder:text-[var(--sr-text-muted,var(--color-text-muted))] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))] ${
                  nitError
                    ? 'border-[var(--color-danger-border,#ef4444)]'
                    : 'border-[var(--sr-border,var(--color-border))] focus:border-[var(--sr-accent,var(--color-accent))]'
                }`}
              />
              <span id="store-nit-hint" className="text-xs text-[var(--sr-text-muted,var(--color-text-muted))]">
                NIT del almacén obligatorio de 9 dígitos
              </span>
              {nitError && (
                <p id="store-nit-error" role="alert" className="text-xs font-semibold text-[var(--color-danger-text,#ff8a8a)]">
                  {nitError}
                </p>
              )}
            </div>

            <PayerEmailForm
              defaultEmail={lastEmail || user?.email || ''}
              submitLabel="Pagar con Mercado Pago"
              busyLabel="Redirigiendo a Mercado Pago…"
              busy={paying}
              errorMessage={gatewayError}
              onSubmit={handleContinueToPayment}
            />
          </div>
        </Card>
      )}
    </section>
  )
}
