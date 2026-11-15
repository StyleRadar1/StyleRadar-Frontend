import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { Toast, Tono } from './hooks'
import './errores.css'

const COLOR: Record<Tono, string> = {
  error: 'var(--sr-bad)',
  aviso: 'var(--sr-warn)',
  info: 'var(--sr-info)',
  ok: 'var(--sr-ok)',
}
const ICONO: Record<Tono, string> = { error: '!', aviso: '!', info: 'i', ok: '✓' }

/**
 * Error debajo de un campo. Tiembla una vez al aparecer.
 * Úsalo con el input: aria-invalid y aria-describedby={`${id}-err`}.
 */
export function ErrorCampo({ id, children }: { id: string; children: ReactNode }) {
  const quieto = useReducedMotion()
  return (
    <motion.p
      id={`${id}-err`} role="alert"
      className="flex items-start gap-1.5 text-xs text-[var(--sr-bad)]"
      initial={quieto ? false : { x: 0, opacity: 0, y: -3 }}
      animate={quieto ? undefined : { x: [0, -4, 4, -2, 0], opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <span aria-hidden="true" className="mt-px grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-[var(--sr-bad)] text-[9px] font-bold text-[var(--sr-bg)]">!</span>
      <span>{children}</span>
    </motion.p>
  )
}

/** Aviso dentro de la pantalla (409, 422 de reglas, sin resultados…). */
export function Aviso({ tono = 'aviso', titulo, children, accion }: { tono?: Tono; titulo: string; children?: ReactNode; accion?: ReactNode }) {
  const quieto = useReducedMotion()
  return (
    <motion.div
      role={tono === 'error' ? 'alert' : 'status'}
      className="flex gap-3 rounded-xl border p-4"
      style={{ borderColor: `color-mix(in srgb, ${COLOR[tono]} 45%, transparent)`, background: `color-mix(in srgb, ${COLOR[tono]} 9%, var(--sr-bg-2))` }}
      initial={quieto ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-[var(--sr-bg)]" style={{ background: COLOR[tono] }}>{ICONO[tono]}</span>
      <div className="grid gap-1">
        <p className="text-sm font-semibold text-[var(--sr-tx)]">{titulo}</p>
        {children && <div className="text-xs leading-relaxed text-[var(--sr-tx-2)]">{children}</div>}
        {accion && <div className="mt-2 flex flex-wrap gap-2">{accion}</div>}
      </div>
    </motion.div>
  )
}

/** Zona de toasts abajo a la derecha. Los lectores de pantalla los anuncian. */
export function Toasts({ items, quitar, duracion = 5000 }: { items: Toast[]; quitar: (id: number) => void; duracion?: number }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 grid w-[min(360px,calc(100vw-32px))] gap-2">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id} layout
            role={t.tono === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto relative overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--sr-tx)_12%,transparent)] bg-[var(--sr-bg-2)] p-3.5 pr-10 shadow-[0_16px_30px_-12px_var(--sr-sombra)]"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--sr-tx)]">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: COLOR[t.tono] }} />{t.titulo}
            </p>
            {t.texto && <p className="mt-1 text-xs text-[var(--sr-tx-2)]">{t.texto}</p>}
            {t.accion && (
              <button type="button" onClick={() => { t.accion?.onClick(); quitar(t.id) }}
                className="mt-2 text-xs font-bold uppercase tracking-wider text-[var(--sr-acc-tx)] underline underline-offset-2">
                {t.accion.label}
              </button>
            )}
            <button type="button" aria-label="Cerrar aviso" onClick={() => quitar(t.id)}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg text-[var(--sr-tx-2)] hover:bg-[color-mix(in_srgb,var(--sr-tx)_8%,transparent)]">×</button>
            <span aria-hidden="true" className="sr-toast-barra absolute bottom-0 left-0 h-0.5 w-full" style={{ background: COLOR[t.tono], ['--dur' as string]: `${duracion}ms` }} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
