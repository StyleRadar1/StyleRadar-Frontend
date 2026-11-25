import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { seedFoundations, seedPlaylists, seedStores } from '../mocks/admin'
import {
  MAX_DESTACADAS, MOTIVO_RECHAZO_MAX, MOTIVO_RECHAZO_MIN, STORE_CATEGORY_LABEL, VERIFICACION_DE, interaccion,
  type AdminFoundationDto, type AdminPlaylistDto, type AdminStoreDto, type FoundationFormDto, type FoundationRequestDto,
  type FoundationResponseDto, type StoreAdministratorDto,
  type StoreVerificationDto, type StoreVerificationPageDto, type Verificacion, type VerificationDecisionRequestDto,
} from '../types/admin.dto'
import { erroresFundacion } from '../utils/validation'

/** Rutas del API Gateway para el administrador (/api/v1) */
const API = { tiendas: '/api/v1/admin/stores', fundaciones: '/api/v1/admin/foundations', playlists: '/api/v1/admin/playlists' }

/** Se dispara cuando cambia algo que mueve las insignias de la barra lateral del admin. */
export const ADMIN_CHANGED = 'sr:admin'
const avisar = <T>(r: T) => { window.dispatchEvent(new Event(ADMIN_CHANGED)); return r }

let tiendas: AdminStoreDto[] | null = null
let fundaciones: AdminFoundationDto[] | null = null
let playlists: AdminPlaylistDto[] | null = null
const db = () => ({ tiendas: (tiendas ??= seedStores()), fundaciones: (fundaciones ??= seedFoundations()), playlists: (playlists ??= seedPlaylists()) })
/** Solo para pruebas: vuelve a los datos iniciales. */
export const resetAdminMock = () => { tiendas = null; fundaciones = null; playlists = null; administradores = null }

const tienda = (id: string) => {
  const t = db().tiendas.find((x) => x.id === id)
  if (!t) throw new ApiError(404, 'Esa tienda no existe.')
  return t
}
const fundacion = (id: string) => {
  const f = db().fundaciones.find((x) => x.id === id)
  if (!f) throw new ApiError(404, 'Esa fundación no existe.')
  return f
}
const validar = (data: FoundationFormDto, selfId?: string) => {
  const otras = db().fundaciones.filter((f) => f.id !== selfId)
  const errores = erroresFundacion(
    data,
    { nits: otras.map((f) => f.nit), nombres: otras.map((f) => f.name), representantes: otras.map((f) => String(f.representativeId)) },
    { requireCertificado: true },
  )
  const duplicado = (['name', 'nit', 'representativeId'] as const).find((k) => /^(Ya existe|El usuario con ID)/.test(errores[k] ?? ''))
  if (duplicado) throw new ApiError(409, errores[duplicado]!, 'CONFLICT')
  if (errores.certificate) throw new ApiError(400, errores.certificate, 'BUSINESS_RULE_VIOLATION')
  const fields = Object.fromEntries(Object.entries(errores).filter(([, m]) => m)) as Record<string, string>
  if (Object.keys(fields).length) throw new ApiError(400, 'La solicitud contiene datos inválidos', fields, 'INVALID_DATA')
}

/** Texto del motivo de rechazo cuando no cumple 10 a 1000 caracteres (RN-05). */
export const MOTIVO_RECHAZO_TEXTO = 'Escribe el motivo (mínimo 10 caracteres) para que la tienda sepa qué corregir.'
export const MOTIVO_RECHAZO_LARGO = `El motivo admite hasta ${MOTIVO_RECHAZO_MAX} caracteres.`
export function errorDeMotivoRechazo(motivo?: string): string {
  const m = (motivo ?? '').trim()
  if (m.length < MOTIVO_RECHAZO_MIN) return MOTIVO_RECHAZO_TEXTO
  if (m.length > MOTIVO_RECHAZO_MAX) return MOTIVO_RECHAZO_LARGO
  return ''
}

/**
 * F-16: la verificación que manda ms-tiendas sobre la ficha de la pantalla.
 * Suscripción y catálogo son de otros servicios (pagos y catálogo): con el back real llegan vacíos hasta conectarlos.
 */
