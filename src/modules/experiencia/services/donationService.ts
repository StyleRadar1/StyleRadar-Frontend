import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { FOUNDATIONS, seedDonations } from '../mocks/secondHand'
import { isoDay } from '../utils/dates'
import { SIGUIENTE, type DonationDto, type DonationRequestDto, type DonationStatusRequestDto, type EstadoDonacion, type FoundationDto } from '../types/donation.dto'

let store: DonationDto[] | null = null
const db = () => (store ??= seedDonations())
export const resetDonationMock = () => { store = null }

/** En la demo, la cuenta de fundación (f-1) representa a Fundación Abrigo Bogotá. */
const MOCK_FOUNDATION_OF: Record<string, string> = { 'f-1': 'abrigo' }

export const donationService = {
  /** RF-44: fundaciones ordenadas por cercanía, con las categorías que reciben. */
  async foundations(): Promise<FoundationDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay([...FOUNDATIONS].sort((a, b) => a.distanciaKm - b.distanciaKm)) }
    return apiClient.get<FoundationDto[]>('/api/donations/foundations').then((r) => r.data)
  },

  /** RF-42, RF-45 y RF-48: solicitud con fotos y logística desde el primer formulario. */
  async create(data: DonationRequestDto, files: File[]): Promise<DonationDto> {
    if (env.useMocks) {
      failIfScenario('duplicado')
      const u = mockSessionUser()
      if (!u) throw new ApiError(401, 'Tu sesión venció, vuelve a iniciar sesión.')
      if (MOCK_FOUNDATION_OF[u.id] === data.fundacionId) {
        throw new ApiError(400, 'Revisa los datos. La donación debe ir a una fundación, no a tu propia cuenta.', {
          fundacionId: 'La donación debe ir a una fundación, no a tu propia cuenta.',
        })
      }
      const f = FOUNDATIONS.find((x) => x.id === data.fundacionId)
      if (!f || !f.activa) throw new ApiError(422, 'Esa fundación no está recibiendo donaciones.')
      if (!f.categorias.includes(data.prenda.categoria)) throw new ApiError(422, `${f.nombre} no recibe ${data.prenda.categoria.toLowerCase()}.`)
      const dup = db().find((d) => d.donante.id === u.id && d.fundacion.id === f.id && d.prenda.titulo === data.prenda.titulo && d.estado === 'PENDIENTE')
      if (dup) throw new ApiError(409, 'Ya enviaste esta misma donación a esa fundación y sigue pendiente.')
      const d: DonationDto = { id: `d-${Date.now().toString(36)}`, fundacion: { id: f.id, nombre: f.nombre }, donante: { id: u.id, nombre: u.name }, prenda: data.prenda,
        fotos: files.map((x) => URL.createObjectURL(x)), logistica: { ...data.logistica, puntoNombre: f.puntos.find((p) => p.id === data.logistica.puntoId)?.nombre },
        estado: 'PENDIENTE', creadaEn: isoDay() }
      db().unshift(d)
      return mockDelay(d, 700)
    }
    const form = new FormData()
    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    files.forEach((f) => form.append('files', f))
    return apiClient.post<DonationDto>('/api/donations', form).then((r) => r.data)
  },

  /** RF-46: solicitudes de la fundación del representante (el backend filtra por token). */
  async forMyFoundation(): Promise<DonationDto[]> {
    if (env.useMocks) {
      failIfScenario('sin-permiso')
      const fid = MOCK_FOUNDATION_OF[mockSessionUser()?.id ?? '']
      if (!fid) throw new ApiError(403, 'Tu cuenta no representa a ninguna fundación.')
      return mockDelay(db().filter((d) => d.fundacion.id === fid))
    }
    return apiClient.get<DonationDto[]>('/api/donations/foundation/requests').then((r) => r.data)
  },

  /** RF-47 y RF-49: aprobar, rechazar, iniciar recogida o confirmar recepción. */
  async setStatus(id: string, body: DonationStatusRequestDto): Promise<DonationDto> {
    if (env.useMocks) {
      failIfScenario('conflicto', 'sin-permiso')
      const d = db().find((x) => x.id === id)
      if (!d) throw new ApiError(404, 'Esa solicitud ya no existe.')
      if (d.fundacion.id !== MOCK_FOUNDATION_OF[mockSessionUser()?.id ?? '']) throw new ApiError(403, 'Esta solicitud es de otra fundación.')
      if (!SIGUIENTE[d.estado].includes(body.estado)) throw new ApiError(409, `No se puede pasar de ${d.estado} a ${body.estado}.`)
      if (body.estado === 'RECHAZADA' && (body.justificacion ?? '').trim().length < 10) throw new ApiError(422, 'Escribe por qué la rechazas (mínimo 10 caracteres).')
      if (body.estado === 'ENTREGADA' && d.logistica.fecha > isoDay()) throw new ApiError(409, 'Aún no llega la fecha acordada para la entrega.')
      d.estado = body.estado as EstadoDonacion
      if (body.justificacion) d.justificacion = body.justificacion.trim()
      if (body.estado === 'ENTREGADA') d.comprobante = { codigo: `SR-DON-${id.replace(/\W/g, '').slice(-4).toUpperCase().padStart(4, '0')}`, emitidoEn: isoDay() }
      return mockDelay({ ...d }, 500)
    }
    return apiClient.patch<DonationDto>(`/api/donations/${encodeURIComponent(id)}/status`, body).then((r) => r.data)
  },
}

