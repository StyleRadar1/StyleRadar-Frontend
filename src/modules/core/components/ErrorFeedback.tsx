import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, Lock, RefreshCw, X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

export type FeedbackTone = 'bad' | 'warn' | 'info' | 'ok'

const TONE_COLOR: Record<FeedbackTone, string> = {
  bad: 'var(--sr-bad)',
  warn: 'var(--sr-warn)',
  info: 'var(--sr-acc-tx)',
  ok: 'var(--sr-ok)',
}

function ToneIcon({ tone, kind }: { tone: FeedbackTone; kind?: 'lock' | 'refresh' | 'info' | 'warn' | 'ok' }) {
  const cls = 'h-4 w-4 shrink-0'
  if (kind === 'lock') return <Lock className={cls} aria-hidden="true" />
  if (kind === 'refresh') return <RefreshCw className={cls} aria-hidden="true" />
  if (kind === 'info' || tone === 'info') return <Info className={cls} aria-hidden="true" />
  if (kind === 'ok' || tone === 'ok') return <CheckCircle2 className={cls} aria-hidden="true" />
  return <AlertTriangle className={cls} aria-hidden="true" />
}

/** Error debajo de un campo: siempre con ícono y texto, entra suave sin depender solo del color. */
export function FieldError({ id, message, tone = 'bad' }: { id?: string; message?: string | null; tone?: FeedbackTone }) {
  const reduced = !!useReducedMotion()
  if (!message) return null
  const color = TONE_COLOR[tone]
  return (
    <motion.p
      id={id}
      role="alert"
      initial={reduced ? false : { opacity: 0, y: -4, x: -4 }}
      animate={reduced ? undefined : { opacity: 1, y: 0, x: [0, -4, 4, -2, 0] }}
      transition={{ duration: 0.28 }}
      className="mt-1.5 flex items-center gap-1.5 text-xs font-medium"
      style={{ color }}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </motion.p>
  )
}

/** Aviso fijo en línea (banda) para reglas de negocio, bloqueos (403/422) o confirmaciones. */
export function ErrorBanner({
  tone = 'bad',
  icon,
  title,
  children,
  actions,
  className = '',
}: {
  tone?: FeedbackTone
  icon?: 'lock' | 'refresh' | 'info' | 'warn' | 'ok'
  title: string
  children?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  const reduced = !!useReducedMotion()
  const color = TONE_COLOR[tone]
  const role = tone === 'ok' || tone === 'info' ? 'status' : 'alert'
  return (
    <motion.div
      role={role}
      initial={reduced ? false : { opacity: 0, y: -6 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border p-4 ${className}`}
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5"><ToneIcon tone={tone} kind={icon} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          {children && <div className="mt-1 text-sm text-white/80">{children}</div>}
          {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </motion.div>
  )
}

/** Toast de 5 segundos con barra de progreso, ícono y cierre manual. */
export function ErrorToast({
  open,
  tone = 'bad',
  icon,
  title,
  subtitle,
  action,
  durationMs = 5000,
  onClose,
}: {
  open: boolean
  tone?: FeedbackTone
  icon?: 'lock' | 'refresh' | 'info' | 'warn' | 'ok'
  title: string
  subtitle?: string
  action?: ReactNode
  durationMs?: number
  onClose: () => void
}) {
  const reduced = !!useReducedMotion()
  const color = TONE_COLOR[tone]

  useEffect(() => {
    if (!open || durationMs <= 0) return
    const timer = window.setTimeout(onClose, durationMs)
    return () => window.clearTimeout(timer)
  }, [open, durationMs, onClose, title, subtitle])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role={tone === 'ok' || tone === 'info' ? 'status' : 'alert'}
          initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: 8 }}
          transition={{ duration: 0.22 }}
          className="relative overflow-hidden rounded-xl border bg-grafito px-4 py-3 shadow-xl"
          style={{ borderColor: `color-mix(in srgb, ${color} 50%, transparent)` }}
        >
          <div className="flex items-center gap-3">
            <span style={{ color }}><ToneIcon tone={tone} kind={icon} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-blanco">{title}</p>
              {subtitle && <p className="text-xs text-white/70">{subtitle}</p>}
            </div>
            {action}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar aviso"
              className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-blanco"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {!reduced && durationMs > 0 && (
            <motion.div
              key={`${title}-${subtitle ?? ''}`}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: durationMs / 1000, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-0.5 w-full origin-left"
              style={{ backgroundColor: color }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
