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
