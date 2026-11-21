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

  it('estado vacío cuando no hay ninguna playlist disponible', async () => {
    vi.spyOn(playlistService, 'getAll').mockResolvedValue([])
    renderAt('/playlists', routes)

    expect(await screen.findByRole('heading', { level: 3, name: /Aún no hay playlists disponibles/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Todas \(0\)/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Creadas por ti \(0\)/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Guardadas \(0\)/i })).toBeInTheDocument()
  })

  it('mantiene las pestañas visibles y muestra estado vacío al entrar a una pestaña sin playlists', async () => {
    const user = userEvent.setup()
    vi.spyOn(playlistService, 'getAll').mockResolvedValue([
      {
        id: 'pl-ajena',
        nombre: 'Playlist de otro usuario',
        descripcion: 'Colección de prueba',
        visibilidad: 'PUBLICA',
        estilo: 'CASUAL',
        usuarioId: 'u-otro',
        creador: { id: 'u-otro', nombre: 'Carlos S.', email: 'carlos@styleradar.co' },
        prendas: [],
        likes: 1,
        guardados: 0,
        esGuardada: false,
        fechaCreacion: '2026-11-19T00:00:00Z',
      },
    ])
    renderAt('/playlists', routes)

    const tabCreadas = await screen.findByRole('tab', { name: /Creadas por ti \(0\)/i })
    await user.click(tabCreadas)

    expect(await screen.findByRole('heading', { level: 3, name: /Aún no has creado ninguna playlist/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Ver todas las playlists/i }))
    expect(screen.getByRole('heading', { level: 2, name: /Playlist de otro usuario/i })).toBeInTheDocument()
  })

  it('muestra estado vacío en la pestaña Guardadas cuando el usuario no tiene guardadas', async () => {
    const user = userEvent.setup()
    vi.spyOn(playlistService, 'getAll').mockResolvedValue([
      {
        id: 'pl-mia',
        nombre: 'Mi colección privada',
        descripcion: 'Colección propia',
        visibilidad: 'PRIVADA',
        estilo: 'CASUAL',
        usuarioId: 'u-1',
        creador: { id: 'u-1', nombre: 'Valentina R.', email: 'usuario@styleradar.co' },
        prendas: [],
        likes: 0,
        guardados: 0,
        esGuardada: false,
        fechaCreacion: '2026-11-19T00:00:00Z',
      },
    ])
    renderAt('/playlists', routes)

    const tabGuardadas = await screen.findByRole('tab', { name: /Guardadas \(0\)/i })
    await user.click(tabGuardadas)

    expect(await screen.findByRole('heading', { level: 3, name: /No tienes playlists guardadas/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Explorar playlists/i }))
    expect(screen.getByRole('heading', { level: 2, name: /Mi colección privada/i })).toBeInTheDocument()
  })
})
