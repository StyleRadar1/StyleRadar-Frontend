import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import MiTiendaPage from '../pages/MiTiendaPage'
import { errorDeFoto, storePhotoService, TEXTOS_FOTOS } from '../services/storePhotoService'
import { png, renderAt } from '../../experiencia/__tests__/helpers'

const NIT = '901.482.337-1'
const galeria = () => document.querySelector('#fotos-tienda') as HTMLElement
const abrir = async () => {
  renderAt('/mi-tienda', [{ path: '/mi-tienda', element: <MiTiendaPage /> }])
  expect(await screen.findByText(/3\/6 fotos\./)).toBeInTheDocument()
}

describe('Fotos de la tienda (SR-RF-74 · F-20)', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear() })

  it('acepta JPEG, PNG y WebP de máximo 6 MB y rechaza lo demás', () => {
    expect(errorDeFoto(png('a.webp', 100, 'image/webp'))).toBe('')
    expect(errorDeFoto(png('a.jpg', 100, 'image/jpeg'))).toBe('')
    expect(errorDeFoto(png('a.gif', 100, 'image/gif'))).toBe(TEXTOS_FOTOS.formato)
    expect(errorDeFoto(png('vacia.png', 0, 'image/png'))).toBe(TEXTOS_FOTOS.formato)
    expect(errorDeFoto(png('pesada.webp', 7 * 1024 * 1024, 'image/webp'))).toBe(TEXTOS_FOTOS.formato)
  })

  it('sube una foto WebP y la primera de la galería es la portada', async () => {
    const user = userEvent.setup({ applyAccept: false })
    await abrir()
    expect(within(galeria()).getByText('Portada')).toBeInTheDocument()
    await user.upload(galeria().querySelector('input[type="file"]') as HTMLInputElement, png('vitrina.webp', 256, 'image/webp'))
    expect(await screen.findByText(/4\/6 fotos\./)).toBeInTheDocument()
  })

  it('mover la segunda foto antes la vuelve portada', async () => {
    const user = userEvent.setup()
    await abrir()
    const segunda = (await storePhotoService.list(NIT))[1]
    await user.click(screen.getByRole('button', { name: 'Mover foto 2 antes' }))
    expect(await screen.findByText('Orden guardado. La primera foto es la portada.')).toBeInTheDocument()
    const ahora = await storePhotoService.list(NIT)
    expect(ahora[0]).toMatchObject({ id: segunda.id, position: 1, cover: true })
  })

  it('quitar la portada pide confirmación y la siguiente pasa a ser portada', async () => {
    const user = userEvent.setup()
    await abrir()
    const antes = await storePhotoService.list(NIT)
    await user.click(screen.getByRole('button', { name: 'Quitar foto 1' }))
    const dialog = screen.getByRole('dialog', { name: '¿Quitar esta foto?' })
    expect(dialog).toHaveTextContent('Es la portada')
    await user.click(within(dialog).getByRole('button', { name: 'Quitar foto' }))
    expect(await screen.findByText(/2\/6 fotos\./)).toBeInTheDocument()
    await waitFor(async () => expect((await storePhotoService.list(NIT))[0]).toMatchObject({ id: antes[1].id, cover: true }))
  })

  it('el servicio responde 422 con la séptima foto', async () => {
    for (let i = 0; i < 3; i++) await storePhotoService.upload(NIT, png(`f${i}.png`, 100, 'image/png'))
    await expect(storePhotoService.upload(NIT, png('septima.png', 100, 'image/png'))).rejects.toMatchObject({ status: 422 })
  })
})
