import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { ApiError } from '@/modules/core/api/apiClient'
import { AuthContext, type AuthState } from '@/modules/identidad/states/authContext'
import { ContactButton } from '../components/ContactButton'
import { chatService } from '../services/chatService'
import { problemaInicio } from '../utils/chatErrors'
import { esNit, nitDeTienda, tiendaContacto } from '../utils/contacts'

const sesion = { user: { id: '12', name: 'Val', email: 'v@x.co', role: 'BUYER' } } as unknown as AuthState
const verBoton = (nit?: string) => render(
  <AuthContext.Provider value={sesion}>
    <MemoryRouter>
      <ContactButton icon label="Escribir a Calle 85 Store sobre Hoodie" contacto={tiendaContacto('Calle 85 Store')} asunto="Hoodie" referenciaId="p1" nit={nit} />
    </MemoryRouter>
  </AuthContext.Provider>,
)

afterEach(() => vi.restoreAllMocks())

describe('chat con tiendas: solo con el NIT real', () => {
  it('reconoce un NIT y descarta el texto armado con el nombre', () => {
    expect(esNit('900555777-1')).toBe(true)
    expect(esNit('9005557771')).toBe(true)
    expect(esNit('tienda-calle-85-store')).toBe(false)
    expect(esNit('fc942335-ab30-350a-b6a5-577cf0ca2fb5')).toBe(false)
    expect(esNit(undefined)).toBe(false)
  })

  it('toma el NIT de la prenda: storeNit primero, luego un almacenId que ya sea NIT', () => {
    expect(nitDeTienda({ storeNit: '900555777-1', almacenId: 'fc942335-ab30-350a-b6a5-577cf0ca2fb5' })).toBe('900555777-1')
    expect(nitDeTienda({ almacenId: '900555777-1' })).toBe('900555777-1')
    // Hoy en QA el almacenId de las prendas es un UUID: no sirve como NIT
    expect(nitDeTienda({ almacenId: 'fc942335-ab30-350a-b6a5-577cf0ca2fb5' })).toBeUndefined()
  })

  it('sin NIT el botón queda apagado y no llama al servidor', async () => {
    const start = vi.spyOn(chatService, 'start')
    verBoton(undefined)
    const b = screen.getByRole('button', { name: /todavía no se puede contactar/ })
    expect(b).toBeDisabled()
    await userEvent.setup().click(b)
    expect(start).not.toHaveBeenCalled()
  })

  it('con NIT abre la conversación por /stores/{nit}', async () => {
    const start = vi.spyOn(chatService, 'start').mockRejectedValue(new ApiError(422, 'x'))
    verBoton('900555777-1')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Escribir a Calle 85 Store sobre Hoodie' }))
    expect(start).toHaveBeenCalledWith(expect.objectContaining({ nit: '900555777-1', contacto: expect.objectContaining({ tipo: 'TIENDA' }) }))
  })

  it('el 422 de una tienda dice que no está habilitada, no «es tuya»', () => {
    expect(problemaInicio(new ApiError(422, 'x'), 'TIENDA').titulo).toBe('Esta tienda aún no recibe mensajes')
    expect(problemaInicio(new ApiError(422, 'x'), 'VENDEDOR').titulo).toBe('No puedes escribir sobre esta publicación')
  })
})
