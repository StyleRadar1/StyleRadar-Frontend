import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { seedFoundations, seedPlaylists, seedStores } from '../mocks/admin'
import { MAX_DESTACADAS, interaccion, type AdminFoundationDto, type AdminPlaylistDto, type AdminStoreDto, type FoundationFormDto, type Verificacion } from '../types/admin.dto'
import { erroresFundacion } from '../utils/validation'

/** Rutas del API Gateway para el administrador. Provisionales hasta tener el Swagger. */
const API = { tiendas: '/api/admin/tiendas', fundaciones: '/api/admin/fundaciones', playlists: '/api/admin/playlists' }

/** Se dispara cuando cambia algo que mueve las insignias de la barra lateral del admin. */
export const ADMIN_CHANGED = 'sr:admin'
const avisar = <T>(r: T) => { window.dispatchEvent(new Event(ADMIN_CHANGED)); return r }

let tiendas: AdminStoreDto[] | null = null
let fundaciones: AdminFoundationDto[] | null = null
let playlists: AdminPlaylistDto[] | null = null
const db = () => ({ tiendas: (tiendas ??= seedStores()), fundaciones: (fundaciones ??= seedFoundations()), playlists: (playlists ??= seedPlaylists()) })
/** Solo para pruebas: vuelve a los datos iniciales. */
export const resetAdminMock = () => { tiendas = null; fundaciones = null; playlists = null }

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
  const errores = erroresFundacion(data, db().fundaciones.filter((f) => f.id !== selfId).map((f) => f.nit))
  const primero = Object.values(errores)[0]
  if (primero) throw new ApiError(errores.nit?.startsWith('Ya hay') ? 409 : 400, primero)
}

export const adminStoreService = {
  async list(): Promise<AdminStoreDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay(db().tiendas) }
    return apiClient.get<AdminStoreDto[]>(API.tiendas).then((r) => r.data)
  },
  async get(id: string): Promise<AdminStoreDto> {
    if (env.useMocks) { failIfScenario(); return mockDelay(tienda(id)) }
    return apiClient.get<AdminStoreDto>(`${API.tiendas}/${encodeURIComponent(id)}`).then((r) => r.data)
  },
  /** Aprobar, rechazar (con motivo) o retirar la verificación. Solo una tienda verificada aparece en el radar. */
  async setVerification(id: string, verificacion: Verificacion, motivo?: string): Promise<AdminStoreDto> {
    if (verificacion === 'Rechazada' && (motivo ?? '').trim().length < 10) throw new ApiError(400, 'Escribe el motivo (mínimo 10 caracteres) para que la tienda sepa qué corregir.')
    if (env.useMocks) {
      failIfScenario('conflicto')
      const t = tienda(id)
      t.verificacion = verificacion
      t.motivoRechazo = verificacion === 'Rechazada' ? motivo!.trim() : undefined
      return mockDelay(t).then(avisar)
    }
    return apiClient.put<AdminStoreDto>(`${API.tiendas}/${encodeURIComponent(id)}/verificacion`, { verificacion, motivo }).then((r) => avisar(r.data))
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
    return apiClient.post<AdminStoreDto>(`${API.tiendas}/${encodeURIComponent(id)}/extender-prueba`, { dias: 15 }).then((r) => r.data)
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
      validar(data)
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
    if (env.useMocks) { failIfScenario('conflicto'); const f = fundacion(id); f.estado = estado; return mockDelay(f) }
    return apiClient.put<AdminFoundationDto>(`${API.fundaciones}/${encodeURIComponent(id)}/estado`, { estado }).then((r) => r.data)
  },
}

export const adminPlaylistService = {
  /** Playlists públicas ordenadas por interacción (me gusta + guardados × 2). */
  async list(): Promise<AdminPlaylistDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay([...db().playlists].sort((a, b) => interaccion(b) - interaccion(a))) }
    return apiClient.get<AdminPlaylistDto[]>(API.playlists).then((r) => r.data)
  },
  /** Destaca o quita del inicio. Máximo tres destacadas. */
  async setFeatured(id: string, destacada: boolean): Promise<AdminPlaylistDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const p = db().playlists.find((x) => x.id === id)
      if (!p) throw new ApiError(404, 'Esa playlist no existe.')
      if (destacada && !p.destacada && db().playlists.filter((x) => x.destacada).length >= MAX_DESTACADAS) {
        throw new ApiError(422, `Ya hay ${MAX_DESTACADAS} playlists destacadas. Quita una primero.`)
      }
      p.destacada = destacada
      return mockDelay(p, 250)
    }
    return apiClient.put<AdminPlaylistDto>(`${API.playlists}/${encodeURIComponent(id)}/destacada`, { destacada }).then((r) => r.data)
  },
}

const trim = (d: FoundationFormDto): FoundationFormDto =>
  Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String(v).trim()])) as FoundationFormDto
