/** Colores, medidas y utilidades de los gráficos de estadísticas. Orden fijo de categorías, validado para daltonismo: arena → violeta claro → lavanda → blanco. */
export const SERIE = ['var(--color-arena)', 'var(--color-violeta-claro)', 'var(--color-lavanda)', 'var(--color-blanco)'] as const
/** Textura de cada posición (las dos últimas son claras y se confunden sin ella). */
export const TEXTURA = [null, null, 'diag', 'cruz'] as const

export const card = 'sr-verdelo-panel rounded-2xl border border-white/10 bg-white/[.03] p-5'
export const kicker = 'text-[11px] font-bold uppercase tracking-[.16em] text-lavanda'
export const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0)
/** Tope «redondo» del eje para que las marcas sean números enteros. */
export const tope = (max: number) => {
  if (max <= 0) return 10
  const paso = 10 ** Math.floor(Math.log10(max))
  return Math.ceil(max / paso) * paso
}

/* ─── Exportar a Excel: CSV con «;» y BOM para que Excel en español lo abra con tildes ─── */

export function descargarCsv(nombreArchivo: string, filas: (string | number)[][]) {
  const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${nombreArchivo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
