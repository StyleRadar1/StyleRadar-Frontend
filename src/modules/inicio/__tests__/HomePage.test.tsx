import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { feedService } from '@/modules/identidad/services/feedService'
import { TEXTOS_FEED } from '@/modules/identidad/types/feed.dto'
import { mapService } from '@/modules/mapa/services/mapService'
import type { MapPinDto } from '@/modules/mapa/types/map.dto'
import HomePage from '../pages/HomePage'

vi.mock('@/modules/mapa/components/MapaBogota', () => ({
  default: ({ pins, selectedId }: { pins: MapPinDto[]; selectedId?: string | null }) => (
    <div data-testid="mapa" data-pins={pins.length} data-seleccion={selectedId ?? ''} />
  ),
}))

vi.mock('@/modules/mapa/components/MapCard', () => ({
  default: ({ pin }: { pin: MapPinDto }) => <div data-testid="tarjeta">{pin.name}</div>,
}))

class SinInterseccion {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
vi.stubGlobal('IntersectionObserver', SinInterseccion)

const comprador = { id: 'u-1', name: 'Valentina R.', email: 'usuario@styleradar.co', role: 'BUYER' as const }

const PINES: MapPinDto[] = [
  { id: 't-1', tipo: 'tienda', name: 'Luna Store', cat: 'Urbano', barrio: 'Chapinero', d: '2,40 km', lngLat: [-74.06, 4.64], href: '/tiendas/t-1' },
  { id: 'f-1', tipo: 'fundacion', name: 'Fundación Abrigo', cat: 'Fundación', barrio: 'Teusaquillo', d: '0,80 km', lngLat: [-74.07, 4.62], href: '/fundaciones/f-1' },
]

function renderInicio() {
  return render(
    <AuthContext.Provider
      value={{
        user: comprador,
        login: async () => ({ kind: 'session', user: comprador }),
        register: async () => ({ kind: 'session', user: comprador }),
        verifyOtp: async () => comprador,
        updateUser: () => {},
        loginWithGoogle: async () => comprador,
        logout: () => {},
      }}
    >
      <MemoryRouter initialEntries={['/inicio']}>
        <Routes>
          <Route path="/inicio" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('HomePage - inicio del comprador', () => {
  afterEach(() => vi.restoreAllMocks())

  it('muestra las recomendaciones del back, la entrada al probador y el mapa con los lugares más cercanos', async () => {
    const user = userEvent.setup()
    const recSpy = vi.spyOn(feedService, 'getRecommendations').mockResolvedValue({
      content: [
        {
          itemId: 'rec-1',
          garmentId: 101,
          storeId: 'store-1',
          name: 'Blazer lino arena',
          garmentType: 'TOP',
          brand: 'Luna Store',
          style: 'FORMAL',
          price: 185000,
          stock: 3,
          status: 'AVAILABLE',
          publishedAt: '2026-11-20T12:00:00Z',
          photos: ['https://example.com/blazer.jpg'],
          availableSizes: ['M'],
          reason: 'Tu estilo Formal y tu talla M',
        },
      ],
      page: 0,
      size: 8,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      generalWithoutPreferences: false,
      message: TEXTOS_FEED.conPerfil,
    })
    vi.spyOn(mapService, 'getAll').mockResolvedValue(PINES)

    renderInicio()

    expect(await screen.findByText(TEXTOS_FEED.conPerfil)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /prendas recomendadas para ti/i })).not.toBeInTheDocument()
    expect(recSpy).toHaveBeenCalledWith('u-1', expect.objectContaining({ page: 0 }))

    expect(screen.getByRole('heading', { name: /Pruébatelo antes de salir/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir el probador' })).toHaveAttribute('href', '/probador')

    const lista = await screen.findByRole('complementary', { name: 'Lugares más cercanos' })
    const lugares = within(lista).getAllByRole('button')
    expect(lugares[0]).toHaveTextContent('Fundación Abrigo')
    expect(lugares[1]).toHaveTextContent('Luna Store')

    await user.click(screen.getByRole('button', { name: 'Tiendas' }))
    expect(screen.getByTestId('mapa')).toHaveAttribute('data-pins', '1')
    expect(within(lista).queryByText('Fundación Abrigo')).not.toBeInTheDocument()

    await user.click(within(lista).getByRole('button', { name: /Luna Store/ }))
    expect(screen.getByTestId('tarjeta')).toHaveTextContent('Luna Store')
  })

  it('si el mapa falla ofrece reintentar sin afectar las demás secciones', async () => {
    vi.spyOn(feedService, 'getRecommendations').mockResolvedValue({
      content: [],
      page: 0,
      size: 8,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
      generalWithoutPreferences: true,
      message: TEXTOS_FEED.sinPreferencias,
    })
    vi.spyOn(mapService, 'getAll').mockRejectedValue(new Error('caído'))

    renderInicio()

    expect(await screen.findByText('No pudimos cargar las tiendas y fundaciones.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Actualizar mi perfil' })[0]).toHaveAttribute('href', '/perfil')
    expect(screen.getByRole('link', { name: 'Abrir el probador' })).toBeInTheDocument()
  })

  it('el rastro de prendas aparece al mover el cursor, la última se queda quieta y al hacer clic muestra su información', async () => {
    vi.spyOn(feedService, 'getRecommendations').mockResolvedValue({
      content: [
        {
          itemId: 'rec-1',
          garmentId: 101,
          storeId: 'store-1',
          name: 'Blazer lino arena',
          garmentType: 'TOP',
          brand: 'Luna Store',
          style: 'FORMAL',
          price: 185000,
          stock: 3,
          status: 'AVAILABLE',
          publishedAt: '2026-11-20T12:00:00Z',
          photos: ['https://example.com/blazer.jpg'],
          availableSizes: ['M', 'L'],
          reason: 'Tu estilo Formal y tu talla M',
        },
      ],
      page: 0,
      size: 8,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      generalWithoutPreferences: false,
      message: TEXTOS_FEED.conPerfil,
    })
    vi.spyOn(mapService, 'getAll').mockResolvedValue(PINES)

    renderInicio()

    const seccion = await screen.findByRole('region', { name: 'ELEGIDO PARA TU TALLA' })
    const zona = seccion.querySelector('.sr-trail-zona') as HTMLElement
    await within(zona).findByText(TEXTOS_FEED.conPerfil)
    const caja = (left: number, top: number, width: number, height: number) =>
      ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect
    vi.spyOn(zona, 'getBoundingClientRect').mockReturnValue(caja(0, 0, 1000, 800))
    const texto = zona.querySelector('.sr-trail-texto') as HTMLElement
    vi.spyOn(texto, 'getBoundingClientRect').mockReturnValue(caja(350, 300, 300, 200))

    fireEvent.pointerMove(zona, { clientX: 500, clientY: 400 })
    expect(within(zona).queryByRole('button', { name: /Ver información de/ })).not.toBeInTheDocument()
    expect(within(zona).getByRole('link', { name: 'Ver todo el catálogo →' })).toHaveAttribute('href', '/catalogo')

    fireEvent.pointerMove(zona, { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(zona, { clientX: 100, clientY: 600 })

    const prendas = within(zona).getAllByRole('button', { name: 'Ver información de Blazer lino arena' })
    expect(prendas.length).toBeGreaterThanOrEqual(1)

    fireEvent.click(prendas[prendas.length - 1])

    const info = await screen.findByRole('dialog', { name: 'Blazer lino arena' })
    expect(within(info).getByText(/Luna Store/)).toBeInTheDocument()
    expect(within(info).getByText('Tallas: M, L')).toBeInTheDocument()
    expect(within(info).getByRole('link', { name: 'Ver prenda' })).toHaveAttribute('href', '/catalogo/rec-1')
  })
})
