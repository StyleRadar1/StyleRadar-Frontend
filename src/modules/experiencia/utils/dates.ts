/** Fecha local en formato AAAA-MM-DD, desplazada n días desde hoy. */
export function isoDay(offset = 0, from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + offset)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function formatDay(valor: string | null | undefined): string {
  if (!valor) return 'sin fecha'
  const soloDia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim())
  const fecha = soloDia ? new Date(Number(soloDia[1]), Number(soloDia[2]) - 1, Number(soloDia[3])) : new Date(valor)
  if (Number.isNaN(fecha.getTime())) return 'sin fecha'
  return fecha.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
}

export const digitsToInt = (v: string) => parseInt(v.replace(/\D/g, ''), 10) || 0
