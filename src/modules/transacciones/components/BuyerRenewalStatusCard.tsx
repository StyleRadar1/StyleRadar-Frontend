import { useState } from 'react'
import { errorMessage } from '@/modules/core/api/errors'
import { Badge, Button } from '@/modules/core/design-system'
import { formatCOP } from '@/modules/core/utils/format'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { useUserPlan } from '../hooks/useUserPlan'
import { userPlanService } from '../services/userPlanService'

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
 * RF-95: Muestra en /planes y /perfil para el comprador con Radar+:
 * "Próximo cobro: {fecha} · {valor}" y el estado de la renovación automática (Activa/Desactivada),
 * con la acción para desactivarla o reactivarla.
 */
export function BuyerRenewalStatusCard() {
  const { user } = useAuth()
  const isBuyer = user?.role === 'COMPRADOR'
  const { plan, details } = useUserPlan(isBuyer)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  if (!isBuyer || plan !== 'RADAR_PLUS') return null

  const renewalActive = details?.renewalEnabled !== false
  const fechaTexto = formatFechaCobro(details?.proximoCobro ?? details?.periodEndsAt)
  const valorTexto = formatCOP(RADAR_PLUS_PRICE)

  const handleToggleRenewal = async () => {
    if (busy) return
    setBusy(true)
    setFeedback(null)
    try {
      const next = !renewalActive
      await userPlanService.setRenewal(next)
      setFeedback({
        ok: true,
        text: next
          ? `Renovación automática activada. Próximo cobro: ${fechaTexto} · ${valorTexto}.`
          : `La renovación automática está desactivada. Radar+ sigue activo hasta ${fechaTexto}.`,
      })
    } catch (err) {
      setFeedback({
        ok: false,
        text: errorMessage(err, 'No fue posible actualizar la renovación automática.'),
      })
    } finally {
      setBusy(false)
    }
  }

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
              : `Radar+ activo hasta ${fechaTexto}. No se renovará · Próximo cobro: ${fechaTexto} · ${valorTexto} (pausado)`}
          </p>
        </div>

        <Button
          type="button"
          variant={renewalActive ? 'secundario' : 'primario'}
          disabled={busy}
          onClick={() => {
            void handleToggleRenewal()
          }}
        >
          {busy
            ? 'Actualizando…'
            : renewalActive
              ? 'Desactivar renovación'
              : 'Reactivar renovación'}
        </Button>
      </div>

      {feedback && (
        <p
          role={feedback.ok ? 'status' : 'alert'}
          className={`mt-3 rounded-xl p-2.5 text-xs font-semibold ${
            feedback.ok
              ? 'bg-[#9be3b4]/10 text-[#9be3b4]'
              : 'bg-[#ff8a8a]/10 text-[#ffb4b4]'
          }`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  )
}
