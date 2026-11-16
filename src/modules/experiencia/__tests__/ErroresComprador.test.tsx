import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/modules/core/api/apiClient'
import CatalogPage from '@/modules/catalogo/pages/CatalogPage'
import ItemDetailPage from '@/modules/catalogo/pages/ItemDetailPage'
import { mapService } from '@/modules/mapa/services/mapService'
import { distanciaKm, RADIO_KM } from '@/modules/mapa/utils/mapUtils'
import AlertsPage from '@/modules/soporte/pages/AlertsPage'
import MessagesPage from '@/modules/soporte/pages/MessagesPage'
import { resetAlertsMock } from '@/modules/soporte/services/alertService'
import { resetChatMock } from '@/modules/soporte/services/chatService'
import { setMockPlan } from '@/modules/transacciones/services/userPlanService'
import TryOnPage from '../pages/TryOnPage'
import { problemaFoto, problemaPrueba, problemaResultado, validarArchivoPrueba, validarDimensionesPrueba } from '../utils/tryOnRules'
import { loginAs, png, renderAt } from './helpers'
import { loginAs as loginSoporte, renderAt as renderSoporte } from '@/modules/soporte/__tests__/helpers'

vi.mock('../utils/photoRules', async (orig) => ({ ...(await orig<typeof import('../utils/photoRules')>()), readDimensions: vi.fn().mockResolvedValue({ width: 800, height: 1200 }) }))
vi.mock('../mocks/tryon', async (orig) => ({ ...(await orig<typeof import('../mocks/tryon')>()), MOCK_JOB_TIMES: { pending: 50, done: 150 } }))

const escenario = (s: string) => sessionStorage.setItem('sr_mock', s)

beforeEach(() => {
  sessionStorage.clear(); localStorage.clear()
  resetAlertsMock(); resetChatMock()
  loginAs('u-1', 'Valentina Rojas'); setMockPlan('u-1', 'RADAR')
})

/** Ningún aviso puede mostrar IDs, NIT ni nombres de servicios. */
const sinFugas = () => expect(document.body.textContent ?? '').not.toMatch(/ms-|JOB_NOT_FOUND|CONSENT_REQUIRED|QUOTA_EXCEEDED|NIT|ID:|Redis|RabbitMQ/)

describe('probador: reglas de la foto según ms-probador-virtual', () => {
  it('solo JPG o PNG, máximo 5 MB, vertical y mínimo 300 × 400 px', () => {
    expect(validarArchivoPrueba(png('a.webp', 100, 'image/webp'))).toBe('Usa una foto JPG o PNG.')
    expect(validarArchivoPrueba(png('a.png', 7.2 * 1024 * 1024))).toBe('La foto pesa 7,2 MB. Máximo 5 MB.')
    expect(validarArchivoPrueba(png('a.jpg', 2048, 'image/jpeg'))).toBe('')
    expect(validarDimensionesPrueba(300, 400)).toBe(true)
    expect(validarDimensionesPrueba(299, 400)).toBe(false)
    expect(validarDimensionesPrueba(1200, 800)).toBe(false)
  })

  it('cada código del servidor tiene su texto fijo', () => {
    expect(problemaFoto(new ApiError(413, 'x')).texto).toMatch(/Máximo 5 MB/)
    expect(problemaFoto(new ApiError(422, 'x')).titulo).toBe('Usa una foto vertical de cuerpo entero')
    expect(problemaPrueba(new ApiError(400, 'x', 'CONSENT_REQUIRED')).accion).toBe('consentimiento')
    expect(problemaPrueba(new ApiError(400, 'x', 'INVALID_GARMENT')).titulo).toBe('Esta prenda no se puede probar')
    expect(problemaPrueba(new ApiError(429, 'x')).accion).toBe('planes')
    expect(problemaPrueba(new ApiError(504, 'x')).accion).toBe('reintentar')
    // 403 y 404 se ven igual
    expect(problemaPrueba(new ApiError(403, 'x')).titulo).toBe(problemaPrueba(new ApiError(404, 'x')).titulo)
    expect(problemaResultado('SILHOUETTE_NOT_DETECTED').titulo).toBe('No reconocimos tu silueta')
  })
})

