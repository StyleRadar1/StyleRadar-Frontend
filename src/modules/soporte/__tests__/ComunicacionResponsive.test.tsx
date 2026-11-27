import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationBell } from '../components/NotificationBell'
import MessagesPage from '../pages/MessagesPage'
import { notificationService, resetNotificationsMock } from '../services/notificationService'
import { loginAs, renderAt } from './helpers'

const routes = [
  { path: '/campana', element: <header data-testid="encabezado"><NotificationBell /></header> },
  { path: '/avisos', element: <p>Bandeja de avisos</p> },
  { path: '/mensajes', element: <MessagesPage /> },
]

beforeEach(() => { resetNotificationsMock(); loginAs('u-1', 'Valentina Rojas') })
afterEach(() => vi.restoreAllMocks())

describe('Fase 1 UX: campana y chat en pantallas pequeñas', () => {
  it('el panel de la campana se pinta fuera del encabezado y ocupa el ancho de la pantalla en celular', async () => {
    const user = userEvent.setup()
    renderAt('/campana', routes)
    await user.click(await screen.findByRole('button', { name: /Notificaciones/ }))
    const panel = await screen.findByRole('region', { name: 'Notificaciones' })
    // Fuera del encabezado (que tiene backdrop-blur y atraparía un elemento fijo): directo en el <body>
    expect(panel.parentElement).toBe(document.body)
    expect(screen.getByTestId('encabezado')).not.toContainElement(panel)
    // Con margen a los dos lados en celular (la posición fija va en su CSS); desde `sm` vuelve a anclarse a la campana
    expect(panel).toHaveClass('sr-campana', 'inset-x-3', 'sm:right-[var(--campana-der)]', 'sm:w-[24rem]')
    expect(panel.style.top).toMatch(/^\d+px$/)
  })

  it('se cierra con Escape y al tocar fuera, pero no al tocar dentro del panel', async () => {
    const user = userEvent.setup()
    renderAt('/campana', routes)
    const boton = await screen.findByRole('button', { name: /Notificaciones/ })

    await user.click(boton)
    const panel = await screen.findByRole('region', { name: 'Notificaciones' })
    await user.click(screen.getByText('Notificaciones', { selector: 'p' })) // dentro del panel
    expect(panel).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: 'Notificaciones' })).not.toBeInTheDocument()

    await user.click(boton)
    await screen.findByRole('region', { name: 'Notificaciones' })
    await user.click(document.body) // fuera
    expect(screen.queryByRole('region', { name: 'Notificaciones' })).not.toBeInTheDocument()
  })

  it('«Ver todas las notificaciones» lleva a la bandeja y cierra el panel', async () => {
    const user = userEvent.setup()
    renderAt('/campana', routes)
    await user.click(await screen.findByRole('button', { name: /Notificaciones/ }))
    await user.click(await screen.findByRole('link', { name: 'Ver todas las notificaciones' }))
    expect(await screen.findByText('Bandeja de avisos')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Notificaciones' })).not.toBeInTheDocument()
  })

  it('el botón de la campana mide 44 px de zona táctil', async () => {
    renderAt('/campana', routes)
    expect(await screen.findByRole('button', { name: /Notificaciones/ })).toHaveClass('h-11', 'w-11')
  })

  it('el encabezado del chat dice el tipo y el asunto, sin el ID interno de la persona', async () => {
    renderAt('/mensajes?c=c1', routes)
    const chat = await screen.findByRole('region', { name: /Chat con Sofía L\./ }, { timeout: 3000 })
    expect(chat).toHaveTextContent('Vende · Collar medalla dorado')
    expect(chat.textContent).not.toMatch(/#u-\d+/)
    expect(chat.textContent).not.toContain('#')
  })

  it('el botón de volver del chat y los filtros de la lista tienen zona táctil de 44 px en celular', async () => {
    renderAt('/mensajes?c=c1', routes)
    expect(await screen.findByRole('button', { name: 'Volver a las conversaciones' }, { timeout: 3000 })).toHaveClass('h-11', 'w-11')
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveClass('min-h-11')
    expect(screen.getByRole('button', { name: 'Sin leer' })).toHaveClass('min-h-11')
  })
})

