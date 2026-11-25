import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationsPage, { ESPERA_DESHACER_MS } from '../pages/NotificationsPage'
import { notificationService } from '../services/notificationService'
import type { NotificacionDto } from '../types/notification.dto'
import { loginAs, renderAt } from './helpers'

const routes = [{ path: '/avisos', element: <NotificationsPage /> }]
const aviso = (id: string, extra: Partial<NotificacionDto> = {}): NotificacionDto => ({
  id, tipo: 'MENSAJE_NUEVO', titulo: `Aviso ${id}`, detalle: `Detalle ${id}`, enlace: '/mensajes?c=1', leida: false, creadaEn: '2026-11-20T10:00:00Z', ...extra,
})
let datos: NotificacionDto[]
const fingirLista = () => vi.spyOn(notificationService, 'page').mockImplementation(async () => ({ items: datos, hasNext: false }))

beforeEach(() => {
  localStorage.clear(); loginAs('u-1', 'Valentina Rojas')
  datos = [aviso('1'), aviso('2', { leida: true }), aviso('3', { leida: true, enlace: undefined })]
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

const abrir = async () => {
  fingirLista()
  const r = renderAt('/avisos', routes)
  await screen.findByRole('list', { name: 'Notificaciones' }, { timeout: 3000 })
  return r
}

describe('bandeja de avisos: eliminar (discreto, con «Deshacer»)', () => {
  it('cada fila tiene una papelera pequeña con su nombre accesible', async () => {
    await abrir()
    expect(screen.getAllByRole('button', { name: 'Eliminar notificación' })).toHaveLength(3)
  })

  it('un aviso sin enlace se ve como texto: sin clic, sin botón y sin flecha', async () => {
    await abrir()
    const fila = screen.getByText('Aviso 3').closest('li')!
    expect(fila.querySelector('[role="button"]')).toBeNull()
    expect(fila).not.toHaveTextContent('›')
  })

  it('al eliminar la fila se va al instante y «Deshacer» la devuelve sin enviar nada', async () => {
    const user = userEvent.setup()
    const remove = vi.spyOn(notificationService, 'remove').mockResolvedValue()
    await abrir()
    await user.click(screen.getAllByRole('button', { name: 'Eliminar notificación' })[0])
    expect(screen.queryByText('Aviso 1')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(screen.getByText('Aviso 1')).toBeInTheDocument()
    expect(remove).not.toHaveBeenCalled()
  })

  it('pasados 5 segundos se envía una sola eliminación', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const remove = vi.spyOn(notificationService, 'remove').mockImplementation(async () => { datos = datos.filter((d) => d.id !== '1') })
    await abrir()
    await user.click(screen.getAllByRole('button', { name: 'Eliminar notificación' })[0])
    expect(remove).not.toHaveBeenCalled()
    await act(async () => { await vi.advanceTimersByTimeAsync(ESPERA_DESHACER_MS + 50) })
    expect(remove).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith('1')
    expect(screen.queryByText('Aviso 1')).toBeNull()
  })

  it('si falla, las filas vuelven y se avisa', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    vi.spyOn(notificationService, 'remove').mockRejectedValue(new Error('red'))
    await abrir()
    await user.click(screen.getAllByRole('button', { name: 'Eliminar notificación' })[0])
    await act(async () => { await vi.advanceTimersByTimeAsync(ESPERA_DESHACER_MS + 50) })
    expect(await screen.findByText('No se pudo eliminar. Inténtalo de nuevo.')).toBeInTheDocument()
    expect(screen.getByText('Aviso 1')).toBeInTheDocument()
  })

  it('salir de la pantalla antes de los 5 s envía lo pendiente de inmediato', async () => {
    const user = userEvent.setup()
    const remove = vi.spyOn(notificationService, 'remove').mockResolvedValue()
    const { unmount } = await abrir()
    await user.click(screen.getAllByRole('button', { name: 'Eliminar notificación' })[0])
    expect(remove).not.toHaveBeenCalled()
    unmount()
    expect(remove).toHaveBeenCalledWith('1')
  })

  it('«Seleccionar» muestra casillas y la barra; eliminar varias envía UNA petición con los ids', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const many = vi.spyOn(notificationService, 'removeMany').mockResolvedValue(2)
    await abrir()
    await user.click(screen.getByRole('button', { name: 'Seleccionar' }))
    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar: Aviso 1' }))
    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar: Aviso 2' }))
    expect(screen.getByText('2 seleccionadas')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(ESPERA_DESHACER_MS + 50) })
    expect(many).toHaveBeenCalledTimes(1)
    expect(many).toHaveBeenCalledWith(['1', '2'])
  })

  it('atajos de la selección: todas las de la página y solo las leídas; Cancelar sale del modo', async () => {
    const user = userEvent.setup()
    await abrir()
    await user.click(screen.getByRole('button', { name: 'Seleccionar' }))
    await user.click(screen.getByRole('button', { name: 'Seleccionar leídas' }))
    expect(screen.getByText('2 seleccionadas')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Seleccionar todas las de esta página' }))
    expect(screen.getByText('3 seleccionadas')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('«Eliminar leídas» está en el menú «⋯», pide confirmación y avisa cuántas se fueron', async () => {
    const user = userEvent.setup()
    const leidas = vi.spyOn(notificationService, 'removeRead').mockImplementation(async () => { datos = datos.filter((d) => !d.leida); return 2 })
    await abrir()
    await user.click(screen.getByRole('button', { name: 'Más opciones' }))
    await user.click(screen.getByRole('menuitem', { name: 'Eliminar leídas' }))
    expect(screen.getByText(/¿Eliminar las notificaciones leídas\? Esta acción no se puede deshacer\./)).toBeInTheDocument()
    expect(leidas).not.toHaveBeenCalled()
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('Se eliminaron 2 notificaciones')).toBeInTheDocument()
    expect(screen.queryByText('Aviso 2')).toBeNull()
    expect(screen.getByText('Aviso 1')).toBeInTheDocument()
  })

  it('«Eliminar leídas» está deshabilitada si no hay leídas', async () => {
    const user = userEvent.setup()
    datos = [aviso('1')]
    await abrir()
    await user.click(screen.getByRole('button', { name: 'Más opciones' }))
    expect(screen.getByRole('menuitem', { name: 'Eliminar leídas' })).toBeDisabled()
  })

  it('si no había leídas lo dice', async () => {
    const user = userEvent.setup()
    vi.spyOn(notificationService, 'removeRead').mockResolvedValue(0)
    await abrir()
    await user.click(screen.getByRole('button', { name: 'Más opciones' }))
    await user.click(screen.getByRole('menuitem', { name: 'Eliminar leídas' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('No había notificaciones leídas')).toBeInTheDocument()
  })

  it('sin avisos: «No tienes notificaciones»', async () => {
    datos = []
    fingirLista()
    renderAt('/avisos', routes)
    expect(await screen.findByText('No tienes notificaciones', {}, { timeout: 3000 })).toBeInTheDocument()
  })
})
