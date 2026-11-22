import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { seedFoundations, seedPlaylists, seedStores } from '../mocks/admin'
import {
  MAX_DESTACADAS, MOTIVO_RECHAZO_MAX, MOTIVO_RECHAZO_MIN, STORE_CATEGORY_LABEL, VERIFICACION_DE, interaccion,
  type AdminFoundationDto, type AdminPlaylistDto, type AdminStoreDto, type FoundationFormDto, type StoreAdministratorDto,
  type StoreVerificationDto, type StoreVerificationPageDto, type Verificacion, type VerificationDecisionRequestDto,
} from '../types/admin.dto'
import { erroresFundacion } from '../utils/validation'

/** Rutas del API Gateway para el administrador (/api/v1) */
const API = { tiendas: '/api/v1/admin/stores', fundaciones: '/api/v1/admin/fundaciones', playlists: '/api/v1/admin/playlists' }

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
const validar = (data: FoundationFormDto, selfId?: string, requireCertificado = false) => {
  const otras = db().fundaciones.filter((f) => f.id !== selfId)
  const errores = erroresFundacion(
    data,
    {
      nits: otras.map((f) => f.nit),
      nombres: otras.map((f) => f.nombre),
      representantes: otras.map((f) => f.representante),
    },
    { requireCertificado },
  )
  const fields: Record<string, string> = {}
  for (const [k, msg] of Object.entries(errores)) {
    if (msg) fields[k] = msg
  }
  const primero = Object.values(fields)[0]
  const duplicated = Boolean(
    errores.nit?.startsWith('Ya hay') ||
    errores.nombre?.startsWith('Ya hay') ||
    errores.representante?.startsWith('Esta persona'),
  )
  if (primero) throw new ApiError(duplicated ? 409 : 400, primero, fields)
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
  /** Extiende 15 días el periodo gratuito. */
  async extendTrial(id: string): Promise<AdminStoreDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const t = tienda(id)
      if (t.suscripcion.estado !== 'Periodo gratuito') throw new ApiError(422, 'Solo se puede extender una tienda en periodo gratuito.')
      t.suscripcion = { ...t.suscripcion, proximo: `${t.suscripcion.proximo} + 15 días` }
      return mockDelay(t)
    }
    // La suscripción es de pagos, no de ms-tiendas: esta ruta sigue igual hasta que ese equipo la defina.
    return apiClient.post<AdminStoreDto>(`/api/v1/admin/almacenes/${encodeURIComponent(id)}/extender-prueba`, { dias: 15 }).then((r) => r.data)
  },
}

export const adminFoundationService = {
  async list(): Promise<AdminFoundationDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay(db().fundaciones) }
    return apiClient.get<AdminFoundationDto[]>(API.fundaciones).then((r) => r.data)
  },
  async get(id: string): Promise<AdminFoundationDto> {
    if (env.useMocks) { failIfScenario(); return mockDelay(fundacion(id)) }
    return apiClient.get<AdminFoundationDto>(`${API.fundaciones}/${encodeURIComponent(id)}`).then((r) => r.data)
  },
  /** Registra una fundación aliada (queda activa y exenta de suscripción). */
  async create(data: FoundationFormDto): Promise<AdminFoundationDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      validar(data, undefined, true)
      const f: AdminFoundationDto = { ...trim(data), id: `fd-${Date.now().toString(36)}`, estado: 'Activa', aliadaDesde: 'nov 2026', donaciones: { pendientes: 0, enProceso: 0, recibidas: 0, rechazadas: 0 } }
      db().fundaciones.push(f)
      return mockDelay(f, 600)
    }
    return apiClient.post<AdminFoundationDto>(API.fundaciones, data).then((r) => r.data)
  },
  async update(id: string, data: FoundationFormDto): Promise<AdminFoundationDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      validar(data, id)
      return mockDelay(Object.assign(fundacion(id), trim(data)), 500)
    }
    return apiClient.put<AdminFoundationDto>(`${API.fundaciones}/${encodeURIComponent(id)}`, data).then((r) => r.data)
  },
  /** Una fundación inactiva no recibe donaciones nuevas ni aparece en el radar; su historial se conserva. */
  async setState(id: string, estado: AdminFoundationDto['estado']): Promise<AdminFoundationDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const f = fundacion(id)
      if (f.estado === estado && estado === 'Inactiva') throw new ApiError(409, 'Esta fundación ya está inactiva.')
      f.estado = estado
      return mockDelay(f)
    }
    return apiClient.put<AdminFoundationDto>(`${API.fundaciones}/${encodeURIComponent(id)}/estado`, { estado }).then((r) => r.data)
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
    const r = await apiClient.get<any>('/api/v1/playlists/populares')
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
    const url = `/api/v1/playlists/${encodeURIComponent(id)}/destacar`
    const r = destacada ? await apiClient.put<any>(url) : await apiClient.delete<any>(url)
    return r.data ? { ...toAdminPlaylistDto(r.data), destacada } : { id, nombre: '', creador: '', meGusta: 0, guardados: 0, prendas: 0, destacada }
  },
}

const trim = (d: FoundationFormDto): FoundationFormDto =>
  Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String(v).trim()])) as FoundationFormDto
