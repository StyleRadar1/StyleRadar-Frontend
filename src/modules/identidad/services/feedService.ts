import { apiClient } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { ITEMS } from '@/modules/catalogo/mocks/items'
import type { Estilo, ItemResponseDto } from '@/modules/catalogo/types/item.dto'
import { usuarioService } from './usuarioService'
import { FEED_SIZE_MAX, TEXTOS_FEED, type FeedItemDto, type FeedPageDto, type FeedQuery, type RecommendationsPageDto } from '../types/feed.dto'
import { SIZES_BOTTOM, SIZES_FOOTWEAR, STYLE_LABEL, type GarmentType, type PerfilDto, type StyleCode } from '../types/usuario.dto'

/** Solo los valores dentro de los límites del documento: page ≥ 0 y size de 1 a 20. */
export function paginaFeed(q: FeedQuery = {}): { page: number; size: number } {
  const page = Math.max(0, Math.trunc(q.page ?? 0))
  const size = Math.min(FEED_SIZE_MAX, Math.max(1, Math.trunc(q.size ?? FEED_SIZE_MAX)))
  return { page, size }
}

/** Puntaje de SR-RF-05: +3 si hay una de sus tallas, +2 si es uno de sus estilos. */
export function puntaje(item: FeedItemDto, perfil: Pick<PerfilDto, 'stylePreferences' | 'sizesByGarmentType'>): number {
  const tallas = perfil.sizesByGarmentType?.[item.garmentType] ?? []
  const talla = item.availableSizes.some((t) => tallas.includes(t)) ? 3 : 0
  const estilo = item.style && perfil.stylePreferences?.includes(item.style) ? 2 : 0
  return talla + estilo
}

/**
 * Motivo de la recomendación (RN-03). Usa `reason` si el back lo envía (P-04 pendiente);
 * si no, lo arma con las mismas reglas del puntaje.
 */
export function motivoDe(item: FeedItemDto, perfil?: Pick<PerfilDto, 'stylePreferences' | 'sizesByGarmentType'> | null): string {
  if (item.reason?.trim()) return item.reason.trim()
  if (!perfil) return ''
  const tallas = perfil.sizesByGarmentType?.[item.garmentType] ?? []
  const talla = item.availableSizes.find((t) => tallas.includes(t))
  const estilo = item.style && perfil.stylePreferences?.includes(item.style) ? STYLE_LABEL[item.style] : ''
  if (talla && estilo) return `Tu estilo ${estilo} y tu talla ${talla}`
  if (talla) return `Hay tu talla ${talla}`
  if (estilo) return `Tu estilo ${estilo}`
  return ''
}

/** Prenda del feed → tarjeta del catálogo (ItemCard). La tienda se identifica por NIT cuando viene. */
export function aTarjeta(i: FeedItemDto): ItemResponseDto {
  const foto = i.photos?.[0] ?? ''
  return {
    id: i.itemId,
    almacenId: i.storeNit || i.storeId,
    nombre: i.name,
    tienda: i.brand ?? '',
    marca: i.brand ?? undefined,
    precio: i.price,
    estilo: (i.style ? STYLE_LABEL[i.style] : '') as Estilo,
    tipo: i.garmentType,
    color: i.color ?? '',
    tallas: i.availableSizes,
    imagen: foto,
    fotografias: i.photos ?? undefined,
    descripcion: i.description ?? undefined,
    fechaPublicacion: i.publishedAt,
    distanciaKm: 0,
  }
}

/* ---------- Datos de prueba: el catálogo del mock con las reglas del documento ---------- */