export function aTiendaAdmin(v: StoreVerificationDto): AdminStoreDto {
  const nit = String(v.nit)
  return {
    id: nit,
    nombre: v.tradeName ?? '',
    categoria: (v.categories ?? []).map((c) => STORE_CATEGORY_LABEL[c] ?? c).join(', ') || '—',
    barrio: '—',
    direccion: '—',
    telefono: v.phone ?? '',
    correo: v.contactEmail ?? '',
    nit,
    representante: '—',
    aliadaDesde: '—',
    verificacion: VERIFICACION_DE[v.verificationStatus] ?? 'Pendiente',
    motivoRechazo: v.verificationReason ?? undefined,
    suscripcion: { estado: 'Sin suscripción', proximo: '—', inicio: '—' },
    documentos: [{ nombre: 'RUT', recibido: !!v.rutPdfUrl, ...(v.rutPdfUrl ? { url: v.rutPdfUrl } : {}) }],
    catalogo: { publicadas: 0, revision: 0, agotadas: 0, retiradas: 0 },
  }
}

/* Datos de prueba de los administradores del almacén: Luna Store la administra la cuenta t-1. */
let administradores: Record<string, StoreAdministratorDto[]> | null = null
const admins = () => (administradores ??= { luna: [{ id: 1, userId: 't-1', storeNit: '901.482.337-1', assignedById: 'a-1', assignedAt: '2026-02-15T10:00:00Z' }] })

