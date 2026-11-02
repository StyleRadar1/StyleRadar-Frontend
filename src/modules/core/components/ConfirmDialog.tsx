import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Diálogo de confirmación accesible: atrapa el foco, cierra con Escape y lo devuelve al cerrar. */
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = 'Cancelar', danger, busy, onConfirm, onCancel }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const focusables = () => [...(box.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea') ?? [])].filter((el) => !el.hasAttribute('disabled'))
    focusables()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) { e.preventDefault(); onCancel() }
      if (e.key === 'Tab') {
        const els = focusables(); if (!els.length) return
        const first = els[0], last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [open, busy, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel() }}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-md rounded-2xl border border-white/15 bg-grafito p-6 shadow-2xl">
        <h2 id={titleId} className="text-xl font-bold">{title}</h2>
        {children && <div className="mt-2 text-sm text-white/75">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={busy}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${danger ? 'bg-[#c0392b]' : 'bg-violeta'} disabled:opacity-60`}>
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
