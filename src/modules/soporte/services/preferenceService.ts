import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { TIPOS_AVISO, type CanalAviso, type PreferenciaAvisoDto, type TipoNotificacion } from '../types/notification.dto'

const idSesion = () => {
  const id = mockSessionUser()?.id
  if (!id) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  return String(id)
}

/** SR-RF-105: canal de cada tipo de aviso (sin /me). */
const preferenciasUrl = () => `/api/v1/users/${encodeURIComponent(idSesion())}/notification-preferences`

const CANALES: CanalAviso[] = ['SOLO_PLATAFORMA', 'CORREO_Y_PLATAFORMA']
const esCanal = (v: unknown): v is CanalAviso => CANALES.includes(v as CanalAviso)
const esTipo = (v: unknown): v is TipoNotificacion => (TIPOS_AVISO as readonly string[]).includes(v as string)

let store: Record<string, Partial<Record<TipoNotificacion, CanalAviso>>> | null = null
/** Solo para pruebas: vuelve a los datos iniciales. */
export const resetPreferencesMock = () => { store = null }
const mine = () => {
  const u = mockSessionUser()
  if (!u) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  return ((store ??= {})[u.id] ??= {})
}

/** Una fila por cada tipo, aunque el servicio solo traiga algunas: lo que nunca se configuró es «solo plataforma». */
const completas = (filas: Partial<Record<TipoNotificacion, CanalAviso>>): PreferenciaAvisoDto[] =>
  TIPOS_AVISO.map((tipo) => ({ tipo, canal: filas[tipo] ?? 'SOLO_PLATAFORMA' }))

export const preferenceService = {
  async list(): Promise<PreferenciaAvisoDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay(completas(mine())) }
    const { data } = await apiClient.get<unknown>(preferenciasUrl())
    const filas = (Array.isArray(data) ? data : ((data as { content?: unknown[] } | null)?.content ?? [])) as Record<string, unknown>[]
    const m: Partial<Record<TipoNotificacion, CanalAviso>> = {}
    for (const f of filas) {
      const tipo = f.tipo ?? f.type
      if (esTipo(tipo) && esCanal(f.canal)) m[tipo] = f.canal
    }
    return completas(m)
  },

  /** Devuelve la fila guardada. 400 si el tipo o el canal no son válidos. */
  async set(tipo: TipoNotificacion, canal: CanalAviso): Promise<PreferenciaAvisoDto> {
    if (env.useMocks) {
      failIfScenario()
      mine()[tipo] = canal
      return mockDelay({ tipo, canal }, 200)
    }
    const { data } = await apiClient.put<{ canal?: unknown }>(`${preferenciasUrl()}/${encodeURIComponent(tipo)}`, { canal })
    return { tipo, canal: esCanal(data?.canal) ? data.canal : canal }
  },
}
