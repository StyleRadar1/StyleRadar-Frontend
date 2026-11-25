import { useCallback, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { env } from '@/configs/env'
import { Button } from '@/modules/core/design-system'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { CancelSubscriptionButton } from '../components/CancelSubscriptionButton'
import { PayerEmailForm } from '../components/PayerEmailForm'
import { StoreSuspendedBanner } from '../components/StoreSuspendedBanner'
import { STORE_SUBSCRIPTION_PRICE } from '../constants/plansByRole'
import { useStoreSubscription } from '../hooks/useStoreSubscription'
import { deriveSubscriptionStatus, formatStatusLabel, formatSubscriptionDate } from '../mappers/paymentsMappers'
import { storeSubscriptionService } from '../services/storeSubscriptionService'
import type { PaymentDto, PaymentStatus } from '../types/payment.dto'
import type { CheckoutResultDto } from '../types/plan.dto'
import type { StoreSubscriptionStatus } from '../types/storeSubscription.dto'
import { isSubscriptionAlreadyExistsError, SUBSCRIPTION_ALREADY_EXISTS_MSG } from '../utils/erroresPlan'
import './StoreSubscriptionPage.css'

const STATUS_LABEL: Record<StoreSubscriptionStatus, string> = {
  PENDIENTE: 'Pendiente',
  ACTIVA: 'Activa',
  VENCIDA: 'Vencida',
  SUSPENDIDA: 'Suspendida',
  CANCELADA: 'Cancelada',
}
const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  pendiente: 'Pendiente',
}

const fecha = (iso?: string | null) => formatSubscriptionDate(iso, '—')

const OUTCOME: Record<CheckoutResultDto['status'], { title: string; text: string; alert: boolean }> = {
  aprobado: { title: 'Tu suscripción fue reactivada', text: 'Tu suscripción quedó activa y tu catálogo sigue visible en el radar', alert: false },
  pendiente: { title: 'Pago pendiente', text: 'Tu pago está pendiente de confirmación. Las funcionalidades se habilitarán cuando sea aprobado', alert: false },
  rechazado: { title: 'Pago rechazado', text: 'El pago no fue aprobado. Puedes intentarlo nuevamente. La suscripción no se activó', alert: true },
}

/**
 * Sin ninguna suscripción en el back (404), el primer pago se hace en /tienda/suscripcion/activar,
 * que pide el NIT (taxId) y el correo del pagador y redirige a Mercado Pago.
 */
function IrAPagarButton() {
  const navigate = useNavigate()
  return <Button onClick={() => navigate('/tienda/suscripcion/activar')}>Ir a pagar</Button>
}

