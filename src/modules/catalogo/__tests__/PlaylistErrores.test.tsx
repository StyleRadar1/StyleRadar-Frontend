import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/configs/env'
import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
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

  it('muestra la pestaña Destacadas y su estado vacío cuando no hay playlists destacadas', async () => {
    const user = userEvent.setup()
    vi.spyOn(playlistService, 'getAll').mockResolvedValue([
      {
        id: 'pl-normal',
        nombre: 'Playlist sin destacar',
        descripcion: 'Colección de prueba',
        visibilidad: 'PUBLICA',
        estilo: 'CASUAL',
        usuarioId: 'u-1',
        creador: { id: 'u-1', nombre: 'Valentina R.', email: 'usuario@styleradar.co' },
        prendas: [],
        likes: 2,
        guardados: 0,
        destacada: false,
        esGuardada: false,
        fechaCreacion: '2026-11-21T00:00:00Z',
      },
    ])
    renderAt('/playlists', routes)

    const tabDestacadas = await screen.findByRole('tab', { name: /Destacadas \(0\)/i })
    await user.click(tabDestacadas)

    expect(await screen.findByRole('heading', { level: 3, name: /Aún no hay playlists destacadas/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Explorar playlists/i }))
    expect(screen.getByRole('heading', { level: 2, name: /Playlist sin destacar/i })).toBeInTheDocument()
  })

  it('en modo API consulta /api/v1/playlists/users/{userId}, /saved y /featured cuando hay sesión', async () => {
    const prevUseMocks = env.useMocks
    const prevUser = localStorage.getItem('sr_user')
    env.useMocks = false
    tokenStorage.set('jwt-qa-test')
    localStorage.setItem('sr_user', JSON.stringify({ id: 'u-qa', name: 'Usuario QA', email: 'qa@styleradar.co', role: 'BUYER' }))

    const spyGet = vi.spyOn(apiClient, 'get').mockImplementation((url) => {
      if (url === '/api/v1/playlists') {
        return Promise.resolve({ data: [] } as never)
      }
      if (url === '/api/v1/playlists/users/u-qa') {
        return Promise.resolve({
          data: [
            {
              id: 'pl-priv-me',
              nombre: 'Privada de usuario',
              descripcion: 'Desde endpoint users/{userId}',
              visibilidad: 'PRIVADA',
              estilo: 'CASUAL',
              usuarioId: 'u-qa',
              prendas: [],
              likes: 0,
              guardados: 0,
              fechaCreacion: '2026-11-21',
            },
          ],
        } as never)
      }
      if (url === '/api/v1/playlists/users/u-qa/saved') {
        return Promise.resolve({
          data: [
            {
              id: 'pl-saved-me',
              nombre: 'Guardada de usuario',
              descripcion: 'Desde users/{userId}/saved',
              visibilidad: 'PUBLICA',
              estilo: 'URBANO',
              usuarioId: 'u-otro',
              prendas: [],
              likes: 5,
              guardados: 3,
              fechaCreacion: '2026-11-21',
            },
          ],
        } as never)
      }
      if (url === '/api/v1/playlists/featured') {
        return Promise.resolve({
          data: [
            {
              id: 'pl-feat-api',
              nombre: 'Destacada de /featured',
              descripcion: 'Desde featured',
              visibilidad: 'PUBLICA',
              estilo: 'FORMAL',
              usuarioId: 'u-admin',
              prendas: [],
              likes: 40,
              guardados: 12,
              destacada: true,
              fechaCreacion: '2026-11-21',
            },
          ],
        } as never)
      }
      return Promise.reject(new Error(`Unexpected URL ${url}`))
    })

    const user = userEvent.setup()
    try {
      renderAt('/playlists', routes)

      expect(await screen.findByRole('tab', { name: /Destacadas \(1\)/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Creadas por ti \(1\)/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Guardadas \(1\)/i })).toBeInTheDocument()

      expect(spyGet).toHaveBeenCalledWith('/api/v1/playlists')
      expect(spyGet).toHaveBeenCalledWith('/api/v1/playlists/users/u-qa')
      expect(spyGet).toHaveBeenCalledWith('/api/v1/playlists/users/u-qa/saved')
      expect(spyGet).toHaveBeenCalledWith('/api/v1/playlists/featured')

      await user.click(screen.getByRole('tab', { name: /Destacadas \(1\)/i }))
      expect(screen.getByRole('heading', { level: 2, name: /Destacada de \/featured/i })).toBeInTheDocument()
    } finally {
      env.useMocks = prevUseMocks
      tokenStorage.clear()
      if (prevUser === null) localStorage.removeItem('sr_user')
      else localStorage.setItem('sr_user', prevUser)
    }
  })

  it('en modo API toggleLike y toggleSave llaman a /likes y /saves', async () => {
    const prevUseMocks = env.useMocks
    env.useMocks = false
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { likes: 7, esGuardada: true, guardados: 4 },
    } as never)
    try {
      const liked = await playlistService.toggleLike('pl-1')
      expect(liked).toEqual({ likes: 7 })
      expect(postSpy).toHaveBeenCalledWith('/api/v1/playlists/pl-1/likes')

      const saved = await playlistService.toggleSave('pl-1')
      expect(saved).toEqual({ esGuardada: true, guardados: 4 })
      expect(postSpy).toHaveBeenCalledWith('/api/v1/playlists/pl-1/saves')
    } finally {
      env.useMocks = prevUseMocks
    }
  })
})
