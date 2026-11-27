import { Calendar } from 'lucide-react'

export interface SubscriptionSummaryProps {
  startDate?: string | null
  endDate?: string | null
  startLabel?: string
  endLabel?: string
  renewalText?: string | null
  className?: string
}

/**
 * Bloque reutilizable con las fechas de vigencia (dos bloques con icono de calendario,
 * apilados en móvil) y la línea única de renovación automática.
 */
export function SubscriptionSummary({
  startDate,
  endDate,
  startLabel = 'Activa desde',
  endLabel = 'Vigente hasta',
  renewalText,
  className = '',
}: SubscriptionSummaryProps) {
  const hasDates = Boolean(startDate || endDate)
  if (!hasDates && !renewalText) return null

  return (
    <div className={`space-y-3 ${className}`}>
      {hasDates && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {startDate && (
            <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2.5">
              <Calendar
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sr-accent-text,#c084fc)]"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--sr-text-muted,#8b86a4)]">
                  {startLabel}
                </p>
                <p className="text-sm font-semibold text-[var(--sr-text-primary,#f8fafc)]">
                  {startDate}
                </p>
              </div>
            </div>
          )}

          {endDate && (
            <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2.5">
              <Calendar
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sr-accent-text,#c084fc)]"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--sr-text-muted,#8b86a4)]">
                  {endLabel}
                </p>
                <p className="text-sm font-semibold text-[var(--sr-text-primary,#f8fafc)]">
                  {endDate}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {renewalText && (
        <p className="text-xs font-medium text-[var(--sr-text-secondary,#b8b3ce)]">
          {renewalText}
        </p>
      )}
    </div>
  )
}
