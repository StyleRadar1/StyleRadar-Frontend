import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { adminFoundationService } from '../services/adminService'
import { FUNDACION_VACIA, type FoundationResponseDto } from '../types/admin.dto'
import { erroresServidorFundacion } from '../utils/validation'

const ABRIGO: FoundationResponseDto = {
  id: 3, name: 'Fundación Abrigo Bogotá', nit: '900215884-1', neighborhood: 'Chapinero', description: null, address: 'Cl. 45 #13-40',
  phone: null, email: 'abrigo@styleradar.co', latitude: 4.6371, longitude: -74.0659, acceptedCategories: ['TOP', 'FOOTWEAR'],
  representativeId: 12, legalEntityCertificateUrl: 'https://blob.test/cert-3.pdf', supportedCauses: null, openingHours: null,
  donationPolicies: null, active: true, registeredAt: '2025-03-10T15:00:00Z',
}

describe('fundaciones contra ms-tiendas (SR-RF-63 a 65 · F-17 · F-18)', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('lista con GET /api/v1/admin/foundations y mapea active y registeredAt', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [ABRIGO, { ...ABRIGO, id: 4, active: false }] })
    const lista = await adminFoundationService.list()
    expect(get).toHaveBeenCalledWith('/api/v1/admin/foundations')
    expect(lista[0]).toMatchObject({ id: '3', name: 'Fundación Abrigo Bogotá', estado: 'Activa', aliadaDesde: 'mar 2025', donaciones: { pendientes: 0 } })
    expect(lista[1].estado).toBe('Inactiva')
  })

  it('registra con POST y el cuerpo en inglés: números, ids numéricos y opcionales vacíos en null', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: ABRIGO })
    await adminFoundationService.create({
      ...FUNDACION_VACIA, name: ' Fundación Abrigo Bogotá ', nit: '900215884-1', email: 'abrigo@styleradar.co', neighborhood: 'Chapinero',
      address: 'Cl. 45 #13-40', latitude: '4,6371', longitude: '-74.0659', acceptedCategories: ['TOP', 'FOOTWEAR'],
      representativeId: '12', representativeName: 'Mateo Pérez', legalEntityCertificateUrl: 'https://blob.test/cert-3.pdf', certificateName: 'cert.pdf',
    })
    expect(post).toHaveBeenCalledWith('/api/v1/admin/foundations', {
      name: 'Fundación Abrigo Bogotá', nit: '900215884-1', neighborhood: 'Chapinero', description: null, address: 'Cl. 45 #13-40', phone: null,
      email: 'abrigo@styleradar.co', latitude: 4.6371, longitude: -74.0659, acceptedCategories: ['TOP', 'FOOTWEAR'], representativeId: 12,
      legalEntityCertificateUrl: 'https://blob.test/cert-3.pdf', supportedCauses: null, openingHours: null, donationPolicies: null,
    })
  })

  it('sube el certificado como multipart a /certificates y lee la URL', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: 'https://blob.test/a.pdf' }).mockResolvedValueOnce({ data: { url: 'https://blob.test/b.pdf' } })
    const file = new File([new Uint8Array(8)], 'cert.pdf', { type: 'application/pdf' })
    expect(await adminFoundationService.uploadCertificate(file)).toBe('https://blob.test/a.pdf')
    expect(await adminFoundationService.uploadCertificate(file)).toBe('https://blob.test/b.pdf')
    const [url, body] = post.mock.calls[0]
    expect(url).toBe('/api/v1/admin/foundations/certificates')
    expect((body as FormData).get('certificate')).toBe(file)
  })

  it('edita con PUT /{id} y cambia el estado con PATCH /deactivate y /activate y ?reason= opcional', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: ABRIGO })
    await adminFoundationService.update('3', { ...FUNDACION_VACIA, name: 'X', representativeId: '12', latitude: '1', longitude: '2' })
    expect(put.mock.calls[0][0]).toBe('/api/v1/admin/foundations/3')
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: { ...ABRIGO, active: false } })
    const f = await adminFoundationService.setState('3', 'Inactiva', '  Cerró su sede.  ')
    expect(patch).toHaveBeenCalledWith('/api/v1/admin/foundations/3/deactivate', undefined, { params: { reason: 'Cerró su sede.' } })
    expect(f.estado).toBe('Inactiva')
    await adminFoundationService.setState('3', 'Activa', '   ')
    expect(patch).toHaveBeenLastCalledWith('/api/v1/admin/foundations/3/activate', undefined, undefined)
  })

  it('el 400 BUSINESS_RULE_VIOLATION marca el certificado y los errors caen en su campo', () => {
    expect(erroresServidorFundacion(new ApiError(400, 'x', 'BUSINESS_RULE_VIOLATION')))
      .toEqual({ certificate: 'El certificado de personería jurídica en PDF es obligatorio para registrar la fundación aliada' })
    expect(erroresServidorFundacion(new ApiError(400, 'x', { nit: 'El NIT es obligatorio' }, 'INVALID_DATA'))).toEqual({ nit: 'El NIT es obligatorio' })
  })
})
