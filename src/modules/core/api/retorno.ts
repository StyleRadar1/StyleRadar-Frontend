/**
 * Página a la que se vuelve después de iniciar sesión cuando la sesión venció (401).
 * Solo se aceptan rutas internas de la app, para no abrir una redirección a otro sitio.
 */
const KEY = 'sr_volver'

export const esRutaInterna = (ruta: unknown): ruta is string =>
  typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//') && !ruta.startsWith('/\\')

const actual = () => window.location.pathname + window.location.search + window.location.hash

/** Guarda la página actual (o la indicada). No guarda el inicio ni el propio inicio de sesión. */
export function guardarRetorno(ruta: string = actual()) {
  if (!esRutaInterna(ruta) || ruta === '/' || ruta.startsWith('/?login') || ruta.startsWith('/login')) return
  try { sessionStorage.setItem(KEY, ruta) } catch { /* sin almacenamiento */ }
}

/** Devuelve la página guardada y la borra, para usarla una sola vez. */
export function tomarRetorno(): string | null {
  try {
    const ruta = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    return esRutaInterna(ruta) ? ruta : null
  } catch {
    return null
  }
}