export const adminStoreService = {
  /** SR-RF-62: todas las páginas de GET /api/v1/admin/stores/verifications (la tabla filtra y ordena en pantalla). */
  async list(): Promise<AdminStoreDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay(db().tiendas) }
    const todas: StoreVerificationDto[] = []
    for (let page = 0; page < 50; page++) {
      const r = await apiClient.get<StoreVerificationPageDto>(`${API.tiendas}/verifications`, { params: { page, size: 100 } })
      todas.push(...(r.data?.content ?? []))
      if (r.data?.last !== false) break
    }
    return todas.map(aTiendaAdmin)
  },
  /** SR-RF-62: detalle con el RUT (GET /api/v1/admin/stores/{nit}/verification). */
  async get(id: string): Promise<AdminStoreDto> {
    if (env.useMocks) { failIfScenario(); return mockDelay(tienda(id)) }
    return apiClient.get<StoreVerificationDto>(`${API.tiendas}/${encodeURIComponent(id)}/verification`).then((r) => aTiendaAdmin(r.data))
  },
  /** Aprobar, rechazar (con motivo) o retirar la verificación. Solo una tienda verificada aparece en el radar. */
  async setVerification(id: string, verificacion: Verificacion, motivo?: string): Promise<AdminStoreDto> {
    const errMotivo = verificacion === 'Rechazada' ? errorDeMotivoRechazo(motivo) : ''
    if (errMotivo) throw new ApiError(400, errMotivo, { reason: errMotivo })
    if (env.useMocks) {
      failIfScenario('conflicto')
      const t = tienda(id)
      if (t.verificacion === verificacion && verificacion !== 'Pendiente') {
        throw new ApiError(409, 'Esta tienda ya fue revisada.')
      }
      if (verificacion === 'Pendiente' && t.verificacion === 'Pendiente') {
        throw new ApiError(422, 'La tienda ya está pendiente de revisión.', 'UNPROCESSABLE_OPERATION')
      }
      if (verificacion === 'Verificada' && !t.documentos.some((d) => d.nombre.toUpperCase() === 'RUT' && d.recibido)) {
        throw new ApiError(422, 'Falta el RUT para aprobar.')
      }
      t.verificacion = verificacion
      t.motivoRechazo = verificacion === 'Rechazada' ? motivo!.trim() : undefined
      return mockDelay(t).then(avisar)
    }
    const base = `${API.tiendas}/${encodeURIComponent(id)}/verification`
    // D14: «Retirar verificación» vuelve a PENDING con review-request; el PATCH solo decide APPROVED o REJECTED.
    if (verificacion === 'Pendiente') {
      return apiClient.post<StoreVerificationDto>(`${base}/review-request`).then((r) => avisar(aTiendaAdmin(r.data)))
    }
    const body: VerificationDecisionRequestDto = verificacion === 'Verificada'
      ? { decision: 'APPROVED' }
      : { decision: 'REJECTED', reason: (motivo ?? '').trim() }
    return apiClient.patch<StoreVerificationDto>(base, body).then((r) => avisar(aTiendaAdmin(r.data)))
  },

  /** Anexo · F-24: administradores autorizados del almacén. */
  async listAdministrators(nit: string): Promise<StoreAdministratorDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay([...(admins()[nit] ?? [])]) }
    return apiClient.get<StoreAdministratorDto[]>(`${API.tiendas}/${encodeURIComponent(nit)}/administrators`).then((r) => (Array.isArray(r.data) ? r.data : []))
  },
  /** Asocia una cuenta con rol Tienda como administradora (idempotente: si ya estaba, no cambia nada). */
  async assignAdministrator(nit: string, userId: string): Promise<StoreAdministratorDto> {
    const uid = userId.trim()
    if (env.useMocks) {
      failIfScenario('conflicto')
      tienda(nit)
      const lista = (admins()[nit] ??= [])
      const ya = lista.find((a) => String(a.userId) === uid)
      if (ya) return mockDelay(ya)
      // Solo con datos de prueba: «u-…» son compradores (422) y «t-…» cuentas de Tienda.
      if (!uid.startsWith('t-')) throw new ApiError(422, 'Esa cuenta no tiene rol Tienda.', 'UNPROCESSABLE_OPERATION')
      const nuevo: StoreAdministratorDto = { id: lista.length + 1, userId: uid, storeNit: tienda(nit).nit, assignedById: 'a-1', assignedAt: new Date().toISOString() }
      lista.push(nuevo)
      return mockDelay(nuevo, 250)
    }
    return apiClient.put<StoreAdministratorDto>(`${API.tiendas}/${encodeURIComponent(nit)}/administrators/${encodeURIComponent(uid)}`).then((r) => r.data)
  },
  /**
   * SR-RF-119: elimina el almacén de forma definitiva (DELETE /api/v1/admin/stores/{nit}) → 204.
   * 404 si otro administrador ya lo eliminó: la pantalla lo trata como ya eliminado.
   */
  async remove(nit: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      tienda(nit)
      tiendas = db().tiendas.filter((x) => x.id !== nit)
      avisar(null)
      return mockDelay(undefined, 300)
    }
    await apiClient.delete(`${API.tiendas}/${encodeURIComponent(nit)}`)
    avisar(null)
  },
  /**
   * Extiende 15 días el periodo gratuito. Solo existe con datos de prueba: ni ms-tiendas
   * ni pagos tienen todavía una ruta para esto, así que con el back no se llama a nada.
   */
  async extendTrial(id: string): Promise<AdminStoreDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const t = tienda(id)
      if (t.suscripcion.estado !== 'Periodo gratuito') throw new ApiError(422, 'Solo se puede extender una tienda en periodo gratuito.')
      t.suscripcion = { ...t.suscripcion, proximo: `${t.suscripcion.proximo} + 15 días` }
      return mockDelay(t)
    }
    throw new ApiError(501, 'Esta acción todavía no está disponible.')
  },
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
/** «2025-03-04T…» → «mar 2025», como el «Aliada desde» del prototipo. */
const mesCorto = (iso?: string) => {
  const d = iso ? new Date(iso) : null
  return d && !Number.isNaN(d.getTime()) ? `${MESES_CORTOS[d.getUTCMonth()]} ${d.getUTCFullYear()}` : '—'
}
const SIN_DONACIONES = { pendientes: 0, enProceso: 0, recibidas: 0, rechazadas: 0 }

/** Respuesta de ms-tiendas → modelo de la pantalla. Las donaciones vienen de otro servicio y quedan en cero. */
export function aFundacionAdmin(r: FoundationResponseDto, previa?: Pick<AdminFoundationDto, 'donaciones'>): AdminFoundationDto {
  return {
    ...r,
    id: String(r.id),
    acceptedCategories: r.acceptedCategories ?? [],
    estado: r.active ? 'Activa' : 'Inactiva',
    aliadaDesde: mesCorto(r.registeredAt),
    donaciones: previa?.donaciones ?? { ...SIN_DONACIONES },
  }
}

