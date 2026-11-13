import { Link } from 'react-router-dom'
import { formatCOP } from '@/modules/core/utils/format'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { tiendaContacto } from '@/modules/soporte/utils/contacts'
import { getStoreIdByName } from '../services/storePublicService'
import type { ItemResponseDto } from '../types/item.dto'

export function ItemCard({ item }: { item: ItemResponseDto }) {
  const storeId = getStoreIdByName(item.tienda)

  return (
    <div className="group relative block h-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition hover:-translate-y-1 hover:border-[var(--color-accent)] shadow-sm hover:shadow-md">
      <Link
        to={`/catalogo/${item.id}`}
        className="block aspect-[4/5] overflow-hidden bg-[var(--color-surface-raised,var(--color-surface))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      >
        <img
          src={item.imagen}
          alt={item.nombre}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="p-4 pr-16">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.16em]">
          <span className="text-[var(--color-accent)]">{item.estilo}</span>
          <span className="text-[var(--color-text-muted)]">·</span>
          <Link
            to={`/tiendas/${storeId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-focus-ring)] rounded"
            title={`Ver tienda ${item.tienda}`}
          >
            {item.tienda} →
          </Link>
        </div>
        <h3 className="mt-1 font-semibold text-[var(--color-text)]">
          <Link
            to={`/catalogo/${item.id}`}
            className="hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-focus-ring)] rounded"
          >
            {item.nombre}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 text-sm text-[var(--color-text-muted)]">
          <span className="font-semibold text-[var(--color-text)]">{formatCOP(item.precio)}</span>
          <span>a {item.distanciaKm.toLocaleString('es-CO')} km</span>
        </div>
      </div>
      {/* RF-73: escribirle a la tienda desde cualquier prenda. Va fuera del enlace para no anidar elementos interactivos */}
      <ContactButton
        icon
        className="absolute bottom-4 right-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        label={`Escribir a ${item.tienda} sobre ${item.nombre}`}
        contacto={tiendaContacto(item.tienda)}
        asunto={item.nombre}
        referenciaId={item.id}
      />
    </div>
  )
}
