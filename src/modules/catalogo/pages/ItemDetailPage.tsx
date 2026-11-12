import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Badge } from '@/modules/core/design-system'
import { Loading, ErrorState } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { useResource } from '@/modules/core/hooks/useResource'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { tiendaContacto } from '@/modules/soporte/utils/contacts'
import { ItemCard } from '../components/ItemCard'
import { itemService } from '../services/itemService'
import type { ItemResponseDto } from '../types/item.dto'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tallaSeleccionada, setTallaSeleccionada] = useState<string>('')
  const [guardado, setGuardado] = useState(false)
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null)

  // Carga de la prenda principal
  const loader = useCallback(async () => {
    if (!id) throw new Error('ID de prenda no especificado.')
    const prenda = await itemService.getById(id)
    const similares = await itemService.search({ estilo: prenda.estilo })
    return {
      prenda,
      similares: similares.filter((x) => x.id !== prenda.id).slice(0, 4),
    }
  }, [id])

  const { data, loading, error, reload } = useResource<{
    prenda: ItemResponseDto | null
    similares: ItemResponseDto[]
  }>(loader, { prenda: null, similares: [] })

  const prenda = data.prenda
  const similares = data.similares

  const handleGuardar = () => {
    setGuardado((prev) => !prev)
    setMensajeFeedback(guardado ? 'Prenda retirada de tu wishlist.' : '¡Prenda guardada en tu wishlist!')
    setTimeout(() => setMensajeFeedback(null), 3000)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 text-[var(--color-text)]">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-[var(--color-text-muted)]" aria-label="Migas de pan">
        <Link to="/catalogo" className="hover:text-[var(--color-text)]">Catálogo</Link>
        <span>/</span>
        {prenda && (
          <>
            <Link to={`/catalogo?estilo=${prenda.estilo}`} className="hover:text-[var(--color-text)]">
              {prenda.estilo}
            </Link>
            <span>/</span>
            <span className="truncate text-[var(--color-text)]">{prenda.nombre}</span>
          </>
        )}
      </nav>

      {/* Estados */}
      {loading && <Loading label="Cargando detalles de la prenda..." />}

      {!!error && (
        <ErrorState
          error={error}
          onRetry={reload}
          title="No se pudo encontrar la prenda"
        />
      )}

      {mensajeFeedback && (
        <div role="status" className="mb-6 rounded-xl border border-[var(--color-success-border,rgba(16,185,129,0.3))] bg-[var(--color-success-bg,rgba(16,185,129,0.1))] p-3.5 text-xs text-[var(--color-success-text,#10b981)] flex items-center gap-2 shadow-sm">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{mensajeFeedback}</span>
        </div>
      )}

      {prenda && (
        <div className="space-y-16">
          {/* Ficha Principal de la Prenda */}
          <div className="grid gap-10 md:grid-cols-2 lg:gap-14">
            {/* Columna Izquierda: Imagen Editorial 4:5 */}
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
              <img
                src={prenda.imagen}
                alt={prenda.nombre}
                className="h-full w-full object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLElement).style.display = 'none'
                }}
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <Badge tone="arena">{prenda.estilo}</Badge>
                <span className="rounded-full bg-[var(--color-overlay,rgba(0,0,0,0.6))] px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  {prenda.tipo}
                </span>
              </div>
            </div>

            {/* Columna Derecha: Información y Acciones (RF-16, 22, 57) */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-accent)]">
                  <span>{prenda.tienda}</span>
                  <span>·</span>
                  <span>{prenda.barrio}</span>
                  <span>·</span>
                  <span className="text-[var(--color-text-muted)]">A {prenda.distanciaKm} km de ti</span>
                </div>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] md:text-4xl">
                  {prenda.nombre}
                </h1>

                <p className="mt-4 text-3xl font-extrabold text-[var(--color-accent)]">
                  {formatCOP(prenda.precio)}
                </p>

                {/* Disponibilidad en tienda (RF-22) */}
                <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs text-[var(--color-text)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success-bg,rgba(16,185,129,0.15))] border border-[var(--color-success-border,rgba(16,185,129,0.3))] px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-success-text,#10b981)]">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                      Disponible hoy
                    </span>
                    <span className="font-semibold text-[var(--color-text)]">Disponibilidad en tienda real (RF-22)</span>
                  </div>
                  <p className="mt-1 text-[var(--color-text-muted)]">
                    Disponible hoy para entrega o retiro inmediato en <strong>{prenda.tienda}</strong> ({prenda.barrio}).
                  </p>
                  {/* RF-73: escribirle a la tienda por chat (reemplaza «Llamar») */}
                  <ContactButton className="mt-3" label="Enviar mensaje a la tienda" contacto={tiendaContacto(prenda.tienda)} asunto={prenda.nombre} referenciaId={prenda.id} />
                </div>

                {/* Selector de tallas interactivas */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text)]">
                    <span>Selecciona tu talla:</span>
                    {tallaSeleccionada && (
                      <span className="text-[var(--color-accent)] font-bold">Talla elegida: {tallaSeleccionada}</span>
                    )}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Tallas disponibles">
                    {prenda.tallas.map((talla) => (
                      <button
                        key={talla}
                        type="button"
                        role="radio"
                        aria-checked={tallaSeleccionada === talla}
                        onClick={() => setTallaSeleccionada(talla)}
                        className={`h-11 min-w-[44px] rounded-xl border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                          tallaSeleccionada === talla
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-text-on-accent)] shadow-md scale-105'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]'
                        }`}
                      >
                        {talla}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Atributos adicionales */}
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                    <span className="text-[var(--color-text-muted)]">Color</span>
                    <p className="font-semibold text-[var(--color-text)]">{prenda.color}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                    <span className="text-[var(--color-text-muted)]">Estilo urbano</span>
                    <p className="font-semibold text-[var(--color-text)]">{prenda.estilo}</p>
                  </div>
                </div>
              </div>

              {/* Botones de acción principales (RF-57) */}
              <div className="mt-8 flex flex-col gap-3 pt-6 border-t border-[var(--color-border)] sm:flex-row">
                <Link
                  to={`/probador?prenda=${prenda.id}${tallaSeleccionada ? `&talla=${tallaSeleccionada}` : ''}`}
                  className="flex-1"
                >
                  <Button variant="primario" className="w-full">
                    ✨ Probarme esta prenda en el probador
                  </Button>
                </Link>

                <Button
                  variant={guardado ? 'arena' : 'secundario'}
                  onClick={handleGuardar}
                  className="px-5"
                >
                  {guardado ? '★ Guardada' : '☆ Guardar look'}
                </Button>
              </div>
            </div>
          </div>

          {/* Sección de Prendas Similares (RF-16) */}
          {similares.length > 0 && (
            <div className="border-t border-[var(--color-border)] pt-12">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">RF-16</span>
                  <h2 className="mt-1 text-2xl font-bold text-[var(--color-text)]">Prendas similares de estilo {prenda.estilo}</h2>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Otras opciones disponibles en almacenes de Bogotá con estética compatible.
                  </p>
                </div>
                <Link to={`/catalogo?estilo=${prenda.estilo}`} className="text-xs font-semibold text-[var(--color-accent)] hover:underline">
                  Ver todas →
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {similares.map((sim) => (
                  <ItemCard key={sim.id} item={sim} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
