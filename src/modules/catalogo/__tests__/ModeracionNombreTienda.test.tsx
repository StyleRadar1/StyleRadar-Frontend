import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import ModerationPage from '../pages/ModerationPage'
import { moderationService } from '../services/moderationService'
import { renderAt } from '../../experiencia/__tests__/helpers'

const UUID = 'fc942335-ab30-350a-b6a5-577cf0ca2fb5'
const prenda = (id: string, extra: Record<string, unknown> = {}) => ({
  id, almacenId: UUID, nombre: `Prueba historial ${id}`, tipo: 'Saco', color: 'Negro', marca: 'Almacén Pruebas QA', estilo: 'Urbano',
  precio: 120000, fotografias: ['https://picsum.photos/seed/p/600'], estado: 'PENDIENTE', disponible: true, storeNit: '900555777-1', ...extra,
})
/** Lo que responde ms-item-catalogo hoy: el nombre va en `almacen`, el NIT en cada prenda y el id es un UUID. */
const respuesta = (grupo: Record<string, unknown> = {}) => ({
  tipoPublicador: 'TIENDA', total: 2,
  grupos: [{ almacenId: UUID, almacen: 'Almacén Pruebas QA', pendientes: 2, prendas: [prenda('1'), prenda('2')], ...grupo }],
})
const fingir = (data: unknown) => vi.spyOn(apiClient, 'get').mockResolvedValue({ data } as never)
const routes = [{ path: '/admin/moderacion', element: <ModerationPage /> }]

describe('moderación: la tienda se ve por su nombre y su NIT, no por un ID', () => {
  afterEach(() => vi.restoreAllMocks())

  it('toma el nombre de `almacen` y el NIT de `storeNit` (así lo manda el back)', async () => {
    fingir(respuesta())
    const [a, b] = await moderationService.getPending()
    expect(a).toMatchObject({ id: '1', publicador: 'Almacén Pruebas QA', publicadorNit: '900555777-1', almacenId: UUID })
    expect(b).toMatchObject({ id: '2', publicador: 'Almacén Pruebas QA', publicadorNit: '900555777-1' })
  })

  it('sin `almacen`, usa el nombre de la marca de la prenda; nunca el UUID', async () => {
    fingir(respuesta({ almacen: undefined }))
    expect((await moderationService.getPending())[0].publicador).toBe('Almacén Pruebas QA')
  })

  it('sin nombre ni marca, muestra «NIT …» y no el UUID', async () => {
    fingir(respuesta({ almacen: undefined, prendas: [prenda('1', { marca: undefined })] }))
    expect((await moderationService.getPending())[0].publicador).toBe('NIT 900555777-1')
  })

  it('sin nombre, marca ni NIT, dice «Tienda sin nombre» (el UUID no le sirve a nadie)', async () => {
    fingir(respuesta({ almacen: undefined, prendas: [prenda('1', { marca: undefined, storeNit: undefined })] }))
    const [it] = await moderationService.getPending()
    expect(it.publicador).toBe('Tienda sin nombre')
    expect(it.publicadorNit).toBeUndefined()
    expect(it.almacenId).toBe(UUID) // el id se conserva para decidir, solo que no se muestra
  })

  it('acepta el NIT con otros nombres de campo y lo limpia de espacios', async () => {
    fingir(respuesta({ prendas: [prenda('1', { storeNit: undefined, nitAlmacen: ' 900555777-1 ' })] }))
    expect((await moderationService.getPending())[0].publicadorNit).toBe('900555777-1')
  })

  it('una publicación de una persona (segunda mano) no lleva NIT', async () => {
    fingir({ tipoPublicador: 'SEGUNDA_MANO', total: 1, grupos: [{ almacenId: null, almacen: 'Laura Gómez', pendientes: 1, prendas: [prenda('9', { storeNit: '123' })] }] })
    const [it] = await moderationService.getPending()
    expect(it).toMatchObject({ publicador: 'Laura Gómez', tipoPublicador: 'Persona' })
    expect(it.publicadorNit).toBeUndefined()
  })

  it('en la pantalla se ve el nombre y el NIT de la tienda, y no el UUID', async () => {
    fingir(respuesta())
    renderAt('/admin/moderacion', routes)
    await waitFor(() => expect(screen.getAllByText(/Almacén Pruebas QA/).length).toBeGreaterThan(0))
    const nits = screen.getAllByTestId('nit-tienda')
    expect(nits.length).toBeGreaterThan(0)
    expect(nits[0].textContent).toContain('NIT 900555777-1')
    expect(document.body.textContent).not.toContain('fc942335')
  })

  it('en la vista «Por publicador» el encabezado trae nombre y NIT', async () => {
    fingir(respuesta())
    renderAt('/admin/moderacion', routes)
    await waitFor(() => expect(screen.getAllByText(/Almacén Pruebas QA/).length).toBeGreaterThan(0))
    await userEvent.setup().click(screen.getByRole('button', { name: /Por publicador/i }))
    const encabezado = await screen.findByRole('heading', { level: 2, name: /Almacén Pruebas QA/ })
    expect(encabezado.textContent).toContain('NIT 900555777-1')
    expect(document.body.textContent).not.toContain('fc942335')
  })
})
