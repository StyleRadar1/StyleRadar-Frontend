import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { FOUNDATIONS, seedDonations } from '../mocks/secondHand'
import { isoDay } from '../utils/dates'
import {
  SIGUIENTE,
  type ClaimDonationRequestDto,
  type ConfirmDonationRequestDto,
  type DecideDonationRequestDto,
  type DirectDonationRequestDto,
  type DonationDto,
  type DonationRequestDto,
  type DonationStatusRequestDto,
  type EstadoDonacion,
  type FoundationDto,
  type PickupDonationRequestDto,
} from '../types/donation.dto'

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
  async create(data: DonationRequestDto, files: File[] = []): Promise<DonationDto> {
    if (env.useMocks) {
      failIfScenario('duplicado')
      const u = mockSessionUser()
      if (!u) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
      const f = FOUNDATIONS.find((x) => x.id === data.fundacionId)
      if (!f || !f.activa) throw new ApiError(422, 'Esa fundación no está recibiendo donaciones.')
      if (data.prenda && !f.categorias.includes(data.prenda.categoria)) throw new ApiError(422, `${f.nombre} no recibe ${data.prenda.categoria.toLowerCase()}.`)
      const dup = db().find((d) => d.donante.id === u.id && d.fundacion.id === f.id && d.prenda.titulo === data.prenda.titulo && d.estado === 'PENDIENTE')
      if (dup) throw new ApiError(409, 'Ya enviaste esta misma donación a esa fundación y sigue pendiente.')
      const d: DonationDto = { id: `d-${Date.now().toString(36)}`, fundacion: { id: f.id, nombre: f.nombre }, donante: { id: u.id, nombre: u.name }, prenda: data.prenda,
        fotos: files.map((x) => URL.createObjectURL(x)), logistica: { ...data.logistica, puntoNombre: f.puntos.find((p) => p.id === data.logistica?.puntoId)?.nombre },
        estado: 'PENDIENTE', creadaEn: isoDay() }
      db().unshift(d)
      return mockDelay(d, 700)
    }
    const form = new FormData()
    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    files.forEach((f) => form.append('files', f))
    return apiClient.post<DonationDto>('/api/v1/donaciones', form).then((r) => r.data)
  },

  /** Solicitud directa oficial: POST /api/v1/donaciones */
  async createDirect(body: DirectDonationRequestDto): Promise<DonationDto> {
    if (env.useMocks) {
      failIfScenario('duplicado')
      const u = mockSessionUser()
      if (!u) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
      const f = FOUNDATIONS.find((x) => x.id === String(body.foundationId)) || FOUNDATIONS[0]
      const d: DonationDto = {
        id: `d-${Date.now().toString(36)}`,
        fundacion: { id: f.id, nombre: f.nombre },
        donante: { id: u.id, nombre: u.name },
        prenda: {
          titulo: `Publicación #${body.publicationId}`,
          categoria: 'Chaquetas',
          talla: 'M',
          conservacion: 'BUENO',
          cantidad: 1,
          descripcion: body.message || 'Donación directa de prenda',
        },
        fotos: [],
        logistica: { modalidad: 'ENTREGA_EN_PUNTO', fecha: isoDay(), franja: '8:00 a 12:00' },
        estado: 'PENDIENTE',
        creadaEn: isoDay(),
      }
      db().unshift(d)
      return mockDelay(d, 500)
    }
    return apiClient.post<DonationDto>('/api/v1/donaciones', body).then((r) => r.data)
  },

  /** Reclamar prenda donada: POST /api/v1/donaciones/claim */
  async claim(body: ClaimDonationRequestDto): Promise<DonationDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const u = mockSessionUser()
      if (!u) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
      const d: DonationDto = {
        id: `d-${Date.now().toString(36)}`,
        fundacion: { id: String(body.foundationId), nombre: 'Fundación Aliada' },
        donante: { id: 'donante-1', nombre: 'Donante Bogotano' },
        prenda: {
          titulo: `Prenda #${body.publicationId}`,
          categoria: 'Vestidos',
          talla: 'M',
          conservacion: 'COMO_NUEVO',
          cantidad: 1,
          descripcion: body.message || 'Prenda reclamada de vitrina de donación',
        },
        fotos: [],
        logistica: { modalidad: 'RECOGIDA', fecha: isoDay(), franja: '12:00 a 15:00' },
        estado: 'PENDIENTE',
        creadaEn: isoDay(),
      }
      db().unshift(d)
      return mockDelay(d, 500)
    }
    return apiClient.post<DonationDto>('/api/v1/donaciones/claim', body).then((r) => r.data)
  },

  /** RF-46: solicitudes de la fundación del representante (el backend filtra por token). */
  async forMyFoundation(): Promise<DonationDto[]> {
    if (env.useMocks) {
      failIfScenario()
      const fid = MOCK_FOUNDATION_OF[mockSessionUser()?.id ?? '']
      if (!fid) throw new ApiError(403, 'Tu cuenta no representa a ninguna fundación.')
      return mockDelay(db().filter((d) => d.fundacion.id === fid))
    }
    return apiClient.get<DonationDto[]>('/api/v1/donaciones').then((r) => r.data)
  },

  /** RF-47 y RF-49: aprobar, rechazar, iniciar recogida o confirmar recepción. */
  async setStatus(id: string, body: DonationStatusRequestDto): Promise<DonationDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
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
    return apiClient.patch<DonationDto>(`/api/v1/donaciones/${encodeURIComponent(id)}/status`, body).then((r) => r.data)
  },

  /** PATCH /api/v1/donaciones/{id}/decide */
  async decide(id: string | number, body: DecideDonationRequestDto): Promise<DonationDto> {
    if (env.useMocks) {
      const nuevoEstado: EstadoDonacion = body.approve ? 'APROBADA' : 'RECHAZADA'
      return this.setStatus(String(id), {
        estado: nuevoEstado,
        justificacion: body.reason ?? undefined,
      })
    }
    return apiClient.patch<DonationDto>(`/api/v1/donaciones/${id}/decide`, body).then((r) => r.data)
  },

  /** PATCH /api/v1/donaciones/{id}/pickup */
  async schedulePickup(id: string | number, body: PickupDonationRequestDto): Promise<DonationDto> {
    if (env.useMocks) {
      return this.setStatus(String(id), {
        estado: 'EN_RECOGIDA',
      })
    }
    return apiClient.patch<DonationDto>(`/api/v1/donaciones/${id}/pickup`, body).then((r) => r.data)
  },

  /** PATCH /api/v1/donaciones/{id}/confirm */
  async confirmReception(id: string | number, body: ConfirmDonationRequestDto): Promise<DonationDto> {
    if (env.useMocks) {
      return this.setStatus(String(id), {
        estado: 'ENTREGADA',
      })
    }
    return apiClient.patch<DonationDto>(`/api/v1/donaciones/${id}/confirm`, body).then((r) => r.data)
  },
}

