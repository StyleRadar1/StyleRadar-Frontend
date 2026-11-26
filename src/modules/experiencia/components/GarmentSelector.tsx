import { useState } from 'react'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import type { GarmentValidationResponseDto, TryOnGarmentDto, ZonaPrenda } from '../types/tryon.dto'
import { garmentProblem } from '../utils/garments'

const ZONAS: [ZonaPrenda | 'TODAS', string][] = [
  ['TODAS', 'Todas'],
  ['SUPERIOR', 'Parte de arriba'],
  ['INFERIOR', 'Parte de abajo'],
  ['CUERPO_COMPLETO', 'Cuerpo completo'],
]

/** RF-24: galería de prendas, selección de talla y validación de ajuste antropométrico. */
export function GarmentSelector({
  garments,
  loading,
  error,
  onRetry,
  selected,
  onSelect,
  selectedSize,
  onSelectSize,
  validation,
  validatingSize = false,
  zoneNotice,
}: {
  garments: TryOnGarmentDto[]
  loading: boolean
  error: unknown
  onRetry: () => void
  selected: string | null
  onSelect: (id: string) => void
  selectedSize?: string | null
  onSelectSize?: (size: string) => void
  validation?: GarmentValidationResponseDto | null
  validatingSize?: boolean
  zoneNotice?: string | null
}) {
  const [zona, setZona] = useState<ZonaPrenda | 'TODAS'>('TODAS')

  if (loading) return <Loading label="Cargando prendas…" />
  if (error) return <ErrorState error={error} onRetry={onRetry} title="No pudimos cargar las prendas" />
  if (!garments.length) return <EmptyState title="Todavía no hay prendas para probar">Las tiendas aún no tienen prendas compatibles con el probador. Vuelve pronto.</EmptyState>

  const list = garments.filter((g) => zona === 'TODAS' || g.zona === zona)
  const selectedGarment = garments.find((g) => g.id === selected)

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
                    ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-focus-ring)] bg-[var(--color-surface)] shadow-md'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <div className="relative aspect-[4/5] bg-[var(--color-surface-subtle)]">
                  <img
                    src={g.imagen || '/img/productos/blazer-oversize.jpg'}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget
                      if (!target.src.endsWith('/img/productos/blazer-oversize.jpg')) {
                        target.src = '/img/productos/blazer-oversize.jpg'
                      }
                    }}
                  />
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

      {/* Selector de talla y validación de compatibilidad anatómica (RF-24) */}
      {selectedGarment && (
        <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-sm" aria-label="Talla y compatibilidad de la prenda">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">Talla para la prueba virtual</p>
              <h3 className="text-sm font-bold text-[var(--color-text)]">Elige tu talla en «{selectedGarment.nombre}»</h3>
            </div>
            {selectedGarment.tallas.length > 0 && (
              <div role="group" aria-label="Tallas disponibles" className="flex flex-wrap gap-1.5">
                {selectedGarment.tallas.map((t) => {
                  const isSizeActive = selectedSize === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onSelectSize?.(t)}
                      aria-pressed={isSizeActive}
                      className={`min-w-9 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] ${
                        isSizeActive
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] shadow-sm'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-accent)]'
                      }`}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Aviso de reemplazo por conflicto de zona corporal (RF-24) */}
          {zoneNotice && (
            <p role="status" className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs text-[var(--color-text)]">
              {zoneNotice}
            </p>
          )}

          {/* Semáforo orientativo de compatibilidad RF-24 (no bloqueante) */}
          {validatingSize ? (
            <p className="mt-3 text-xs text-[var(--color-text-muted)] animate-pulse">Comprobando compatibilidad de medidas con la prenda…</p>
          ) : validation ? (
            (() => {
              const noData = validation.sizeEligible === null || validation.sizeEligible === undefined
              const warn = validation.sizeEligible === false
              const tone = noData
                ? 'border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]'
                : warn
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
              const icon = noData ? '⚪' : warn ? '🟢' === '🟢' && '🟡' : '🟢'
              const msg = noData
                ? validation.fitMessage || 'No hay medidas suficientes para evaluar el ajuste de esta talla.'
                : warn
                  ? validation.fitMessage || 'La talla seleccionada podría no ajustarse a tus medidas.'
                  : validation.fitMessage || validation.validationMessage || 'Ajuste aproximado adecuado para tus medidas corporales.'
              return (
                <div role="status" className={`mt-3 rounded-xl border p-3 text-xs ${tone}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-base" aria-hidden="true">{icon}</span>
                    <div>
                      <p className="font-semibold">{msg}</p>
                      <p className="mt-0.5 text-[11px] opacity-80">
                        Ajuste orientativo según tus medidas corporales registradas. No garantiza ajuste físico exacto.
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()
          ) : null}
        </div>
      )}
    </div>
  )
}
