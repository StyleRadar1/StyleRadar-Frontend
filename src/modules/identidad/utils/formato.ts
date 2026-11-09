const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** «2025-03-04» → «marzo 2025». */
export function mesAnio(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  return y && m ? `${MESES[m - 1]} ${y}` : '—'
}

/** Iniciales para el avatar: «Valentina Rojas» → «VR». */
export function iniciales(nombre: string): string {
  return nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

/** Quita tildes y mayúsculas para buscar. */
export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Celular colombiano: 10 dígitos que empiezan en 3, con o sin +57 y espacios. */
export const celularValido = (s: string) => /^(\+?57)?3\d{9}$/.test(s.replace(/[\s-]/g, ''))

export const correoValido = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
