import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/modules/core/design-system'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { useUserPlan } from '../hooks/useUserPlan'
import {
  dismissPlanDegradedNotice,
  isPlanDegradedDismissed,
} from '../services/userPlanService'

export const PLAN_DEGRADED_MSG =
  'Tu plan Radar+ se suspendió porque no se pudo procesar el pago. Volviste al plan Radar, con sus límites gratuitos y conservando tus fotos y alertas'

export const PLAN_PENDING_RENEWAL_MSG =
  'Tu pago está pendiente de confirmación. Por ahora usas Radar; Radar+ se reactivará cuando el pago sea aprobado'

/**
 * RF-103: Banner informativo dismissible con persistencia por sesión en /perfil y /planes
 * cuando el comprador pasó de Radar+ a Radar por falta de pago o tiene el pago de renovación pendiente.
 */
export function PlanDegradedBanner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isBuyer = user?.role === 'BUYER'
  const { details } = useUserPlan(isBuyer)
  const userId = user?.id ?? 'u-1'

  const [dismissed, setDismissed] = useState<boolean>(() => isPlanDegradedDismissed(userId))

  useEffect(() => {
    setDismissed(isPlanDegradedDismissed(userId))
  }, [userId, details?.degradedByPayment, details?.pendingRenewal])

  const isSuspended = !!details?.degradedByPayment
  const isPendingRenewal = !!details?.pendingRenewal

  if (!isBuyer || (!isSuspended && !isPendingRenewal) || dismissed) return null

  const handleDismiss = () => {
    dismissPlanDegradedNotice(userId)
    setDismissed(true)
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-6 rounded-2xl border border-[var(--color-danger-border,rgba(239,68,68,0.4))] bg-[var(--color-danger-bg,rgba(239,68,68,0.12))] p-4 text-[var(--sr-text-primary,var(--color-text))]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {isPendingRenewal ? PLAN_PENDING_RENEWAL_MSG : PLAN_DEGRADED_MSG}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {!isPendingRenewal && (
            <Button type="button" variant="primario" onClick={() => navigate('/suscripcion')}>
              Reactivar Radar+
            </Button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar aviso de estado de plan"
            className="rounded-lg border border-[var(--sr-border,var(--color-border))] px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--sr-surface-raised,var(--color-surface-raised))]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
