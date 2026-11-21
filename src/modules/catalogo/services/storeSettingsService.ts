import { apiClient } from '@/modules/core/api/apiClient'
import type { StoreResponseDto } from '../types/store.dto'

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
}
