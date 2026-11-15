import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/modules/core/api/apiClient'
import PlaylistsPage from '../pages/PlaylistsPage'
import { playlistService } from '../services/playlistService'
import { errorDeAgregar, TEXTOS_PLAYLIST } from '../utils/erroresPlaylist'
import { renderAt } from '../../experiencia/__tests__/helpers'

const routes = [
  { path: '/playlists', element: <PlaylistsPage /> },
  { path: '/playlists/:id', element: <PlaylistsPage /> },
]

const abrirAgregar = async (user: ReturnType<typeof userEvent.setup>) => {
  renderAt('/playlists/u-weekend', routes)
  await user.click((await screen.findAllByRole('button', { name: /Agregar prendas/ }))[0])
  return screen.getByRole('dialog', { name: 'Agregar prendas a la playlist' })
}

describe('Playlists · errores del plan (Cristian)', () => {
  afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })

  it('400: nombre vacío → mensaje debajo del campo', async () => {
    const user = userEvent.setup()
    renderAt('/playlists', routes)
    await user.click(screen.getByRole('button', { name: /\+ Nueva playlist/i }))
    await user.click(screen.getByRole('button', { name: /^Crear playlist$/i }))
    const campo = screen.getByLabelText(/Nombre de la playlist/i)
    expect(screen.getByText(TEXTOS_PLAYLIST.nombre).closest('[role="alert"]')).toHaveAttribute('id', 'pl-nombre-err')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveFocus()
  })

  it('422 del servidor al crear (nombre muy largo): mensaje debajo del nombre, sin texto del servidor', async () => {
    vi.spyOn(playlistService, 'create').mockRejectedValue(new ApiError(422, 'name length > 40'))
    const user = userEvent.setup()
    renderAt('/playlists', routes)
    await user.click(screen.getByRole('button', { name: /\+ Nueva playlist/i }))
    await user.type(screen.getByLabelText(/Nombre de la playlist/i), 'Colección de invierno')
    await user.click(screen.getByRole('button', { name: /^Crear playlist$/i }))
    expect(await screen.findByText(TEXTOS_PLAYLIST.nombreLargo)).toBeInTheDocument()
    expect(screen.queryByText(/name length/)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre de la playlist/i)).toHaveValue('Colección de invierno')
  })

  it('422 al agregar (más de 15): mensaje junto a la acción y contador 15/15', async () => {
    sessionStorage.setItem('sr_demo_playlist', '422')
    const user = userEvent.setup()
    const dialogo = await abrirAgregar(user)
    expect(within(dialogo).getByTestId('contador-prendas')).toHaveTextContent(/^\d+\/15$/)
    await user.selectOptions(within(dialogo).getByRole('combobox'), within(dialogo).getAllByRole('option')[1])
    await user.click(within(dialogo).getByRole('button', { name: 'Agregar prenda' }))
    expect(await within(dialogo).findByText(TEXTOS_PLAYLIST.limite)).toBeInTheDocument()
    expect(within(dialogo).getByTestId('contador-prendas')).toHaveTextContent('15/15')
    expect(within(dialogo).getByRole('button', { name: 'Agregar prenda' })).toBeDisabled()
  })

  it('422 por prenda repetida: «Esa prenda ya está en la playlist»; si no estaba, es el límite', () => {
    expect(errorDeAgregar(new ApiError(422, 'duplicate'), true)).toEqual({ texto: TEXTOS_PLAYLIST.repetida, limite: false })
    expect(errorDeAgregar(new ApiError(422, 'max 15'), false)).toEqual({ texto: TEXTOS_PLAYLIST.limite, limite: true })
  })

  it('404: «Esta playlist no existe o no está disponible» con Volver a playlists', async () => {
    const user = userEvent.setup()
    renderAt('/playlists/no-existe', routes)
    expect(await screen.findByRole('heading', { name: TEXTOS_PLAYLIST.noDisponible })).toBeInTheDocument()
    expect(screen.getByTestId('codigo-error')).toHaveTextContent('404')
    await user.click(screen.getByRole('button', { name: 'Volver a playlists' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: TEXTOS_PLAYLIST.noDisponible })).not.toBeInTheDocument())
  })

  it('403 (privada de otra persona): el mismo texto que el 404', async () => {
    vi.spyOn(playlistService, 'getAll').mockResolvedValue([])
    renderAt('/playlists/privada-de-otra', routes)
    expect(await screen.findByRole('heading', { name: TEXTOS_PLAYLIST.noDisponible })).toBeInTheDocument()
  })
})
