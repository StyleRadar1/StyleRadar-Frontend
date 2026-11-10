import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import CatalogPage from '@/modules/catalogo/pages/CatalogPage'
import { ContactButton } from '../components/ContactButton'
import { MessagesLink } from '../components/MessagesLink'
import MessagesPage from '../pages/MessagesPage'
import { chatService, resetChatMock } from '../services/chatService'
import { tiendaContacto } from '../utils/contacts'
import { loginAs, renderAt } from './helpers'

beforeEach(() => { resetChatMock(); localStorage.clear(); sessionStorage.clear() })

describe('iniciar una conversación (RF-41 y RF-73)', () => {
  it('RF-73: cada prenda del catálogo tiene el ícono para escribirle a la tienda', async () => {
    const user = userEvent.setup()
    loginAs('u-1', 'Valentina Rojas')
    renderAt('/catalogo', [{ path: '/catalogo', element: <CatalogPage /> }, { path: '/mensajes', element: <MessagesPage /> }])

    await screen.findByRole('heading', { name: 'Hoodie azul noche' }, { timeout: 3000 })
    const iconos = screen.getAllByRole('button', { name: /^Escribir a .+ sobre / })
    expect(iconos.length).toBe(screen.getAllByRole('heading', { level: 3 }).length)
    await user.click(screen.getByRole('button', { name: 'Escribir a Luna Store sobre Hoodie azul noche' }))

    const hilo = await screen.findByRole('list', { name: 'Mensajes con Luna Store' }, { timeout: 3000 })
    await user.type(screen.getByLabelText('Escribe un mensaje'), '¿Lo tienen en talla M?')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await within(hilo).findByText('¿Lo tienen en talla M?')).toBeInTheDocument()
  })

  it('la tienda no ve el ícono en sus propias prendas', async () => {
    loginAs('t-1', 'Luna Store', 'ADMIN_ALMACEN')
    renderAt('/catalogo', [{ path: '/catalogo', element: <CatalogPage /> }])
    await screen.findByRole('heading', { name: 'Hoodie azul noche' }, { timeout: 3000 })
    expect(screen.queryByRole('button', { name: /^Escribir a Luna Store/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escribir a Nómada Studio sobre Blazer oversize' })).toBeInTheDocument()
  })

  it('no duplica la conversación si se escribe dos veces sobre lo mismo', async () => {
    loginAs('u-1', 'Valentina Rojas')
    const req = { contacto: { id: 'u-2', nombre: 'Mateo P.', tipo: 'VENDEDOR' as const }, asunto: 'Blazer negro oversize', referenciaId: 'l3' }
    const a = await chatService.start(req)
    const b = await chatService.start(req)
    expect(b.id).toBe(a.id)
    expect((await chatService.conversations()).filter((c) => c.referenciaId === 'l3')).toHaveLength(1)
    await expect(chatService.start({ ...req, contacto: { id: 'u-1', nombre: 'Yo', tipo: 'VENDEDOR' } })).rejects.toThrow(/propia publicación/)
  })

  it('RF-73: el mensaje a la tienda le llega a la tienda con su contador', async () => {
    loginAs('u-1', 'Valentina Rojas')
    const c = await chatService.start({ contacto: tiendaContacto('Luna Store'), asunto: 'Hoodie azul noche', referenciaId: 'p3' })
    await chatService.send(c.id, '¿Lo tienen en talla M?')

    loginAs('t-1', 'Luna Store', 'ADMIN_ALMACEN')
    const bandeja = await chatService.conversations()
    const nueva = bandeja.find((x) => x.id === c.id)!
    expect(nueva).toMatchObject({ asunto: 'Hoodie azul noche', noLeidos: 1, ultimoMensaje: '¿Lo tienen en talla M?', contacto: { id: 'u-1', tipo: 'COMPRADOR' } })
    expect(await chatService.unreadCount()).toBe(2) // la nueva + la de Mateo P. de los datos de prueba
  })

  it('el ícono del menú muestra los mensajes sin leer', async () => {
    loginAs('t-1', 'Luna Store', 'ADMIN_ALMACEN')
    renderAt('/', [{ path: '/', element: <MessagesLink /> }])
    expect(await screen.findByRole('link', { name: 'Mensajes, 1 sin leer' }, { timeout: 3000 })).toHaveAttribute('href', '/mensajes')
  })

  it('sin sesión invita a iniciar sesión y el administrador no ve el botón', () => {
    const props = { label: 'Enviar mensaje a la tienda', contacto: tiendaContacto('Luna Store'), asunto: 'Hoodie' }
    const { unmount } = renderAt('/', [{ path: '/', element: <><ContactButton {...props} /><ContactButton icon {...props} /></> }])
    expect(screen.getByRole('link', { name: 'Inicia sesión para escribir' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Inicia sesión para escribir a Luna Store' })).toHaveAttribute('href', '/login')
    unmount()
    loginAs('a-1', 'Mariana Bernal', 'ADMIN_STYLERADAR')
    renderAt('/', [{ path: '/', element: <ContactButton {...props} /> }])
    expect(screen.queryByRole('button', { name: 'Enviar mensaje a la tienda' })).not.toBeInTheDocument()
  })
})
