import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import AdminStoreDetailPage from '../pages/AdminStoreDetailPage'
import { adminStoreService } from '../services/adminService'
import type { StoreVerificationDto } from '../types/admin.dto'

const ROPERO: StoreVerificationDto = {
  nit: '9018801142', tradeName: 'Ropero 57', contactEmail: 'ropero57@correo.co', phone: '+57 601 555 0170',
  categories: ['VINTAGE', 'CASUAL'], verificationStatus: 'PENDING', rutPdfUrl: 'https://blob.test/rut-9018801142.pdf', legacyUnverified: false,
}
const pagina = (content: StoreVerificationDto[], page: number, last: boolean) => ({ data: { content, page, size: 100, totalElements: 2, totalPages: 2, first: page === 0, last } })

describe('admin de tiendas contra ms-tiendas (SR-RF-62 · F-15 · F-16 · F-24)', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('lee todas las páginas de /admin/stores/verifications y mapea los campos en inglés', async () => {
    const get = vi.spyOn(apiClient, 'get')
      .mockResolvedValueOnce(pagina([ROPERO], 0, false))
      .mockResolvedValueOnce(pagina([{ ...ROPERO, nit: '9001', tradeName: 'Luna', verificationStatus: 'APPROVED', rutPdfUrl: null }], 1, true))
    const lista = await adminStoreService.list()
    expect(get).toHaveBeenNthCalledWith(1, '/api/v1/admin/stores/verifications', { params: { page: 0, size: 100 } })
    expect(get).toHaveBeenNthCalledWith(2, '/api/v1/admin/stores/verifications', { params: { page: 1, size: 100 } })
    expect(lista[0]).toMatchObject({ id: '9018801142', nombre: 'Ropero 57', categoria: 'Vintage, Casual', correo: 'ropero57@correo.co', verificacion: 'Pendiente' })
    expect(lista[0].documentos).toEqual([{ nombre: 'RUT', recibido: true, url: 'https://blob.test/rut-9018801142.pdf' }])
    expect(lista[1]).toMatchObject({ verificacion: 'Verificada', documentos: [{ nombre: 'RUT', recibido: false }] })
  })

  it('aprueba y rechaza con PATCH /verification y solo { decision, reason }', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: { ...ROPERO, verificationStatus: 'APPROVED' } })
    await adminStoreService.setVerification('9018801142', 'Verificada')
    expect(patch).toHaveBeenCalledWith('/api/v1/admin/stores/9018801142/verification', { decision: 'APPROVED' })
    await adminStoreService.setVerification('9018801142', 'Rechazada', '  La cámara de comercio está vencida.  ')
    expect(patch).toHaveBeenLastCalledWith('/api/v1/admin/stores/9018801142/verification', { decision: 'REJECTED', reason: 'La cámara de comercio está vencida.' })
  })

  it('rechazar con motivo de menos de 10 o más de 1000 caracteres no llama al back', async () => {
    const patch = vi.spyOn(apiClient, 'patch')
    await expect(adminStoreService.setVerification('9018801142', 'Rechazada', 'corto')).rejects.toMatchObject({ status: 400 })
    await expect(adminStoreService.setVerification('9018801142', 'Rechazada', 'x'.repeat(1001))).rejects.toMatchObject({ status: 400 })
    expect(patch).not.toHaveBeenCalled()
  })

  it('«Retirar verificación» usa POST /verification/review-request (D14)', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: ROPERO })
    const t = await adminStoreService.setVerification('9018801142', 'Pendiente')
    expect(post).toHaveBeenCalledWith('/api/v1/admin/stores/9018801142/verification/review-request')
    expect(t.verificacion).toBe('Pendiente')
  })

  it('administradores del almacén: GET y PUT /administrators/{userId}', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [{ id: 1, userId: 7, storeNit: '9018801142' }] })
    expect(await adminStoreService.listAdministrators('9018801142')).toHaveLength(1)
    expect(get).toHaveBeenCalledWith('/api/v1/admin/stores/9018801142/administrators')
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: { id: 2, userId: 9, storeNit: '9018801142' } })
    await adminStoreService.assignAdministrator('9018801142', ' 9 ')
    expect(put).toHaveBeenCalledWith('/api/v1/admin/stores/9018801142/administrators/9')
  })

  it('extender el periodo gratuito no llama a ninguna ruta del back (no existe todavía)', async () => {
    const post = vi.spyOn(apiClient, 'post')
    await expect(adminStoreService.extendTrial('9018801142')).rejects.toMatchObject({ status: 501 })
    expect(post).not.toHaveBeenCalled()
  })

  it('el detalle abre el RUT que manda el back', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/admin/stores/9018801142/verification') return { data: ROPERO }
      return { data: [] }
    })
    render(<MemoryRouter initialEntries={['/admin/tiendas/9018801142']}><Routes><Route path="/admin/tiendas/:id" element={<AdminStoreDetailPage />} /></Routes></MemoryRouter>)
    const docs = await screen.findByRole('list', { name: 'Documentos' })
    expect(within(docs).getByRole('link', { name: /Abrir RUT/ })).toHaveAttribute('href', 'https://blob.test/rut-9018801142.pdf')
  })
  it('SR-RF-119: eliminar la tienda usa DELETE /api/v1/admin/stores/{nit}', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue({ status: 204, data: '' })
    await adminStoreService.remove('9018801142')
    expect(del).toHaveBeenCalledWith('/api/v1/admin/stores/9018801142')
  })
})
