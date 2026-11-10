import { useCallback, useState } from 'react'
import { Badge, Button, Card } from '@/modules/core/design-system'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { useStoreSubscription } from '../hooks/useStoreSubscription'
import { storeSubscriptionService } from '../services/storeSubscriptionService'
import type { PaymentStatus } from '../types/payment.dto'
import type { CheckoutResultDto } from '../types/plan.dto'
import type { StoreSubscriptionStatus } from '../types/storeSubscription.dto'

const STATUS_LABEL: Record<StoreSubscriptionStatus, string> = { PRUEBA: 'Periodo gratuito', ACTIVA: 'Activa', SUSPENDIDA: 'Suspendida' }
const STATUS_TONE: Record<StoreSubscriptionStatus, 'violeta' | 'arena' | 'lavanda'> = { PRUEBA: 'lavanda', ACTIVA: 'violeta', SUSPENDIDA: 'arena' }
const PAYMENT_LABEL: Record<PaymentStatus, string> = { aprobado: 'Aprobado', rechazado: 'Rechazado', pendiente: 'Pendiente', reembolsado: 'Reembolsado' }

const fecha = (iso?: string) => iso
  ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  : '—'

const OUTCOME: Record<CheckoutResultDto['status'], { title: string; text: string; alert: boolean }> = {
  aprobado: { title: '¡Pago aprobado!', text: 'Tu suscripción quedó activa y tu catálogo sigue visible en el radar.', alert: false },
  pendiente: { title: 'Pago pendiente', text: 'Aún no recibimos la confirmación del pago. La suscripción se activará cuando se apruebe.', alert: false },
  rechazado: { title: 'Pago rechazado', text: 'La suscripción no se activó. Puedes intentarlo de nuevo con otro medio de pago.', alert: true },
}

export default function StoreSubscriptionPage() {
  const { data, loading, error, reload } = useStoreSubscription()
  const [paying, setPaying] = useState(false)
  const [outcome, setOutcome] = useState<CheckoutResultDto | null>(null)
  const [payError, setPayError] = useState<unknown>(null)
  const [askCancel, setAskCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<unknown>(null)

  const pay = useCallback(async () => {
    setPaying(true)
    setPayError(null)
    setOutcome(null)
    try {
      const r = await storeSubscriptionService.pay()
      if (r.redirectTo) { window.location.assign(r.redirectTo); return }
      setOutcome(r.result ?? null)
      reload()
    } catch (e) {
      setPayError(e)
    } finally {
      setPaying(false)
    }
  }, [reload])

  const cancel = useCallback(async () => {
    setCancelling(true)
    setCancelError(null)
    try {
      await storeSubscriptionService.cancelRenewal()
      reload()
    } catch (e) {
      setCancelError(e)
    } finally {
      setCancelling(false)
      setAskCancel(false)
    }
  }, [reload])

  if (!data) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10">
        {loading ? <Loading label="Cargando tu suscripción…" /> : <ErrorState error={error} onRetry={reload} title="No pudimos cargar tu suscripción" />}
      </section>
    )
  }

  const { subscription: sub, payments } = data
  const msg = outcome ? OUTCOME[outcome.status] : null

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Suscripción de la tienda</h1>
      <p className="mt-1 text-white/70">Activa, paga y administra la suscripción que mantiene tu catálogo visible.</p>

      {msg && (
        <div role={msg.alert ? 'alert' : 'status'} className={`mt-6 rounded-2xl border p-4 ${msg.alert ? 'border-[#ff8a8a]/40 bg-[#ff8a8a]/10' : 'border-white/20 bg-white/5'}`}>
          <p className="font-semibold">{msg.title}</p>
          <p className="mt-1 text-sm text-white/80">{msg.text}</p>
        </div>
      )}
      {!!payError && <div className="mt-6"><ErrorState error={payError} title="No pudimos procesar el pago" /></div>}
      {!!cancelError && <div className="mt-6"><ErrorState error={cancelError} title="No se canceló la renovación" /></div>}

      <Card className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">Plan</p>
            <h2 className="mt-1 text-2xl font-extrabold">{sub.planName}</h2>
            <p className="text-white/70">{formatCOP(sub.amount)} al mes</p>
          </div>
          <Badge tone={STATUS_TONE[sub.status]}>{STATUS_LABEL[sub.status]}</Badge>
        </div>

        <div className="mt-4 text-sm text-white/80">
          {sub.status === 'PRUEBA' && (
            <p>Tienes 30 días gratis hasta el {fecha(sub.trialEndsAt)}. Después, para mantener tu catálogo activo, paga la suscripción de {formatCOP(sub.amount)} al mes.</p>
          )}
          {sub.status === 'ACTIVA' && sub.renewalEnabled && (
            <p>Tu suscripción está al día. Se renovará automáticamente el {fecha(sub.periodEndsAt)}.</p>
          )}
          {sub.status === 'ACTIVA' && !sub.renewalEnabled && (
            <p>No se renovará automáticamente. Tu suscripción sigue activa hasta el {fecha(sub.periodEndsAt)}; no hay devolución por el tiempo restante.</p>
          )}
          {sub.status === 'SUSPENDIDA' && (
            <p>Tu catálogo está suspendido por falta de pago. Paga la suscripción para volver a mostrarlo.</p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {sub.status !== 'ACTIVA' && (
            <Button onClick={() => { void pay() }} disabled={paying}>
              {paying ? 'Procesando pago…' : sub.status === 'SUSPENDIDA' ? 'Pagar y reactivar' : 'Pagar y activar suscripción'}
            </Button>
          )}
          {sub.status === 'ACTIVA' && sub.renewalEnabled && (
            <Button variant="secundario" onClick={() => setAskCancel(true)}>Cancelar renovación</Button>
          )}
        </div>
      </Card>

      <h2 className="mt-10 text-xl font-bold">Historial de pagos</h2>
      {payments.length === 0 ? (
        <div className="mt-3"><EmptyState title="Aún no tienes pagos">Cuando pagues la suscripción, cada intento aparecerá aquí.</EmptyState></div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
          <table aria-label="Historial de pagos" className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th scope="col" className="px-4 py-3">Fecha</th>
                <th scope="col" className="px-4 py-3">Referencia</th>
                <th scope="col" className="px-4 py-3">Método</th>
                <th scope="col" className="px-4 py-3">Monto</th>
                <th scope="col" className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{fecha(p.date)}</td>
                  <td className="px-4 py-3 font-mono">{p.id}</td>
                  <td className="px-4 py-3">{p.method}</td>
                  <td className="px-4 py-3 font-mono">{formatCOP(p.amount)}</td>
                  <td className="px-4 py-3">{PAYMENT_LABEL[p.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={askCancel}
        title="¿Cancelar la renovación?"
        confirmLabel="Sí, cancelar renovación"
        cancelLabel="Mantener suscripción"
        danger
        busy={cancelling}
        onConfirm={() => { void cancel() }}
        onCancel={() => setAskCancel(false)}
      >
        Dejaremos de cobrarte automáticamente en Mercado Pago. Tu suscripción sigue activa hasta el {fecha(sub.periodEndsAt)} y no se devuelve el tiempo restante.
      </ConfirmDialog>
    </section>
  )
}
