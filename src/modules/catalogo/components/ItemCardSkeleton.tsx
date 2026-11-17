/**
 * Esqueleto de tarjeta de prenda para carga fluida (CLS = 0)
 * Mantiene la misma relación de aspecto 3:4 que ItemCard
 */
export function ItemCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm animate-pulse"
      aria-hidden="true"
    >
      {/* Aspect-ratio 3:4 idéntico al recuadro de foto */}
      <div className="aspect-[3/4] w-full bg-[var(--color-surface-raised)]/60" />

      {/* Información compacta */}
      <div className="flex flex-1 flex-col justify-between p-3.5 pb-3.5 pr-12 space-y-3">
        <div>
          {/* Estilo y tienda */}
          <div className="h-2.5 w-24 rounded-full bg-[var(--color-surface-raised)]" />
          {/* Nombre de la prenda */}
          <div className="mt-2 h-3.5 w-4/5 rounded bg-[var(--color-surface-raised)]" />
          <div className="mt-1 h-3.5 w-1/2 rounded bg-[var(--color-surface-raised)]" />
        </div>

        {/* Precio y distancia */}
        <div className="mt-2 flex items-baseline justify-between">
          <div className="h-4 w-20 rounded bg-[var(--color-surface-raised)]" />
          <div className="h-2.5 w-14 rounded bg-[var(--color-surface-raised)]" />
        </div>
      </div>
    </div>
  )
}

export function ItemGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  )
}
