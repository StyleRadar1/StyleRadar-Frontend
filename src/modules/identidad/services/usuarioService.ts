import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { MENSAJES } from '@/modules/core/api/mensajes'
import { env } from '@/configs/env'
import { PERFILES_BASE, USUARIOS_BASE, perfilNuevo } from '../mocks/usuarios'
import type { ActualizarPerfilDto, CambioEstadoDto, PerfilDto, UsuarioAdminDto } from '../types/usuario.dto'

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
  perfiles[u.id] = perfilNuevo(u.id, u.nombre, u.correo)
}

function perfilDeSesion(): PerfilDto {
  const s = mockSessionUser() as { id: string; name: string; email?: string } | null
  if (!s) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  perfiles[s.id] ??= perfilNuevo(s.id, s.name, s.email ?? '')
  return perfiles[s.id]
}

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

  /** RF-03 a RF-06: perfil de la persona con sesión. */
  async me(): Promise<PerfilDto> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(perfilDeSesion())
    }
    return apiClient.get<PerfilDto>('/api/usuarios/me').then((r) => r.data)
  },

  async updateMe(body: ActualizarPerfilDto): Promise<PerfilDto> {
    if (env.useMocks) {
      failIfScenario()
      const p = perfilDeSesion()
      Object.assign(p, structuredClone(body))
      const fila = usuarios.find((x) => x.id === p.id)
      if (fila) { fila.nombre = p.nombre; fila.barrio = p.barrio }
      return mockDelay(p, 400)
    }
    return apiClient.put<PerfilDto>('/api/usuarios/me', body).then((r) => r.data)
  },
}
