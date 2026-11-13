import { Link } from 'react-router-dom'
import { formatCOP } from '@/modules/core/utils/format'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { tiendaContacto } from '@/modules/soporte/utils/contacts'
import type { ItemResponseDto } from '../types/item.dto'

const MAIN_PHOTO_MASK_STYLE: React.CSSProperties = {
  maskImage:
    'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
  WebkitMaskImage:
    'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
}

export function ItemCard({ item }: { item: ItemResponseDto }) {
  return (
    <div className="relative h-full">
      <Link
        to={`/catalogo/${item.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm transition duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      >
        {/* Recuadro de foto con aspect-ratio 3/4 unificado y overflow-hidden sin línea divisoria */}
        <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-t-2xl">
          {/* Fondo uniforme: copia de la misma foto con blur fuerte (32px), scale 1.4, saturate 1.15 y opacidad 1 */}
          <img
            src={item.imagen}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute inset-0 h-full w-full scale-[1.4] object-cover opacity-100 blur-[32px] saturate-[1.15]"
          />
          {/* Foto principal completa (object-contain) con máscara de degradado en los 4 bordes para fundirse con el fondo */}
          <img
            src={item.imagen}
            alt={item.nombre}
            loading="lazy"
            decoding="async"
            style={MAIN_PHOTO_MASK_STYLE}
            className="relative z-10 h-full w-full object-contain transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.03]"
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
