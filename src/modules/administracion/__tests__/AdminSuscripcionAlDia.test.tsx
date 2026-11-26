import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { ApiError, apiClient } from '@/modules/core/api/apiClient'
import AdminStoresPage from '../pages/AdminStoresPage'
import { adminStoreService, conSuscripcionAlDia, nitsConSuscripcionAlDia } from '../services/adminService'
import type { StoreVerificationDto } from '../types/admin.dto'

const AL_DIA = '/api/v1/subscriptions/stores/up-to-date'
const tienda = (nit: string, tradeName: string): StoreVerificationDto => ({
  nit, tradeName, contactEmail: 'a@b.co', phone: '+57 1', categories: ['CASUAL'], verificationStatus: 'APPROVED', rutPdfUrl: null, legacyUnverified: false,
})
const LUNA = tienda('900555777-1', 'Luna Store')
const ROPERO = tienda('9018801142', 'Ropero 57')

/** Fabrica las respuestas del gateway; `alDia` es lo que devuelve Pagos (un Error simula que el endpoint aún no existe). */
const fingir = (alDia: unknown) => vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
  if (url === '/api/v1/admin/stores/verifications') return { data: { content: [LUNA, ROPERO], page: 0, size: 100, totalElements: 2, totalPages: 1, first: true, last: true } } as never
  if (url === AL_DIA) { if (alDia instanceof Error) throw alDia; return { data: alDia } as never }
  if (url.endsWith('/verification')) return { data: LUNA } as never
  throw new Error(`URL inesperada ${url}`)
})

describe('BUG-20: el panel de admin muestra la suscripción real (lista «al día» de Pagos)', () => {
  afterEach(() => vi.restoreAllMocks())

  it('la tienda cuyo NIT está en la lista sale «Activa»; la que no, sigue «Sin suscripción»', async () => {
    fingir({ taxIds: ['900555777-1'] })
    const [luna, ropero] = await adminStoreService.list()
    expect(luna.suscripcion.estado).toBe('Activa')
    expect(ropero.suscripcion.estado).toBe('Sin suscripción')
  })

  it('pide la lista a GET /api/v1/subscriptions/stores/up-to-date', async () => {
    const get = fingir({ taxIds: [] })
    await adminStoreService.list()
    expect(get).toHaveBeenCalledWith(AL_DIA)
  })

  it('compara solo los dígitos: puntos, guiones y espacios no importan', async () => {
    fingir({ taxIds: ['900.555.777-1', ' 901 880 114 2 '] })
    const lista = await adminStoreService.list()
    expect(lista.map((t) => t.suscripcion.estado)).toEqual(['Activa', 'Activa'])
  })

  it('si Pagos aún no tiene el endpoint (404) o falla, la lista carga igual y nada se marca como Activa', async () => {
    for (const e of [new ApiError(404, 'x'), new ApiError(403, 'x'), new ApiError(503, 'x'), new Error('red')]) {
      fingir(e)
      const lista = await adminStoreService.list()
      expect(lista).toHaveLength(2)
      expect(lista.every((t) => t.suscripcion.estado === 'Sin suscripción')).toBe(true)
      vi.restoreAllMocks()
    }
  })

  it('una respuesta rara no rompe nada ni marca de más', async () => {
    for (const rara of [null, {}, { taxIds: null }, { taxIds: 'x' }, { taxIds: [null, '', undefined] }]) {
      fingir(rara)
      expect((await adminStoreService.list()).every((t) => t.suscripcion.estado === 'Sin suscripción')).toBe(true)
      vi.restoreAllMocks()
    }
  })

  it('el detalle de una tienda también muestra «Activa»', async () => {
    fingir({ taxIds: ['900555777-1'] })
    expect((await adminStoreService.get('900555777-1')).suscripcion.estado).toBe('Activa')
  })

  it('tras aprobar o rechazar, la tienda no vuelve a «Sin suscripción»', async () => {
    fingir({ taxIds: ['900555777-1'] })
    vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: LUNA } as never)
    expect((await adminStoreService.setVerification('900555777-1', 'Verificada')).suscripcion.estado).toBe('Activa')
  })

  it('las funciones sueltas: sin lista no cambia nada; con lista marca solo a quien corresponde', async () => {
    fingir({ taxIds: ['111'] })
    expect(await nitsConSuscripcionAlDia()).toEqual(new Set(['111']))
    const base = (await adminStoreService.list())[0]
    expect(conSuscripcionAlDia(base, null)).toBe(base)
    expect(conSuscripcionAlDia(base, new Set(['999']))).toBe(base)
    expect(conSuscripcionAlDia(base, new Set(['9005557771'])).suscripcion).toMatchObject({ estado: 'Activa', proximo: '—', inicio: '—' })
  })

  it('en la pantalla de tiendas se ve «Activa» para la tienda al día', async () => {
    fingir({ taxIds: ['900555777-1'] })
    render(<MemoryRouter><AdminStoresPage /></MemoryRouter>)
    expect((await screen.findAllByText('Luna Store')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Activa').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sin suscripción').length).toBeGreaterThan(0) // Ropero 57
  })
})
