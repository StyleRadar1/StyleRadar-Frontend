import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderConSesion, sesionComo } from '@/modules/identidad/__tests__/helpers'
import MiTiendaPage from '../pages/MiTiendaPage'
import { distintivoDe, resetStoreSettingsMock, storeSettingsService, TEXTOS_DISTINTIVOS } from '../services/storeSettingsService'

const abrir = async (user: ReturnType<typeof userEvent.setup>) => {
  sesionComo('luna@styleradar.co')
  renderConSesion('/mi-tienda', [{ path: '/mi-tienda', element: <MiTiendaPage /> }])
  await user.click(await screen.findByRole('button', { name: 'Configurar' }))
  return screen.getByRole('dialog', { name: 'Distintivos automáticos' })
}

describe('Distintivos automáticos (SR-RF-59 · SR-RF-60 · F-19)', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); resetStoreSettingsMock() })

  it('abre con los valores por defecto del documento: 3 unidades y 7 días', async () => {
    const user = userEvent.setup()
    const dialog = await abrir(user)
    expect(within(dialog).getByLabelText('Umbral de últimas unidades')).toHaveValue(3)
    expect(within(dialog).getByLabelText('Duración de nueva llegada')).toHaveValue('7')
  })

  it('valida el umbral de 0 a 50 con los textos del documento y no guarda', async () => {
    const user = userEvent.setup()
    const dialog = await abrir(user)
    const umbral = within(dialog).getByLabelText('Umbral de últimas unidades')
    await user.clear(umbral)
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))
    expect(within(dialog).getByText(TEXTOS_DISTINTIVOS.umbralObligatorio)).toBeInTheDocument()
    await user.type(umbral, '51')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))
    expect(within(dialog).getByText(TEXTOS_DISTINTIVOS.umbralMaximo)).toBeInTheDocument()
    expect(umbral).toHaveAttribute('aria-invalid', 'true')
    expect((await storeSettingsService.getCatalogSettings('901.482.337-1')).lowStockThreshold).toBe(3)
  })

  it('guarda umbral y días y los muestra en la tarjeta de distintivos', async () => {
    const user = userEvent.setup()
    const dialog = await abrir(user)
    const umbral = within(dialog).getByLabelText('Umbral de últimas unidades')
    await user.clear(umbral)
    await user.type(umbral, '10')
    await user.selectOptions(within(dialog).getByLabelText('Duración de nueva llegada'), '30')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Se guardaron las reglas de distintivos automáticos.')).toBeInTheDocument()
    expect(await screen.findByText('≤ 10 uds')).toBeInTheDocument()
    expect(await screen.findByText('30 días')).toBeInTheDocument()
    expect(await storeSettingsService.getCatalogSettings('901.482.337-1')).toMatchObject({ lowStockThreshold: 10, newArrivalDays: 30 })
  })

  it('calcula el distintivo con las reglas del documento', () => {
    const c = { lowStockThreshold: 3, newArrivalDays: 7 }
    const ahora = new Date('2026-11-21T12:00:00Z')
    expect(distintivoDe(c, { currentStock: 2, available: true }, ahora).activeBadge).toBe('LOW_STOCK')
    // Agotada o no disponible prevalece (RN-02 de SR-RF-59).
    expect(distintivoDe(c, { currentStock: 0, available: true }, ahora).activeBadge).toBe('NONE')
    expect(distintivoDe(c, { currentStock: 2, available: false }, ahora).activeBadge).toBe('NONE')
    expect(distintivoDe(c, { publishedAt: '2026-11-18T12:00:00Z', withdrawn: false }, ahora).activeBadge).toBe('NEW_ARRIVAL')
    expect(distintivoDe(c, { publishedAt: '2026-11-01T12:00:00Z', withdrawn: false }, ahora).activeBadge).toBe('NONE')
    // Retirada no se reactiva (RN-02 de SR-RF-60).
    expect(distintivoDe(c, { publishedAt: '2026-11-20T12:00:00Z', withdrawn: true }, ahora).activeBadge).toBe('NONE')
  })

  it('R1: el distintivo «Últimas unidades» usa ícono reloj de arena distinto al triángulo de KPI Stock bajo', async () => {
    sesionComo('luna@styleradar.co')
    const { container } = renderConSesion('/mi-tienda', [{ path: '/mi-tienda', element: <MiTiendaPage /> }])
    expect(await screen.findByText('Últimas unidades')).toBeInTheDocument()
    const softPath = container.querySelector('.msd-badge--soft svg path')?.getAttribute('d')
    const kpiPaths = Array.from(container.querySelectorAll('.msd-kpi__icon svg path')).map((p) => p.getAttribute('d'))
    expect(softPath).toBeTruthy()
    expect(kpiPaths).not.toContain(softPath)
  })
})
