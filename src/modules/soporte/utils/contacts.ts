import { TIENDAS_DEMO } from '../mocks/chat'
import type { ContactoDto } from '../types/chat.dto'

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/**
 * Contacto de una tienda a partir de su nombre. Provisional: la prenda del catálogo todavía no trae
 * el id de la tienda; cuando ms-catalogo lo entregue, se usa ese id directamente.
 */
export const tiendaContacto = (nombre: string): ContactoDto => ({ id: TIENDAS_DEMO[nombre] ?? `tienda-${slug(nombre)}`, nombre, tipo: 'TIENDA' })
