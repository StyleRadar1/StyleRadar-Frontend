import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import PlaylistsPage from '../pages/PlaylistsPage'
import { renderAt } from '../../experiencia/__tests__/helpers'

const routes = [
  { path: '/playlists', element: <PlaylistsPage /> },
  { path: '/playlists/:id', element: <PlaylistsPage /> },
  { path: '/probador', element: <div>Pantalla Probador</div> },
]

describe('PlaylistsPage (RNF-12 y RF-69 a RF-72)', () => {
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
    expect(screen.getByText(/Escribe el nombre de la playlist/i)).toBeInTheDocument()

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
    expect(screen.getAllByText(/RNF-12/i).length).toBeGreaterThanOrEqual(1)
  })
})
