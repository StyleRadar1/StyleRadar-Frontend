/**
 * ms-item-catalogo entrega `fechaPublicacion` como LocalDateTime, sin zona («2026-11-26T17:10:35.253406887»), y su servidor
 * está en UTC. ms-inventario espera un instante con zona (`Instant`) y rechaza la fecha sin ella con un 400
 * «El formato del JSON o alguno de los valores enviados no es válido». Aquí se le agrega la «Z» de UTC cuando falta.
 * Si no hay fecha, usa la hora actual.
 */
export function aInstanteUtc(fecha?: unknown): string {
  if (typeof fecha !== 'string' || !fecha.trim()) return new Date().toISOString()
  const f = fecha.trim()
  return /(Z|[+-]\d{2}:?\d{2})$/i.test(f) ? f : `${f}Z`
}
