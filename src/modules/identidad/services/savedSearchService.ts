import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { MENSAJES } from '@/modules/core/api/errors'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { SAVED_SEARCH_NAME_MAX, type SavedSearchDto, type SavedSearchRequestDto } from '../types/savedSearch.dto'

type Errores = Partial<Record<keyof SavedSearchRequestDto | 'priceRange', string>>

/** Mensajes de SR-RF-28 (EX-01 a EX-06), tal como los devuelve ms-usuarios en `errors`. */
export function erroresBusqueda(b: SavedSearchRequestDto): Errores {
  const e: Errores = {}
  const nombre = b.name?.trim() ?? ''
  if (!nombre) e.name = 'El nombre de la búsqueda guardada es obligatorio'
  else if (nombre.length > SAVED_SEARCH_NAME_MAX) e.name = `El nombre debe tener entre 1 y ${SAVED_SEARCH_NAME_MAX} caracteres`
  if (b.query !== undefined && !b.query.trim()) e.query = 'query no puede estar vacío'
  if (b.color !== undefined && !b.color.trim()) e.color = 'color no puede estar vacío'
  if (b.brand !== undefined && !b.brand.trim()) e.brand = 'marca no puede estar vacía'
  if (b.minPrice !== undefined && b.minPrice < 0) e.minPrice = 'precioMin debe ser mayor o igual a 0'
  if (b.maxPrice !== undefined && b.maxPrice < 0) e.maxPrice = 'precioMax debe ser mayor o igual a 0'
  if (!e.minPrice && !e.maxPrice && b.minPrice !== undefined && b.maxPrice !== undefined && b.minPrice > b.maxPrice) {
    e.priceRange = 'precioMin no puede ser mayor que precioMax'
  }
  if (b.latitude !== undefined && (b.latitude < -90 || b.latitude > 90)) e.latitude = 'latitud debe estar entre -90 y 90'
  if (b.longitude !== undefined && (b.longitude < -180 || b.longitude > 180)) e.longitude = 'longitud debe estar entre -180 y 180'
  return e
}

/** Quita los filtros vacíos y recorta los textos: solo viaja lo que la persona eligió. */
export function cuerpoBusqueda(b: SavedSearchRequestDto): SavedSearchRequestDto {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined || v === null) continue
    if (typeof v === 'string') { if (v.trim()) out[k] = v.trim() }
    else if (typeof v === 'number') { if (Number.isFinite(v)) out[k] = v }
    else out[k] = v
  }
  return out as unknown as SavedSearchRequestDto
}

const url = (userId: string, searchId?: string | number) =>
  `/api/v1/users/${encodeURIComponent(userId)}/saved-searches${searchId === undefined ? '' : `/${encodeURIComponent(String(searchId))}`}`

/* ---------- Datos de prueba en memoria, por cuenta ---------- */
let guardadas: Record<string, SavedSearchDto[]> = {}
let siguiente = 1
/** Solo para pruebas: vuelve a empezar sin búsquedas. */
export const resetSavedSearchesMock = () => { guardadas = {}; siguiente = 1 }
/** RN-02: solo la propia cuenta (el admin no usa estas rutas desde el front). */
const propia = (userId: string) => {
  const s = mockSessionUser()
  if (!s?.id) throw new ApiError(401, MENSAJES.sesion)
  if (String(s.id) !== userId) throw new ApiError(403, MENSAJES.permiso)
  return (guardadas[userId] ??= [])
}

export const savedSearchService = {
  /** SR-RF-28: POST /api/v1/users/{id}/saved-searches → 201 con la búsqueda guardada. */
  async save(userId: string, busqueda: SavedSearchRequestDto): Promise<SavedSearchDto> {
    const body = cuerpoBusqueda(busqueda)
    const errores = erroresBusqueda({ ...busqueda, name: busqueda.name ?? '' })
    const fields = Object.fromEntries(Object.entries(errores).filter(([, m]) => m)) as Record<string, string>
    if (Object.keys(fields).length) throw new ApiError(400, MENSAJES.datos, fields, 'INVALID_DATA')
    if (env.useMocks) {
      failIfScenario()
      const lista = propia(userId)
      const nueva: SavedSearchDto = { ...body, id: siguiente++, createdAt: new Date().toISOString() }
      lista.unshift(nueva)
      return mockDelay(structuredClone(nueva))
    }
    return apiClient.post<SavedSearchDto>(url(userId), body).then((r) => r.data)
  },

  /** SR-RF-28: GET /api/v1/users/{id}/saved-searches → de la más reciente a la más antigua (RN-07). */
  async list(userId: string): Promise<SavedSearchDto[]> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(structuredClone(propia(userId)))
    }
    const r = await apiClient.get<SavedSearchDto[] | { content?: SavedSearchDto[] }>(url(userId))
    const rows = Array.isArray(r.data) ? r.data : r.data?.content ?? []
    return [...rows].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  },

  /**
   * SR-RF-28: DELETE /api/v1/users/{id}/saved-searches/{searchId} → 204.
   * D21 sigue abierta (hoy 204 aunque no exista; el Swagger dice 404): un 404 se trata como ya eliminada.
   */
  async remove(userId: string, searchId: string | number): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      const lista = propia(userId)
      guardadas[userId] = lista.filter((b) => String(b.id) !== String(searchId))
      return mockDelay(undefined)
    }
    try {
      await apiClient.delete(url(userId, searchId))
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return
      throw e
    }
  },
}
