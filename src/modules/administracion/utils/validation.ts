import { FOUNDATION_LIMITS as L, type FoundationFormDto } from '../types/admin.dto'

export interface FoundationDuplicates {
  nits?: string[]
  nombres?: string[]
  /** representativeId de las otras fundaciones (RN-03: un usuario solo representa a una). */
  representantes?: string[]
}

export type FoundationFormErrors = Partial<Record<keyof FoundationFormDto | 'certificate', string>>

/** Errores del servidor → campos del formulario. El 400 BUSINESS_RULE_VIOLATION es el certificado que falta (FA-04). */
export function erroresServidorFundacion(e: unknown): FoundationFormErrors {
  const x = e as { fields?: Record<string, string>; code?: string; status?: number } | null
  const fields: FoundationFormErrors = { ...(x?.fields ?? {}) }
  if (x?.status === 400 && x.code === 'BUSINESS_RULE_VIOLATION' && !fields.certificate) fields.certificate = TEXTOS_FUNDACION.certificado
  if (fields.legalEntityCertificateUrl && !fields.certificate) { fields.certificate = fields.legalEntityCertificateUrl; delete fields.legalEntityCertificateUrl }
  return fields
}

const norm = (s: string) => s.trim().toLowerCase()

/** SR-RF-63: 8 a 12 dígitos, guion y dígito de verificación opcional, sin puntos (900215884-1). */
export const NIT_FUNDACION = /^\d{8,12}(-\d)?$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Textos de SR-RF-63 a 65. Los marcados «(front)» no vienen en el documento. */
export const TEXTOS_FUNDACION = {
  certificado: 'El certificado de personería jurídica en PDF es obligatorio para registrar la fundación aliada',
  certificadoFormato: 'Sube el certificado en PDF de máximo 6 MB.', // (front)
  yaInactiva: 'Esta fundación ya está inactiva',
  yaActiva: 'Esta fundación ya está activa', // (front)
  motivoLargo: `El motivo no puede superar ${L.reason} caracteres`, // (front)
}

const numero = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')))

/**
 * Validaciones de SR-RF-63 y 64 con los mismos mensajes que devuelve el back en `errors`.
 * Las claves son las del JSON (name, nit, …) para que los errores del servidor caigan en el mismo campo.
 */
export function erroresFundacion(
  d: FoundationFormDto,
  otros: string[] | FoundationDuplicates = [],
  opts: { requireCertificado?: boolean } = {},
): FoundationFormErrors {
  const dup: FoundationDuplicates = Array.isArray(otros) ? { nits: otros } : otros
  const e: FoundationFormErrors = {}
  const v = (k: keyof FoundationFormDto) => String(d[k] ?? '').trim()
  const max = (k: keyof FoundationFormDto, n: number, texto: string) => { if (!e[k] && v(k).length > n) e[k] = texto }

  if (!v('name')) e.name = 'El nombre es obligatorio'
  else if (v('name').length < L.nameMin || v('name').length > L.nameMax) e.name = `El nombre debe tener entre ${L.nameMin} y ${L.nameMax} caracteres`
  else if (dup.nombres?.some((n) => norm(n) === norm(v('name')))) e.name = `Ya existe una fundación aliada registrada con el nombre: ${v('name')}`

  if (!v('nit')) e.nit = 'El NIT es obligatorio'
  else if (!NIT_FUNDACION.test(v('nit'))) e.nit = 'El NIT debe tener un formato válido (ej. 900215884-1)'
  else if (dup.nits?.includes(v('nit'))) e.nit = `Ya existe una fundación aliada registrada con el NIT: ${v('nit')}`

  if (!v('email')) e.email = 'El email es obligatorio'
  else if (!EMAIL.test(v('email'))) e.email = 'El email no tiene un formato válido'

  max('phone', L.phone, `El teléfono no puede superar ${L.phone} caracteres`)

  if (!v('neighborhood')) e.neighborhood = 'El barrio es obligatorio'
  max('neighborhood', L.neighborhood, `El barrio no puede superar ${L.neighborhood} caracteres`)
  if (!v('address')) e.address = 'La dirección es obligatoria'
  max('address', L.address, `La dirección no puede superar ${L.address} caracteres`)
  max('description', L.description, `La descripción no puede superar ${L.description} caracteres`)

  const lat = numero(v('latitude'))
  if (!v('latitude')) e.latitude = 'La latitud es obligatoria'
  else if (!Number.isFinite(lat) || lat < -90 || lat > 90) e.latitude = 'La latitud debe estar entre -90 y 90'
  const lng = numero(v('longitude'))
  if (!v('longitude')) e.longitude = 'La longitud es obligatoria'
  else if (!Number.isFinite(lng) || lng < -180 || lng > 180) e.longitude = 'La longitud debe estar entre -180 y 180'

  if (!d.acceptedCategories?.length) e.acceptedCategories = 'Debe aceptar al menos una categoría de prenda'

  if (!v('representativeId')) e.representativeId = 'El ID del usuario representante es obligatorio'
  else if (dup.representantes?.includes(v('representativeId'))) {
    e.representativeId = `El usuario con ID ${v('representativeId')} ya se encuentra asignado como representante de otra fundación aliada`
  }

  max('supportedCauses', L.supportedCauses, `Las causas apoyadas no pueden superar ${L.supportedCauses} caracteres`)
  max('openingHours', L.openingHours, `El horario no puede superar ${L.openingHours} caracteres`)
  max('donationPolicies', L.donationPolicies, `Las políticas de donación no pueden superar ${L.donationPolicies} caracteres`)

  if (opts.requireCertificado && !v('legalEntityCertificateUrl')) e.certificate = TEXTOS_FUNDACION.certificado
  return e
}
