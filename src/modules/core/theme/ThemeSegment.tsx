import { TEMAS, TEMA_LABEL } from './tema'
import { useTema } from './useTema'
import { executeThemeTransition } from './themeTransition'

/** Tema dentro del menú de cuenta: tres opciones a la vista en lugar de un select. */
export function ThemeSegment({ onPick }: { onPick?: () => void }) {
  const { tema, setTema } = useTema()
  return (
    <div role="group" aria-label="Tema" className="px-3 pb-2 pt-1">
      <p aria-hidden="true" className="pb-2 text-[10.5px] font-bold uppercase tracking-[.16em] text-[var(--sr-text-muted)]">Tema</p>
      <div className="flex rounded-lg border border-[var(--sr-border-subtle)] bg-[var(--sr-bg-2,var(--color-surface-muted))] p-0.5">
        {TEMAS.map((t) => (
          <button
            key={t}
            type="button"
            role="menuitemradio"
            aria-checked={tema === t}
            onClick={(e) => {
              executeThemeTransition(() => {
                setTema(t)
                onPick?.()
              }, e.currentTarget)
            }}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${tema === t ? 'bg-[var(--sr-accent)] text-[var(--sr-text-on-accent)] shadow-xs' : 'text-[var(--sr-text-secondary)] hover:bg-[var(--sr-surface)] hover:text-[var(--sr-text-primary)]'}`}
          >
            {TEMA_LABEL[t]}
          </button>
        ))}
      </div>
    </div>
  )
}
