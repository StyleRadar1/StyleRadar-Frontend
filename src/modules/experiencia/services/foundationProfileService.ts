import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { FOUNDATION_PROFILES } from '../mocks/foundationProfile'
import type { FoundationProfileDto } from '../types/foundationProfile.dto'

/** En la demo, la cuenta de fundación (f-1) representa a Fundación Abrigo Bogotá. */
const MOCK_FOUNDATION_OF: Record<string, string> = { 'f-1': 'abrigo' }

const DEFAULT_FOTOS = {
  portada: '/img/fundaciones/abrigo-trabajo.jpg',
  trabajo: '/img/fundaciones/abrigo-trabajo.jpg',
  donaciones: '/img/fundaciones/abrigo-donaciones.jpg',
}

function normalizeFoundationProfile(raw: Partial<FoundationProfileDto> | null | undefined): FoundationProfileDto {
  const data = raw ?? {}
  const fotos = data.fotos ?? ({} as Partial<FoundationProfileDto['fotos']>)
  return {
    ...(data as FoundationProfileDto),
    id: data.id ?? '',
    nombre: data.nombre || 'Fundación',
    activa: data.activa ?? true,
    aQuienAyudamos: data.aQuienAyudamos ?? '',
    queHacemos: Array.isArray(data.queHacemos) ? data.queHacemos : [],
    queRecibimos: Array.isArray(data.queRecibimos) ? data.queRecibimos : [],
    necesidades: Array.isArray(data.necesidades) ? data.necesidades : [],
    contacto: {
      direccion: data.contacto?.direccion ?? '',
      horario: data.contacto?.horario ?? '',
      telefono: data.contacto?.telefono ?? '',
      web: data.contacto?.web ?? '',
      correo: data.contacto?.correo ?? '',
    },
    fotos: {
      portada: fotos.portada || DEFAULT_FOTOS.portada,
      trabajo: fotos.trabajo || DEFAULT_FOTOS.trabajo,
      donaciones: fotos.donaciones || DEFAULT_FOTOS.donaciones,
    },
  }
}

export const foundationProfileService = {
  /** Página de la fundación del representante con sesión (el backend la toma del token). */
  async mine(): Promise<FoundationProfileDto> {
    if (env.useMocks) {
      failIfScenario()
      const p = FOUNDATION_PROFILES[MOCK_FOUNDATION_OF[mockSessionUser()?.id ?? ''] ?? '']
      if (!p) throw new ApiError(403, 'Tu cuenta no representa a ninguna fundación.')
      return mockDelay(p)
    }
    return apiClient
      .get<FoundationProfileDto>('/api/v1/donations/foundations/representative')
      .then((r) => normalizeFoundationProfile(r.data))
  },
}
