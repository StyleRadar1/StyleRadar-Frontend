import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { FOUNDATIONS, seedDonations } from '../mocks/secondHand'
import { isoDay } from '../utils/dates'
import { secondHandService } from './secondHandService'
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

export const normalizeDonation = (raw: any): DonationDto => {
  if (!raw) return raw
  const estado = raw.status || raw.estado || 'PENDIENTE'
  const logistica = raw.logistica || {
    modalidad: raw.deliveryMode === 'HOME_PICKUP' ? 'RECOGIDA' : 'ENTREGA_EN_PUNTO',
    fecha: raw.slotStart ? raw.slotStart.split('T')[0] : isoDay(),
    franja: raw.slotStart ? `${raw.slotStart.split('T')[1] || ''}` : '8:00 a 12:00',
    direccion: raw.deliveryPoint,
    puntoNombre: raw.deliveryPoint,
  }
  return {
    ...raw,
    id: String(raw.id),
    publicationId: raw.publicationId,
    donorId: raw.donorId,
    estado: estado === 'DELIVERED' ? 'ENTREGADA' : (estado === 'APPROVED' ? 'APROBADA' : (estado === 'REJECTED' ? 'RECHAZADA' : (estado === 'IN_PICKUP' ? 'EN_RECOGIDA' : estado))),
    status: raw.status || estado,
    justificacion: raw.rejectionReason || raw.justificacion,
    rejectionReason: raw.rejectionReason || raw.justificacion,
    fundacion: raw.fundacion || { id: String(raw.foundationId || 'f-1'), nombre: `Fundación #${raw.foundationId || 1}` },
    donante: raw.donante || { id: String(raw.donorId || 'u-1'), nombre: `Donante #${raw.donorId || 1}` },
    prenda: raw.prenda || {
      titulo: `Prenda donada #${raw.publicationId || raw.id}`,
      categoria: 'Prenda',
      talla: 'M',
      conservacion: 'BUENO',
      cantidad: 1,
      descripcion: raw.message || 'Donación benéfica',
    },
    fotos: raw.fotos || (raw.publication?.photos || []),
    logistica,
    comprobante: raw.receiptCode ? { codigo: raw.receiptCode, emitidoEn: raw.receptionDate || isoDay() } : raw.comprobante,
    creadaEn: raw.requestDate ? raw.requestDate.split('T')[0] : (raw.creadaEn || isoDay()),
  }
}

