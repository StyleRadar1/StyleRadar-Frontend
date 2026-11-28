import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  confirmDisabled?: boolean
  /** Modal ancho para formularios largos (crear/editar prenda). */
  wide?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Diálogo de confirmación accesible: atrapa el foco, cierra con Escape y lo devuelve al cerrar. */
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = 'Cancelar', danger, busy, confirmDisabled, wide, onConfirm, onCancel }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const dialogId = useId()
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const focusables = () => [...(box.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea') ?? [])].filter((el) => !el.hasAttribute('disabled'))
    focusables()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) { e.preventDefault(); onCancelRef.current() }
      if (e.key === 'Tab') {
        const els = focusables(); if (!els.length) return
        const first = els[0], last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (prev && prev.isConnected) prev.focus?.()
    }
  }, [open, busy])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[300] grid place-items-center bg-[var(--overlay,rgba(0,0,0,0.6))] p-4 backdrop-blur-xs" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel() }}>
      <div id={dialogId} ref={box} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`w-full ${wide ? 'max-w-5xl max-h-[90vh] flex flex-col' : 'max-w-md'} rounded-2xl border border-[var(--sr-border-subtle)] bg-[var(--sr-surface-raised)] p-6 text-[var(--sr-text-primary)] shadow-2xl`}>
        <h2 id={titleId} className="text-xl font-bold text-[var(--sr-text-primary)]">{title}</h2>
        {children && <div className={`mt-2 text-sm text-[var(--sr-text-secondary)] ${wide ? 'min-h-0 flex-1 overflow-y-auto pr-2' : ''}`}>{children}</div>}
        <div className="mt-6 flex shrink-0 justify-end gap-2">
          <button type="button" data-testid="confirm-dialog-cancel" onClick={onCancel} disabled={busy} className="rounded-xl border border-[var(--sr-border-control)] px-4 py-2 text-sm font-semibold text-[var(--sr-text-primary)] hover:bg-[var(--sr-surface)]">{cancelLabel}</button>
          <button type="button" data-testid="confirm-dialog-confirm" onClick={onConfirm} disabled={busy || confirmDisabled}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-[var(--sr-text-on-accent)] ${danger ? 'bg-[var(--sr-bad)]' : 'bg-[var(--sr-accent)]'} disabled:opacity-60`}>
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
