import { Link } from 'react-router-dom'
import { Badge } from '@/modules/core/design-system'
import { formatCOP } from '@/modules/core/utils/format'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { CancelSubscriptionButton } from './CancelSubscriptionButton'
import { SubscriptionSummary } from './SubscriptionSummary'
import { getSubscriptionBadgeClass } from '../utils/subscriptionBadge'
import { RADAR_PLUS_PRICE } from '../constants/plansByRole'
import { useUserPlan } from '../hooks/useUserPlan'
import { deriveSubscriptionStatus } from '../mappers/paymentsMappers'
import { getTryOnPhotoUses } from '../services/userPlanService'
import { PLAN_LIMITS } from '../types/plan.dto'

/**
 * Formatea YYYY-MM-DD en español sin usar `new Date("YYYY-MM-DD")` para evitar
 * desfases de zona horaria. Si no hay fecha válida, devuelve null.
 */
function formatFechaEsCO(raw?: string | null): string | null {
  if (!raw) return null
  const parts = raw.trim().slice(0, 10).split('-')
  if (parts.length !== 3) return null
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * RF-95, RF-100, RF-102 (BUG-15): Muestra en /planes y /perfil para el comprador
 * el estado claro de su suscripción, fechas en español, límite del probador con foto propia
 * y el botón "Cancelar suscripción" (solo en estado ACTIVA).
 */
export function BuyerRenewalStatusCard() {
  const { user } = useAuth()
  const isBuyer = user?.role === 'BUYER'
  const { plan, details } = useUserPlan(isBuyer)

  if (!isBuyer) return null

  const uses = getTryOnPhotoUses(user?.id ?? 'u-1')
  const disponibles = Math.max(0, PLAN_LIMITS.probadorFoto - uses)

  if (plan === 'RADAR') {
    const isExpiredOrSuspended = details?.estado === 'SUSPENDIDA' || details?.estado === 'VENCIDA'
    return (
      <div
        role="region"
        aria-label="Estado del plan Radar"
        className="mt-4 rounded-2xl border border-[var(--sr-border,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] p-4 text-sm text-[var(--sr-text-primary,var(--color-text))]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">Plan actual:</span>
              <Badge tone="arena">Radar (Gratuito)</Badge>
              {isExpiredOrSuspended && <Badge tone="lavanda">{details?.estado}</Badge>}
            </div>
            <p className="text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">
              Límite aplicado: Probador con maniquí (sin probador con foto propia ni alertas de disponibilidad)
            </p>
          </div>
          {isExpiredOrSuspended && (
            <Link
              to="/suscripcion"
              className="rounded-xl bg-violeta px-4 py-2 text-xs font-semibold text-blanco"
            >
              Volver a suscribirme
            </Link>
          )}
        </div>
      </div>
    )
  }

  if (plan !== 'RADAR_PLUS') return null

  const renewalActive = details?.renewalEnabled !== false
  const estado = details?.estado ?? 'ACTIVA'
  const fechaInicioRaw = details?.fechaInicio ?? null
  const fechaFinRaw = details?.fechaFin ?? details?.proximoCobro ?? details?.periodEndsAt ?? null
  const fechaInicioTexto = formatFechaEsCO(fechaInicioRaw)
  const fechaFinTexto = formatFechaEsCO(fechaFinRaw)
  const valorTexto = formatCOP(RADAR_PLUS_PRICE)
  const derived = deriveSubscriptionStatus(estado, {
    autoRenewal: renewalActive,
    endDate: fechaFinRaw,
  })
  const badgeClass = getSubscriptionBadgeClass(derived.status, renewalActive)

  return (
    <div
      role="region"
      aria-label="Estado de renovación automática Radar+"
      className="mt-4 rounded-2xl border border-[var(--sr-border,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] p-4 text-sm text-[var(--sr-text-primary,var(--color-text))]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-bold">Plan Radar+</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeClass}`}>
              <span aria-hidden="true">●</span>
              <span>{derived.label}</span>
            </span>
          </div>

          {derived.status === 'PENDIENTE' ? (
            <p className="text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">
              Suscripción pendiente de confirmación.
            </p>
          ) : (
            <SubscriptionSummary
              startDate={fechaInicioTexto}
              endDate={fechaFinTexto}
              endLabel={derived.status === 'CANCELADA' || derived.status === 'VENCIDA' ? 'Finalizó el' : 'Vigente hasta'}
              renewalText={
                derived.status === 'ACTIVA'
                  ? renewalActive
                    ? `Se renovará automáticamente (${valorTexto}).`
                    : 'No se renovará al finalizar el período.'
                  : undefined
              }
            />
          )}

          <p className="text-xs font-semibold text-arena">
            Usos disponibles del probador con foto propia: {disponibles} de {PLAN_LIMITS.probadorFoto} ({uses} usados)
          </p>
        </div>

        {renewalActive && (
          <CancelSubscriptionButton
            tipo="comprador"
            status={estado}
            renewalEnabled={renewalActive}
            fechaFin={fechaFinTexto ?? undefined}
          />
        )}
      </div>
    </div>
  )
}
