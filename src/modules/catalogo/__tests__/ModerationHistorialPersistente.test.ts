import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import { useModeration } from '../hooks/useModeration'
import { guardarDecision, leerHistorial, MAX_HISTORIAL, nuevaDecision } from '../services/moderationHistoryStore'

const pendiente = (id: string, publicador = 'Almacén Pruebas QA') => ({
  id, almacenId: 'a-1', titulo: `Prenda ${id}`, publicador, tipoPublicador: 'Tienda', tipo: 'Catálogo', precio: 100000,
  fecha: '2026-11-26T10:00:00', imagen: '', categoria: 'Camiseta', tallas: ['M'],
})
const sesion = (id: string) => localStorage.setItem('sr_user', JSON.stringify({ id, name: 'Admin', role: 'STYLERADAR_ADMIN' }))

describe('BUG-19: el historial de decisiones no se pierde al cambiar de pestaña ni al recargar', () => {
  beforeEach(() => {
    localStorage.clear(); sesion('4')
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [pendiente('p-1'), pendiente('p-2'), pendiente('p-3', 'Otra tienda')] } as never)
    vi.spyOn(apiClient, 'put').mockResolvedValue({ data: undefined } as never)
  })
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })

  /** «Volver a entrar» a la pantalla: un montaje nuevo, sin el estado del anterior. */
  const entrar = async () => {
    const r = renderHook(() => useModeration())
    await waitFor(() => expect(r.result.current.loading).toBe(false))
    return r
  }

  it('lo aprobado sigue en el historial después de desmontar y volver a entrar', async () => {
    const primera = await entrar()
    await act(async () => { await primera.result.current.approve('p-1') })
    expect(primera.result.current.history.map((h) => h.itemId)).toEqual(['p-1'])
    primera.unmount() // cambiar de pestaña o recargar

    const segunda = await entrar()
    expect(segunda.result.current.history).toHaveLength(1)
    expect(segunda.result.current.history[0]).toMatchObject({ itemId: 'p-1', titulo: 'Prenda p-1', aprobado: true })
  })

  it('lo rechazado conserva el motivo y una fecha real (no el texto «Hoy»)', async () => {
    const primera = await entrar()
    await act(async () => { await primera.result.current.reject('p-2', 'Foto borrosa') })
    primera.unmount()

    const [h] = (await entrar()).result.current.history
    expect(h).toMatchObject({ itemId: 'p-2', aprobado: false, motivo: 'Foto borrosa' })
    expect(Number.isNaN(new Date(h.fecha).getTime())).toBe(false)
    expect(h.fecha).not.toBe('Hoy')
  })

  it('la más reciente va primero y se acumulan varias', async () => {
    const r = await entrar()
    await act(async () => { await r.result.current.approve('p-1') })
    await act(async () => { await r.result.current.reject('p-2', 'Precio incorrecto') })
    r.unmount()
    expect((await entrar()).result.current.history.map((h) => h.itemId)).toEqual(['p-2', 'p-1'])
  })

  it('la decisión en lote por publicador también queda, una entrada por prenda', async () => {
    const r = await entrar()
    await act(async () => { await r.result.current.approvePublisher('Almacén Pruebas QA', 'a-1') })
    expect(leerHistorial().map((h) => h.itemId).sort()).toEqual(['p-1', 'p-2'])
    expect(leerHistorial().every((h) => h.aprobado)).toBe(true)
    expect(leerHistorial().some((h) => h.itemId === 'p-3')).toBe(false) // otra tienda: no se toca
  })

  it('si la decisión falla en el servidor, no se guarda nada', async () => {
    vi.spyOn(apiClient, 'put').mockRejectedValue(new Error('500'))
    const r = await entrar()
    await act(async () => { await r.result.current.approve('p-1').catch(() => undefined) })
    expect(leerHistorial()).toEqual([])
  })

  it('cada administrador ve solo su historial', async () => {
    const r = await entrar()
    await act(async () => { await r.result.current.approve('p-1') })
    r.unmount()
    sesion('99')
    expect((await entrar()).result.current.history).toEqual([])
    sesion('4')
    expect((await entrar()).result.current.history).toHaveLength(1)
  })

  it('decidir otra vez la misma prenda deja una sola entrada, la última', () => {
    guardarDecision(nuevaDecision({ id: 'p-1', titulo: 'Prenda p-1', publicador: 'T' }, false, 'Foto borrosa'))
    guardarDecision(nuevaDecision({ id: 'p-1', titulo: 'Prenda p-1', publicador: 'T' }, true))
    expect(leerHistorial()).toHaveLength(1)
    expect(leerHistorial()[0].aprobado).toBe(true)
  })

  it(`guarda como máximo ${MAX_HISTORIAL} y descarta las más antiguas`, () => {
    for (let i = 0; i < MAX_HISTORIAL + 5; i++) guardarDecision(nuevaDecision({ id: `x-${i}`, titulo: `X${i}`, publicador: 'T' }, true))
    const lista = leerHistorial()
    expect(lista).toHaveLength(MAX_HISTORIAL)
    expect(lista[0].itemId).toBe(`x-${MAX_HISTORIAL + 4}`)
  })

  it('un contenido dañado en el almacenamiento no rompe la pantalla', async () => {
    localStorage.setItem('sr_moderation_history_4', '{no es json')
    expect(leerHistorial()).toEqual([])
    localStorage.setItem('sr_moderation_history_4', JSON.stringify([{ id: 1 }, 'x', null]))
    expect(leerHistorial()).toEqual([])
    expect((await entrar()).result.current.history).toEqual([])
  })

  it('sin almacenamiento disponible, decidir sigue funcionando', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('lleno') })
    const r = await entrar()
    await act(async () => { await r.result.current.approve('p-1') })
    expect(r.result.current.history.map((h) => h.itemId)).toEqual(['p-1']) // al menos en pantalla
    expect(r.result.current.items.some((i) => i.id === 'p-1')).toBe(false)
  })
})
