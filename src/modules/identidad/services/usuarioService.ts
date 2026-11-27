import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { MENSAJES } from '@/modules/core/api/mensajes'
import { env } from '@/configs/env'
import { aRol } from '@/modules/core/types/roles'
import { PERFILES_BASE, USUARIOS_BASE, perfilNuevo } from '../mocks/usuarios'
import {
  ADMIN_PAGE_SIZE_MAX, ADMIN_Q_MAX, GARMENT_TYPES, REASON_MAX,
  type ActualizarPerfilDto, type AdminUserDto, type AdminUsersQuery, type ChangeStatusRequestDto, type PageDto,
  type PerfilDto, type SizesByGarmentType, type UpdateUserRequestDto, type UserProfileDto,
} from '../types/usuario.dto'
import { normalizar } from '../utils/formato'

/** Solo datos de prueba: con este barrio el guardado responde 400 con errores por campo. */
export const BARRIO_DEMO_400 = 'prueba-400'
/** Solo datos de prueba: cambiar el estado de estas cuentas responde 403 (Paula Méndez) y 404 (Felipe Castro). */
export const DEMO_ESTADO = { sinPermiso: 'u-12', noExiste: 'u-11' } as const

/* Estado de los datos de prueba: vive mientras la pestaña esté abierta. */
let usuarios: AdminUserDto[] = structuredClone(USUARIOS_BASE)
let perfiles: Record<string, PerfilDto> = structuredClone(PERFILES_BASE)

/** Vuelve los datos de prueba a su estado inicial (lo usan las pruebas). */
export function resetUsuariosMock() {
  usuarios = structuredClone(USUARIOS_BASE)
  perfiles = structuredClone(PERFILES_BASE)
}

/** Registra en los datos de prueba una cuenta creada con el registro. */
export function agregarUsuarioMock(u: AdminUserDto) {
  usuarios = [u, ...usuarios.filter((x) => x.id !== u.id)]
  perfiles[u.id] = perfilNuevo(u.id, u.name, u.email, u.neighborhood ?? '')
}

/** Convierte la cuenta que manda ms-usuarios (id numérico, roles en lista) a la de la pantalla. */
export function aUsuarioAdmin(dto: AdminUserDto): AdminUserDto {
  return {
    ...dto,
    id: String(dto.id),
    name: dto.name ?? '',
    email: dto.email ?? '',
    neighborhood: dto.neighborhood ?? '',
    roles: (dto.roles ?? []).map((r) => aRol(r)).filter((r): r is NonNullable<typeof r> => !!r),
  }
}

const VACIA: PageDto<AdminUserDto> = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true }

/** Solo los filtros con valor y dentro de los límites del documento (q ≤ 100, page ≥ 0, size 1–100). */
export function filtrosParaEnviar(f: AdminUsersQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (f.status) out.status = f.status
  if (f.role) out.role = f.role
  const q = f.q?.trim().slice(0, ADMIN_Q_MAX)
  if (q) out.q = q
  out.page = Math.max(0, Math.floor(f.page ?? 0))
  out.size = Math.min(ADMIN_PAGE_SIZE_MAX, Math.max(1, Math.floor(f.size ?? 20)))
  return out
}

/** Búsqueda de prueba con las mismas reglas que el back: estado, rol, nombre o correo y una página. */
function buscarMock(f: AdminUsersQuery): PageDto<AdminUserDto> {
  const p = filtrosParaEnviar(f)
  const q = typeof p.q === 'string' ? normalizar(p.q) : ''
  const todas = usuarios.filter((u) => (!f.status || u.accountStatus === f.status)
    && (!f.role || u.roles.includes(f.role))
    && (!q || normalizar(`${u.name} ${u.email}`).includes(q)))
  const page = Number(p.page), size = Number(p.size)
  const totalPages = Math.ceil(todas.length / size)
  return {
    content: structuredClone(todas.slice(page * size, page * size + size)),
    page, size, totalElements: todas.length, totalPages, first: page === 0, last: page >= totalPages - 1,
  }
}

/** Solo datos de prueba: validaciones del PATCH /status (EX-02, EX-03, EX-04, EX-08). */
function validarCambioMock(u: AdminUserDto, body: ChangeStatusRequestDto) {
  if (!body.status) throw new ApiError(400, MENSAJES.datos, { status: 'El estado es obligatorio.' })
  if (body.status === 'BLOCKED' && !body.reason?.trim()) throw new ApiError(400, MENSAJES.datos, { reasonValid: 'El bloqueo exige un motivo no vacío' })
  if ((body.reason?.length ?? 0) > REASON_MAX) throw new ApiError(400, MENSAJES.datos, { reason: `El motivo admite hasta ${REASON_MAX} caracteres.` })
  if (u.accountStatus === body.status) throw new ApiError(403, MENSAJES.permiso)
}

/** Id de la persona con sesión: las rutas de ms-usuarios van por {id}, sin /me (D2 · D15 · F-32). */
function idDeSesion(): string {
  const s = mockSessionUser()
  if (!s?.id) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  return String(s.id)
}

