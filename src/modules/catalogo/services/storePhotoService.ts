import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { MENSAJES } from '@/modules/core/api/mensajes'
import { env } from '@/configs/env'
import {
  ALLOWED_STORE_PHOTO_TYPES, MAX_STORE_PHOTO_BYTES, MAX_STORE_PHOTOS, type StorePhotoDto,
} from '../types/store.dto'

/** Textos de la galería (SR-RF-74 FA-04 a FA-07 y FA-09). */
export const TEXTOS_FOTOS = {
  formato: 'Sube una imagen JPG, PNG o WebP de máximo 6 MB.',
  maximo: 'Ya llegaste al máximo de 6 fotos.',
  ordenDesactualizado: 'La galería cambió en otra sesión. La actualizamos; intenta ordenar de nuevo.',
} as const

/** Validación antes de subir: JPEG, PNG o WebP, no vacía y de máximo 6 MB. */
export function errorDeFoto(file: File): string {
  const tipoValido = (ALLOWED_STORE_PHOTO_TYPES as readonly string[]).includes(file.type)
  return !tipoValido || file.size === 0 || file.size > MAX_STORE_PHOTO_BYTES ? TEXTOS_FOTOS.formato : ''
}

/** Posición y portada según el orden de la lista (RN-02 y RN-03: la primera es la portada). */
const numerar = (fotos: StorePhotoDto[]): StorePhotoDto[] => fotos.map((f, i) => ({ ...f, position: i + 1, cover: i === 0 }))
export const ordenadas = (fotos: StorePhotoDto[]) => [...fotos].sort((a, b) => a.position - b.position)

/*
 * Datos de prueba: la galería se guarda en el navegador con la misma llave que lee el perfil público con mocks.
 * Con el back real no se usa el navegador.
 */
const LLAVE_MOCK = 'styleradar-store-gallery'
const BASE_MOCK = [
  { url: '/img/mapa/luna.jpg', tag: 'Fachada' },
  { url: '/img/sesion/rol-tienda.jpg', tag: 'Mostrador' },
  { url: '/prototipo/assets/img/productos/r1c3-tenis-running.jpg', tag: 'Vitrina' },
]
type FotoGuardada = { id: string; url: string; tag?: string }
function leerMock(nit: string): StorePhotoDto[] {
  let guardadas: FotoGuardada[] | null = null
  try { guardadas = JSON.parse(localStorage.getItem(LLAVE_MOCK) ?? 'null') } catch { guardadas = null }
  const lista = Array.isArray(guardadas) && guardadas.length ? guardadas : BASE_MOCK.map((f, i) => ({ id: `foto-${i + 1}`, ...f }))
  return numerar(lista.map((f) => ({ id: f.id, url: f.url, storeNit: nit, position: 0, cover: false, tag: f.tag } as StorePhotoDto)))
}
function guardarMock(fotos: StorePhotoDto[]) {
  const etiqueta = (f: StorePhotoDto, i: number) => (f as StorePhotoDto & { tag?: string }).tag || `Foto ${i + 1}`
  try { localStorage.setItem(LLAVE_MOCK, JSON.stringify(fotos.map((f, i) => ({ id: String(f.id), url: f.url, tag: etiqueta(f, i) })))) } catch { /* sin almacenamiento */ }
}
const leerArchivo = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('No se pudo leer la imagen.')))
  reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
  reader.readAsDataURL(file)
})

const base = (nit: string) => `/api/v1/stores/${encodeURIComponent(nit)}/photos`

/** SR-RF-74 · F-20: galería de la tienda física en ms-tiendas (máximo 6, la primera es la portada). */
export const storePhotoService = {
  async list(nit: string): Promise<StorePhotoDto[]> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(leerMock(nit))
    }
    return apiClient.get<StorePhotoDto[]>(base(nit)).then((r) => ordenadas(Array.isArray(r.data) ? r.data : []))
  },

  /** Sube una sola foto (multipart, campo «file»). */
  async upload(nit: string, file: File): Promise<StorePhotoDto> {
    if (env.useMocks) {
      failIfScenario()
      const fotos = leerMock(nit)
      if (fotos.length >= MAX_STORE_PHOTOS) throw new ApiError(422, TEXTOS_FOTOS.maximo, 'UNPROCESSABLE_OPERATION')
      if (file.size > MAX_STORE_PHOTO_BYTES) throw new ApiError(413, MENSAJES.datos, 'FILE_TOO_LARGE')
      if (errorDeFoto(file)) throw new ApiError(400, MENSAJES.datos, 'BUSINESS_RULE_VIOLATION')
      const nueva = { id: `foto-${Date.now()}-${fotos.length + 1}`, storeNit: nit, url: await leerArchivo(file), position: 0, cover: false, registeredAt: new Date().toISOString() }
      const todas = numerar([...fotos, nueva])
      guardarMock(todas)
      return mockDelay(todas[todas.length - 1], 150)
    }
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<StorePhotoDto>(base(nit), form, { timeout: 60000 }).then((r) => r.data)
  },

  /** Cambia el orden: la que queda primera pasa a ser la portada. */
  async reorder(nit: string, photoIds: (number | string)[]): Promise<StorePhotoDto[]> {
    if (env.useMocks) {
      failIfScenario()
      const fotos = leerMock(nit)
      const actuales = fotos.map((f) => String(f.id)).sort().join()
      if (actuales !== photoIds.map(String).sort().join()) {
        throw new ApiError(400, MENSAJES.datos, { photoIds: 'El nuevo orden debe incluir todas las fotografías actuales del almacén' })
      }
      const porId = new Map(fotos.map((f) => [String(f.id), f]))
      const todas = numerar(photoIds.map((id) => porId.get(String(id)) as StorePhotoDto))
      guardarMock(todas)
      return mockDelay(todas, 150)
    }
    return apiClient.put<StorePhotoDto[]>(`${base(nit)}/order`, { photoIds }).then((r) => ordenadas(Array.isArray(r.data) ? r.data : []))
  },

  /** Quita una foto; si era la portada, la siguiente pasa a serlo. */
  async remove(nit: string, photoId: number | string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      const fotos = leerMock(nit)
      if (!fotos.some((f) => String(f.id) === String(photoId))) throw new ApiError(400, MENSAJES.datos, 'BUSINESS_RULE_VIOLATION')
      guardarMock(numerar(fotos.filter((f) => String(f.id) !== String(photoId))))
      return mockDelay(undefined, 150)
    }
    await apiClient.delete(`${base(nit)}/${encodeURIComponent(String(photoId))}`)
  },
}
