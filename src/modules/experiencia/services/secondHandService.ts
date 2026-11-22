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
  if (!u) throw new ApiError(401, 'Tu sesión venció, vuelve a iniciar sesión.')
  return u
}

const owned = (id: string) => {
  const l = db().find((x) => x.id === id)
  if (!l) throw new ApiError(404, 'Esta publicación no está disponible.')
  if (l.vendedor.id !== me().id) throw new ApiError(403, 'Esta publicación no está disponible.')
  return l
}

export interface UploadPhotoResponse {
  photoUrl: string
  filename: string
  sizeBytes: number
}

const toLong = (value: string | number): number | null => {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? value : null
  const clean = String(value).trim()
  if (!/^\d+$/.test(clean)) return null
  const parsed = Number(clean)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export const normalizePublication = (raw: any): ListingDto => {
  if (!raw) return raw
  const isDonation = Boolean(raw.esDonacion)
  const price = isDonation ? 0 : Number(raw.price ?? raw.precio ?? 0)
  const photos = raw.photos || raw.fotos || []
  const userIdStr = String(raw.userId || raw.vendedor?.id || '')
  return {
    ...raw,
    id: String(raw.id),
    userId: raw.userId ?? raw.vendedor?.id,
    garmentName: raw.garmentName || raw.titulo || 'Prenda',
    titulo: raw.garmentName || raw.titulo || 'Prenda',
    description: raw.description || raw.descripcion || '',
    descripcion: raw.description || raw.descripcion || '',
    brand: raw.brand || raw.marca || 'Genérica',
    marca: raw.brand || raw.marca || 'Genérica',
    color: raw.color || 'Varios',
    garmentType: raw.garmentType || raw.categoria,
    categoria: raw.garmentType || raw.categoria || 'Prenda',
    size: raw.size || raw.talla || 'M',
    talla: raw.size || raw.talla || 'M',
    style: raw.style || 'CASUAL',
    conservationStatus: raw.conservationStatus || raw.conservacion || 'GOOD_CONDITION',
    conservacion: raw.conservationStatus || raw.conservacion || 'BUENO',
    localidad: raw.localidad || 'CHAPINERO',
    barrio: raw.localidad || raw.barrio || 'Chapinero',
    price,
    precio: price,
    esDonacion: isDonation,
    photos,
    fotos: photos,
    status: raw.status || raw.estado || 'AVAILABLE',
    estado: raw.status === 'AVAILABLE' ? 'DISPONIBLE' : (raw.status === 'SOLD' ? 'VENDIDA' : (raw.status === 'RETIRED' ? 'RETIRADA' : raw.estado || 'DISPONIBLE')),
    vendedor: raw.vendedor || { id: userIdStr, nombre: `Vendedor #${userIdStr}` },
    creadaEn: raw.publicationDate ? raw.publicationDate.split('T')[0] : (raw.creadaEn || isoDay()),
    publicationDate: raw.publicationDate,
    updateDate: raw.updateDate,
  }
}

export const secondHandService = {
  /** Subida de fotografías a Azure Blob: POST /api/v1/second-hand/photos */
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
    formData.append('photo', file)
    return apiClient
      .post<UploadPhotoResponse>('/api/v1/second-hand/photos', formData)
      .catch(() => apiClient.post<UploadPhotoResponse>('/api/v1/segunda-mano/fotos/upload', formData))
      .then((r) => r.data)
  },

  /** GET /api/v1/second-hand/publications?status=AVAILABLE&... */
  async search(f: ListingFiltersDto): Promise<ListingDto[]> {
    if (env.useMocks) {
      failIfScenario()
      if (hasScenario('catalogo-vacio')) return mockDelay([])
      const q = (f.searchTerm || f.texto || '').trim().toLowerCase()
      const colorQuery = (f.color || '').trim().toLowerCase()
      const brandQuery = (f.brand || '').trim().toLowerCase()

      return mockDelay(
        db().filter(
          (l) =>
            (l.status === 'AVAILABLE' || l.estado === 'DISPONIBLE') &&
            (f.esDonacion === undefined || l.esDonacion === f.esDonacion) &&
            (!q || `${l.titulo} ${l.marca} ${l.categoria} ${l.garmentName || ''} ${l.color || ''}`.toLowerCase().includes(q)) &&
            (!f.conservacion?.length || f.conservacion.includes(l.conservacion)) &&
            (!f.conservationStatus?.length || f.conservationStatus.includes(l.conservationStatus as any)) &&
            (!f.talla || l.talla === f.talla || l.size === f.talla) &&
            (!f.size || l.size === f.size || l.talla === f.size) &&
            (!f.type || l.garmentType === f.type) &&
            (!colorQuery || (l.color || '').toLowerCase().includes(colorQuery)) &&
            (!brandQuery || (l.brand || l.marca || '').toLowerCase().includes(brandQuery)) &&
            (!f.localidad || l.localidad === f.localidad) &&
            (!f.precioMin || l.precio >= f.precioMin) &&
            (!f.precioMax || l.precio <= f.precioMax) &&
            (!f.minPrice || (l.price ?? l.precio) >= f.minPrice) &&
            (!f.maxPrice || (l.price ?? l.precio) <= f.maxPrice)
        )
      )
    }

    const params = {
      status: 'AVAILABLE',
      searchTerm: f.searchTerm || f.texto || undefined,
      type: f.type,
      size: f.size || f.talla,
      conservationStatus: f.conservationStatus?.[0] || f.conservationStatus || undefined,
      style: f.style,
      color: f.color,
      brand: f.brand,
      localidad: f.localidad,
      minPrice: f.minPrice || f.precioMin,
      maxPrice: f.maxPrice || f.precioMax,
      esDonacion: f.esDonacion,
    }

    return apiClient
      .get<any[]>('/api/v1/second-hand/publications', { params })
      .catch(() => apiClient.get<any[]>('/api/v1/segunda-mano', { params }))
      .then((r) => r.data.map(normalizePublication))
  },

  /** SR-P5-N04: publicaciones propias en cualquier estado (GET /api/v1/second-hand/publications/users/{userId}) */
  async mine(userId?: string): Promise<ListingDto[]> {
    if (env.useMocks) {
      failIfScenario()
      const u = me()
      return mockDelay(db().filter((l) => l.vendedor.id === u.id || l.userId === u.id))
    }
    const uid = userId || me().id
    return apiClient
      .get<any[]>(`/api/v1/second-hand/publications/users/${encodeURIComponent(uid)}`)
      .catch(() => apiClient.get<any[]>('/api/v1/segunda-mano/mine'))
      .then((r) => r.data.map(normalizePublication))
  },

  async get(id: string): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario()
      const l = db().find((x) => x.id === id)
      if (!l) throw new ApiError(404, 'Esta publicación no está disponible.')
      return mockDelay(l)
    }
    return apiClient
      .get<any>(`/api/v1/second-hand/publications/${encodeURIComponent(id)}`)
      .catch(() => apiClient.get<any>(`/api/v1/segunda-mano/${encodeURIComponent(id)}`))
      .then((r) => normalizePublication(r.data))
  },

  /** Obtiene una publicación solo si pertenece al usuario actual (para edición). */
  async getForEdit(id: string): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(owned(id))
    }
    return this.get(id)
  },

  /** POST /api/v1/second-hand/publications — RF-33 a RF-35: crea la publicación con hasta 4 fotos. */
  async create(data: ListingRequestDto, files: File[] = []): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario()
      const u = me()
      const photoUrls = files.map((f) => URL.createObjectURL(f))
      const combinedPhotos = [...(data.photos || []), ...photoUrls]

      const isDonation = !!data.esDonacion
      const finalPrice = isDonation ? 0 : data.precio || data.price || 0

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
        price: finalPrice,
        precio: finalPrice,
        esDonacion: isDonation,
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

    const u = me()
    const resolvedUserId = toLong(data.userId || u.id) || 101

    const payload = {
      userId: resolvedUserId,
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

    return apiClient
      .post<any>('/api/v1/second-hand/publications', payload)
      .catch(() => apiClient.post<any>('/api/v1/segunda-mano', payload))
      .then((r) => normalizePublication(r.data))
  },

  /** PUT /api/v1/second-hand/publications/{id} — RF-37 */
  async update(id: string, data: ListingRequestDto, files: File[] = []): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const l = owned(id)
      if (l.estado !== 'DISPONIBLE' && l.status !== 'AVAILABLE')
        throw new ApiError(409, 'Esta prenda ya se vendió o donó.')
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

    const u = me()
    const resolvedUserId = toLong(data.userId || u.id) || 101
    const combinedPhotos = [...(data.photos || data.fotosConservadas || [])]

    const payload = {
      userId: resolvedUserId,
      garmentName: data.garmentName || data.titulo,
      description: data.description || data.descripcion,
      brand: data.brand || data.marca,
      color: data.color || 'Varios',
      garmentType: data.garmentType || mapCategoriaToGarmentType(data.categoria || ''),
      size: data.size || data.talla,
      style: data.style || 'CASUAL',
      conservationStatus: data.conservationStatus || 'GOOD_CONDITION',
      localidad: data.localidad || 'CHAPINERO',
      price: data.esDonacion ? 0 : data.price ?? data.precio ?? 0,
      photos: combinedPhotos,
    }

    return apiClient
      .put<any>(`/api/v1/second-hand/publications/${encodeURIComponent(id)}`, payload)
      .catch(() => apiClient.put<any>(`/api/v1/segunda-mano/${encodeURIComponent(id)}`, payload))
      .then((r) => normalizePublication(r.data))
  },

  /** PATCH /api/v1/second-hand/publications/{id}/sale */
  async markAsSold(id: string, compradorId = 'u-comprador'): Promise<ListingDto> {
    const u = me()
    return this.sell(id, u.id, compradorId)
  },

  /** RF-38: marcar como vendida indicando vendedor (userId) y comprador (compradorId) por query string. */
  async sell(id: string, userId: string | number, compradorId: string | number): Promise<ListingDto> {
    const compStr = String(compradorId ?? '').trim()
    const userStr = String(userId ?? '').trim()
    if (!compStr) {
      throw new ApiError(400, 'Revisa los datos e intenta de nuevo.', { compradorId: 'Elige a la persona que te la compró.' })
    }
    if (compStr === userStr) {
      throw new ApiError(400, 'Revisa los datos e intenta de nuevo.', { compradorId: 'No puedes venderte la prenda a ti mismo.' })
    }

    if (env.useMocks) {
      failIfScenario('conflicto')
      const l = owned(id)
      if (l.estado !== 'DISPONIBLE' && l.status !== 'AVAILABLE') throw new ApiError(409, 'Esta prenda ya se vendió o donó.')
      l.estado = 'VENDIDA'
      l.status = 'SOLD'
      return mockDelay(l, 500)
    }

    const uid = toLong(userStr) || userStr
    const cid = toLong(compStr) || compStr
    return apiClient
      .patch<any>(`/api/v1/second-hand/publications/${encodeURIComponent(id)}/sale`, null, {
        params: { userId: uid, compradorId: cid },
      })
      .catch(() =>
        apiClient.patch<any>(`/api/v1/segunda-mano/${encodeURIComponent(id)}/sell`, null, {
          params: { userId: uid, compradorId: cid },
        })
      )
      .then((r) => normalizePublication(r.data))
  },

  /** RF-42: convertir publicación existente de venta en donación (PATCH /api/v1/second-hand/publications/{id}/donation?userId={id}) */
  async passToDonation(id: string): Promise<ListingDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const l = owned(id)
      if (l.estado !== 'DISPONIBLE' && l.status !== 'AVAILABLE') throw new ApiError(409, 'Esta prenda ya se vendió o retiró.')
      l.status = 'IN_DONATION'
      l.esDonacion = true
      l.precio = 0
      l.price = 0
      return mockDelay(l, 500)
    }
    const u = me()
    return apiClient
      .patch<any>(`/api/v1/second-hand/publications/${encodeURIComponent(id)}/donation`, null, {
        params: { userId: u.id },
      })
      .catch(() =>
        apiClient.patch<any>(`/api/v1/segunda-mano/${encodeURIComponent(id)}/donate`, null, {
          params: { userId: u.id },
        })
      )
      .then((r) => normalizePublication(r.data))
  },

  /** RF-39: retirar publicación (DELETE /api/v1/second-hand/publications/{id}?userId={id}) */
  async retire(id: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const l = owned(id)
      if (l.estado !== 'DISPONIBLE' && l.status !== 'AVAILABLE')
        throw new ApiError(409, 'Esta prenda ya se vendió o donó.')
      l.estado = 'RETIRADA'
      l.status = 'RETIRED'
      return mockDelay(undefined, 500)
    }
    const u = me()
    return apiClient
      .delete(`/api/v1/second-hand/publications/${encodeURIComponent(id)}`, {
        params: { userId: u.id },
      })
      .catch(() =>
        apiClient.patch(`/api/v1/segunda-mano/${encodeURIComponent(id)}/retire`, null, {
          params: { userId: u.id },
        })
      )
      .then(() => undefined)
  },

  /** RF-39: cambiar estado manteniendo compatibilidad */
  async setStatus(id: string, body: ListingStatusRequestDto): Promise<ListingDto> {
    if (body.estado === 'VENDIDA' || body.estado === 'SOLD') {
      return this.markAsSold(id)
    }
    await this.retire(id)
    return this.get(id)
  },

  /** SR-P5-N05: reclamar prenda disponible desde la Vitrina Abierta por una fundación (POST /api/v1/donations/claims) */
  async claimDonation(publicationId: string | number, foundationId: string | number, message?: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const l = db().find((x) => x.id === String(publicationId))
      if (!l || l.status === 'DONATED') throw new ApiError(409, 'Esta prenda acaba de ser reclamada por otra fundación.')
      l.status = 'DONATED'
      l.estado = 'VENDIDA'
      return mockDelay(undefined, 600)
    }
    return apiClient
      .post('/api/v1/donations/claims', { publicationId, foundationId, message })
      .catch(() => apiClient.post('/api/v1/donaciones/claim', { publicationId, foundationId, message }))
      .then(() => undefined)
  },
}
