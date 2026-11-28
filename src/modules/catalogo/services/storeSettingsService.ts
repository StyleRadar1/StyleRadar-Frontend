import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { MENSAJES } from '@/modules/core/api/mensajes'
import { env } from '@/configs/env'
import {
  LOW_STOCK_DEFAULT, LOW_STOCK_MAX, LOW_STOCK_MIN, NEW_ARRIVAL_DEFAULT, NEW_ARRIVAL_MAX, NEW_ARRIVAL_MIN,
  type CatalogSettingsDto, type CatalogSettingsRequestDto, type ItemBadgeDto, type LowStockRequestDto,
  type NewArrivalRequestDto, type StoreResponseDto, type UpdateStoreRequestDto,
} from '../types/store.dto'

/** Mensajes por campo del documento (SR-RF-59 FA-04 a FA-06 · SR-RF-60 FA-04 a FA-06). */
export const TEXTOS_DISTINTIVOS = {
  umbralObligatorio: 'El umbral de últimas unidades es obligatorio',
  umbralNegativo: 'El umbral de últimas unidades no puede ser negativo',
  umbralMaximo: `El umbral de últimas unidades no puede superar ${LOW_STOCK_MAX}`,
  diasObligatorio: 'El periodo en días de nueva llegada es obligatorio',
  diasMinimo: `El periodo de nueva llegada debe ser de al menos ${NEW_ARRIVAL_MIN} día`,
  diasMaximo: `El periodo de nueva llegada no puede superar ${NEW_ARRIVAL_MAX} días`,
} as const

/** Errores por campo de la configuración, con los mismos nombres que usa el back. Vacío si todo está bien. */
export function erroresDeConfiguracion(c: { lowStockThreshold: number | null; newArrivalDays: number | null }): Record<string, string> {
  const e: Record<string, string> = {}
  const u = c.lowStockThreshold
  if (u === null || Number.isNaN(u)) e.lowStockThreshold = TEXTOS_DISTINTIVOS.umbralObligatorio
  else if (u < LOW_STOCK_MIN) e.lowStockThreshold = TEXTOS_DISTINTIVOS.umbralNegativo
  else if (u > LOW_STOCK_MAX) e.lowStockThreshold = TEXTOS_DISTINTIVOS.umbralMaximo
  const d = c.newArrivalDays
  if (d === null || Number.isNaN(d)) e.newArrivalDays = TEXTOS_DISTINTIVOS.diasObligatorio
  else if (d < NEW_ARRIVAL_MIN) e.newArrivalDays = TEXTOS_DISTINTIVOS.diasMinimo
  else if (d > NEW_ARRIVAL_MAX) e.newArrivalDays = TEXTOS_DISTINTIVOS.diasMaximo
  return e
}

/** Reglas del documento para el distintivo de una prenda (RN-01 y RN-02 de SR-RF-59 y SR-RF-60). */
export function distintivoDe(
  c: Pick<CatalogSettingsDto, 'lowStockThreshold' | 'newArrivalDays'>,
  p: { currentStock?: number; available?: boolean; publishedAt?: string; withdrawn?: boolean },
  ahora = new Date(),
): Pick<ItemBadgeDto, 'lowStock' | 'newArrival' | 'activeBadge'> {
  const lowStock = p.currentStock !== undefined && p.available !== false && p.currentStock >= 1 && p.currentStock <= c.lowStockThreshold
  const dias = p.publishedAt ? (ahora.getTime() - new Date(p.publishedAt).getTime()) / 86_400_000 : Infinity
  const newArrival = p.publishedAt !== undefined && !p.withdrawn && dias >= 0 && dias <= c.newArrivalDays
  return { lowStock, newArrival, activeBadge: lowStock ? 'LOW_STOCK' : newArrival ? 'NEW_ARRIVAL' : 'NONE' }
}

/* Datos de prueba: la configuración de cada almacén vive mientras la pestaña esté abierta. */
let configuraciones: Record<string, CatalogSettingsDto> = {}
export function resetStoreSettingsMock() { configuraciones = {} }
const configMock = (nit: string): CatalogSettingsDto =>
  (configuraciones[nit] ??= { nit, lowStockThreshold: LOW_STOCK_DEFAULT, newArrivalDays: NEW_ARRIVAL_DEFAULT, updatedAt: new Date().toISOString() })

