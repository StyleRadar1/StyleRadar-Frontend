/**
 * Formatea YYYY-MM-DD en español sin usar `new Date("YYYY-MM-DD")` para evitar
 * desfases de zona horaria. Si no hay fecha válida, devuelve null.
 */
export function formatFechaEsCO(raw?: string | null): string | null {
  if (!raw) return null
  const parts = raw.trim().slice(0, 10).split('-')
  if (parts.length !== 3) return null
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