/** Formulario → cuerpo de POST y PUT. Los opcionales vacíos van como null y los ids numéricos como número. */
export function aFundacionRequest(d: FoundationFormDto): FoundationRequestDto {
  const t = (s: string) => s.trim()
  const opcional = (s: string) => (t(s) ? t(s) : null)
  const id = t(d.representativeId)
  return {
    name: t(d.name),
    nit: t(d.nit),
    neighborhood: t(d.neighborhood),
    description: opcional(d.description),
    address: t(d.address),
    phone: opcional(d.phone),
    email: t(d.email),
    latitude: Number(t(d.latitude).replace(',', '.')),
    longitude: Number(t(d.longitude).replace(',', '.')),
    acceptedCategories: [...d.acceptedCategories],
    representativeId: /^\d+$/.test(id) ? Number(id) : id,
    legalEntityCertificateUrl: t(d.legalEntityCertificateUrl),
    supportedCauses: opcional(d.supportedCauses),
    openingHours: opcional(d.openingHours),
    donationPolicies: opcional(d.donationPolicies),
  }
}

/** Fundación guardada → valores iniciales del formulario de edición. */
export function aFormularioFundacion(f: AdminFoundationDto, representativeName = ''): FoundationFormDto {
  const s = (v: unknown) => (v == null ? '' : String(v))
  return {
    name: f.name, nit: f.nit, email: f.email, phone: s(f.phone), neighborhood: f.neighborhood, address: f.address,
    description: s(f.description), latitude: s(f.latitude), longitude: s(f.longitude), acceptedCategories: [...(f.acceptedCategories ?? [])],
    representativeId: s(f.representativeId), representativeName, legalEntityCertificateUrl: s(f.legalEntityCertificateUrl), certificateName: '',
    supportedCauses: s(f.supportedCauses), openingHours: s(f.openingHours), donationPolicies: s(f.donationPolicies),
  }
}

/** ?reason= solo cuando el admin escribió algo (sin motivo el back pone su texto por defecto al desactivar). */
const conMotivo = (reason?: string) => (reason?.trim() ? { params: { reason: reason.trim() } } : undefined)

export const adminFoundationService = {
  /** SR-RF-63: GET /api/v1/admin/foundations. Acepta lista o página ({ content }). */
  async list(): Promise<AdminFoundationDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay(db().fundaciones) }
    const r = await apiClient.get<FoundationResponseDto[] | { content?: FoundationResponseDto[] }>(API.fundaciones)
    const rows = Array.isArray(r.data) ? r.data : r.data?.content ?? []
    return rows.map((f) => aFundacionAdmin(f))
  },
  /** SR-RF-64: GET /api/v1/admin/foundations/{id}. */
  async get(id: string): Promise<AdminFoundationDto> {
    if (env.useMocks) { failIfScenario(); return mockDelay(fundacion(id)) }
    return apiClient.get<FoundationResponseDto>(`${API.fundaciones}/${encodeURIComponent(id)}`).then((r) => aFundacionAdmin(r.data))
  },
  /** SR-RF-63: sube el PDF con POST /api/v1/admin/foundations/certificates (multipart, campo file) y devuelve la URL para legalEntityCertificateUrl. */
  async uploadCertificate(file: File): Promise<string> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(`https://mock.styleradar.co/foundations/certificates/${encodeURIComponent(file.name)}`, 300)
    }
    const body = new FormData()
    body.append('file', file)
    const r = await apiClient.post<string | { url?: string; legalEntityCertificateUrl?: string }>(`${API.fundaciones}/certificates`, body)
    const url = typeof r.data === 'string' ? r.data : r.data?.url ?? r.data?.legalEntityCertificateUrl ?? ''
    if (!url) throw new ApiError(500, 'No pudimos subir el certificado. Intenta de nuevo.')
    return url
  },
  /** SR-RF-63: registra una fundación aliada (queda activa y exenta de suscripción). */
  async create(data: FoundationFormDto): Promise<AdminFoundationDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      validar(data)
      const f = aFundacionAdmin({ ...aFundacionRequest(data), id: `fd-${Date.now().toString(36)}`, active: true, registeredAt: new Date().toISOString() })
      db().fundaciones.push(f)
      return mockDelay(f, 600)
    }
    return apiClient.post<FoundationResponseDto>(API.fundaciones, aFundacionRequest(data)).then((r) => aFundacionAdmin(r.data))
  },
  /** SR-RF-64: PUT /api/v1/admin/foundations/{id}. No cambia el estado ni la fecha de registro. */
  async update(id: string, data: FoundationFormDto): Promise<AdminFoundationDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      validar(data, id)
      const f = fundacion(id)
      return mockDelay(Object.assign(f, aFundacionRequest(data)), 500)
    }
    return apiClient.put<FoundationResponseDto>(`${API.fundaciones}/${encodeURIComponent(id)}`, aFundacionRequest(data)).then((r) => aFundacionAdmin(r.data))
  },
  /**
   * SR-RF-65: PATCH …/{id}/deactivate?reason= o …/{id}/activate?reason=. Una fundación inactiva no recibe
   * donaciones nuevas ni aparece en el radar; su historial se conserva.
   */
  async setState(id: string, estado: AdminFoundationDto['estado'], reason?: string): Promise<AdminFoundationDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const f = fundacion(id)
      if (f.estado === estado) {
        throw new ApiError(409, estado === 'Inactiva' ? 'La fundación aliada ya se encuentra desactivada' : 'La fundación aliada ya se encuentra activa', 'CONFLICT')
      }
      f.estado = estado
      f.active = estado === 'Activa'
      return mockDelay(f)
    }
    const accion = estado === 'Inactiva' ? 'deactivate' : 'activate'
    return apiClient.patch<FoundationResponseDto>(`${API.fundaciones}/${encodeURIComponent(id)}/${accion}`, undefined, conMotivo(reason))
      .then((r) => aFundacionAdmin(r.data))
  },
  /**
   * SR-RF-120: elimina la fundación de forma definitiva (DELETE /api/v1/admin/foundations/{id}) → 204.
   * 404 si otro administrador ya la eliminó: la pantalla lo trata como ya eliminada.
   */
  async remove(id: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      fundacion(id)
      fundaciones = db().fundaciones.filter((x) => x.id !== id)
      avisar(null)
      return mockDelay(undefined, 300)
    }
    await apiClient.delete(`${API.fundaciones}/${encodeURIComponent(id)}`)
    avisar(null)
  },
}

