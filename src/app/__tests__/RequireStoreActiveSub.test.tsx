import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/modules/core/api/apiClient'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'

const getMyStore = vi.fn()
const estado = { status: 'ACTIVA' as string }

vi.mock('@/configs/env', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/configs/env')>()
  return { env: { ...real.env, useMocks: false } }
})
vi.mock('@/modules/catalogo/services/storeSettingsService', () => ({ storeSettingsService: { getMyStore: (id: string) => getMyStore(id) } }))
vi.mock('@/modules/transacciones/hooks/useStoreSubscription', () => ({
  useStoreSubscription: () => ({ data: { subscription: { status: estado.status }, payments: [] }, loading: false }),
}))

const { RequireStoreActiveSub } = await import('../RequireStoreActiveSub')

const renderMiTienda = () => render(
  <AuthProvider>
    <MemoryRouter initialEntries={['/mi-tienda']}>
      <Routes>
        <Route path="/mi-tienda" element={<RequireStoreActiveSub><p>Mi tienda</p></RequireStoreActiveSub>} />
        <Route path="/tienda/registro" element={<p>Registro del almacén (NIT)</p>} />
        <Route path="/tienda/suscripcion/activar" element={<p>Activar suscripción</p>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

describe('tienda: registrar el almacén antes de la suscripción', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('sr_token', 'demo-t-9')
    localStorage.setItem('sr_user', JSON.stringify({ id: 't-9', name: 'Tienda nueva', email: 't-9@styleradar.co', role: 'STORE_ADMIN' }))
    getMyStore.mockReset()
    estado.status = 'ACTIVA'
  })

  it('sin almacén en ms-tiendas (404) lleva al registro del NIT, aunque no tenga suscripción', async () => {
    getMyStore.mockRejectedValue(new ApiError(404, 'Sin almacén'))
    estado.status = 'PENDIENTE'
    renderMiTienda()
    expect(await screen.findByText('Registro del almacén (NIT)')).toBeInTheDocument()
    expect(getMyStore).toHaveBeenCalledWith('t-9')
  })

  it('con almacén y sin suscripción activa sigue a activar la suscripción', async () => {
    getMyStore.mockResolvedValue({ nit: '900555777-1' })
    estado.status = 'PENDIENTE'
    renderMiTienda()
    expect(await screen.findByText('Activar suscripción')).toBeInTheDocument()
  })

  it('con almacén y suscripción activa entra a Mi tienda', async () => {
    getMyStore.mockResolvedValue({ nit: '900555777-1' })
    renderMiTienda()
    expect(await screen.findByText('Mi tienda')).toBeInTheDocument()
  })

  it('si ms-tiendas falla por otra razón no bloquea a la tienda', async () => {
    getMyStore.mockRejectedValue(new ApiError(503, 'Servicio no disponible'))
    renderMiTienda()
    expect(await screen.findByText('Mi tienda')).toBeInTheDocument()
  })
})