export const donationService = {
  /** RF-44: fundaciones ordenadas por cercanía, con las categorías que reciben. */
  async foundations(): Promise<FoundationDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay([...FOUNDATIONS].sort((a, b) => a.distanciaKm - b.distanciaKm)) }
    return apiClient
      .get<any[]>('/api/v1/donations/foundations')
      .catch(() => apiClient.get<any[]>('/api/v1/donaciones/foundations'))
      .then((r) => r.data.map((raw: any) => ({
        id: String(raw.id),
        nombre: raw.nombre,
        barrio: raw.barrio || 'Bogotá D.C.',
        distanciaKm: raw.distanciaKm ?? 0,
        categorias: raw.categoriasAceptadas || raw.categorias || [],
        categoriasAceptadas: raw.categoriasAceptadas || raw.categorias || [],
        activa: raw.activa ?? true,
        direccion: raw.direccion,
        puntos: raw.puntos || (raw.direccion ? [{ id: `p-${raw.id}`, nombre: raw.nombre, direccion: raw.direccion }] : []),
      })))
  },

  /** RF-42, RF-45 y RF-48: solicitud con fotos y logística desde el primer formulario. */
  async create(data: DonationRequestDto, files: File[] = []): Promise<DonationDto> {
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
      if (data.prenda && !f.categorias.includes(data.prenda.categoria)) throw new ApiError(422, `${f.nombre} no recibe ${data.prenda.categoria.toLowerCase()}.`)
      const dup = db().find((d) => d.donante.id === u.id && d.fundacion.id === f.id && d.prenda.titulo === data.prenda.titulo && d.estado === 'PENDIENTE')
      if (dup) throw new ApiError(409, 'Ya enviaste esta misma donación a esa fundación y sigue pendiente.')
      const d: DonationDto = {
        id: `d-${Date.now().toString(36)}`,
        fundacion: { id: f.id, nombre: f.nombre },
        donante: { id: u.id, nombre: u.name },
        prenda: data.prenda,
        fotos: files.map((x) => URL.createObjectURL(x)),
        logistica: { ...data.logistica, puntoNombre: f.puntos.find((p) => p.id === data.logistica?.puntoId)?.nombre },
        estado: 'PENDIENTE',
        creadaEn: isoDay(),
      }
      db().unshift(d)
      return mockDelay(d, 700)
    }
    if (data.publicationId) {
      return this.createDirect({
        publicationId: data.publicationId,
        foundationId: data.fundacionId,
        donorId: data.donorId || 101,
        message: data.prenda?.descripcion || data.message,
        deliveryMode: data.logistica?.modalidad,
        deliveryPoint: data.logistica?.direccion || 'Sede Fundación',
        pickupWindowStart: data.logistica?.fecha,
      })
    }

    // Si la donación se crea desde cero en el formulario libre:
    // 1. Subir fotos a Azure Blob Storage
    const photoUrls: string[] = []
    for (const f of files) {
      try {
        const up = await secondHandService.uploadPhoto(f)
        if (up.photoUrl) photoUrls.push(up.photoUrl)
      } catch {
        // En caso de fallo de red en foto individual
      }
    }

    // 2. Crear la publicación benéfica (esDonacion: true, price: 0) en ms-segunda-vida
    const pub = await secondHandService.create({
      titulo: data.prenda?.titulo || 'Prenda donada',
      descripcion: data.prenda?.descripcion || 'Donación benéfica',
      categoria: data.prenda?.categoria || 'Chaquetas',
      marca: 'Donación',
      talla: data.prenda?.talla || 'M',
      conservacion: data.prenda?.conservacion || 'BUENO',
      precio: 0,
      esDonacion: true,
      photos: photoUrls,
    })

    // 3. Crear la solicitud de donación formal vinculada a la publicación creada
    return this.createDirect({
      publicationId: pub.id,
      foundationId: data.fundacionId,
      donorId: data.donorId || 101,
      message: data.prenda?.descripcion || data.message,
      deliveryMode: data.logistica?.modalidad,
      deliveryPoint: data.logistica?.direccion || 'Sede Fundación',
      pickupWindowStart: data.logistica?.fecha,
    })
  },

  /** Solicitud directa oficial: POST /api/v1/donations (SR-RF-45) */
  async createDirect(body: DirectDonationRequestDto): Promise<DonationDto> {
    const mode = (body.deliveryProposal?.mode === 'RECOGIDA' || body.deliveryMode === 'RECOGIDA') ? 'HOME_PICKUP' : 'DROP_OFF_POINT'
    const point = body.deliveryProposal?.point || body.deliveryPoint || 'Sede Principal Fundación'
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowEnd = new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000)
    const startTime = body.deliveryProposal?.startTime || body.pickupWindowStart || tomorrow.toISOString().slice(0, 19)
    const endTime = body.deliveryProposal?.endTime || body.pickupWindowEnd || tomorrowEnd.toISOString().slice(0, 19)

    const payload = {
      publicationId: Number(body.publicationId) || body.publicationId,
      foundationId: Number(body.foundationId) || body.foundationId,
      message: body.message || 'Donación directa de prenda',
      deliveryMode: mode,
      deliveryPoint: point,
      startTime,
      endTime,
      deliveryProposal: {
        mode,
        deliveryMode: mode,
        point,
        deliveryPoint: point,
        startTime,
        endTime,
      },
    }

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
        logistica: {
          modalidad: (body.deliveryProposal?.mode as any) || (body.deliveryMode as any) || 'ENTREGA_EN_PUNTO',
          fecha: body.deliveryProposal?.startTime || isoDay(),
          franja: '8:00 a 12:00',
        },
        estado: 'PENDIENTE',
        creadaEn: isoDay(),
      }
      db().unshift(d)
      return mockDelay(d, 500)
    }
    return apiClient
      .post<any>('/api/v1/donations', payload)
      .catch(() => apiClient.post<any>('/api/v1/donaciones', payload))
      .then((r) => normalizeDonation(r.data))
  },

  /** Reclamar prenda donada: POST /api/v1/donations/claims (SR-P5-N05) */
  async claim(body: ClaimDonationRequestDto): Promise<DonationDto> {
    const payload = {
      publicationId: Number(body.publicationId) || body.publicationId,
      foundationId: Number(body.foundationId) || body.foundationId,
      message: body.message || 'Prenda reclamada de vitrina de donación',
    }

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
        estado: 'APROBADA',
        creadaEn: isoDay(),
      }
      db().unshift(d)
      return mockDelay(d, 500)
    }
    return apiClient
      .post<any>('/api/v1/donations/claims', payload)
      .catch(() => apiClient.post<any>('/api/v1/donaciones/claim', payload))
      .then((r) => normalizeDonation(r.data))
  },

  /** RF-46: solicitudes de la fundación del representante (GET /api/v1/donations/foundations/{foundationId}/requests). */
  async forMyFoundation(foundationId?: string): Promise<DonationDto[]> {
    if (env.useMocks) {
      failIfScenario('sin-permiso')
      const fid = foundationId || MOCK_FOUNDATION_OF[mockSessionUser()?.id ?? '']
      if (!fid) throw new ApiError(403, 'Tu cuenta no representa a ninguna fundación.')
      return mockDelay(db().filter((d) => d.fundacion.id === fid))
    }
    const fid = foundationId || 'mine'
    return apiClient
      .get<any[]>(`/api/v1/donations/foundations/${encodeURIComponent(fid)}/requests`)
      .catch(() => apiClient.get<any[]>('/api/v1/donations'))
      .catch(() => apiClient.get<any[]>('/api/v1/donaciones'))
      .then((r) => r.data.map(normalizeDonation))
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
    return apiClient
      .patch<any>(`/api/v1/donations/${encodeURIComponent(id)}/status`, body)
      .catch(() => apiClient.patch<any>(`/api/v1/donaciones/${encodeURIComponent(id)}/status`, body))
      .then((r) => normalizeDonation(r.data))
  },

  /** PATCH /api/v1/donations/{id}/decision (SR-RF-47) */
  async decide(id: string | number, body: DecideDonationRequestDto): Promise<DonationDto> {
    const payload = {
      foundationId: Number(body.foundationId) || body.foundationId,
      approve: Boolean(body.approve),
      reason: body.reason ?? null,
    }

    if (env.useMocks) {
      const nuevoEstado: EstadoDonacion = body.approve ? 'APROBADA' : 'RECHAZADA'
      return this.setStatus(String(id), {
        estado: nuevoEstado,
        justificacion: body.reason ?? undefined,
      })
    }
    return apiClient
      .patch<any>(`/api/v1/donations/${id}/decision`, payload)
      .catch(() => apiClient.patch<any>(`/api/v1/donaciones/${id}/decide`, payload))
      .then((r) => normalizeDonation(r.data))
  },

  /** PATCH /api/v1/donations/{id}/pickup */
  async schedulePickup(id: string | number, body: PickupDonationRequestDto): Promise<DonationDto> {
    const payload = {
      userId: Number(body.userId) || body.userId,
      deliveryPoint: body.deliveryPoint,
      startTime: body.startTime,
      endTime: body.endTime,
    }

    if (env.useMocks) {
      return this.setStatus(String(id), {
        estado: 'EN_RECOGIDA',
      })
    }
    return apiClient
      .patch<any>(`/api/v1/donations/${id}/pickup`, payload)
      .catch(() => apiClient.patch<any>(`/api/v1/donaciones/${id}/pickup`, payload))
      .then((r) => normalizeDonation(r.data))
  },

  /** PATCH /api/v1/donations/{id}/confirmation (SR-RF-49) */
  async confirmReception(id: string | number, body: ConfirmDonationRequestDto): Promise<DonationDto> {
    const payload = {
      foundationId: Number(body.foundationId) || body.foundationId,
    }

    if (env.useMocks) {
      return this.setStatus(String(id), {
        estado: 'ENTREGADA',
      })
    }
    return apiClient
      .patch<any>(`/api/v1/donations/${id}/confirmation`, payload)
      .catch(() => apiClient.patch<any>(`/api/v1/donaciones/${id}/confirm`, payload))
      .then((r) => normalizeDonation(r.data))
  },
}
