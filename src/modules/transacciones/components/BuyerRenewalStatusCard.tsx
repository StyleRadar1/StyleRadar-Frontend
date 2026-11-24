import { Link } from 'react-router-dom'
import { Badge } from '@/modules/core/design-system'
import { formatCOP } from '@/modules/core/utils/format'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { CancelSubscriptionButton } from './CancelSubscriptionButton'
import { RADAR_PLUS_PRICE } from '../constants/plansByRole'
import { useUserPlan } from '../hooks/useUserPlan'
import { deriveSubscriptionStatus, formatSubscriptionDate } from '../mappers/paymentsMappers'
import { getTryOnPhotoUses } from '../services/userPlanService'
import { PLAN_LIMITS } from '../types/plan.dto'

const formatFechaCobro = (iso?: string | null) =>
  formatSubscriptionDate(iso, '9 de diciembre de 2026')

/**
 * RF-95, RF-100, RF-102: Muestra en /planes y /perfil para el comprador:
 * suscripcionId, estado, fechaInicio, fechaFin, autoRenovacion, límite aplicado del probador con foto propia y el botón "Cancelar suscripción" (solo en estado ACTIVA).
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
  const suscripcionId = details?.suscripcionId ?? `SUB-USR-${user?.id ?? 'u-1'}`
  const fechaInicio = details?.fechaInicio ?? '2026-11-09'
  const fechaFinRaw = details?.fechaFin ?? details?.proximoCobro ?? details?.periodEndsAt ?? '2026-12-09'
  const fechaTexto = formatFechaCobro(fechaFinRaw)
  const valorTexto = formatCOP(RADAR_PLUS_PRICE)
  const derived = deriveSubscriptionStatus(estado, { autoRenewal: renewalActive, endDate: fechaFinRaw })

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
              {renewalActive ? 'Activa' : 'Activa sin renovación'}
            </Badge>
            <Badge tone={estado === 'ACTIVA' ? 'violeta' : 'lavanda'}>{derived.label}</Badge>
          </div>
          <p className="text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">
            <span>suscripcionId: <b className="font-mono">{suscripcionId}</b></span>
            {' · '}
            <span>estado: <b>{estado}</b></span>
            {' · '}
            <span>fechaInicio: <b className="font-mono">{fechaInicio}</b></span>
            {' · '}
            <span>fechaFin: <b className="font-mono">{fechaFinRaw}</b></span>
            {' · '}
            <span>autoRenovacion: <b>{renewalActive ? 'true' : 'false'}</b></span>
          </p>
          <p className="text-xs text-[var(--sr-text-secondary,var(--color-text-muted))]">
            {renewalActive
              ? `Próximo cobro: ${fechaTexto} · ${valorTexto}`
              : `Tu plan sigue activo hasta ${fechaTexto}`}
          </p>
          <p className="text-xs font-semibold text-arena">
            Usos disponibles del probador con foto propia: {disponibles} de {PLAN_LIMITS.probadorFoto} ({uses} usados)
          </p>
        </div>

        <CancelSubscriptionButton
          tipo="comprador"
          status={estado}
          renewalEnabled={renewalActive}
          fechaFin={fechaTexto}
        />
      </div>
    </div>
  )
}
