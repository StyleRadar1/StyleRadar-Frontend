import { useState } from 'react'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import type { TryOnGarmentDto, ZonaPrenda } from '../types/tryon.dto'
import { garmentProblem } from '../utils/garments'

const ZONAS: [ZonaPrenda | 'TODAS', string][] = [['TODAS', 'Todas'], ['SUPERIOR', 'Parte de arriba'], ['INFERIOR', 'Parte de abajo']]

/** RF-24: galería de prendas; las agotadas o incompatibles se ven pero no se pueden elegir. */
export function GarmentSelector({ garments, loading, error, onRetry, selected, onSelect }: {
  garments: TryOnGarmentDto[]; loading: boolean; error: unknown; onRetry: () => void
  selected: string | null; onSelect: (id: string) => void
}) {
  const [zona, setZona] = useState<ZonaPrenda | 'TODAS'>('TODAS')
  if (loading) return <Loading label="Cargando prendas…" />
  if (error) return <ErrorState error={error} onRetry={onRetry} title="No pudimos cargar las prendas" />
  if (!garments.length) return <EmptyState title="Todavía no hay prendas para probar">Las tiendas aún no tienen prendas compatibles con el probador. Vuelve pronto.</EmptyState>
  const list = garments.filter((g) => zona === 'TODAS' || g.zona === zona)
  return (
    <div>
      <div role="group" aria-label="Filtrar por zona" className="flex flex-wrap gap-2">
        {ZONAS.map(([z, label]) => (
          <button
            key={z}
            type="button"
            aria-pressed={zona === z}
            onClick={() => setZona(z)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] ${
              zona === z
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] ring-2 ring-[var(--color-focus-ring)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Prendas para probar">
        {list.map((g) => {
          const problem = garmentProblem(g)
          const on = selected === g.id
          return (
            <li key={g.id}>
              <button
                type="button"
                disabled={!!problem}
                aria-pressed={on}
                onClick={() => onSelect(g.id)}
                aria-label={`${g.nombre}, ${g.tienda}${problem ? `, ${problem.toLowerCase()}` : ''}`}
                className={`group w-full overflow-hidden rounded-2xl border text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] ${
                  on
                    ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-focus-ring)] bg-[var(--color-surface)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <div className="relative aspect-[4/5] bg-[var(--color-surface-subtle)]">
                  <img src={g.imagen} alt="" loading="lazy" className="h-full w-full object-cover" />
                  {problem && (
                    <span className="absolute left-2 top-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-2 py-1 text-[11px] font-semibold text-[var(--color-text)] backdrop-blur-sm shadow-sm">
                      {problem}
                    </span>
                  )}
                  {on && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-2 py-1 text-[11px] font-bold text-[var(--color-accent-contrast,#ffffff)] shadow-sm">
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Elegida</span>
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{g.nombre}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{g.tienda} · Tallas {g.tallas.join(', ')}</p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