function perfilMock(id: string): PerfilDto {
  const s = mockSessionUser() as { id: string; name: string; email?: string } | null
  if (!perfiles[id] && s && String(s.id) === id) perfiles[id] = perfilNuevo(id, s.name, s.email ?? '')
  const p = perfiles[id]
  if (!p) throw new ApiError(404, 'Esa cuenta ya no existe.')
  return p
}

/** Lo que el front guarda solo en el navegador (el documento de ms-usuarios no define maniquí ni plan). */
const MANIQUI_KEY = (id: string) => `sr_maniqui_${id}`
const leerManiqui = (id: string): PerfilDto['maniqui'] => {
  try { return localStorage.getItem(MANIQUI_KEY(id)) === 'HOMBRE' ? 'HOMBRE' : 'MUJER' } catch { return 'MUJER' }
}
const guardarManiqui = (id: string, m: PerfilDto['maniqui']) => {
  try { localStorage.setItem(MANIQUI_KEY(id), m) } catch { /* sin almacenamiento */ }
}

/** Convierte la respuesta de ms-usuarios al perfil de la pantalla. */
export function aPerfil(dto: UserProfileDto): PerfilDto {
  const id = String(dto.id)
  return {
    id,
    name: dto.name ?? '',
    email: dto.email ?? '',
    phone: dto.phone ?? '',
    neighborhood: dto.neighborhood ?? '',
    emailVerified: !!dto.emailVerified,
    registeredAt: dto.registeredAt ?? '',
    stylePreferences: dto.stylePreferences ?? [],
    usualSizes: dto.usualSizes ?? [],
    sizesByGarmentType: dto.sizesByGarmentType ?? {},
    maniqui: leerManiqui(id),
  }
}

/** Solo los tipos de prenda con al menos una talla (SR-RF-04: cada tipo enviado debe traer una). */
export function tallasParaEnviar(t: SizesByGarmentType): SizesByGarmentType {
  const out: SizesByGarmentType = {}
  for (const k of GARMENT_TYPES) if (t[k]?.length) out[k] = [...(t[k] as string[])]
  return out
}

const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const mismasTallas = (a: SizesByGarmentType, b: SizesByGarmentType) => igual(tallasParaEnviar(a), tallasParaEnviar(b))
const ordenados = (l: string[]) => [...l].sort()

