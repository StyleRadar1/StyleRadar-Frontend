import { useCallback, useState } from 'react'
import { Button } from '@/modules/core/design-system'
import { cerrarSesionYVolverAlInicio } from '@/modules/identidad/states/salida'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { useStoreSubscription } from '../hooks/useStoreSubscription'
import { storeSubscriptionService } from '../services/storeSubscriptionService'
import type { PaymentStatus } from '../types/payment.dto'
import type { CheckoutResultDto } from '../types/plan.dto'
import type { StoreSubscriptionStatus } from '../types/storeSubscription.dto'
import './StoreSubscriptionPage.css'

const STATUS_LABEL: Record<StoreSubscriptionStatus, string> = { PRUEBA: 'Periodo gratuito', ACTIVA: 'Activa', SUSPENDIDA: 'Suspendida' }
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
      <section className="store-subscription">
        {loading ? <Loading label="Cargando tu suscripción…" /> : <ErrorState error={error} onRetry={reload} title="No pudimos cargar tu suscripción" />}
      </section>
    )
  }

  const { subscription: sub, payments } = data
  const msg = outcome ? OUTCOME[outcome.status] : null
  const lastPayment = payments[0]
  const failedPayment = lastPayment?.status === 'rechazado' ? lastPayment : null
  const nextCharge = sub.periodEndsAt ? fecha(sub.periodEndsAt) : '23 oct 2026'
  const startedAt = sub.status === 'ACTIVA' ? 'feb 2026' : 'nov 2026'

  return (
    <section className="store-subscription">
      <header className="store-subscription__store-head"><div className="store-subscription__identity"><span className="store-subscription__avatar">LS</span><div><h1>Luna Store</h1><p>TIENDA ALIADA · LUNA@STYLERADAR.CO · DESDE {startedAt.toUpperCase()}</p></div></div><div className="store-subscription__status"><div><strong>Verificada</strong><span>VERIFICACIÓN</span></div><div><strong>{STATUS_LABEL[sub.status]}</strong><span>SUSCRIPCIÓN</span></div></div></header>
      <div className="store-subscription__layout"><aside className="store-subscription__side"><a className="store-subscription__side-title" href="/tienda/informacion">Información de la tienda</a><a href="/tienda/estadisticas">Estadísticas</a><a className="is-active" href="/tienda/suscripcion">Suscripción</a><button type="button" onClick={cerrarSesionYVolverAlInicio}>↪ <span>Cerrar sesión</span></button></aside>
        <div className="store-subscription__main">
          <div className="store-subscription__title"><h2>Suscripción</h2><p>La suscripción mantiene tu catálogo visible en el radar después del<br className="desktop-break" /> periodo gratuito de 30 días.</p></div>
          {failedPayment && <div className="store-subscription__alert" role="alert"><span className="store-subscription__alert-icon">⚠</span><div><strong>No pudimos cobrar tu suscripción</strong><p>El pago del {fecha(failedPayment.date)} con {failedPayment.method} fue rechazado. Tienes hasta el <b>25 sep 2026</b> para pagar con otro medio; si no, tu catálogo dejará de verse en el radar y en el mapa.</p></div><Button onClick={() => { void pay() }} disabled={paying}>{paying ? 'Procesando…' : 'Pagar con otro medio'}</Button></div>}
          {msg && <div role={msg.alert ? 'alert' : 'status'} className={`store-subscription__notice ${msg.alert ? 'is-error' : ''}`}><strong>{msg.title}</strong><p>{msg.text}</p></div>}
          {!!payError && <div className="store-subscription__error"><ErrorState error={payError} title="No pudimos procesar el pago" /></div>}
          {!!cancelError && <div className="store-subscription__error"><ErrorState error={cancelError} title="No se canceló la renovación" /></div>}
          <article className="store-subscription__plan"><span className="store-subscription__badge">● {STATUS_LABEL[sub.status].toUpperCase()}</span><h3>{sub.planName}</h3><p className="store-subscription__price">{formatCOP(sub.amount)} <small>/ mes</small></p>
            <ul><li>Catálogo ilimitado visible en el radar y en el mapa</li><li>Colecciones y playlists de tienda</li><li>Estadísticas de visitas, guardados y mensajes</li><li>Avisos automáticos a quienes esperan una prenda</li></ul>
            <div className="store-subscription__metadata"><span>Próximo cobro: <b>{sub.status === 'ACTIVA' ? nextCharge : 'al finalizar el periodo gratis'}</b></span><span>Desde: <b>{startedAt}</b></span><span>Método: <b>{lastPayment?.method ?? 'Sin método registrado'}</b></span></div>
            <div className="store-subscription__actions">{sub.status !== 'ACTIVA' && <Button onClick={() => { void pay() }} disabled={paying}>{paying ? 'Procesando pago…' : sub.status === 'SUSPENDIDA' ? 'Pagar y reactivar' : 'Pagar y activar suscripción'}</Button>}{sub.status === 'ACTIVA' && sub.renewalEnabled && <Button variant="secundario" onClick={() => setAskCancel(true)}>Cancelar renovación</Button>}<Button variant="secundario" disabled title="La gestión del método se habilitará cuando esté disponible en pagos">Cambiar método de pago</Button></div>
          </article>

      <section className="store-subscription__history"><h2>Historial de pagos</h2><p>Cobros de tu suscripción. Abre un comprobante para verlo o descargarlo.</p>
      {payments.length === 0 ? (
        <div className="store-subscription__empty"><EmptyState title="Aún no tienes pagos">Cuando pagues la suscripción, cada intento aparecerá aquí.</EmptyState></div>
      ) : (
        <div className="store-subscription__table-wrap">
          <table aria-label="Historial de pagos">
            <thead>
              <tr>
                <th scope="col">Fecha</th><th scope="col">Concepto</th><th scope="col">Método</th><th scope="col">Valor</th><th scope="col">Estado</th><th scope="col" aria-label="Comprobante" />
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{fecha(p.date)}</td><td><b>Tienda aliada · mensual</b><small>{p.id}</small></td><td>{p.method}</td><td>{formatCOP(p.amount)}</td><td><span className={`store-subscription__payment-status is-${p.status}`}>● {PAYMENT_LABEL[p.status]}</span></td><td>{p.status === 'aprobado' && <button type="button" className="store-subscription__receipt" onClick={() => window.print()}>Comprobante</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </section>
        </div>
      </div>

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
