import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario, hasScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { seedListings } from '../mocks/secondHand'
import { isoDay } from '../utils/dates'
import type { ListingDto, ListingFiltersDto, ListingRequestDto, ListingStatusRequestDto } from '../types/secondhand.dto'

let store: ListingDto[] | null = null
const db = () => (store ??= seedListings())
/** Solo para pruebas: vuelve a los datos iniciales. */
export const resetSecondHandMock = () => { store = null }

const me = () => {
  const u = mockSessionUser()
  if (!u) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  return u
}
const owned = (id: string) => {
  const l = db().find((x) => x.id === id)
  if (!l) throw new ApiError(404, 'Esa publicación ya no existe.')
  if (l.vendedor.id !== me().id) throw new ApiError(403, 'Solo quien publicó la prenda puede cambiarla.')
  return l
}
const multipart = (data: ListingRequestDto, files: File[]) => {
  const form = new FormData()
  form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  files.forEach((f) => form.append('files', f))
  return form
}

export const secondHandService = {
  /** RF-36: busca publicaciones disponibles. */
  async search(f: ListingFiltersDto): Promise<ListingDto[]> {
    if (env.useMocks) {
      failIfScenario()
      if (hasScenario('catalogo-vacio')) return mockDelay([])
      const t = (f.texto ?? '').trim().toLowerCase()
      return mockDelay(db().filter((l) => l.estado === 'DISPONIBLE'
        && (!t || `${l.titulo} ${l.marca} ${l.categoria}`.toLowerCase().includes(t))
        && (!f.conservacion?.length || f.conservacion.includes(l.conservacion))
        && (!f.talla || l.talla === f.talla)
        && (!f.precioMin || l.precio >= f.precioMin)
        && (!f.precioMax || l.precio <= f.precioMax)))
    }
    return apiClient.get<ListingDto[]>('/api/second-hand/listings', {
      params: { ...f, conservacion: f.conservacion?.join(',') || undefined },
    }).then((r) => r.data)
  },

  /** RF-37 a RF-39: publicaciones propias en cualquier estado. */
  async mine(): Promise<ListingDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay(db().filter((l) => l.vendedor.id === me().id)) }
    return apiClient.get<ListingDto[]>('/api/second-hand/listings/mine').then((r) => r.data)
  },

  async get(id: string): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario()
      const l = db().find((x) => x.id === id)
      if (!l) throw new ApiError(404, 'Esa publicación ya no existe.')
      return mockDelay(l)
    }
    return apiClient.get<ListingDto>(`/api/second-hand/listings/${encodeURIComponent(id)}`).then((r) => r.data)
  },

  /** RF-33 a RF-35: crea la publicación con hasta 4 fotos. */
  async create(data: ListingRequestDto, files: File[]): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario()
      const u = me()
      const l: ListingDto = { ...data, id: `l-${Date.now().toString(36)}`, fotos: files.map((f) => URL.createObjectURL(f)), estado: 'DISPONIBLE',
        vendedor: { id: u.id, nombre: u.name }, barrio: 'Chapinero', creadaEn: isoDay() }
      db().unshift(l)
      return mockDelay(l, 700)
    }
    return apiClient.post<ListingDto>('/api/second-hand/listings', multipart(data, files)).then((r) => r.data)
  },

  /** RF-37: editar. Solo publicaciones DISPONIBLES (409 si no). */
  async update(id: string, data: ListingRequestDto, files: File[]): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const l = owned(id)
      if (l.estado !== 'DISPONIBLE') throw new ApiError(409, 'Solo se pueden editar publicaciones disponibles.')
      Object.assign(l, data, { fotos: [...(data.fotosConservadas ?? []), ...files.map((f) => URL.createObjectURL(f))] })
      return mockDelay(l, 600)
    }
    return apiClient.put<ListingDto>(`/api/second-hand/listings/${encodeURIComponent(id)}`, multipart(data, files)).then((r) => r.data)
  },

  /** RF-38 (VENDIDA) y RF-39 (RETIRADA). */
  async setStatus(id: string, body: ListingStatusRequestDto): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const l = owned(id)
      if (l.estado !== 'DISPONIBLE') throw new ApiError(409, `La publicación ya está ${l.estado === 'VENDIDA' ? 'vendida' : 'retirada'}.`)
      l.estado = body.estado
      return mockDelay(l, 500)
    }
    return apiClient.patch<ListingDto>(`/api/second-hand/listings/${encodeURIComponent(id)}/status`, body).then((r) => r.data)
  },
}