describe('panel de la campana con la identidad de StyleRadar', () => {
  const abrir = async () => {
    const user = userEvent.setup()
    renderAt('/campana', routes)
    await user.click(await screen.findByRole('button', { name: /Notificaciones/ }))
    return { user, panel: await screen.findByRole('region', { name: 'Notificaciones' }) }
  }

  it('el encabezado dice cuántos avisos hay sin leer y ofrece marcarlos todos', async () => {
    const { panel } = await abrir()
    await within(panel).findByRole('button', { name: /Nueva prenda/ })
    expect(within(panel).getByText('2 sin leer')).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Marcar todo como leído' })).toBeInTheDocument()
  })

  it('cada aviso sin leer se marca con un atributo propio y los leídos no', async () => {
    const { panel } = await abrir()
    await screen.findByRole('button', { name: /Nueva prenda/ })
    const filas = panel.querySelectorAll('.sr-campana-fila')
    expect(filas).toHaveLength(3)
    expect([...filas].map((f) => f.hasAttribute('data-sin-leer'))).toEqual([true, true, false])
    expect(within(panel).getAllByText('(sin leer)')).toHaveLength(2) // lo anuncia el lector de pantalla
  })

  it('al marcar todo como leído, el encabezado pasa a «Estás al día»', async () => {
    const { user, panel } = await abrir()
    await user.click(await within(panel).findByRole('button', { name: 'Marcar todo como leído' }))
    expect(await within(panel).findByText('Estás al día')).toBeInTheDocument()
    expect(within(panel).queryByRole('button', { name: 'Marcar todo como leído' })).not.toBeInTheDocument()
    expect(panel.querySelectorAll('[data-sin-leer]')).toHaveLength(0)
  })

  it('mientras carga muestra esqueletos con texto para el lector de pantalla, no «Estás al día»', async () => {
    vi.spyOn(notificationService, 'page').mockImplementation(() => new Promise(() => {}))
    const { panel } = await abrir()
    const carga = within(panel).getByRole('status', { name: 'Cargando notificaciones' })
    expect(carga).toHaveTextContent('Cargando…')
    expect(panel.querySelectorAll('.sr-campana-esqueleto').length).toBeGreaterThan(0)
    // Nunca afirma «Estás al día» sin saberlo: usa el contador general si ya llegó y, si no, un texto neutro
    expect(within(panel).queryByText('Estás al día')).not.toBeInTheDocument()
    expect(await within(panel).findByText('2 sin leer')).toBeInTheDocument()
  })

  it('sin avisos muestra un estado vacío amable', async () => {
    vi.spyOn(notificationService, 'page').mockResolvedValue({ items: [], hasNext: false })
    const { panel } = await abrir()
    expect(await within(panel).findByText('Sin notificaciones')).toBeInTheDocument()
    expect(within(panel).getByText(/Aquí te avisaremos cuando vuelva una prenda/)).toBeInTheDocument()
  })

  it('si falla la carga se avisa y se puede reintentar', async () => {
    const page = vi.spyOn(notificationService, 'page').mockRejectedValueOnce(new Error('red'))
    const { user, panel } = await abrir()
    expect(await within(panel).findByRole('alert')).toHaveTextContent('No pudimos cargar tus avisos')
    page.mockRestore()
    await user.click(within(panel).getByRole('button', { name: 'Reintentar' }))
    expect(await within(panel).findByRole('button', { name: /Nueva prenda/ })).toBeInTheDocument()
    expect(within(panel).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('el pie tiene un botón principal y dos secundarios (comprador), todos con zona táctil de 44 px', async () => {
    const { panel } = await abrir()
    const principal = within(panel).getByRole('link', { name: 'Ver todas las notificaciones' })
    expect(principal).toHaveAttribute('href', '/avisos')
    expect(principal).toHaveClass('bg-violeta', 'h-11')
    for (const nombre of ['Ver búsquedas y alertas', 'Preferencias de avisos']) {
      expect(within(panel).getByRole('link', { name: nombre })).toHaveClass('min-h-11', 'rounded-full')
    }
  })

  it('para tienda y fundación no sale «Ver búsquedas y alertas»', async () => {
    loginAs('t-1', 'Luna Store', 'STORE_ADMIN')
    const { panel } = await abrir()
    expect(within(panel).queryByRole('link', { name: 'Ver búsquedas y alertas' })).not.toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: 'Preferencias de avisos' })).toBeInTheDocument()
  })
})