const base = (nit: string) => `/api/v1/stores/${encodeURIComponent(nit)}`

/**
 * ms-tiendas para la Tienda que administra su almacén («Mi tienda»).
 * F-19: el NIT sale de GET /api/v1/users/{userId}/store; con él se arman las rutas /api/v1/stores/{nit}/...
 */
export const storeSettingsService = {
  /** Almacén que administra la persona con sesión. 404 si su cuenta aún no tiene almacén asociado. */
  async getMyStore(userId: string): Promise<StoreResponseDto> {
    const r = await apiClient.get<StoreResponseDto>(`/api/v1/users/${encodeURIComponent(userId)}/store`)
    return { ...r.data, nit: String(r.data?.nit ?? '') }
  },

  /** Actualiza la información comercial del almacén (PUT /api/v1/stores/{nit}). */
  async updateStore(nit: string, payload: UpdateStoreRequestDto): Promise<StoreResponseDto> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(
        {
          nit,
          tradeName: payload.tradeName ?? 'Luna Store',
          description: payload.description ?? null,
          phone: payload.phone ?? null,
          contactEmail: payload.contactEmail ?? null,
          representative: payload.representative ?? null,
          payoutAccount: payload.payoutAccount ?? null,
          address: payload.address ?? null,
          barrio: payload.barrio ?? null,
          hours: payload.hours ?? null,
          categories: payload.categories ?? null,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
        },
        200,
      )
    }
    const r = await apiClient.put<StoreResponseDto>(base(nit), payload)
    return { ...r.data, nit: String(r.data?.nit ?? nit) }
  },

  /** SR-RF-59 · SR-RF-60: umbral de «Últimas unidades» y días de «Nueva llegada» del almacén. */
  async getCatalogSettings(nit: string): Promise<CatalogSettingsDto> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay({ ...configMock(nit) })
    }
    return apiClient.get<CatalogSettingsDto>(`${base(nit)}/catalog-settings`).then((r) => r.data)
  },

  /** Guarda las dos reglas a la vez (PUT /catalog-settings). */
  async saveCatalogSettings(nit: string, body: CatalogSettingsRequestDto): Promise<CatalogSettingsDto> {
    if (env.useMocks) {
      failIfScenario()
      const errores = erroresDeConfiguracion(body)
      if (Object.keys(errores).length) throw new ApiError(400, MENSAJES.datos, errores)
      configuraciones[nit] = { nit, ...body, updatedAt: new Date().toISOString() }
      return mockDelay({ ...configuraciones[nit] }, 250)
    }
    return apiClient.put<CatalogSettingsDto>(`${base(nit)}/catalog-settings`, body).then((r) => r.data)
  },

  /** SR-RF-59: envía el stock de una prenda y ms-tiendas devuelve su distintivo. */
  async markLowStock(nit: string, itemId: number | string, body: LowStockRequestDto): Promise<ItemBadgeDto> {
    if (env.useMocks) {
      const c = configMock(nit)
      return mockDelay({ ...c, itemId: Number(itemId), ...distintivoDe(c, body), updatedAt: new Date().toISOString() })
    }
    return apiClient.patch<ItemBadgeDto>(`${base(nit)}/items/${encodeURIComponent(String(itemId))}/low-stock`, body).then((r) => r.data)
  },

  /** SR-RF-60: envía la fecha de publicación de una prenda y ms-tiendas devuelve su distintivo. */
  async markNewArrival(nit: string, itemId: number | string, body: NewArrivalRequestDto): Promise<ItemBadgeDto> {
    if (env.useMocks) {
      const c = configMock(nit)
      return mockDelay({ ...c, itemId: Number(itemId), ...distintivoDe(c, body), updatedAt: new Date().toISOString() })
    }
    return apiClient.patch<ItemBadgeDto>(`${base(nit)}/items/${encodeURIComponent(String(itemId))}/new-arrival`, body).then((r) => r.data)
  },
}
