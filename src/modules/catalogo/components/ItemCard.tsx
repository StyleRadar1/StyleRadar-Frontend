import { Link } from 'react-router-dom'
import { formatCOP } from '@/modules/core/utils/format'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { nitDeTienda, tiendaContacto } from '@/modules/soporte/utils/contacts'
import { getStoreIdByName } from '../services/storePublicService'
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
  const storeName = item.tienda || item.marca || ''
  const storeId = getStoreIdByName(storeName)
  const imgPrincipal = item.imagen || item.fotografias?.[0] || ''

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm transition duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-md">
      {/* Recuadro de foto con aspect-ratio 3/4 unificado y overflow-hidden sin línea divisoria */}
      <Link
        to={`/catalogo/${item.id}`}
        className="relative block aspect-[3/4] w-full shrink-0 overflow-hidden rounded-t-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      >
        {/* Fondo uniforme: copia de la misma foto con blur fuerte (32px), scale 1.4, saturate 1.15 y opacidad 1 */}
        {imgPrincipal && (
          <img
            src={imgPrincipal}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute inset-0 h-full w-full scale-[1.4] object-cover opacity-100 blur-[32px] saturate-[1.15]"
          />
        )}
        {/* Foto principal completa (object-contain) con máscara de degradado en los 4 bordes para fundirse con el fondo */}
        <img
          src={imgPrincipal}
          alt={item.nombre}
          loading="lazy"
          decoding="async"
          style={MAIN_PHOTO_MASK_STYLE}
          className="relative z-10 h-full w-full object-contain transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.03]"
        />

        {/* Badges superiores (Nuevo, Circular) */}
        <div className="absolute left-2.5 top-2.5 z-30 flex flex-col items-start gap-1">
          {item.esNuevo && (
            <span className="rounded-md bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
              Nuevo
            </span>
          )}
          {item.esSegundaMano && (
            <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
              Segunda mano
            </span>
          )}
        </div>
      </Link>

      {/* Información compacta con padding reducido */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <div className="flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-[.14em]">
            <span className="text-[var(--color-accent)]">{item.estilo}</span>
            {storeName && (
              <>
                <span className="text-[var(--color-text-muted)]">·</span>
                <Link
                  to={`/tiendas/${item.almacenId || storeId}`}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-focus-ring)] rounded"
                  title={`Ver tienda ${storeName}`}
                >
                  {storeName} →
                </Link>
              </>
            )}
          </div>
          <h3 className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-[var(--color-text)]">
            <Link
              to={`/catalogo/${item.id}`}
              className="transition-colors hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-focus-ring)] rounded"
              title={item.nombre}
            >
              {item.nombre}
            </Link>
          </h3>

          {/* Variantes de color disponibles (swatches sutiles estilo Stradivarius) */}
          {item.coloresDisponibles && item.coloresDisponibles.length > 1 && (
            <div className="mt-1.5 flex items-center gap-1">
              {item.coloresDisponibles.slice(0, 3).map((col) => (
                <span
                  key={col}
                  title={`Disponible en ${col}`}
                  className="inline-block h-2 w-2 rounded-full border border-[var(--color-border)] bg-[var(--color-text-muted)]/40"
                />
              ))}
              {item.coloresDisponibles.length > 3 && (
                <span className="text-[9px] text-[var(--color-text-muted)] font-medium">
                  +{item.coloresDisponibles.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-1.5 gap-y-0.5 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              {formatCOP(item.precio)}
            </span>
          </div>
          {item.distanciaKm > 0 && (
            <span className="text-[0.6875rem] text-[var(--color-text-muted)]">
              a {item.distanciaKm.toLocaleString('es-CO', { maximumFractionDigits: 2 })} km
            </span>
          )}
        </div>

        {/* Acciones de la prenda: Probar en el maniquí (RF-7.2) y Escribir a la tienda */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]/40">
          <Link
            to={`/probador/arma-tu-look?prenda=${item.id}&talla=${item.tallas?.[0] || 'M'}&color=${encodeURIComponent(item.color || 'default')}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition py-1"
            title="Probar en el maniquí"
            aria-label={`Probar ${item.nombre} en el maniquí`}
          >
            <span></span>
            <span>Probar en el maniquí</span>
          </Link>

          <ContactButton
            icon
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            label={`Escribir a ${storeName || 'la tienda'} sobre ${item.nombre}`}
            contacto={tiendaContacto(storeName || 'Tienda')}
            nit={nitDeTienda(item)}
            asunto={item.nombre}
            referenciaId={item.id}
          />
        </div>
      </div>
    </div>
  )
}
