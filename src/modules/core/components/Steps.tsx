/** Indicador de pasos de un asistente (wizard). */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label={`Paso ${current + 1} de ${steps.length}`}>
      {steps.map((s, i) => (
        <li
          key={s}
          aria-current={i === current ? 'step' : undefined}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            i === current
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] ring-2 ring-[var(--color-focus-ring)] shadow-sm'
              : i < current
                ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                : 'border-[var(--color-border-subtle,rgba(255,255,255,0.15))] bg-transparent text-[var(--color-text-muted)]'
          }`}
        >
          <span
            aria-hidden="true"
            className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${
              i === current
                ? 'bg-[var(--color-surface)] text-[var(--color-text)]'
                : i < current
                  ? 'bg-[var(--color-success-bg,rgba(30,107,58,0.2))] text-[var(--color-success-text,#144a27)]'
                  : 'bg-[var(--color-surface-subtle,rgba(0,0,0,0.15))] text-[var(--color-text-muted)]'
            }`}
          >
            {i < current ? '✓' : i + 1}
          </span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  )
}
