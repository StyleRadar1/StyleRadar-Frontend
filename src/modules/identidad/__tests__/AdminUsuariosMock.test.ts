import { beforeEach, describe, expect, it } from 'vitest'
import { errorDeMotivo } from '../hooks/useCambioEstado'
import { resetUsuariosMock, usuarioService } from '../services/usuarioService'

describe('datos de prueba de Admin · Usuarios (SR-RF-66)', () => {
  beforeEach(() => { resetUsuariosMock(); localStorage.clear() })

  it('pagina como el back: content[], page, size, totalElements, totalPages, first y last', async () => {
    const p0 = await usuarioService.listAdmin({ page: 0, size: 5 })
    expect(p0).toMatchObject({ page: 0, size: 5, totalElements: 14, totalPages: 3, first: true, last: false })
    expect(p0.content).toHaveLength(5)
    const p2 = await usuarioService.listAdmin({ page: 2, size: 5 })
    expect(p2).toMatchObject({ first: false, last: true })
    expect(p2.content).toHaveLength(4)
  })

  it('filtra por estado, rol y texto sin importar tildes', async () => {
    expect((await usuarioService.listAdmin({ status: 'INACTIVE' })).totalElements).toBe(2)
    expect((await usuarioService.listAdmin({ role: 'STORE_ADMIN' })).content.map((u) => u.name)).toEqual(['Luna Store'])
    expect((await usuarioService.listAdmin({ q: 'JULIAN' })).content.map((u) => u.name)).toEqual(['Julián Rincón'])
  })

  it('bloquear sin motivo responde 400 con errors.reasonValid y guarda la auditoría al cambiar', async () => {
    await expect(usuarioService.setStatus('u-2', { status: 'BLOCKED' })).rejects.toMatchObject({ status: 400, fields: { reasonValid: 'El bloqueo exige un motivo no vacío' } })
    const u = await usuarioService.setStatus('u-2', { status: 'BLOCKED', reason: 'Prendas falsas' })
    expect(u).toMatchObject({ accountStatus: 'BLOCKED', statusChangeReason: 'Prendas falsas' })
    expect(u.statusChangedAt).toBeTruthy()
  })

  it('valida el motivo en el front: obligatorio al bloquear y hasta 1000 caracteres', () => {
    expect(errorDeMotivo('BLOCKED', '  ')).toBe('Escribe el motivo del bloqueo.')
    expect(errorDeMotivo('INACTIVE', '')).toBeNull()
    expect(errorDeMotivo('ACTIVE', 'x'.repeat(1001))).toMatch(/1000/)
  })
})
