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
          <button key={z} type="button" aria-pressed={zona === z} onClick={() => setZona(z)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${zona === z ? 'border-arena bg-arena text-grafito' : 'border-white/20'}`}>{label}</button>
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Prendas para probar">
        {list.map((g) => {
          const problem = garmentProblem(g)
          const on = selected === g.id
          return (
            <li key={g.id}>
              <button type="button" disabled={!!problem} aria-pressed={on} onClick={() => onSelect(g.id)}
                aria-label={`${g.nombre}, ${g.tienda}${problem ? `, ${problem.toLowerCase()}` : ''}`}
                className={`group w-full overflow-hidden rounded-2xl border text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena ${on ? 'border-arena ring-2 ring-arena' : 'border-white/10'} disabled:cursor-not-allowed disabled:opacity-50`}>
                <div className="relative aspect-[4/5] bg-arena">
                  <img src={g.imagen} alt="" loading="lazy" className="h-full w-full object-cover" />
                  {problem && <span className="absolute left-2 top-2 rounded-full bg-grafito/90 px-2 py-1 text-[11px] font-semibold">{problem}</span>}
                  {on && <span className="absolute right-2 top-2 rounded-full bg-arena px-2 py-1 text-[11px] font-bold text-grafito">Elegida</span>}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold">{g.nombre}</p>
                  <p className="text-xs text-white/60">{g.tienda} · Tallas {g.tallas.join(', ')}</p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