/** ms-usuarios (8120) a través del API Gateway. */
export const usuarioService = {
  /** SR-RF-66: búsqueda del administrador con filtros y paginación (GET /api/v1/admin/users). */
  async listAdmin(filtros: AdminUsersQuery = {}): Promise<PageDto<AdminUserDto>> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(buscarMock(filtros))
    }
    return apiClient.get<PageDto<AdminUserDto>>('/api/v1/admin/users', { params: filtrosParaEnviar(filtros) })
      .then((r) => ({ ...VACIA, ...r.data, content: (r.data?.content ?? []).map(aUsuarioAdmin) }))
  },

  /** SR-RF-66: detalle de una cuenta con su auditoría (GET /api/v1/admin/users/{id}). */
  async getAdmin(id: string): Promise<AdminUserDto> {
    if (env.useMocks) {
      failIfScenario()
      const u = usuarios.find((x) => x.id === id)
      if (!u) throw new ApiError(404, 'Esa cuenta ya no existe.')
      return mockDelay(structuredClone(u))
    }
    return apiClient.get<AdminUserDto>(`/api/v1/admin/users/${encodeURIComponent(id)}`).then((r) => aUsuarioAdmin(r.data))
  },

  /**
   * SR-RF-115: elimina la cuenta de forma definitiva (DELETE /api/v1/admin/users/{id}) → 204.
   * 404 (USER_NOT_FOUND) si ya fue eliminada: la pantalla lo trata como ya eliminada.
   */
  async removeAdmin(id: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      if (!usuarios.some((x) => x.id === id)) throw new ApiError(404, 'Esa cuenta ya no existe.', 'USER_NOT_FOUND')
      usuarios = usuarios.filter((x) => x.id !== id)
      return mockDelay(undefined, 300)
    }
    await apiClient.delete(`/api/v1/admin/users/${encodeURIComponent(id)}`)
  },

  /** SR-RF-66: cambia una cuenta a Activa, Inactiva o Bloqueada (PATCH /api/v1/admin/users/{id}/status). */
  async setStatus(id: string, body: ChangeStatusRequestDto): Promise<AdminUserDto> {
    const reason = body.reason?.trim()
    const envio: ChangeStatusRequestDto = { status: body.status, ...(reason ? { reason } : {}) }
    if (env.useMocks) {
      failIfScenario('conflicto')
      // Demostración de los errores del plan con datos de prueba.
      if (id === DEMO_ESTADO.sinPermiso) throw new ApiError(403, MENSAJES.permiso)
      if (String(mockSessionUser()?.id) === id) throw new ApiError(403, MENSAJES.permiso) // EX-07: la propia cuenta
      if (id === DEMO_ESTADO.noExiste) usuarios = usuarios.filter((x) => x.id !== id) // «la borraron» mientras se veía la lista
      const u = usuarios.find((x) => x.id === id)
      if (!u) throw new ApiError(404, 'Esa cuenta ya no existe.')
      validarCambioMock(u, envio)
      Object.assign(u, {
        accountStatus: envio.status,
        statusChangedAt: new Date().toISOString(),
        statusChangedBy: mockSessionUser()?.id ?? null,
        statusChangeReason: envio.reason ?? null,
      })
      return mockDelay(structuredClone(u), 250)
    }
    return apiClient.patch<AdminUserDto>(`/api/v1/admin/users/${encodeURIComponent(id)}/status`, envio).then((r) => aUsuarioAdmin(r.data))
  },

  /** Anexo D15 · B-51: perfil de una cuenta (GET /api/v1/users/{id}). El comprador solo puede ver el suyo. */
  async get(id: string): Promise<PerfilDto> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(perfilMock(id))
    }
    return apiClient.get<UserProfileDto>(`/api/v1/users/${encodeURIComponent(id)}`).then((r) => aPerfil(r.data))
  },

  /** Perfil de la persona con sesión, por su id (sin /me). */
  async me(): Promise<PerfilDto> {
    return this.get(idDeSesion())
  },

  /**
   * Guarda el perfil con los endpoints del documento, solo los que cambiaron:
   * PUT /users/{id} (nombre, teléfono, barrio), PUT /users/{id}/style-preferences (SR-RF-03)
   * y PUT /users/{id}/sizes (SR-RF-04). El maniquí se guarda en el navegador.
   */
  async updateMe(body: ActualizarPerfilDto, actual?: PerfilDto): Promise<PerfilDto> {
    const id = idDeSesion()
    const antes = actual ?? (env.useMocks ? perfilMock(id) : undefined)
    const cambiaDatos = !antes || antes.name !== body.name || antes.phone !== body.phone || antes.neighborhood !== body.neighborhood
    const cambiaEstilos = !antes || !igual(ordenados(antes.stylePreferences), ordenados(body.stylePreferences))
    const cambiaTallas = !antes || !mismasTallas(antes.sizesByGarmentType, body.sizesByGarmentType)
    const sizes = tallasParaEnviar(body.sizesByGarmentType)

    if (env.useMocks) {
      failIfScenario()
      // Demostración del 400 al guardar: barrio «prueba-400» → errores por campo del servidor.
      if (body.neighborhood.trim().toLowerCase() === BARRIO_DEMO_400) {
        throw new ApiError(400, MENSAJES.datos, { neighborhood: 'Escribe un barrio de Bogotá.', validSizes: 'Una o más tallas no corresponden al tipo de prenda.' })
      }
      const p = perfilMock(id)
      Object.assign(p, structuredClone({ ...body, sizesByGarmentType: sizes }))
      p.usualSizes = sizes.TOP ?? []
      const fila = usuarios.find((x) => x.id === p.id)
      if (fila) { fila.name = p.name; fila.neighborhood = p.neighborhood }
      syncMeasurementsFromSizes(sizes)
      return mockDelay(p, 400)
    }

    const base = `/api/v1/users/${encodeURIComponent(id)}`
    let perfil: PerfilDto | undefined
    if (cambiaDatos) {
      const datos: UpdateUserRequestDto = {
        name: body.name,
        ...(body.phone ? { phone: body.phone } : {}),
        ...(body.neighborhood ? { neighborhood: body.neighborhood } : {}),
      }
      perfil = await apiClient.put<UserProfileDto>(base, datos).then((r) => aPerfil(r.data))
    }
    if (cambiaEstilos) {
      perfil = await apiClient.put<UserProfileDto>(`${base}/style-preferences`, { styles: body.stylePreferences }).then((r) => aPerfil(r.data))
    }
    if (cambiaTallas) {
      perfil = await apiClient.put<UserProfileDto>(`${base}/sizes`, { sizesByGarmentType: sizes }).then((r) => aPerfil(r.data))
    }
    guardarManiqui(id, body.maniqui)
    const final = perfil ?? (antes ? { ...antes } : await this.get(id))
    syncMeasurementsFromSizes(final.sizesByGarmentType)
    return { ...final, maniqui: body.maniqui }
  },
}

function syncMeasurementsFromSizes(sizes?: Record<string, string[] | undefined>) {
  if (!sizes || typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem('sr_user_measurements')
    const current = raw ? JSON.parse(raw) : { superior: 'M', inferior: '30', calzado: '38' }
    const next = {
      superior: sizes.TOP?.[0] || current.superior || 'M',
      inferior: sizes.BOTTOM?.[0] || current.inferior || '30',
      calzado: sizes.FOOTWEAR?.[0] || current.calzado || '38',
    }
    localStorage.setItem('sr_user_measurements', JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('sr:profile-sizes-updated', { detail: next }))
  } catch {
    /* ignore storage errors */
  }
}
