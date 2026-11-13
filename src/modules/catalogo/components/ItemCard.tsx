import { Link } from 'react-router-dom'
import { formatCOP } from '@/modules/core/utils/format'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { tiendaContacto } from '@/modules/soporte/utils/contacts'
import type { ItemResponseDto } from '../types/item.dto'

export function ItemCard({ item }: { item: ItemResponseDto }) {
  return (
    <div className="relative h-full">
      <Link
        to={`/catalogo/${item.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm transition duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      >
        {/* Contenedor de foto con aspect-ratio fijo 4/5 y altura máxima acotada en desktop (~220-240px) */}
        <div className="relative aspect-[4/5] max-h-[230px] w-full shrink-0 overflow-hidden bg-[var(--color-surface-raised,var(--color-surface))]">
          {/* Fondo difuminado (blur ~20px, scale ~1.2, baja opacidad) sobre token del tema para rellenar bandas laterales armónicamente */}
          <img
            src={item.imagen}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-[20px]"
          />
          {/* Imagen principal completa sin recorte (object-contain) */}
          <img
            src={item.imagen}
            alt={item.nombre}
            loading="lazy"
            decoding="async"
            className="relative z-10 h-full w-full object-contain p-1.5 transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.03]"
          />
        </div>

        {/* Información compacta con padding reducido y espacio lateral para el botón flotante */}
        <div className="flex flex-1 flex-col justify-between p-3.5 pb-3.5 pr-13">
          <div>
            <p className="line-clamp-1 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--color-accent)]">
              {item.estilo} · {item.tienda}
            </p>
            <h3
              className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]"
              title={item.nombre}
            >
              {item.nombre}
            </h3>
          </div>
          <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-1.5 gap-y-0.5 text-xs text-[var(--color-text-muted)]">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              {formatCOP(item.precio)}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              a {item.distanciaKm.toLocaleString('es-CO')} km
            </span>
          </div>
        </div>
      </Link>
      {/* RF-73: escribirle a la tienda desde cualquier prenda. Va fuera del enlace para no anidar elementos interactivos */}
      <ContactButton
        icon
        className="absolute bottom-3 right-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        label={`Escribir a ${item.tienda} sobre ${item.nombre}`}
        contacto={tiendaContacto(item.tienda)}
        asunto={item.nombre}
        referenciaId={item.id}
      />
    </div>
  )
}
