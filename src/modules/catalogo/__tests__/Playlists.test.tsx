import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PlaylistsPage from '../pages/PlaylistsPage'
import { playlistService } from '../services/playlistService'
import { renderAt } from '../../experiencia/__tests__/helpers'

const routes = [
  { path: '/playlists', element: <PlaylistsPage /> },
  { path: '/playlists/:id', element: <PlaylistsPage /> },
  { path: '/probador', element: <div>Pantalla Probador</div> },
]

describe('PlaylistsPage (RNF-12 y RF-69 a RF-72)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra el encabezado de perfil, Mis playlists y la regla de máximo 15 prendas', async () => {
    renderAt('/playlists', routes)
    expect(screen.getByRole('heading', { level: 2, name: /Mis playlists/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getAllByText(/Hasta 15 prendas/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/Fin de semana en Usaquén/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/Oficina con Estilo/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('permite abrir el modal de creación y valida el nombre requerido', async () => {
    const user = userEvent.setup()
    renderAt('/playlists', routes)

    const btnNuevo = screen.getByRole('button', { name: /\+ Nueva playlist/i })
    await user.click(btnNuevo)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Crear nueva playlist de estilo/i)).toBeInTheDocument()

    // Intentar crear sin nombre
    await user.click(screen.getByRole('button', { name: /^Crear playlist$/i }))
    expect(screen.getByText(/Ponle un nombre a tu playlist/i)).toBeInTheDocument()

    // Escribir nombre válido
    await user.type(screen.getByLabelText(/Nombre de la playlist/i), 'Nueva Colección Festiva')
    await user.click(screen.getByRole('button', { name: /^Crear playlist$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Playlist creada con éxito/i)).toBeInTheDocument()
    })
  })

  it('muestra las prendas de una playlist al pulsar sobre ella y la capacidad RNF-12', async () => {
    const user = userEvent.setup()
    renderAt('/playlists', routes)

    await waitFor(() => {
      expect(screen.getAllByText(/Fin de semana en Usaquén/i).length).toBeGreaterThanOrEqual(1)
    })

    const playlistCard = screen.getAllByText(/Fin de semana en Usaquén/i)[0]
    await user.click(playlistCard)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText(/\/15 prendas/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/RNF-12/i)).not.toBeInTheDocument()
  })

  it('no muestra corazón de favoritos en las filas de prendas de playlists ajenas y usa ícono de compartir', async () => {
    const user = userEvent.setup()
    renderAt('/playlists/3', routes)

    await screen.findByText(/Saco sastre negro/i)
    expect(screen.queryByRole('button', { name: /Guardar Saco sastre negro en favoritos/i })).not.toBeInTheDocument()

    const shareBtn = screen.getByRole('button', { name: /Compartir playlist/i })
    expect(shareBtn).not.toHaveTextContent('···')
    expect(shareBtn.querySelector('svg')).not.toBeNull()

    await user.click(shareBtn)
    expect(screen.getByText('Enlace copiado para compartir.')).toBeInTheDocument()
  })

  it('conecta editar y eliminar playlist con playlistService.update y playlistService.delete', async () => {
    const updateSpy = vi.spyOn(playlistService, 'update')
    const deleteSpy = vi.spyOn(playlistService, 'delete').mockResolvedValueOnce(true)

    const user = userEvent.setup()
    renderAt('/playlists/u-weekend', routes)

    const editBtn = await screen.findByRole('button', { name: /Editar/i })
    await user.click(editBtn)

    const titleInput = screen.getByDisplayValue(/Fin de semana en Usaquén/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Domingo en Chapinero')
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'u-weekend',
        expect.objectContaining({ nombre: 'Domingo en Chapinero' }),
      )
    })

    await user.click(screen.getByRole('button', { name: /Eliminar playlist/i }))
    const confirmDialog = screen.getByRole('dialog', { name: /Confirmar eliminación/i })
    await user.click(within(confirmDialog).getByRole('button', { name: /Eliminar playlist/i }))

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('u-weekend')
    })
  })

  it('alterna el like (toggle ON y OFF) de una playlist ajena llamando a playlistService.toggleLike', async () => {
    const toggleLikeSpy = vi
      .spyOn(playlistService, 'toggleLike')
      .mockResolvedValueOnce({ likes: 13, liked: true })
      .mockResolvedValueOnce({ likes: 12, liked: false })

    const user = userEvent.setup()
    renderAt('/playlists/3', routes)

    const likeBtn = await screen.findByRole('button', { name: /^Me gusta$/i })
    expect(likeBtn).toHaveAttribute('aria-pressed', 'false')

    await user.click(likeBtn)
    await waitFor(() => expect(toggleLikeSpy).toHaveBeenCalledTimes(1))
    expect(toggleLikeSpy).toHaveBeenNthCalledWith(1, '3')
    const unlikeBtn = screen.getByRole('button', { name: /Quitar me gusta/i })
    expect(unlikeBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Te gusta esta playlist.')).toBeInTheDocument()

    await user.click(unlikeBtn)
    await waitFor(() => expect(toggleLikeSpy).toHaveBeenCalledTimes(2))
    expect(toggleLikeSpy).toHaveBeenNthCalledWith(2, '3')
    expect(screen.getByRole('button', { name: /^Me gusta$/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Ya no te gusta esta playlist.')).toBeInTheDocument()
  })
})
