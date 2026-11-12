import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/apiClient'
import { ErrorBanner, ErrorToast, FieldError } from '../components/ErrorFeedback'
import { ErrorCard } from '../components/ErrorScene'
import { NotFound } from '../components/NotFound'
import { SessionExpiredOverlay } from '../components/SessionExpiredOverlay'
import { ErrorState } from '../components/Status'
import { marcarSalidaVoluntaria } from '@/modules/identidad/states/salida'

describe('piezas comunes de errores en core', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  it('NotFound muestra escena de perchero 404 con enlace al catálogo', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    )
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText(/salió del perchero/i)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /perchero/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toHaveAttribute('href', '/catalogo')
  })

  it('ErrorState muestra tornamesa 503 con reintentar, y 403 sin reintentar', () => {
    const onRetry = vi.fn()
    const { rerender } = render(
      <MemoryRouter>
        <ErrorState error={new ApiError(503, 'Servicio caído')} onRetry={onRetry} title="No disponible" />
      </MemoryRouter>
    )
    expect(screen.getByRole('img', { name: /tornamesa/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <ErrorState error={new ApiError(403, 'No tienes permiso para hacer esto.')} onRetry={onRetry} title="Sin acceso" />
      </MemoryRouter>
    )
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    expect(screen.getByText(/Acceso restringido · 403/)).toBeInTheDocument()
  })

  it('FieldError, ErrorBanner y ErrorToast renderizan ícono + texto y cierran toast', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <div>
        <FieldError message="El precio debe ser mayor a 0." />
        <ErrorBanner title="Tu inventario está suspendido" tone="warn" icon="lock">
          Revisa tu suscripción.
        </ErrorBanner>
        <ErrorToast open title="Ya hay 3 destacadas" subtitle="Quita una primero" onClose={onClose} />
      </div>
    )
    expect(screen.getByText('El precio debe ser mayor a 0.')).toBeInTheDocument()
    expect(screen.getByText('Tu inventario está suspendido')).toBeInTheDocument()
    expect(screen.getByText('Ya hay 3 destacadas')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('SessionExpiredOverlay abre modal 401 al expirar sesión y guarda retorno, pero ignora salida voluntaria', () => {
    render(
      <MemoryRouter initialEntries={['/catalogo?color=Negro']}>
        <Routes>
          <Route path="*" element={<SessionExpiredOverlay />} />
        </Routes>
      </MemoryRouter>
    )

    act(() => { marcarSalidaVoluntaria(); window.dispatchEvent(new Event('sr:sesion-expirada')) })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 5000)
    act(() => { window.dispatchEvent(new Event('sr:sesion-expirada')) })
    expect(screen.getByRole('dialog', { name: 'Sesión vencida' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /etiqueta/i })).toBeInTheDocument()
  })

  it('ErrorCard acepta variante perchero para errores de publicación', () => {
    render(
      <MemoryRouter>
        <ErrorCard
          variant="perchero"
          tone="warn"
          chip="Ya no disponible"
          code="409"
          title="Esta prenda ya se vendió o donó"
          description="Por eso ya no se puede editar."
        />
      </MemoryRouter>
    )
    expect(screen.getByText('Esta prenda ya se vendió o donó')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /perchero/i })).toBeInTheDocument()
  })
})
