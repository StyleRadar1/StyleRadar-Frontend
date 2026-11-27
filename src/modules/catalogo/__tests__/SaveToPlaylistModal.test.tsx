import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AuthContext, type AuthState } from '@/modules/identidad/states/authContext'
import { SaveToPlaylistModal } from '../components/SaveToPlaylistModal'
import { playlistService } from '../services/playlistService'

vi.mock('../services/playlistService', () => ({
  playlistService: {
    getMine: vi.fn(),
    addItem: vi.fn(),
    create: vi.fn(),
  },
}))

const mockAuth: AuthState = {
  user: { id: '42', name: 'Ana', email: 'ana@test.co', role: 'BUYER' } as any,
  token: 'tok',
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  refreshSession: vi.fn(),
} as any

describe('SaveToPlaylistModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('permite seleccionar en qué playlist existente guardar la prenda', async () => {
    const user = userEvent.setup()
    vi.mocked(playlistService.getMine).mockResolvedValue([
      {
        id: 'pl-1',
        nombre: 'Looks de Oficina',
        descripcion: '',
        creador: { id: '42', nombre: 'Ana' },
        visibilidad: 'PUBLICA',
        prendas: [],
        likes: 0,
        guardados: 0,
        destacada: false,
        esGuardada: false,
        fechaCreacion: '2026-11-27',
      },
    ])
    vi.mocked(playlistService.addItem).mockResolvedValue({
      id: 'pl-1',
      nombre: 'Looks de Oficina',
      descripcion: '',
      creador: { id: '42', nombre: 'Ana' },
      visibilidad: 'PUBLICA',
      prendas: [{ id: 'item-1', nombre: 'Hoodie gris' } as any],
      likes: 0,
      guardados: 0,
      destacada: false,
      esGuardada: false,
      fechaCreacion: '2026-11-27',
    })

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuth}>
          <SaveToPlaylistModal
            isOpen={true}
            item={{ id: 'item-1', nombre: 'Hoodie gris' }}
            onClose={vi.fn()}
          />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    const btn = await screen.findByRole('button', { name: /Looks de Oficina/i })
    await user.click(btn)

    await waitFor(() => {
      expect(playlistService.addItem).toHaveBeenCalledWith('pl-1', 'item-1', 'Hoodie gris')
    })
    expect(await screen.findByText(/Prenda guardada en/i)).toBeInTheDocument()
  })

  it('si el usuario no tiene playlists, permite crear una nueva inline con la prenda', async () => {
    const user = userEvent.setup()
    vi.mocked(playlistService.getMine).mockResolvedValue([])
    vi.mocked(playlistService.create).mockResolvedValue({
      id: 'pl-new',
      nombre: 'Mi primera playlist',
      descripcion: '',
      creador: { id: '42', nombre: 'Ana' },
      visibilidad: 'PUBLICA',
      prendas: [{ id: 'item-9', nombre: 'Chaqueta' } as any],
      likes: 0,
      guardados: 0,
      destacada: false,
      esGuardada: false,
      fechaCreacion: '2026-11-27',
    })

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuth}>
          <SaveToPlaylistModal
            isOpen={true}
            item={{ id: 'item-9', nombre: 'Chaqueta' }}
            onClose={vi.fn()}
          />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    const input = await screen.findByLabelText(/Nombre de la playlist/i)
    await user.type(input, 'Mi primera playlist')
    await user.click(screen.getByRole('button', { name: /Crear y guardar prenda/i }))

    await waitFor(() => {
      expect(playlistService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Mi primera playlist',
          prendaIds: ['item-9'],
        }),
      )
    })
    expect(await screen.findByText(/Mi primera playlist/i)).toBeInTheDocument()
  })
})
