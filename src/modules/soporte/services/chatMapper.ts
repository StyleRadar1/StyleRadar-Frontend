import type { ConversacionDto, MensajeDto, TipoContacto } from '../types/chat.dto'

/**
 * Traduce lo que devuelve ms-chat a lo que pintan las pantallas.
 * ms-chat no guarda nombres de personas ni contadores: los nombres salen de ms-usuarios, los «sin leer»
 * de los avisos MENSAJE_NUEVO de ms-notificaciones, y el resto se deduce de la propia conversación.
 */
export interface ContextoChat {
  /** Id de quien consulta (el `sub` del JWT). */
  me: string
  /** Rol del front de quien consulta. */
  rol: string | null
  /** Nombres ya conocidos por id de usuario. */
  nombres: Map<string, string>
}

const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
const id = (v: unknown) => (v === null || v === undefined ? '' : String(v))

/** Nombre de la contraparte incluido directamente por ms-chat (evita llamadas extra a ms-usuarios). */
export function nombreEnFila(raw: Record<string, unknown>): string | undefined {
  return (
    texto(raw.participantDisplayName) ??
    texto(raw.otherParticipantName) ??
    texto(raw.contactName)
  )
}

/** Las listas de ms-chat vienen como { content, page, size, totalElements, totalPages }; por si acaso, también un arreglo. */
export function filasDe(data: unknown): { filas: Record<string, unknown>[]; totalPages: number } {
  if (Array.isArray(data)) return { filas: data as Record<string, unknown>[], totalPages: 1 }
  const d = (data ?? {}) as { content?: unknown; totalPages?: unknown }
  return { filas: (Array.isArray(d.content) ? d.content : []) as Record<string, unknown>[], totalPages: Number(d.totalPages) || 1 }
}

const esTienda = (t: string) => t === 'ALMACEN' || t === 'STORE'
const esDonacion = (t: string) => t === 'DONACION' || t === 'DONATION'

/** La otra persona de la conversación: el comprador si yo soy quien vende, y al revés. */
export function idDelOtro(raw: Record<string, unknown>, me: string): string {
  const comprador = id(raw.buyerId)
  const vendedor = id(raw.sellerId)
  return comprador === me ? vendedor : comprador
}

/** Si hay que pedir el nombre de la otra persona a ms-usuarios (las tiendas y filas con participantDisplayName ya traen su nombre). */
export function necesitaNombre(raw: Record<string, unknown>, ctx: Pick<ContextoChat, 'me' | 'rol'>): boolean {
  if (nombreEnFila(raw)) return false
  const tipo = String(raw.type ?? '').toUpperCase()
  return !esTienda(tipo) || ctx.rol === 'STORE_ADMIN'
}

export function aConversacion(raw: Record<string, unknown>, ctx: ContextoChat, noLeidos = 0): ConversacionDto {
  const tipo = String(raw.type ?? raw.tipo ?? '').toUpperCase()
  const otro = idDelOtro(raw, ctx.me)
  const convId = id(raw.id)
  const directo = nombreEnFila(raw)
  const nombreOtro = (fallback: string) =>
    directo ?? ctx.nombres.get(otro) ?? (otro ? `Usuario #${otro}` : convId ? `Conversación #${convId}` : fallback)
  const vendo = id(raw.sellerId) === ctx.me

  let contacto: { id: string; nombre: string; tipo: TipoContacto }
  let asunto: string
  if (esTienda(tipo)) {
    asunto = 'Consulta a la tienda'
    const comprador = id(raw.buyerId) || otro
    contacto = ctx.rol === 'STORE_ADMIN'
      ? { id: comprador, nombre: ctx.nombres.get(comprador) ?? (comprador ? `Comprador #${comprador}` : 'Contacto de tienda'), tipo: 'COMPRADOR' }
      : { id: id(raw.storeNit), nombre: texto(raw.storeName) ?? directo ?? 'Contacto de tienda', tipo: 'TIENDA' }
  } else if (esDonacion(tipo)) {
    asunto = `Donación #${id(raw.donationId)}`
    contacto = ctx.rol === 'FOUNDATION_REPRESENTATIVE'
      ? { id: otro, nombre: nombreOtro('Donante'), tipo: 'DONANTE' }
      : { id: otro, nombre: nombreOtro('Fundación'), tipo: 'FUNDACION' }
  } else {
    asunto = texto(raw.garmentName) ?? 'Segunda mano'
    contacto = { id: otro, nombre: nombreOtro('Usuario'), tipo: vendo ? 'COMPRADOR' : 'VENDEDOR' }
  }

  return {
    id: convId,
    contacto,
    asunto,
    referenciaId: id(raw.publicationId ?? raw.donationId ?? raw.storeNit) || undefined,
    noLeidos,
    // ms-chat no entrega el último mensaje ni su hora: se ordena por la creación de la conversación
    actualizadaEn: texto(raw.createdAt) ?? new Date().toISOString(),
  }
}

export function aMensaje(raw: unknown): MensajeDto {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    id: id(r.id),
    conversacionId: id(r.conversationId ?? r.conversacionId),
    autorId: id(r.authorId ?? r.autorId),
    texto: texto(r.text) ?? texto(r.texto) ?? '',
    enviadoEn: texto(r.sentAt) ?? texto(r.fechaEnvio) ?? new Date().toISOString(),
  }
}
