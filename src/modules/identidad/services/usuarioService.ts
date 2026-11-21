import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { MENSAJES } from '@/modules/core/api/mensajes'
import { env } from '@/configs/env'
import { PERFILES_BASE, USUARIOS_BASE, perfilNuevo } from '../mocks/usuarios'
import {
  GARMENT_TYPES,
  type ActualizarPerfilDto, type CambioEstadoDto, type PerfilDto, type SizesByGarmentType, type UpdateUserRequestDto,
  type UserProfileDto, type UsuarioAdminDto,
} from '../types/usuario.dto'

/** Solo datos de prueba: con este barrio el guardado responde 400 con errores por campo. */
export const BARRIO_DEMO_400 = 'prueba-400'
/** Solo datos de prueba: cambiar el estado de estas cuentas responde 403 (Paula Méndez) y 404 (Felipe Castro). */
export const DEMO_ESTADO = { sinPermiso: 'u-12', noExiste: 'u-11' } as const

/* Estado de los datos de prueba: vive mientras la pestaña esté abierta. */
let usuarios: UsuarioAdminDto[] = structuredClone(USUARIOS_BASE)
let perfiles: Record<string, PerfilDto> = structuredClone(PERFILES_BASE)

/** Vuelve los datos de prueba a su estado inicial (lo usan las pruebas). */
export function resetUsuariosMock() {
  usuarios = structuredClone(USUARIOS_BASE)
  perfiles = structuredClone(PERFILES_BASE)
}

/** Registra en los datos de prueba una cuenta creada con el registro. */
export function agregarUsuarioMock(u: UsuarioAdminDto) {
  usuarios = [u, ...usuarios.filter((x) => x.id !== u.id)]
  perfiles[u.id] = perfilNuevo(u.id, u.nombre, u.correo, u.barrio)
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
  /** RF-66: lista para el administrador. */
  async list(): Promise<UsuarioAdminDto[]> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(usuarios)
    }
    return apiClient.get<UsuarioAdminDto[]>('/api/usuarios').then((r) => r.data)
  },

  /** RF-66: cambia una cuenta a Activa, Inactiva o Bloqueada. */
  async setStatus(id: string, body: CambioEstadoDto): Promise<UsuarioAdminDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      // Demostración de los errores del plan con datos de prueba.
      if (id === DEMO_ESTADO.sinPermiso) throw new ApiError(403, MENSAJES.permiso)
      if (id === DEMO_ESTADO.noExiste) usuarios = usuarios.filter((x) => x.id !== id) // «la borraron» mientras se veía la lista
      const u = usuarios.find((x) => x.id === id)
      if (!u) throw new ApiError(404, 'Esa cuenta ya no existe.')
      u.estado = body.estado
      return mockDelay(u, 250)
    }
    return apiClient.patch<UsuarioAdminDto>(`/api/usuarios/${encodeURIComponent(id)}/estado`, body).then((r) => r.data)
  },

  /** Anexo D15: perfil de una cuenta (GET /api/v1/users/{id}). El comprador solo puede ver el suyo. */
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
      if (fila) { fila.nombre = p.name; fila.barrio = p.neighborhood }
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
    if (cambiaTallas && Object.keys(sizes).length) {
      perfil = await apiClient.put<UserProfileDto>(`${base}/sizes`, { sizesByGarmentType: sizes }).then((r) => aPerfil(r.data))
    }
    guardarManiqui(id, body.maniqui)
    const final = perfil ?? (antes ? { ...antes } : await this.get(id))
    return { ...final, maniqui: body.maniqui }
  },
}
