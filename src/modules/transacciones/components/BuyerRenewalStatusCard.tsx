import { Badge } from '@/modules/core/design-system'
import { formatCOP } from '@/modules/core/utils/format'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { CancelSubscriptionButton } from './CancelSubscriptionButton'
import { useUserPlan } from '../hooks/useUserPlan'
import { getTryOnPhotoUses } from '../services/userPlanService'
import { PLAN_LIMITS } from '../types/plan.dto'

const RADAR_PLUS_PRICE = 14_900

const formatFechaCobro = (iso?: string) =>
  iso
    ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : '9 de diciembre de 2026'

/**
 * RF-95, RF-102, E.2: Muestra en /planes y /perfil para el comprador:
 * el estado de la renovación automática, próximo cobro, límite aplicado del probador con foto propia y el botón "Cancelar suscripción".
 */
export function BuyerRenewalStatusCard() {
  const { user } = useAuth()
  const isBuyer = user?.role === 'COMPRADOR'
  const { plan, details } = useUserPlan(isBuyer)

  if (!isBuyer) return null

  const uses = getTryOnPhotoUses(user?.id ?? 'u-1')
  const disponibles = Math.max(0, PLAN_LIMITS.probadorFoto - uses)

  if (plan === 'RADAR') {
    return (
      <div
        role="region"
        aria-label="Estado del plan Radar"
        className="mt-4 rounded-2xl border border-[var(--sr-border,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] p-4 text-sm text-[var(--sr-text-primary,var(--color-text))]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">Plan actual:</span>
              <Badge tone="arena">Radar (Gratuito)</Badge>
            </div>
            <p className="text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">
              Límite aplicado: Probador con maniquí (sin probador con foto propia ni alertas de disponibilidad)
            </p>
          </div>
          <CancelSubscriptionButton
            tipo="comprador"
            renewalEnabled={false}
            isFreePlan
          />
        </div>
      </div>
    )
  }

  if (plan !== 'RADAR_PLUS') return null

  const renewalActive = details?.renewalEnabled !== false
  const fechaTexto = formatFechaCobro(details?.proximoCobro ?? details?.periodEndsAt)
  const valorTexto = formatCOP(RADAR_PLUS_PRICE)

  return (
    <div
      role="region"
      aria-label="Estado de renovación automática Radar+"
      className="mt-4 rounded-2xl border border-[var(--sr-border,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] p-4 text-sm text-[var(--sr-text-primary,var(--color-text))]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">Renovación automática:</span>
            <Badge tone={renewalActive ? 'violeta' : 'arena'}>
              {renewalActive ? 'Activa' : 'Desactivada'}
            </Badge>
          </div>
          <p className="text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">
            {renewalActive
              ? `Próximo cobro: ${fechaTexto} · ${valorTexto}`
              : `Radar+ activo hasta ${fechaTexto} · Próximo cobro pausado`}
          </p>
          <p className="text-xs font-semibold text-arena">
            Usos disponibles del probador con foto propia: {disponibles} de {PLAN_LIMITS.probadorFoto} ({uses} usados)
          </p>
        </div>

        <CancelSubscriptionButton
          tipo="comprador"
          status="RADAR_PLUS"
          renewalEnabled={renewalActive}
          fechaFin={fechaTexto}
        />
      </div>
    </div>
  )
}
