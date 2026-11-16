import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TryOnPage from '../pages/TryOnPage'
import { png, renderAt } from './helpers'

vi.mock('../utils/photoRules', async (orig) => ({ ...(await orig<typeof import('../utils/photoRules')>()), readDimensions: vi.fn().mockResolvedValue({ width: 800, height: 1200 }) }))
vi.mock('../mocks/tryon', async (orig) => ({ ...(await orig<typeof import('../mocks/tryon')>()), MOCK_JOB_TIMES: { pending: 50, done: 150 } }))

const open = () => renderAt('/probador', [{ path: '/probador', element: <TryOnPage /> }])
const upload = async (file: File) => {
  await userEvent.upload(screen.getByTestId('photo-input'), file, { applyAccept: false })
}

describe('probador virtual (RF-23 a RF-27)', () => {
  it('rechaza un archivo inválido sin mostrar vista previa', async () => {
    open()
    await upload(png('foto.heic', 100, 'image/heic'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Usa una foto JPG o PNG.')
    expect(screen.queryByAltText('Vista previa de tu foto')).not.toBeInTheDocument()
  })

  it('si la subida falla descarta la vista previa y muestra el error', async () => {
    sessionStorage.setItem('sr_mock', 'subida-falla')
    open()
    await upload(png())
    expect(await screen.findByText('El probador no está disponible', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByAltText('Vista previa de tu foto')).not.toBeInTheDocument()
  })

  it('flujo completo: foto, prenda compatible, resultado y probar otra prenda', async () => {
    const user = userEvent.setup()
    open()
    await upload(png())
    expect(await screen.findByText('Foto lista para probar.', {}, { timeout: 3000 })).toBeInTheDocument()
    const prendas = await screen.findByRole('list', { name: 'Prendas para probar' })
    expect(within(prendas).getByRole('button', { name: /Chaqueta de nylon.*agotada/ })).toBeDisabled()
    expect(within(prendas).getByRole('button', { name: /Botas de plataforma.*no se puede probar/ })).toBeDisabled()
    await user.click(within(prendas).getByRole('button', { name: /Blazer oversize/ }))
    await user.click(screen.getByRole('button', { name: 'Probarme Blazer oversize' }))
    expect(await screen.findByText(/Estamos vistiendo tu foto|Enviando tu prueba/)).toBeInTheDocument()
    expect(await screen.findByAltText('Resultado de la prueba con Blazer oversize', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText(/Simulado: no es un resultado real/)).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Probar otra prenda' })[0])
    expect(screen.queryByAltText(/Resultado de la prueba/)).not.toBeInTheDocument()
  })

  it('un job fallido ofrece reintentar', async () => {
    sessionStorage.setItem('sr_mock', 'job-falla')
    const user = userEvent.setup()
    open()
    await upload(png())
    await screen.findByText('Foto lista para probar.', {}, { timeout: 3000 })
    await user.click(await screen.findByRole('button', { name: /Hoodie azul noche/ }))
    await user.click(screen.getByRole('button', { name: /Probarme/ }))
    expect(await screen.findByText('No pudimos generar tu prueba', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('un resultado con la URL vencida no se muestra y ofrece generarlo de nuevo', async () => {
    sessionStorage.setItem('sr_mock', 'resultado-expirado')
    const user = userEvent.setup()
    open()
    await upload(png())
    await screen.findByText('Foto lista para probar.', {}, { timeout: 3000 })
    await user.click(await screen.findByRole('button', { name: /Blazer oversize/ }))
    await user.click(screen.getByRole('button', { name: /Probarme/ }))
    expect(await screen.findByText('El resultado ya no está disponible', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.queryByAltText(/Resultado de la prueba/)).not.toBeInTheDocument()
  })

  it('eliminar la foto: pide confirmación, y si falla no dice que se borró', async () => {
    const user = userEvent.setup()
    open()
    await upload(png())
    await screen.findByText('Foto lista para probar.', {}, { timeout: 3000 })
    sessionStorage.setItem('sr_mock', 'borrado-falla')
    await user.click(screen.getByRole('button', { name: 'Eliminar mi foto y resultados' }))
    const dialog = screen.getByRole('dialog', { name: '¿Eliminar tu foto?' })
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText(/No tenemos confirmación de que tu foto se haya borrado/)).toBeInTheDocument()
    expect(screen.getByAltText('Vista previa de tu foto')).toBeInTheDocument()

    sessionStorage.removeItem('sr_mock')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Eliminamos tu foto y los resultados generados con ella.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByAltText('Vista previa de tu foto')).not.toBeInTheDocument())
  })

  it('el diálogo de confirmación cierra con Escape y no borra', async () => {
    const user = userEvent.setup()
    open()
    await upload(png())
    await screen.findByText('Foto lista para probar.', {}, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: 'Eliminar mi foto y resultados' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByAltText('Vista previa de tu foto')).toBeInTheDocument()
  })
})
