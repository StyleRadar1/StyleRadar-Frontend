import { extractStockMapFromInventory } from '../services/itemService'

const ORDEN = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

/** Orden natural de tallas: XS, S, M, L, XL… y las numéricas de menor a mayor; lo desconocido va al final, sin moverse entre sí. */
export function ordenarTallas(tallas: string[]): string[] {
  const rango = (t: string) => {
    const i = ORDEN.indexOf(t.trim().toUpperCase())
    return i >= 0 ? i : Number.isFinite(Number(t)) ? 100 + Number(t) : 1000
  }
  return [...tallas].sort((a, b) => rango(a) - rango(b))
}

/** Mismo mapa { talla → unidades } con las tallas en orden natural, para que no salten de lugar al subir o bajar el stock. */
export function ordenarStockPorTalla(stock: Record<string, number>): Record<string, number> {
  return Object.fromEntries(ordenarTallas(Object.keys(stock)).map((t) => [t, stock[t]]))
}

/**
 * Tallas de una prenda a partir de lo que dice el inventario: las que tienen stock y las que se agotaron.
 * Catálogo solo lista las que tienen stock; las agotadas se siguen mostrando para poder pedir el aviso «avísame cuando llegue».
 */
export function tallasDeInventario(inv: unknown): { conStock: string[]; sinStock: string[] } {
  const filas = Object.entries(extractStockMapFromInventory(inv))
  return {
    conStock: filas.filter(([, q]) => q > 0).map(([t]) => t),
    sinStock: filas.filter(([, q]) => q <= 0).map(([t]) => t),
  }
}
