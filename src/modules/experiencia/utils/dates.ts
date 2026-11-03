/** Fecha local en formato AAAA-MM-DD, desplazada n días desde hoy. */
export function isoDay(offset = 0, from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + offset)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
}

export const digitsToInt = (v: string) => parseInt(v.replace(/\D/g, ''), 10) || 0
