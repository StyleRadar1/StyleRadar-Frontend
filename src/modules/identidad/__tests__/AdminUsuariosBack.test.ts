import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import { filtrosParaEnviar, usuarioService } from '../services/usuarioService'

const CUENTA = {
  id: 25, name: 'Mateo Pérez', email: 'mateo.p@correo.com', neighborhood: null, roles: ['BUYER'], accountStatus: 'BLOCKED',
  registeredAt: '2025-04-11T10:00:00Z', statusChangedAt: '2026-11-20T15:00:00Z', statusChangedBy: 1, statusChangeReason: 'Prendas falsas',
}

describe('admin de usuarios contra ms-usuarios (SR-RF-66 · F-12 · F-13 · F-14)', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('busca con GET /api/v1/admin/users, solo los filtros con valor, y lee content[] y la paginación', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { content: [CUENTA], page: 1, size: 20, totalElements: 21, totalPages: 2, first: false, last: true },
    })
    const page = await usuarioService.listAdmin({ status: 'BLOCKED', role: 'BUYER', q: '  mateo ', page: 1, size: 20 })
    expect(get).toHaveBeenCalledWith('/api/v1/admin/users', { params: { status: 'BLOCKED', role: 'BUYER', q: 'mateo', page: 1, size: 20 } })
    expect(page).toMatchObject({ page: 1, totalElements: 21, totalPages: 2, first: false, last: true })
    // El id numérico del back queda como texto y el barrio vacío como ''.
    expect(page.content[0]).toMatchObject({ id: '25', neighborhood: '', roles: ['BUYER'], accountStatus: 'BLOCKED', statusChangedBy: 1 })
  })

  it('respeta los límites del documento: q hasta 100, page desde 0 y size de 1 a 100', () => {
    expect(filtrosParaEnviar({ q: 'a'.repeat(150), page: -3, size: 500 })).toEqual({ q: 'a'.repeat(100), page: 0, size: 100 })
    expect(filtrosParaEnviar({ q: '   ', size: 0 })).toEqual({ page: 0, size: 1 })
  })

  it('abre el detalle con GET /api/v1/admin/users/{id}', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: CUENTA })
    const u = await usuarioService.getAdmin('25')
    expect(get).toHaveBeenCalledWith('/api/v1/admin/users/25')
    expect(u).toMatchObject({ id: '25', statusChangeReason: 'Prendas falsas' })
  })

  it('cambia el estado con PATCH /status y { status, reason }; sin motivo no se envía reason', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: CUENTA })
    await usuarioService.setStatus('25', { status: 'BLOCKED', reason: '  Prendas falsas  ' })
    expect(patch).toHaveBeenCalledWith('/api/v1/admin/users/25/status', { status: 'BLOCKED', reason: 'Prendas falsas' })
    await usuarioService.setStatus('25', { status: 'ACTIVE', reason: '   ' })
    expect(patch).toHaveBeenLastCalledWith('/api/v1/admin/users/25/status', { status: 'ACTIVE' })
  })
  it('SR-RF-115: eliminar la cuenta usa DELETE /api/v1/admin/users/{id}', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue({ status: 204, data: '' })
    await usuarioService.removeAdmin('25')
    expect(del).toHaveBeenCalledWith('/api/v1/admin/users/25')
  })
})
