import { apiClient } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import {
  MAX_RUT_BYTES, STORE_REGISTER_LIMITS as L,
  type RegisterStoreRequestDto, type RegisteredStoreDto, type StoreCategory, type UploadedDocumentDto,
} from '../types/store.dto'

/** Formulario de registro: todo en texto, como lo escribe la tienda. */
export interface StoreRegisterForm {
  nit: string
  tradeName: string
  description: string
  phone: string
  contactEmail: string
  latitude: string
  longitude: string
  categories: StoreCategory[]
}

export type StoreRegisterErrors = Partial<Record<keyof StoreRegisterForm | 'rut', string>>

/** Mensajes de RegistrarAlmacenRequestDTO y de ms-tiendas, para que el front y el back digan lo mismo. */
export const TEXTOS_REGISTRO = {
  rut: 'El RUT debe ser un archivo PDF de máximo 5 MB',
  rutFalta: 'Sube el RUT en PDF para verificar la personería jurídica', // (front)
  yaTieneAlmacen: 'El usuario ya administra un almacén',
  enviado: 'Recibimos tu solicitud. Tu almacén quedó en revisión y te avisaremos cuando lo verifiquen.', // (front)
} as const

/** Mismo patrón que ms-tiendas: 8 a 12 dígitos y dígito de verificación opcional, sin puntos (900123456-1). */
export const NIT_TIENDA = /^[0-9]{8,12}(-[0-9])?$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const numero = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')))

/** El RUT: PDF no vacío de máximo 5 MB. */
export function errorDeRut(file: File | null): string {
  if (!file) return TEXTOS_REGISTRO.rutFalta
  const esPdf = file.type.toLowerCase().includes('pdf') || file.name.toLowerCase().endsWith('.pdf')
  return !esPdf || file.size === 0 || file.size > MAX_RUT_BYTES ? TEXTOS_REGISTRO.rut : ''
}

/** Validaciones de POST /api/v1/stores con los mensajes del back. Las claves son las del JSON. */
export function erroresRegistroTienda(f: StoreRegisterForm, rut: File | null): StoreRegisterErrors {
  const e: StoreRegisterErrors = {}
  const nit = f.nit.trim()
  if (!nit) e.nit = 'El NIT del almacén es obligatorio'
  else if (!NIT_TIENDA.test(nit)) e.nit = 'El NIT debe tener un formato válido (ej. 900123456-1)'

  const nombre = f.tradeName.trim()
  if (!nombre) e.tradeName = 'El nombre comercial es obligatorio'
  else if (nombre.length < L.tradeNameMin || nombre.length > L.tradeNameMax) e.tradeName = `El nombre comercial debe tener entre ${L.tradeNameMin} y ${L.tradeNameMax} caracteres`

  if (f.description.trim().length > L.description) e.description = `La descripción no puede superar ${L.description} caracteres`
  if (f.phone.trim().length > L.phone) e.phone = `El teléfono no puede superar ${L.phone} caracteres`

  const correo = f.contactEmail.trim()
  if (!correo) e.contactEmail = 'El correo de contacto es obligatorio'
  else if (!EMAIL.test(correo)) e.contactEmail = 'El correo de contacto debe tener un formato válido'

  // La ubicación es opcional en el back; si se escribe, debe estar en rango.
  if (f.latitude.trim()) {
    const lat = numero(f.latitude)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) e.latitude = 'La latitud debe estar entre -90 y 90'
  }
  if (f.longitude.trim()) {
    const lng = numero(f.longitude)
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) e.longitude = 'La longitud debe estar entre -180 y 180'
  }

  if (!f.categories.length) e.categories = 'Debe indicar al menos una categoría comercial'
  const rutError = errorDeRut(rut)
  if (rutError) e.rut = rutError
  return e
}

/** Formulario → cuerpo de POST /api/v1/stores. Los opcionales vacíos no se envían. */
export function cuerpoRegistro(f: StoreRegisterForm, rutPdfUrl: string): RegisterStoreRequestDto {
  const description = f.description.trim()
  const phone = f.phone.trim()
  return {
    nit: f.nit.trim(),
    tradeName: f.tradeName.trim(),
    ...(description ? { description } : {}),
    ...(phone ? { phone } : {}),
    contactEmail: f.contactEmail.trim().toLowerCase(),
    ...(f.latitude.trim() ? { latitude: numero(f.latitude) } : {}),
    ...(f.longitude.trim() ? { longitude: numero(f.longitude) } : {}),
    categories: [...f.categories],
    rutPdfUrl,
  }
}

/** Errores del servidor → campos. Un 400 de regla de negocio sin campo es el RUT; el 409 de NIT cae en nit. */
export function erroresServidorRegistro(e: unknown): StoreRegisterErrors {
  const x = e as { fields?: Record<string, string>; code?: string; status?: number } | null
  const { rutPdfUrl, ...resto } = x?.fields ?? {}
  const out: StoreRegisterErrors = resto
  if (rutPdfUrl && !out.rut) out.rut = rutPdfUrl
  return out
}

export const storeRegistrationService = {
  /** Sube el RUT y devuelve la URL que va en rutPdfUrl. */
  async uploadRut(file: File): Promise<string> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(`https://mock.styleradar.co/stores/rut/${encodeURIComponent(file.name)}`, 300)
    }
    const body = new FormData()
    body.append('file', file)
    const r = await apiClient.post<UploadedDocumentDto>('/api/v1/stores/documents/rut', body, { timeout: 60000 })
    return r.data?.url ?? ''
  },

  /** Registra el almacén: queda PENDING y asociado a quien lo registra. */
  async register(body: RegisterStoreRequestDto): Promise<RegisteredStoreDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      return mockDelay({ ...body, rating: 0, verificationStatus: 'PENDING' as const }, 400)
    }
    return apiClient.post<RegisteredStoreDto>('/api/v1/stores', body).then((r) => r.data)
  },
}
