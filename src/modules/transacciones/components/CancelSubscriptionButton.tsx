import { useState } from 'react'
import { Button } from '@/modules/core/design-system'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { userPlanService } from '../services/userPlanService'
import { storeSubscriptionService } from '../services/storeSubscriptionService'

export interface CancelSubscriptionButtonProps {
  tipo: 'comprador' | 'tienda'
  renewalEnabled: boolean
  fechaFin?: string
  planName?: string
  status?: string
  isFreePlan?: boolean
  onUpdated?: () => void
  className?: string
}

/**
 * Botón y modal oficial "Cancelar suscripción" (E.2, RF-68, RF-101).
 * Explica que conserva beneficios hasta {fechaFin}, no cobra siguiente ciclo y no hay devolución por el tiempo restante
 */
export function CancelSubscriptionButton({
  tipo,
  renewalEnabled,
  fechaFin = 'fin del periodo',
  planName,
  status = 'ACTIVA',
  isFreePlan = false,
  onUpdated,
  className = '',
}: CancelSubscriptionButtonProps) {
  const [openModal, setOpenModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const effectivePlanName = planName ?? (tipo === 'comprador' ? 'Radar+' : 'Tienda aliada')

  if (isFreePlan || status !== 'ACTIVA') {
    return null
  }

  if (!renewalEnabled) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="rounded-xl border border-arena/40 bg-white/[.04] p-3 text-xs text-[var(--sr-text-primary,var(--color-text))]">
          <p className="font-semibold text-arena">
            {effectivePlanName} · Activa hasta {fechaFin}. No se renovará
          </p>
          <p className="mt-0.5 text-[var(--sr-text-muted,var(--color-text-muted))]">
            La renovación automática está desactivada
          </p>
        </div>
        <div>
          <Button
            type="button"
            variant="primario"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                if (tipo === 'comprador') {
                  await userPlanService.setRenewal(true)
                } else {
                  await storeSubscriptionService.reactivateRenewal()
                }
                onUpdated?.()
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'Reactivando…' : 'Reactivar renovación automática'}
          </Button>
        </div>
      </div>
    )
  }

  const fallbackCancelErr =
    tipo === 'comprador'
      ? 'No fue posible cancelar la renovación de Radar+'
      : 'No fue posible desactivar la renovación. Inténtalo nuevamente'

  const handleConfirmCancel = async () => {
    setBusy(true)
    setError(null)
    try {
      if (tipo === 'comprador') {
        await userPlanService.setRenewal(false)
      } else {
        await storeSubscriptionService.cancelRenewal()
      }
      setOpenModal(false)
      onUpdated?.()
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message.replace(/\.$/, '') : fallbackCancelErr)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className={className}>
        <Button
          type="button"
          variant="secundario"
          disabled={busy}
          onClick={() => setOpenModal(true)}
          className="border-[#c0392b]/50 text-[#ff8a8a] hover:bg-[#c0392b]/10"
        >
          Cancelar suscripción
        </Button>
      </div>

      <ConfirmDialog
        open={openModal}
        title="¿Cancelar suscripción?"
        confirmLabel="Confirmar cancelación"
        cancelLabel="Conservar suscripción"
        danger
        busy={busy}
        onConfirm={() => { void handleConfirmCancel() }}
        onCancel={() => setOpenModal(false)}
      >
        <div className="space-y-2 text-left text-sm text-[var(--sr-text-primary,var(--color-text))]">
          <p>
            Al cancelar la suscripción de <strong>{effectivePlanName}</strong>, conservarás el acceso a los beneficios hasta el final de tu ciclo de facturación (<strong>{fechaFin}</strong>)
          </p>
          <p>
            Se desactiva la renovación automática y no se cobrará el siguiente ciclo en Mercado Pago
          </p>
          <p className="text-xs text-[var(--sr-text-muted,var(--color-text-muted))]">
            No hay devolución por el tiempo restante
          </p>
          {error && (
            <p role="alert" className="mt-2 text-xs font-semibold text-[#ff8a8a]">
              {error}
            </p>
          )}
        </div>
      </ConfirmDialog>
    </>
  )
}