const ESTILO_A_CODIGO: Partial<Record<string, StyleCode>> = {
  Casual: 'CASUAL', Esencial: 'CASUAL', Formal: 'FORMAL', Elegante: 'FORMAL', Sastre: 'FORMAL', Deportivo: 'SPORTY',
  Urbano: 'URBAN', Streetwear: 'URBAN', Calle: 'URBAN', Techwear: 'URBAN', Vintage: 'VINTAGE',
}
const tipoDe = (tallas: string[]): GarmentType | null => {
  if (!tallas.length) return null
  if (tallas.every((t) => (SIZES_BOTTOM as readonly string[]).includes(t))) return 'BOTTOM'
  if (tallas.every((t) => (SIZES_FOOTWEAR as readonly string[]).includes(t))) return 'FOOTWEAR'
  return 'TOP'
}
const catalogoMock = (): FeedItemDto[] => ITEMS
  .filter((i) => !i.esSegundaMano && !i.retirada && i.tallas.length && tipoDe(i.tallas))
  .map((i, n) => ({
    itemId: i.id, garmentId: n + 1, storeId: i.almacenId ?? i.tienda, name: i.nombre, garmentType: tipoDe(i.tallas)!,
    brand: i.tienda, color: i.color, style: ESTILO_A_CODIGO[i.estilo] ?? null, price: i.precio, stock: 1, status: 'AVAILABLE',
    publishedAt: i.fechaPublicacion ?? new Date(Date.UTC(2026, 10, 1) - n * 86_400_000).toISOString(),
    photos: [i.imagen, ...(i.imagenes ?? [])].filter(Boolean), availableSizes: i.tallas, description: i.descripcion ?? null,
  }))

const paginar = <T>(rows: T[], { page, size }: { page: number; size: number }) => {
  const totalPages = Math.max(1, Math.ceil(rows.length / size))
  return { content: rows.slice(page * size, page * size + size), page, size, totalElements: rows.length, totalPages, first: page === 0, last: page >= totalPages - 1 }
}
const porPuntaje = (perfil: PerfilDto) => (a: FeedItemDto, b: FeedItemDto) =>
  puntaje(b, perfil) - puntaje(a, perfil) || b.publishedAt.localeCompare(a.publishedAt)
const tienePreferencias = (p: PerfilDto) => p.stylePreferences.length > 0 || Object.values(p.sizesByGarmentType).some((t) => t?.length)

const VACIA: FeedPageDto = { content: [], page: 0, size: FEED_SIZE_MAX, totalElements: 0, totalPages: 0, first: true, last: true }
const url = (id: string, tramo: 'feed' | 'recommendations') => `/api/v1/users/${encodeURIComponent(id)}/${tramo}`

export const feedService = {
  /** SR-RF-05: «Para ti». Primero lo que coincide con su talla (+3) y su estilo (+2); luego lo más reciente. */
  async getFeed(userId: string, q: FeedQuery = {}): Promise<FeedPageDto> {
    const p = paginaFeed(q)
    if (env.useMocks) {
      failIfScenario()
      const perfil = await usuarioService.get(userId)
      const rows = catalogoMock()
      rows.sort(tienePreferencias(perfil) ? porPuntaje(perfil) : (a, b) => b.publishedAt.localeCompare(a.publishedAt))
      return mockDelay(paginar(rows, p))
    }
    const r = await apiClient.get<FeedPageDto>(url(userId, 'feed'), { params: p })
    return { ...VACIA, ...r.data, content: r.data?.content ?? [] }
  },

  /** SR-RF-06: «Recomendado para ti». Sin estilos ni tallas llega vacía con el mensaje del documento. */
  async getRecommendations(userId: string, q: FeedQuery = {}): Promise<RecommendationsPageDto> {
    const p = paginaFeed(q)
    if (env.useMocks) {
      failIfScenario()
      const perfil = await usuarioService.get(userId)
      if (!tienePreferencias(perfil)) {
        return mockDelay({ ...VACIA, size: p.size, generalWithoutPreferences: true, message: TEXTOS_FEED.sinPreferencias })
      }
      const rows = catalogoMock().filter((i) => puntaje(i, perfil) > 0).sort(porPuntaje(perfil))
        .map((i) => ({ ...i, score: puntaje(i, perfil), reason: motivoDe(i, perfil) }))
      return mockDelay({ ...paginar(rows, p), generalWithoutPreferences: false, message: TEXTOS_FEED.conPerfil })
    }
    const r = await apiClient.get<RecommendationsPageDto>(url(userId, 'recommendations'), { params: p })
    const d: Partial<RecommendationsPageDto> = r.data ?? {}
    return { ...VACIA, ...d, generalWithoutPreferences: Boolean(d.generalWithoutPreferences), message: d.message ?? '', content: d.content ?? [] }
  },
}
