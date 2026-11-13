import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import MessagesPage from '../pages/MessagesPage'
import { resetChatMock } from '../services/chatService'
import { loginAs, renderAt } from './helpers'

const routes = [{ path: '/mensajes', element: <MessagesPage /> }]

beforeEach(() => { resetChatMock(); loginAs('u-1', 'Valentina Rojas') })

describe('mensajes (RF-40, RF-41 y RF-73)', () => {
  it('lista las conversaciones y filtra por tipo de contacto', async () => {
    const user = userEvent.setup()
    renderAt('/mensajes', routes)
    const lista = await screen.findByRole('complementary', { name: 'Conversaciones' }, { timeout: 3000 })
    expect(within(lista).getAllByRole('listitem')).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: 'Tiendas' }))
    expect(within(lista).getAllByRole('listitem')).toHaveLength(1)
    expect(within(lista).getByText('Luna Store')).toBeInTheDocument()
  })

  it('abre una conversación, quita el contador y envía un mensaje', async () => {
    const user = userEvent.setup()
    renderAt('/mensajes', routes)
    await user.click(await screen.findByRole('button', { name: /Sofía L\./ }, { timeout: 3000 }))
    const hilo = await screen.findByRole('list', { name: 'Mensajes con Sofía L.' }, { timeout: 3000 })
    expect(within(hilo).getByText('Sí, sigue disponible. ¿Te queda bien el sábado?')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('sin leer', { exact: false })).not.toBeInTheDocument())

    const enviar = screen.getByRole('button', { name: 'Enviar' })
    expect(enviar).toBeDisabled()
    await user.type(screen.getByLabelText('Escribe un mensaje'), 'Perfecto, nos vemos en Chapinero')
    await user.click(enviar)
    expect(await within(hilo).findByText('Perfecto, nos vemos en Chapinero')).toBeInTheDocument()
    expect(screen.getByLabelText('Escribe un mensaje')).toHaveValue('')
  })

  it('si el envío falla, muestra el error y conserva el texto', async () => {
    const user = userEvent.setup()
    renderAt('/mensajes?c=c2', routes)
    await screen.findByRole('list', { name: 'Mensajes con Luna Store' }, { timeout: 3000 })
    sessionStorage.setItem('sr_mock', 'sin-red')
    await user.type(screen.getByLabelText('Escribe un mensaje'), '¿Tienen talla M?')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Se perdió la conexión')
    expect(screen.getByLabelText('Escribe un mensaje')).toHaveValue('¿Tienen talla M?')
  })

  it('una conversación ajena no se muestra', async () => {
    renderAt('/mensajes?c=c4', routes)
    expect(await screen.findByText('Esta conversación no está disponible', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByText(/c4/)).not.toBeInTheDocument()
  })

  it('la tienda ve las preguntas de sus clientes', async () => {
    loginAs('t-1', 'Luna Store', 'ADMIN_ALMACEN')
    renderAt('/mensajes', routes)
    expect(await screen.findByText('Mateo P.', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Filtrar conversaciones' })).not.toBeInTheDocument()
  })

  it('el administrador ve el estado vacío', async () => {
    loginAs('a-1', 'Mariana Bernal', 'ADMIN_STYLERADAR')
    renderAt('/mensajes', routes)
    expect(await screen.findByText('No hay conversaciones', {}, { timeout: 3000 })).toBeInTheDocument()
  })
})
