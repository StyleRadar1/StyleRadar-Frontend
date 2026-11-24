import { TIENDAS_DEMO } from '../mocks/chat'
import type { ContactoDto } from '../types/chat.dto'

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/**
 * Contacto de una tienda a partir de su nombre. Provisional: la prenda del catálogo todavía no trae
 * el id de la tienda; cuando ms-catalogo lo entregue, se usa ese id directamente.
 */
/** NIT colombiano como lo guarda ms-tiendas: 8 a 10 dígitos con o sin el dígito de verificación («900555777-1»). */
export const esNit = (v?: string | null): v is string => !!v && /^\d{8,10}(-\d)?$/.test(v.trim())

/**
 * NIT real de la tienda dueña de una prenda. ms-chat abre la conversación en /stores/{nit}/conversations y comprueba
 * en ms-tiendas que ese NIT exista; un texto armado con el nombre (tienda-calle-85-store) da 404 y el chat responde 422.
 * Solo se acepta lo que de verdad es un NIT (la prenda lo trae como storeNit, o su almacenId ya es el NIT).
 */
export const nitDeTienda = (prenda: { storeNit?: string; almacenId?: string }): string | undefined =>
  [prenda.storeNit, prenda.almacenId].find(esNit)?.trim()

export const tiendaContacto = (nombre: string): ContactoDto => ({ id: TIENDAS_DEMO[nombre] ?? `tienda-${slug(nombre)}`, nombre, tipo: 'TIENDA' })
