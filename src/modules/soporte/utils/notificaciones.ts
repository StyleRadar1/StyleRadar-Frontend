import type { NotificacionDto, TipoNotificacion } from '../types/notification.dto'

/**
 * El servicio arma los enlaces de los avisos con sus propias rutas (/chat/conversaciones/{id}, /catalogo/prendas/{id}…).
 * Aquí se convierten a las rutas reales del front; si ya es una ruta del front, se deja igual.
 */
export function enlaceFront(enlace?: string | null): string | undefined {
  if (!enlace) return undefined
  const e = enlace.trim()
  if (!e.startsWith('/') || e.startsWith('//')) return undefined // nunca se navega a una dirección externa
  let m: RegExpMatchArray | null
  if ((m = e.match(/^\/chat\/conversaciones\/([^/?#]+)/))) return `/mensajes?c=${m[1]}`
  if ((m = e.match(/^\/catalogo\/prendas\/([^/?#]+)/))) return `/catalogo/${m[1]}`
  if (/^\/catalogo\/mis-prendas\//.test(e)) return '/tienda/inventario'
  if (/^\/segunda-mano\/[^/?#]+$/.test(e) && e !== '/segunda-mano/publicar') return '/segunda-mano'
  if ((m = e.match(/^\/donaciones\/([^/?#]+)/))) return `/donar?donacion=${m[1]}`
  if (e === '/donaciones') return '/donar'
  if (e === '/planes/mi-plan') return '/perfil/pagos'
  return e
}

const TIPOS: string[] = [
  'REPOSICION_STOCK', 'COINCIDENCIA_BUSQUEDA', 'MENSAJE_NUEVO', 'CAMBIO_DONACION', 'MODERACION_PRENDA',
  'SOLICITUD_DONACION', 'PRENDA_VENDIDA', 'PAGO_CONFIRMADO', 'SISTEMA',
  'NUEVA_COINCIDENCIA', 'DISPONIBILIDAD_RESTABLECIDA', 'MENSAJE',
]

const texto = (v: unknown) => (typeof v === 'string' ? v : undefined)

/** Convierte un aviso del servidor a lo que pintan las pantallas, tolerando nombres de campo distintos hasta tener el esquema. */
export function aNotificacion(raw: unknown): NotificacionDto {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const tipo = texto(r.tipo ?? r.type) ?? ''
  return {
    id: String(r.id ?? r.notificationId ?? r.notificacionId ?? ''),
    tipo: TIPOS.includes(tipo) ? (tipo as TipoNotificacion) : 'SISTEMA',
    titulo: texto(r.titulo ?? r.title) ?? 'Notificación',
    detalle: texto(r.mensaje ?? r.detalle ?? r.message) ?? '',
    enlace: enlaceFront(texto(r.enlace ?? r.link ?? r.url)),
    leida: Boolean(r.leida ?? r.read),
    creadaEn: texto(r.fechaCreacion ?? r.creadaEn ?? r.createdAt) ?? new Date().toISOString(),
  }
}
