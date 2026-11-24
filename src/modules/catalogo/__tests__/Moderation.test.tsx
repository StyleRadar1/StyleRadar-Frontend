import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/configs/env'
import { apiClient } from '@/modules/core/api/apiClient'
import { moderationService } from '../services/moderationService'
import ModerationPage from '../pages/ModerationPage'
import { renderAt } from '../../experiencia/__tests__/helpers'

const routes = [{ path: '/admin/moderacion', element: <ModerationPage /> }]

describe('ModerationPage (RF-61)', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })
  it('renderiza la página de moderación con sus filtros y lista inicial', async () => {
    renderAt('/admin/moderacion', routes)
    expect(screen.getByRole('heading', { name: /Moderación de publicaciones/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Todas/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Por prenda/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Por publicador/i })).toBeInTheDocument()

    // Esperar a que cargue la lista desde el mock
    await waitFor(() => {
      expect(screen.getByText(/Chaqueta bomber vintage café/i)).toBeInTheDocument()
    })
  })

  it('permite filtrar por Catálogo y por Segunda mano', async () => {
    const user = userEvent.setup()
    renderAt('/admin/moderacion', routes)

    await waitFor(() => {
      expect(screen.getByText(/Chaqueta bomber vintage café/i)).toBeInTheDocument()
    })

    // Filtrar por Segunda mano
    await user.click(screen.getByRole('button', { name: /Segunda mano/i }))
    expect(screen.getByText(/Chaqueta bomber vintage café/i)).toBeInTheDocument()

    // Cambiar a Catálogo
    await user.click(screen.getByRole('button', { name: /Catálogo de tiendas/i }))
    expect(screen.getByText(/Pantalón cargo ripstop beige/i)).toBeInTheDocument()
  })

  it('exige motivo obligatorio al rechazar una prenda (RF-61)', async () => {
    const user = userEvent.setup()
    renderAt('/admin/moderacion', routes)

    await waitFor(() => {
      expect(screen.getByText(/Chaqueta bomber vintage café/i)).toBeInTheDocument()
    })

    // Click en rechazar del primer elemento
    const botonesRechazar = screen.getAllByRole('button', { name: /^Rechazar$/i })
    await user.click(botonesRechazar[0])

    // Se abre el diálogo modal
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Rechazar publicación/i)).toBeInTheDocument()

    // Intentar rechazar sin seleccionar motivo
    await user.click(screen.getByRole('button', { name: /Rechazar con motivo/i }))
    expect(screen.getByText(/Selecciona el motivo de rechazo\./i)).toBeInTheDocument()

    // Seleccionar un motivo válido
    await user.selectOptions(screen.getByLabelText(/Motivo de rechazo/i), 'Las fotos no muestran bien la prenda')
    await user.click(screen.getByRole('button', { name: /Rechazar con motivo/i }))

    // Verificar que se cerró el modal
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('si alguien ya moderó la prenda (422) muestra aviso y recarga la lista', async () => {
    const user = userEvent.setup()
    renderAt('/admin/moderacion', routes)

    await waitFor(() => {
      expect(screen.getByText(/Pantalón cargo ripstop beige/i)).toBeInTheDocument()
    })

    await user.click(screen.getAllByRole('button', { name: /Aprobar/i })[0])
    sessionStorage.setItem('sr_mock', 'regla')
    await user.click(screen.getByRole('button', { name: /Aprobar prenda/i }))
    expect(await screen.findByText('Ya fue moderado — actualizamos la lista')).toBeInTheDocument()
  })
})

describe('moderationService sin mocks (VITE_USE_MOCKS=false)', () => {
  let prevMocks: boolean

  beforeEach(() => {
    prevMocks = env.useMocks
    env.useMocks = false
  })

  afterEach(() => {
    env.useMocks = prevMocks
    vi.restoreAllMocks()
  })

  it('envía decisiones individuales y en lote sin moderadorId', async () => {
    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: undefined } as never)

    await moderationService.decide({ itemId: 'p-1', aprobado: true })
    expect(putSpy).toHaveBeenCalledWith('/api/v1/garments/p-1/moderation', { decision: 'APROBADA' })
    expect(putSpy.mock.calls[0][1]).not.toHaveProperty('moderadorId')

    await moderationService.decidePublisherBatch({
      publicador: 'Almacén QA',
      almacenId: 'alm-qa',
      aprobado: false,
      motivo: 'Foto borrosa',
    })
    expect(putSpy).toHaveBeenCalledWith('/api/v1/garments/pending/stores/alm-qa/moderation', {
      decision: 'RECHAZADA',
      motivo: 'Foto borrosa',
    })
    expect(putSpy.mock.calls[1][1]).not.toHaveProperty('moderadorId')
  })
})

