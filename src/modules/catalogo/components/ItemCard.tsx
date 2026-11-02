import { Link } from 'react-router-dom'
import { formatCOP } from '@/modules/core/utils/format'
import type { ItemResponseDto } from '../types/item.dto'

export function ItemCard({ item }: { item: ItemResponseDto }) {
  return (
    <Link to={`/catalogo/${item.id}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] transition hover:-translate-y-1 hover:border-violeta-claro/60">
      <div className="aspect-[4/5] overflow-hidden bg-arena">
        <img src={item.imagen} alt={item.nombre} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">{item.estilo} · {item.tienda}</p>
        <h3 className="mt-1 font-semibold">{item.nombre}</h3>
        <div className="mt-2 flex items-center justify-between text-sm text-white/70">
          <span className="font-semibold text-blanco">{formatCOP(item.precio)}</span>
          <span>a {item.distanciaKm.toLocaleString('es-CO')} km</span>
        </div>
      </div>
    </Link>
  )
}
