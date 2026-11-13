import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario, hasScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { seedListings } from '../mocks/secondHand'
import { isoDay } from '../utils/dates'
import {
  mapCategoriaToGarmentType,
  type ListingDto,
  type ListingFiltersDto,
  type ListingRequestDto,
  type ListingStatusRequestDto,
} from '../types/secondhand.dto'

let store: ListingDto[] | null = null
const db = () => (store ??= seedListings())
/** Solo para pruebas: vuelve a los datos iniciales. */
export const resetSecondHandMock = () => {
  store = null
}

const me = () => {
  const u = mockSessionUser()
  if (!u) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  return u
}

const owned = (id: string) => {
  const l = db().find((x) => x.id === id)
  if (!l) throw new ApiError(404, 'Esa publicación ya no existe.')
  if (l.vendedor.id !== me().id)
    throw new ApiError(403, 'Solo quien publicó la prenda puede cambiarla.')
  return l
}

export interface UploadPhotoResponse {
  photoUrl: string
  filename: string
  sizeBytes: number
}

export const secondHandService = {
  /** Subida de fotografías en 2 pasos a Azure Blob: POST /api/v1/segunda-mano/fotos/upload */
  async uploadPhoto(file: File): Promise<UploadPhotoResponse> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay({
        photoUrl: URL.createObjectURL(file),
        filename: file.name,
        sizeBytes: file.size,
      }, 400)
    }

    const formData = new FormData()
    formData.append('file', file)
    return apiClient
      .post<UploadPhotoResponse>('/api/v1/segunda-mano/fotos/upload', formData)
      .then((r) => r.data)
  },

  /** GET /api/v1/segunda-mano?status=AVAILABLE&... */
  async search(f: ListingFiltersDto): Promise<ListingDto[]> {
    if (env.useMocks) {
      failIfScenario()
      if (hasScenario('catalogo-vacio')) return mockDelay([])
      const q = (f.searchTerm || f.texto || '').trim().toLowerCase()
      return mockDelay(
        db().filter(
          (l) =>
            (l.status === 'AVAILABLE' || l.estado === 'DISPONIBLE') &&
            (f.esDonacion === undefined || l.esDonacion === f.esDonacion) &&
            (!q || `${l.titulo} ${l.marca} ${l.categoria} ${l.garmentName || ''}`.toLowerCase().includes(q)) &&
            (!f.conservacion?.length || f.conservacion.includes(l.conservacion)) &&
            (!f.talla || l.talla === f.talla || l.size === f.talla) &&
            (!f.type || l.garmentType === f.type) &&
            (!f.precioMin || l.precio >= f.precioMin) &&
            (!f.precioMax || l.precio <= f.precioMax) &&
            (!f.minPrice || (l.price || l.precio) >= f.minPrice) &&
            (!f.maxPrice || (l.price || l.precio) <= f.maxPrice)
        )
      )
    }

    return apiClient
      .get<ListingDto[]>('/api/v1/segunda-mano', {
        params: {
          status: 'AVAILABLE',
          searchTerm: f.searchTerm || f.texto || undefined,
          type: f.type,
          size: f.size || f.talla,
          conservationStatus: f.conservationStatus?.join(',') || f.conservacion?.join(',') || undefined,
          style: f.style,
          color: f.color,
          brand: f.brand,
          localidad: f.localidad,
          minPrice: f.minPrice || f.precioMin,
          maxPrice: f.maxPrice || f.precioMax,
          esDonacion: f.esDonacion,
        },
      })
      .then((r) => r.data)
  },

  /** RF-37 a RF-39: publicaciones propias en cualquier estado */
  async mine(): Promise<ListingDto[]> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(db().filter((l) => l.vendedor.id === me().id))
    }
    return apiClient.get<ListingDto[]>('/api/v1/segunda-mano/mine').then((r) => r.data)
  },

  async get(id: string): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario()
      const l = db().find((x) => x.id === id)
      if (!l) throw new ApiError(404, 'Esa publicación ya no existe.')
      return mockDelay(l)
    }
    return apiClient
      .get<ListingDto>(`/api/v1/segunda-mano/${encodeURIComponent(id)}`)
      .then((r) => r.data)
  },

  /** POST /api/v1/segunda-mano */
  async create(data: ListingRequestDto, files: File[] = []): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario()
      const u = me()
      const photoUrls = files.map((f) => URL.createObjectURL(f))
      const combinedPhotos = [...(data.photos || []), ...photoUrls]

      const l: ListingDto = {
        id: `l-${Date.now().toString(36)}`,
        garmentName: data.garmentName || data.titulo,
        titulo: data.titulo || data.garmentName || '',
        description: data.description || data.descripcion,
        descripcion: data.descripcion || data.description || '',
        brand: data.brand || data.marca,
        marca: data.marca || data.brand || '',
        color: data.color || 'Negro',
        garmentType: data.garmentType || mapCategoriaToGarmentType(data.categoria || ''),
        categoria: data.categoria || 'Prenda',
        size: data.size || data.talla,
        talla: data.talla || data.size || 'M',
        style: data.style || 'CASUAL',
        conservationStatus: data.conservationStatus || 'GOOD_CONDITION',
        conservacion: data.conservacion || 'BUENO',
        localidad: data.localidad || 'CHAPINERO',
        barrio: 'Chapinero',
        price: data.esDonacion ? 0 : data.precio || data.price || 0,
        precio: data.esDonacion ? 0 : data.precio || data.price || 0,
        esDonacion: !!data.esDonacion,
        photos: combinedPhotos,
        fotos: combinedPhotos,
        status: 'AVAILABLE',
        estado: 'DISPONIBLE',
        userId: u.id,
        vendedor: { id: u.id, nombre: u.name },
        creadaEn: isoDay(),
      }
      db().unshift(l)
      return mockDelay(l, 700)
    }

    const payload = {
      garmentName: data.garmentName || data.titulo,
      description: data.description || data.descripcion,
      brand: data.brand || data.marca,
      color: data.color || 'Varios',
      garmentType: data.garmentType || mapCategoriaToGarmentType(data.categoria || ''),
      size: data.size || data.talla,
      style: data.style || 'CASUAL',
      conservationStatus: data.conservationStatus || 'GOOD_CONDITION',
      localidad: data.localidad || 'CHAPINERO',
      price: data.esDonacion ? 0 : data.price || data.precio || 0,
      esDonacion: !!data.esDonacion,
      photos: data.photos || [],
    }

    return apiClient.post<ListingDto>('/api/v1/segunda-mano', payload).then((r) => r.data)
  },

  /** PUT /api/v1/segunda-mano/{id} */
  async update(id: string, data: ListingRequestDto, files: File[] = []): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const l = owned(id)
      if (l.estado !== 'DISPONIBLE' && l.status !== 'AVAILABLE')
        throw new ApiError(409, 'Solo se pueden editar publicaciones disponibles.')
      const photoUrls = files.map((f) => URL.createObjectURL(f))
      const combinedPhotos = [...(data.fotosConservadas || data.photos || []), ...photoUrls]
      Object.assign(l, data, {
        fotos: combinedPhotos,
        photos: combinedPhotos,
        precio: data.esDonacion ? 0 : data.precio ?? data.price ?? l.precio,
        price: data.esDonacion ? 0 : data.precio ?? data.price ?? l.precio,
      })
      return mockDelay(l, 600)
    }
    return apiClient
      .put<ListingDto>(`/api/v1/segunda-mano/${encodeURIComponent(id)}`, data)
      .then((r) => r.data)
  },

  /** PATCH /api/v1/segunda-mano/{id}/sell?userId={id}&compradorId={compradorId} */
  async markAsSold(id: string, compradorId = 'u-comprador'): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const l = owned(id)
      if (l.estado !== 'DISPONIBLE' && l.status !== 'AVAILABLE')
        throw new ApiError(409, 'La publicación ya no está disponible.')
      l.estado = 'VENDIDA'
      l.status = 'SOLD'
      return mockDelay(l, 500)
    }
    const u = me()
    return apiClient
      .patch<ListingDto>(`/api/v1/segunda-mano/${encodeURIComponent(id)}/sell`, null, {
        params: { userId: u.id, compradorId },
      })
      .then((r) => r.data)
  },

  /** PATCH /api/v1/segunda-mano/{id}/donate?userId={id} */
  async passToDonation(id: string): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const l = owned(id)
      l.status = 'IN_DONATION'
      l.esDonacion = true
      l.precio = 0
      l.price = 0
      return mockDelay(l, 500)
    }
    const u = me()
    return apiClient
      .patch<ListingDto>(`/api/v1/segunda-mano/${encodeURIComponent(id)}/donate`, null, {
        params: { userId: u.id },
      })
      .then((r) => r.data)
  },

  /** PATCH /api/v1/segunda-mano/{id}/retire?userId={id} (204 No Content) */
  async retire(id: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const l = owned(id)
      if (l.estado !== 'DISPONIBLE' && l.status !== 'AVAILABLE')
        throw new ApiError(409, 'La publicación ya no está disponible.')
      l.estado = 'RETIRADA'
      l.status = 'RETIRED'
      return mockDelay(undefined, 500)
    }
    const u = me()
    await apiClient.patch(`/api/v1/segunda-mano/${encodeURIComponent(id)}/retire`, null, {
      params: { userId: u.id },
    })
  },

  /** Método compatible con la suite de pruebas existente */
  async setStatus(id: string, body: ListingStatusRequestDto): Promise<ListingDto> {
    if (body.estado === 'VENDIDA' || body.estado === 'SOLD') {
      return this.markAsSold(id)
    }
    await this.retire(id)
    return this.get(id)
  },

  /** POST /api/v1/donaciones/claim para fundaciones */
  async claimDonation(publicationId: string | number, foundationId: string | number, message?: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const l = db().find((x) => x.id === String(publicationId))
      if (!l || l.status === 'DONATED') throw new ApiError(409, 'Esta prenda acaba de ser reclamada por otra fundación.')
      l.status = 'DONATED'
      l.estado = 'VENDIDA'
      return mockDelay(undefined, 600)
    }
    await apiClient.post('/api/v1/donaciones/claim', { publicationId, foundationId, message })
  },
}