export default function StoreSubscriptionPage() {
  const auth = useContext(AuthContext)
  const user = auth?.user ?? null
  const { data, loading, error, reload } = useStoreSubscription()
  const [paying, setPaying] = useState(false)
  const [outcome, setOutcome] = useState<CheckoutResultDto | null>(null)
  const [payError, setPayError] = useState<unknown>(null)
  const [conflictMsg, setConflictMsg] = useState<string | null>(null)

  // RF-96: Estado para reintento de pago rechazado con PayerEmailForm
  const [retryPaymentTarget, setRetryPaymentTarget] = useState<PaymentDto | null>(null)
  const [showRetryForm, setShowRetryForm] = useState(false)
  const [retryErrorMsg, setRetryErrorMsg] = useState<string | null>(null)

  const pay = useCallback(async () => {
    setPaying(true)
    setPayError(null)
    setConflictMsg(null)
    setOutcome(null)
    try {
      const r = await storeSubscriptionService.pay()
      if (r.redirectTo) { window.location.assign(r.redirectTo); return }
      setOutcome(r.result ?? null)
      reload()
    } catch (e) {
      if (isSubscriptionAlreadyExistsError(e)) {
        setConflictMsg(SUBSCRIPTION_ALREADY_EXISTS_MSG)
        reload()
      } else {
        setPayError(e)
      }
    } finally {
      setPaying(false)
    }
  }, [reload])

  const handleRetryPayment = useCallback(async (payerEmail: string) => {
    setPaying(true)
    setRetryErrorMsg(null)
    setPayError(null)
    setOutcome(null)
    try {
      const targetId = retryPaymentTarget?.id ?? 'REJECTED'
      const r = await storeSubscriptionService.retryPayment(targetId, payerEmail)
      if (r.redirectTo) { window.location.assign(r.redirectTo); return }
      setOutcome(r.result ?? null)
      setShowRetryForm(false)
      setRetryPaymentTarget(null)
      reload()
    } catch (err) {
      setRetryErrorMsg(
        err instanceof Error && err.message
          ? err.message.replace(/\.$/, '')
          : 'No fue posible generar un nuevo intento de pago',
      )
    } finally {
      setPaying(false)
    }
  }, [retryPaymentTarget, reload])

  if (!data) {
    return (
      <section className="store-subscription">
        {loading ? <Loading label="Cargando tu suscripción…" /> : <ErrorState error={error} onRetry={reload} title="No pudimos cargar tu suscripción" />}
      </section>
    )
  }

  const { subscription: sub, payments, sinSuscripcion = false } = data
  const msg = outcome ? OUTCOME[outcome.status] : null
  const lastPayment = payments[0]
  const failedPayment = lastPayment?.status === 'rechazado' ? lastPayment : null
  const nextCharge = (sub.fechaFin ?? sub.periodEndsAt) ? fecha(sub.fechaFin ?? sub.periodEndsAt) : '23 oct 2026'
  const suscripcionId = sub.suscripcionId ?? 'SUB-ALM-1'
  const estado = sub.estado ?? sub.status
  const fechaInicio = sub.fechaInicio ?? null
  const fechaFin = sub.fechaFin ?? sub.periodEndsAt ?? null
  const autoRenovacion = sub.autoRenovacion ?? sub.renewalEnabled
  const derivedSub = deriveSubscriptionStatus(sub.status, { autoRenewal: autoRenovacion, endDate: fechaFin })
  const statusBadgeText = sub.unknownStatus
    ? formatStatusLabel(STATUS_LABEL[derivedSub.status], sub.unknownStatus)
    : STATUS_LABEL[derivedSub.status]
  const planCardBadgeText = sub.unknownStatus
    ? formatStatusLabel(STATUS_LABEL[derivedSub.status], sub.unknownStatus)
    : derivedSub.label
  const isSuspendedOrExpired = derivedSub.status === 'SUSPENDIDA' || derivedSub.status === 'VENCIDA'
  const mostrarPagar = env.useMocksPagos ? sub.status !== 'ACTIVA' : isSuspendedOrExpired || derivedSub.status === 'CANCELADA'
  const defaultRetryEmail =
    retryPaymentTarget?.userEmail ??
    failedPayment?.userEmail ??
    sub.payerEmail ??
    user?.email ??
    'luna@styleradar.co'

  return (
    <section className="store-subscription">
      <StoreSuspendedBanner status={sub.status} onPayClick={() => { void pay() }} />
      <div className="store-subscription__main">
        <div className="store-subscription__title">
          <div className="flex flex-wrap items-center gap-3">
            <h2>Suscripción</h2>
            <span className="store-subscription__badge">
              <span aria-hidden="true">● </span>
              <span>{sinSuscripcion ? 'Sin suscripción' : statusBadgeText}</span>
            </span>
          </div>
          <p>La suscripción mantiene tu catálogo visible en el radar después del<br className="desktop-break" /> periodo gratuito de 30 días</p>
        </div>


        {failedPayment && (
          <div className="store-subscription__alert" role="alert">
            <span className="store-subscription__alert-icon">⚠</span>
            <div>
              <strong>El pago no fue aprobado. Puedes intentarlo nuevamente</strong>
              <p>
                El pago del {fecha(failedPayment.date)} con {failedPayment.method} fue rechazado ({formatCOP(failedPayment.amount)}).
                Genera un nuevo intento indicando el correo del pagador para activar tu suscripción
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setRetryPaymentTarget(failedPayment)
                  setShowRetryForm(true)
                  setRetryErrorMsg(null)
                }}
                disabled={paying}
              >
                Reintentar pago
              </Button>
            </div>
          </div>
        )}

        {msg && (
          <div role={msg.alert ? 'alert' : 'status'} className={`store-subscription__notice ${msg.alert ? 'is-error' : ''}`}>
            <strong>{msg.title}</strong>
            <p>{msg.text}</p>
            {outcome?.status === 'rechazado' && !showRetryForm && (
              <div className="mt-3">
                <Button
                  type="button"
                  onClick={() => {
                    setRetryPaymentTarget(failedPayment)
                    setShowRetryForm(true)
                    setRetryErrorMsg(null)
                  }}
                  disabled={paying}
                >
                  Reintentar pago
                </Button>
              </div>
            )}
          </div>
        )}

        {showRetryForm && (
          <div className="mb-6 rounded-2xl border border-[var(--sr-border,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] p-5">
            <h3 className="text-base font-bold text-[var(--sr-text-primary,var(--color-text))]">
              Reintentar pago rechazado
            </h3>
            <p className="mt-1 mb-4 text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">
              Plan: <b>{retryPaymentTarget?.planName ?? sub.planName}</b> · Valor original:{' '}
              <b>{formatCOP(retryPaymentTarget?.amount ?? sub.amount)}</b>
            </p>
            <PayerEmailForm
              defaultEmail={defaultRetryEmail}
              submitLabel="Pagar con Mercado Pago"
              busyLabel="Generando nuevo intento…"
              busy={paying}
              errorMessage={retryErrorMsg}
              onSubmit={handleRetryPayment}
              onCancel={() => {
                setShowRetryForm(false)
                setRetryPaymentTarget(null)
                setRetryErrorMsg(null)
              }}
            />
          </div>
        )}

        {conflictMsg && (
          <div role="alert" className="store-subscription__notice is-error">
            <strong>{conflictMsg}</strong>
            <p>Actualizamos el estado de tu suscripción para que veas la información vigente</p>
          </div>
        )}

        {!!payError && <div className="store-subscription__error"><ErrorState error={payError} title="No pudimos procesar el pago" /></div>}

        {sinSuscripcion && (
          <div role="status" className="store-subscription__notice">
            <strong>Tu almacén todavía no tiene una suscripción</strong>
            <p>Paga con Mercado Pago para mantener tu catálogo visible en el radar. Te pediremos el NIT del almacén y el correo del pagador</p>
          </div>
        )}

        <article className="store-subscription__plan">
          <span className="store-subscription__badge">● {(sinSuscripcion ? 'Sin suscripción' : planCardBadgeText).toUpperCase()}</span>
          <h3>{sub.planName}</h3>
          <p className="store-subscription__price">{formatCOP(sub.amount || STORE_SUBSCRIPTION_PRICE)} <small>/ mes</small></p>
          <ul>
            <li>Catálogo ilimitado visible en el radar y en el mapa</li>
            <li>Colecciones y playlists de tienda</li>
            <li>Estadísticas de visitas y mensajes</li>
            <li>Avisos automáticos a quienes esperan una prenda</li>
          </ul>
          {!sinSuscripcion && <div className="store-subscription__metadata">
            <span>suscripcionId: <b>{suscripcionId}</b></span>
            <span>estado: <b>{estado}</b></span>
            <span>fechaInicio: <b>{fechaInicio ?? '—'}</b></span>
            <span>fechaFin: <b>{fechaFin ?? '—'}</b></span>
            <span>autoRenovacion: <b>{autoRenovacion ? 'true' : 'false'}</b></span>
            <span>Método: <b>{lastPayment?.method ?? 'Mercado Pago'}</b></span>
          </div>}
          <div className="store-subscription__actions flex flex-wrap items-center gap-3">
            {sinSuscripcion && <IrAPagarButton />}
            {mostrarPagar && (
              <Button onClick={() => { void pay() }} disabled={paying}>
                {paying ? 'Procesando pago…' : isSuspendedOrExpired || derivedSub.status === 'CANCELADA' ? 'Volver a suscribirme' : 'Pagar y activar suscripción'}
              </Button>
            )}
            <CancelSubscriptionButton
              tipo="tienda"
              status={sub.status}
              renewalEnabled={sub.renewalEnabled}
              fechaFin={nextCharge}
              onUpdated={reload}
            />
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]/50 pt-2">
            El plan y la actividad comercial de tu tienda se rigen por las{' '}
            <a href="/legal/reglas-tiendas" className="font-semibold text-[var(--color-accent)] underline">
              Reglas para Tiendas y Marcas Aliadas
            </a>{' '}
            y la{' '}
            <a href="/legal/pagos-seguridad" className="font-semibold text-[var(--color-accent)] underline">
              Política de Pagos y Seguridad
            </a>
            .
          </p>
        </article>

        <section className="store-subscription__history">
          <h2>Historial de pagos</h2>
          <p>Cobros de tu suscripción. Abre un comprobante para verlo o descargarlo</p>
          {payments.length === 0 ? (
            <div className="store-subscription__empty">
              <EmptyState title="Aún no tienes pagos">Cuando pagues la suscripción, cada intento aparecerá aquí</EmptyState>
            </div>
          ) : (
            <div className="store-subscription__table-wrap">
              <table aria-label="Historial de pagos">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Concepto</th>
                    <th scope="col">Método</th>
                    <th scope="col">Valor</th>
                    <th scope="col">Estado</th>
                    <th scope="col" aria-label="Acción o comprobante" />
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{fecha(p.date)}</td>
                      <td><b>Tienda aliada · mensual</b><small>{p.id}</small></td>
                      <td>{p.method}</td>
                      <td>{formatCOP(p.amount)}</td>
                      <td><span className={`store-subscription__payment-status is-${p.status}`}>● {formatStatusLabel(PAYMENT_LABEL[p.status], p.unknownStatus)}</span></td>
                      <td>
                        {p.status === 'aprobado' && (
                          <button type="button" className="store-subscription__receipt" onClick={() => window.print()}>
                            Comprobante
                          </button>
                        )}
                        {p.status === 'rechazado' && sub.status !== 'ACTIVA' && (
                          <button
                            type="button"
                            disabled={paying}
                            className="rounded-lg bg-violeta px-3 py-1.5 text-xs font-bold text-blanco hover:bg-violeta-claro shadow-sm disabled:opacity-50"
                            onClick={() => {
                              setRetryPaymentTarget(p)
                              setShowRetryForm(true)
                              setRetryErrorMsg(null)
                            }}
                          >
                            Reintentar pago
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