describe('probador: errores de la prueba', () => {
  const probar = async (s: string) => {
    escenario(s)
    const user = userEvent.setup()
    renderAt('/probador', [{ path: '/probador', element: <TryOnPage /> }, { path: '/planes', element: <p>Planes</p> }])
    await userEvent.upload(screen.getByTestId('photo-input'), png(), { applyAccept: false })
    await screen.findByText('Foto lista para probar.', {}, { timeout: 3000 })
    await user.click(await screen.findByRole('button', { name: /Blazer oversize/ }))
    await user.click(screen.getByRole('button', { name: /Probarme/ }))
    return user
  }

  it('400 consentimiento: abre los términos y, al aceptar, sigue con la prueba', async () => {
    const user = await probar('consentimiento')
    expect(await screen.findByText('Lo pide la Ley 1581 de protección de datos. Tu foto solo se usa para el probador.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ver y aceptar' }))
    const dialogo = screen.getByRole('dialog', { name: 'Antes de probar, acepta el uso de tu foto' })
    await user.click(within(dialogo).getByRole('button', { name: 'Acepto' }))
    expect(await screen.findByAltText('Resultado de la prueba con Blazer oversize', {}, { timeout: 5000 })).toBeInTheDocument()
  })

  it('429 cuota: dice cuántas pruebas usó y lleva a Radar+', async () => {
    await probar('cuota-agotada')
    expect(await screen.findByText('Usaste las 10 pruebas de este mes')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver Radar+' })).toHaveAttribute('href', '/planes')
    sinFugas()
  })

  it('400 prenda: no se puede probar y se elige otra', async () => {
    await probar('prenda-no-probable')
    expect(await screen.findByText('Esta prenda no se puede probar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Elegir otra prenda' })).toBeInTheDocument()
  })

  it('504: el probador tardó demasiado y se puede reintentar', async () => {
    await probar('ia-lenta')
    expect(await screen.findByText('El probador tardó demasiado en responder')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('FAILED por silueta: pide otra foto sin mostrar el motivo técnico', async () => {
    await probar('silueta')
    expect(await screen.findByText('No reconocimos tu silueta', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Subir otra foto' })).toBeInTheDocument()
    expect(screen.queryByText(/SILHOUETTE/)).not.toBeInTheDocument()
  })

  it('404: la prueba no existe y se vuelve al probador', async () => {
    await probar('prueba-no-existe')
    expect(await screen.findByText('No encontramos esa prueba', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver al probador' })).toBeInTheDocument()
    sinFugas()
  })

  it('413 del servidor: la foto pesa más de 5 MB', async () => {
    escenario('foto-pesada')
    renderAt('/probador', [{ path: '/probador', element: <TryOnPage /> }])
    await userEvent.upload(screen.getByTestId('photo-input'), png(), { applyAccept: false })
    expect(await screen.findByText(/Máximo 5 MB/, {}, { timeout: 3000 })).toBeInTheDocument()
  })
})

describe('detalle de prenda', () => {
  const abrir = () => renderAt('/catalogo/p1', [{ path: '/catalogo/:id', element: <ItemDetailPage /> }, { path: '/catalogo', element: <p>Catálogo</p> }, { path: '/alertas', element: <p>Alertas</p> }])

  it('404: la prenda ya no está disponible y se vuelve al catálogo', async () => {
    renderAt('/catalogo/nada', [{ path: '/catalogo/:id', element: <ItemDetailPage /> }])
    expect(await screen.findByText('Esta prenda ya no está disponible.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toHaveAttribute('href', '/catalogo')
  })

  it('409, 422 y 503 al crear la alerta', async () => {
    const user = userEvent.setup()
    escenario('alerta-duplicada')
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Avisarme cuando llegue' }))
    expect(await screen.findByText('Ya tienes una alerta para esta prenda')).toBeInTheDocument()

    escenario('alerta-con-stock')
    await user.click(screen.getByRole('button', { name: 'Avisarme cuando llegue' }))
    expect(await screen.findByText('Esta prenda ya tiene unidades')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Reservar en tienda' })).toHaveLength(2)

    escenario('catalogo-caido')
    await user.click(screen.getByRole('button', { name: 'Avisarme cuando llegue' }))
    expect(await screen.findByText('No pudimos crear la alerta')).toBeInTheDocument()
    expect(screen.getByText('Intenta más tarde.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('409 al reservar: ya no quedan unidades y la talla queda deshabilitada', async () => {
    const user = userEvent.setup()
    escenario('sin-unidades')
    abrir()
    await user.click(await screen.findByRole('radio', { name: 'M' }))
    await user.click(screen.getByRole('button', { name: 'Reservar en tienda' }))
    expect(await screen.findByText('Ya no quedan unidades en esa talla')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'M, agotada' })).toBeDisabled()
  })
})

describe('catálogo', () => {
  const routes = [{ path: '/catalogo', element: <CatalogPage /> }, { path: '/alertas', element: <p>Alertas</p> }]

  it('400: ordenar por cercanía sin ubicación pide la ubicación o el barrio', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo', routes)
    await screen.findByRole('heading', { name: 'Hoodie azul noche' }, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: 'Ordenar resultados' }))
    await user.click(screen.getByRole('button', { name: /Cercanía/ }))
    expect(await screen.findByText('Activa tu ubicación para ordenar por cercanía')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Usar mi ubicación' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Elegir barrio' })).toBeInTheDocument()
  })

  it('422: la búsqueda recién guardada todavía no llega y se puede reintentar', async () => {
    const user = userEvent.setup()
    escenario('busqueda-pendiente')
    renderAt('/catalogo', routes)
    await screen.findByRole('heading', { name: 'Hoodie azul noche' }, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: /Guardar búsqueda/ }))
    expect(await screen.findByText('Tu búsqueda todavía se está guardando')).toBeInTheDocument()
    sessionStorage.clear()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Guardamos «Catálogo completo»')).toBeInTheDocument()
  })
})

describe('mensajes', () => {
  const routes = [{ path: '/mensajes', element: <MessagesPage /> }]
  const abrirHilo = async () => {
    loginSoporte('u-1', 'Valentina Rojas')
    renderSoporte('/mensajes?c=c2', routes)
    await screen.findByRole('list', { name: 'Mensajes con Luna Store' }, { timeout: 3000 })
    return userEvent.setup()
  }

  it('400: más de 1.000 caracteres avisa debajo de la caja y no deja enviar', async () => {
    await abrirHilo()
    const caja = screen.getByLabelText('Escribe un mensaje')
    // Pegar un texto largo (escribirlo letra por letra tardaría demasiado)
    await userEvent.click(caja)
    await userEvent.paste('a'.repeat(1001))
    expect(screen.getByText('El mensaje puede tener hasta 1.000 caracteres.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
    expect(caja).toHaveValue('a'.repeat(1001))
  })

  it('422: si la publicación se vendió, la caja queda bloqueada y dice por qué', async () => {
    const user = await abrirHilo()
    escenario('chat-cerrado')
    await user.type(screen.getByLabelText('Escribe un mensaje'), '¿Sigue disponible?')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByText('Ya no puedes enviar mensajes')).toBeInTheDocument()
    expect(screen.getByLabelText('Escribe un mensaje')).toBeDisabled()
  })

  it('503: no se pudo enviar, el texto sigue ahí y se puede reintentar', async () => {
    const user = await abrirHilo()
    escenario('publicaciones-caido')
    await user.type(screen.getByLabelText('Escribe un mensaje'), '¿Me la separas para el sábado?')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByText('No pudimos enviar el mensaje')).toBeInTheDocument()
    expect(screen.getByLabelText('Escribe un mensaje')).toHaveValue('¿Me la separas para el sábado?')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    sinFugas()
  })
})

describe('búsquedas y alertas', () => {
  it('404 y 403: la alerta se quita de la lista sin mostrar su ID', async () => {
    const user = userEvent.setup()
    escenario('alerta-borrada')
    renderAt('/alertas', [{ path: '/alertas', element: <AlertsPage /> }])
    await user.click(await screen.findByRole('switch', { name: 'Alerta para Botella térmica 1 L' }, { timeout: 3000 }))
    expect(await screen.findByText('Esa alerta ya no está')).toBeInTheDocument()
    expect(screen.getByText('Actualizamos la lista.')).toBeInTheDocument()
    sinFugas()
  })

  it('403: alerta de otra persona se trata como «Ya no está disponible»', async () => {
    const user = userEvent.setup()
    escenario('alerta-ajena')
    renderAt('/alertas', [{ path: '/alertas', element: <AlertsPage /> }])
    await user.click(await screen.findByRole('switch', { name: 'Alerta para Botella térmica 1 L' }, { timeout: 3000 }))
    expect(await screen.findByText('Ya no está disponible')).toBeInTheDocument()
  })
})

describe('mapa · ms-geolocalización', () => {
  const casa = { lat: 4.65, lng: -74.06 }

  it('400 sin ubicación y 422 con el radio fuera de 1 a 10 km', async () => {
    await expect(mapService.nearby(null, 5)).rejects.toMatchObject({ status: 400 })
    await expect(mapService.nearby(casa, RADIO_KM.max + 1)).rejects.toMatchObject({ status: 422 })
    await expect(mapService.nearby(casa, 0)).rejects.toMatchObject({ status: 422 })
    expect(Array.isArray(await mapService.nearby(casa, RADIO_KM.max))).toBe(true)
  })

  it('404: la tienda ya no existe', async () => {
    escenario('tienda-retirada')
    await expect(mapService.distance('luna', casa)).rejects.toMatchObject({ status: 404 })
  })

  it('la distancia se calcula como el backend (Haversine)', () => {
    expect(distanciaKm(casa, [casa.lng, casa.lat])).toBe(0)
    expect(distanciaKm(casa, [-74.06, 4.74])).toBeCloseTo(10, 0)
  })
})
