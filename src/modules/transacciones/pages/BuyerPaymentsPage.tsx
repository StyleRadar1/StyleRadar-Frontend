import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { env } from '@/configs/env'
import { Badge, Button, Card } from '@/modules/core/design-system'
import { EmptyState, Loading } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { PayerEmailForm } from '../components/PayerEmailForm'
import { formatStatusLabel } from '../mappers/paymentsMappers'
import { planService } from '../services/planService'
import { userPlanService } from '../services/userPlanService'
import type { PaymentDto, PaymentStatus } from '../types/payment.dto'

const STATUS_BADGE_LABEL: Record<PaymentStatus, string> = {
  aprobado: 'APROBADO',
  rechazado: 'RECHAZADO',
  pendiente: 'PENDIENTE',
}

const STATUS_TONE: Record<PaymentStatus, 'violeta' | 'arena' | 'lavanda'> = {
  aprobado: 'violeta',
  rechazado: 'arena',
  pendiente: 'lavanda',
}

const formatFecha = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

/**
 * Sección reutilizable del historial de pagos propios del comprador (RF-97).
 */
export function BuyerPaymentsSection() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState<PaymentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentDto | null>(null)
  const [retryTarget, setRetryTarget] = useState<PaymentDto | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await userPlanService.getMyPayments()
      setPayments(list)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <Loading label="Cargando tu historial de pagos…" />
  }

  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--color-danger-border,rgba(239,68,68,0.4))] bg-[var(--color-danger-bg,rgba(239,68,68,0.12))] p-5 text-[var(--sr-text-primary,var(--color-text))]"
      >
        <p className="text-sm font-semibold">
          No pudimos cargar tu historial. Inténtalo en unos minutos
        </p>
        <Button
          type="button"
          variant="primario"
          onClick={() => {
            void load()
          }}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <EmptyState title="Aún no tienes pagos de suscripción registrados">
        Cuando actives Radar+, tus transacciones y comprobantes aparecerán aquí ordenados del más reciente al más antiguo
      </EmptyState>
    )
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-2xl border border-[var(--sr-border,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))]">
        <table className="w-full min-w-[40rem] text-left text-sm" aria-label="Historial de pagos">
          <thead className="border-b border-[var(--sr-border,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] text-xs uppercase tracking-wider text-[var(--sr-text-secondary,var(--color-text-muted))]">
            <tr>
              <th scope="col" className="p-4 font-bold">Fecha</th>
              <th scope="col" className="p-4 font-bold">Concepto / Plan</th>
              <th scope="col" className="p-4 font-bold">Valor y moneda</th>
              <th scope="col" className="p-4 font-bold">Estado</th>
              <th scope="col" className="p-4 font-bold">Referencia Mercado Pago</th>
              <th scope="col" className="p-4 font-bold text-right">Comprobante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--sr-border,var(--color-border))]">
            {payments.map((p) => {
              const ref = p.mpReference ?? p.id
              const currency = p.currency ?? 'COP'
              return (
                <tr key={p.id} className="hover:bg-[var(--sr-surface-raised,var(--color-surface-raised))]/40">
                  <td className="p-4 whitespace-nowrap">{formatFecha(p.date)}</td>
                  <td className="p-4">
                    <div className="font-semibold text-[var(--sr-text-primary,var(--color-text))]">
                      {p.planName || '—'} · mensual
                    </div>
                    <div className="text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">
                      {p.method} · {p.id}
                    </div>
                  </td>
                  <td className="p-4 font-mono font-semibold whitespace-nowrap">
                    {formatCOP(p.amount)} {currency}
                  </td>
                  <td className="p-4">
                    <Badge tone={STATUS_TONE[p.status]}>{formatStatusLabel(STATUS_BADGE_LABEL[p.status], p.unknownStatus)}</Badge>
                  </td>
                  <td className="p-4 font-mono text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">
                    {ref}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(p)}
                        className="rounded-lg border border-[var(--sr-border,var(--color-border))] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--sr-surface-raised,var(--color-surface-raised))]"
                      >
                        Comprobante
                      </button>
                      {p.status === 'rechazado' && (
                        <button
                          type="button"
                          disabled={retrying}
                          onClick={() => {
                            setRetryTarget(p)
                            setRetryError(null)
                          }}
                          className="rounded-lg bg-[var(--sr-accent,var(--color-accent))] px-3 py-1.5 text-xs font-bold text-[var(--color-text-on-accent,#ffffff)] disabled:opacity-50"
                        >
                          Reintentar pago
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {retryTarget && (
        <Card className="border border-[var(--sr-border,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--sr-border,var(--color-border))] pb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--sr-text-secondary,var(--color-text-muted))]">
                Reintentar pago rechazado
              </p>
              <h3 className="mt-0.5 text-lg font-extrabold">
                {retryTarget.planName} · {formatCOP(retryTarget.amount)}
              </h3>
              <p className="mt-1 text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">
                El pago no fue aprobado. Puedes intentarlo nuevamente
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRetryTarget(null)}
              className="text-xs font-semibold text-[var(--sr-text-secondary,var(--color-text-muted))] hover:underline"
            >
              Cerrar
            </button>
          </div>
          <div className="mt-4">
            <PayerEmailForm
              defaultEmail={retryTarget.userEmail}
              submitLabel="Pagar con Mercado Pago"
              busyLabel="Preparando reintento…"
              busy={retrying}
              errorMessage={retryError}
              onCancel={() => setRetryTarget(null)}
              onSubmit={async (payerEmail) => {
                setRetrying(true)
                setRetryError(null)
                try {
                  if (!env.useMocksPagos) {
                    const retried = await planService.retryRejectedPayment(
                      {
                        orderId: retryTarget.id,
                        status: 'rechazado',
                        planName: retryTarget.planName,
                        amount: retryTarget.amount,
                        planId: retryTarget.planId,
                      },
                      payerEmail,
                    )
                    setRetryTarget(null)
                    if (retried.initPoint) {
                      window.location.assign(retried.initPoint)
                      return
                    }
                    navigate(`/pago/resultado?orden=${encodeURIComponent(retried.orderId)}`)
                    return
                  }
                  await planService.createCheckout(retryTarget.planId, payerEmail)
                  setRetryTarget(null)
                  navigate('/pago/resultado?orden=MOCK_ORDER_OK')
                } catch (e) {
                  setRetryError(e instanceof Error ? e.message.replace(/\.$/, '') : 'No fue posible generar un nuevo intento de pago')
                } finally {
                  setRetrying(false)
                }
              }}
            />
          </div>
        </Card>
      )}

      {selectedReceipt && (
        <Card className="border border-[var(--sr-border,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--sr-border,var(--color-border))] pb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--sr-text-secondary,var(--color-text-muted))]">
                Comprobante de transacción
              </p>
              <h3 className="mt-0.5 text-lg font-extrabold">
                {selectedReceipt.planName} · {selectedReceipt.id}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secundario" onClick={() => window.print()}>
                Imprimir / PDF
              </Button>
              <Button type="button" variant="secundario" onClick={() => setSelectedReceipt(null)}>
                Cerrar
              </Button>
            </div>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">Fecha</dt>
              <dd className="font-semibold">{formatFecha(selectedReceipt.date)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">Valor y moneda</dt>
              <dd className="font-mono font-semibold">
                {formatCOP(selectedReceipt.amount)} {selectedReceipt.currency ?? 'COP'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">Estado</dt>
              <dd className="font-semibold">{STATUS_BADGE_LABEL[selectedReceipt.status]}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">Referencia Mercado Pago</dt>
              <dd className="font-mono">{selectedReceipt.mpReference ?? selectedReceipt.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">Método</dt>
              <dd>{selectedReceipt.method || 'Mercado Pago'}</dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  )
}

/**
 * RF-97: Página dedicada `/perfil/pagos` para el historial de pagos propios del comprador.
 */
export default function BuyerPaymentsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 text-[var(--sr-text-primary,var(--color-text))]">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--sr-border,var(--color-border))] pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-arena">Mi cuenta · Suscripciones</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-5xl">Historial de pagos</h1>
          <p className="mt-2 text-sm text-[var(--sr-text-secondary,var(--color-text-muted))]">
            Transacciones asociadas a tu cuenta, ordenadas de la más reciente a la más antigua.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/perfil"
            className="rounded-xl border border-[var(--sr-border,var(--color-border))] px-4 py-2.5 text-xs font-semibold hover:bg-[var(--sr-surface-raised,var(--color-surface-raised))]"
          >
            ← Volver a Mi perfil
          </Link>
          <Link
            to="/planes"
            className="rounded-xl bg-[var(--sr-accent,var(--color-accent))] px-4 py-2.5 text-xs font-bold text-[var(--color-text-on-accent,#ffffff)]"
          >
            Ver mi plan
          </Link>
        </div>
      </div>

      <BuyerPaymentsSection />
    </section>
  )
}
