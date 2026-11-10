import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import SecondHandPage from '@/modules/experiencia/pages/SecondHandPage'
import { ContactButton } from '../components/ContactButton'
import { MessagesLink } from '../components/MessagesLink'
import MessagesPage from '../pages/MessagesPage'
import { chatService, resetChatMock } from '../services/chatService'
import { tiendaContacto } from '../utils/contacts'
import { loginAs, renderAt } from './helpers'

beforeEach(() => { resetChatMock(); localStorage.clear(); sessionStorage.clear() })

describe('iniciar una conversación (RF-40, RF-41 y RF-73)', () => {
  it('RF-40: desde una publicación de segunda mano abre el chat con quien vende', async () => {
    const user = userEvent.setup()
    loginAs('u-1', 'Valentina Rojas')
    renderAt('/segunda-mano', [{ path: '/segunda-mano', element: <SecondHandPage /> }, { path: '/mensajes', element: <MessagesPage /> }])

    const resultados = await screen.findByRole('list', { name: 'Resultados' }, { timeout: 3000 })
    const blazer = within(resultados).getByText('Blazer negro oversize').closest('li')!
    await user.click(within(blazer).getByRole('button', { name: 'Escribir a quien vende' }))

    const hilo = await screen.findByRole('list', { name: 'Mensajes con Mateo P.' }, { timeout: 3000 })
    expect(screen.getByText(/Acuerden aquí el lugar y la hora/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Escribe un mensaje'), '¿Sigue disponible el blazer?')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await within(hilo).findByText('¿Sigue disponible el blazer?')).toBeInTheDocument()
  })

  it('en su propia publicación no ofrece escribirse', async () => {
    loginAs('u-1', 'Valentina Rojas')
    renderAt('/segunda-mano', [{ path: '/segunda-mano', element: <SecondHandPage /> }])
    const resultados = await screen.findByRole('list', { name: 'Resultados' }, { timeout: 3000 })
    const propia = within(resultados).getByText('Jean recto azul claro').closest('li')!
    expect(within(propia).getByText('Es tu publicación')).toBeInTheDocument()
    expect(within(propia).queryByRole('button', { name: 'Escribir a quien vende' })).not.toBeInTheDocument()
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
    const { unmount } = renderAt('/', [{ path: '/', element: <ContactButton {...props} /> }])
    expect(screen.getByRole('link', { name: 'Inicia sesión para escribir' })).toHaveAttribute('href', '/login')
    unmount()
    loginAs('a-1', 'Mariana Bernal', 'ADMIN_STYLERADAR')
    renderAt('/', [{ path: '/', element: <ContactButton {...props} /> }])
    expect(screen.queryByRole('button', { name: 'Enviar mensaje a la tienda' })).not.toBeInTheDocument()
  })
})
