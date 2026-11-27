const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** «2025-03-04» → «marzo 2025». */
export function mesAnio(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  return y && m ? `${MESES[m - 1]} ${y}` : '—'
}

/** Fecha y hora de Bogotá para la auditoría: «2 mar 2026, 10:20 a. m.». Vacío o inválido → «—». */
export function fechaHora(iso?: string | null): string {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' })
}

/** Iniciales para el avatar: «Valentina Rojas» → «VR». */
export function iniciales(nombre: string): string {
  return nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

/** Quita tildes y mayúsculas para buscar. */
export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** SR-RF-01 y anexo D15: teléfono de 7 a 20 caracteres con dígitos, +, -, espacios y paréntesis. */
export const telefonoValido = (s: string) => {
  const t = s.trim()
  return t.length >= 7 && t.length <= 20 && /^[\d+\-\s()]+$/.test(t) && /\d/.test(t)
}

/** Celular colombiano: 10 dígitos que empiezan en 3, con o sin +57 y espacios. */
export const celularValido = (s: string) => /^(\+?57)?3\d{9}$/.test(s.replace(/[\s-]/g, ''))

export const correoValido = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())

/**
 * Compara dos correos electrónicos normalizando espacios y mayúsculas/minúsculas,
 * conservando subdirecciones con "+". Devuelve false si falta cualquiera de los dos.
 */
export function isSameAccount(a?: string | null, b?: string | null): boolean {
  const left = typeof a === 'string' ? a.trim().toLowerCase() : ''
  const right = typeof b === 'string' ? b.trim().toLowerCase() : ''
  return left !== '' && right !== '' && left === right
}
