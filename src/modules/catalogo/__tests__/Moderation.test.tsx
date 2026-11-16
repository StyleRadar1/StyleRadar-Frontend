import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
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

