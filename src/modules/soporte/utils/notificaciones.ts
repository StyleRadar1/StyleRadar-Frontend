import { aRol } from '@/modules/core/types/roles'
import { TIPOS_AVISO, type NotificacionDto, type TipoNotificacion } from '../types/notification.dto'

/** Rol de la sesión (el JWT lo trae; aquí se lee del usuario guardado). Sin sesión, `null`. */
export function rolActual(): string | null {
  try { return aRol(JSON.parse(localStorage.getItem('sr_user') ?? 'null')?.role) } catch { return null }
}

/**
 * El servicio arma los enlaces de los avisos con sus propias rutas (/chat/conversaciones/{id}, /catalogo/prendas/{id}…).
 * Aquí se convierten a las rutas reales del front según quién los recibe: la misma ruta del back lleva a
 * una pantalla distinta para una persona, una tienda o una fundación. Si ya es una ruta del front, se deja igual.
 */
export function enlaceFront(enlace?: string | null, rol: string | null = rolActual()): string | undefined {
  if (!enlace) return undefined
  const e = enlace.trim()
  if (!e.startsWith('/') || e.startsWith('//')) return undefined // nunca se navega a una dirección externa
  const tienda = rol === 'STORE_ADMIN'
  const fundacion = rol === 'FOUNDATION_REPRESENTATIVE'
  let m: RegExpMatchArray | null
  if ((m = e.match(/^\/chat\/conversaciones\/([^/?#]+)/))) return `/mensajes?c=${m[1]}`
  if ((m = e.match(/^\/catalogo\/prendas\/([^/?#]+)/))) return `/catalogo/${m[1]}`
  // Vista del dueño de la prenda: la tienda la ve en su inventario; una persona, en sus publicaciones
  if (/^\/catalogo\/mis-prendas\//.test(e)) return tienda ? '/tienda/inventario' : '/segunda-mano'
  if (/^\/segunda-mano\/[^/?#]+$/.test(e) && e !== '/segunda-mano/publicar') return '/segunda-mano'
  if ((m = e.match(/^\/donaciones\/([^/?#]+)/))) return fundacion ? '/fundacion/donaciones' : `/donar?donacion=${m[1]}`
  if (e === '/donaciones') return fundacion ? '/fundacion/donaciones' : '/donar'
  if (e === '/planes/mi-plan') return tienda ? '/tienda/suscripcion' : '/perfil/pagos'
  return e
}

const texto = (v: unknown) => (typeof v === 'string' ? v : undefined)

/** Convierte un aviso del servidor a lo que pintan las pantallas, tolerando nombres de campo distintos. */
export function aNotificacion(raw: unknown, rol: string | null = rolActual()): NotificacionDto {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const tipo = texto(r.tipo ?? r.type) ?? ''
  return {
    id: String(r.id ?? r.notificationId ?? r.notificacionId ?? ''),
    tipo: (TIPOS_AVISO as readonly string[]).includes(tipo) ? (tipo as TipoNotificacion) : 'SISTEMA',
    titulo: texto(r.titulo ?? r.title) ?? 'Notificación',
    detalle: texto(r.mensaje ?? r.detalle ?? r.message) ?? '',
    enlace: enlaceFront(texto(r.enlace ?? r.link ?? r.url), rol),
    leida: Boolean(r.leida ?? r.read),
    creadaEn: texto(r.fechaCreacion ?? r.creadaEn ?? r.createdAt) ?? new Date().toISOString(),
  }
}