function toAdminPlaylistDto(p: Record<string, any>): AdminPlaylistDto {
  return {
    id: String(p.id ?? ''),
    nombre: p.nombre || '',
    creador: p.creador?.nombre || p.usuarioId || (typeof p.creador === 'string' ? p.creador : ''),
    meGusta: Number(p.likes ?? p.meGusta ?? 0),
    guardados: Number(p.guardados ?? 0),
    prendas: typeof p.totalPrendas === 'number'
      ? p.totalPrendas
      : Array.isArray(p.prendas)
        ? p.prendas.length
        : Number(p.prendas ?? 0),
    destacada: Boolean(p.destacada),
  }
}

export const adminPlaylistService = {
  /** Playlists públicas ordenadas por interacción (me gusta + guardados × 2). */
  async list(): Promise<AdminPlaylistDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay([...db().playlists].sort((a, b) => interaccion(b) - interaccion(a))) }
    const r = await apiClient.get<any>('/api/v1/playlists/popular')
    const rows: Record<string, any>[] = Array.isArray(r.data)
      ? r.data
      : Array.isArray(r.data?.content)
        ? r.data.content
        : []
    return rows.map(toAdminPlaylistDto).sort((a, b) => interaccion(b) - interaccion(a))
  },
  /** Destaca o quita del inicio. Máximo tres destacadas. */
  async setFeatured(id: string, destacada: boolean): Promise<AdminPlaylistDto> {
    if (env.useMocks) {
      if (destacada) failIfScenario('conflicto')
      else failIfScenario()
      const p = db().playlists.find((x) => x.id === id)
      if (!p) throw new ApiError(404, 'Esa playlist no existe.')
      if (destacada && !p.destacada && db().playlists.filter((x) => x.destacada).length >= MAX_DESTACADAS) {
        throw new ApiError(422, `Ya hay ${MAX_DESTACADAS} playlists destacadas. Quita una primero.`)
      }
      p.destacada = destacada
      return mockDelay(p, 250)
    }
    const url = `/api/v1/playlists/${encodeURIComponent(id)}/featured`
    const r = destacada ? await apiClient.put<any>(url) : await apiClient.delete<any>(url)
    return r.data ? { ...toAdminPlaylistDto(r.data), destacada } : { id, nombre: '', creador: '', meGusta: 0, guardados: 0, prendas: 0, destacada }
  },
}
