import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import MiTiendaPage from '../pages/MiTiendaPage'
import StoreInfoPage from '../pages/StoreInfoPage'
import { png, renderAt } from '../../experiencia/__tests__/helpers'

describe('Mi tienda e Información de tienda (errores)', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('valida NIT, nombre y correo inválidos (400) en Información de la tienda', async () => {
    const user = userEvent.setup()
    renderAt('/tienda/informacion', [{ path: '/tienda/informacion', element: <StoreInfoPage /> }])

    const nit = screen.getByRole('textbox', { name: /NIT/i })
    await user.clear(nit)
    await user.type(nit, '123')
    const email = screen.getByLabelText(/Correo de la cuenta/i)
    await user.clear(email)
    await user.type(email, 'correo-invalido')

    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('El NIT debe tener entre 8 y 12 dígitos.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa un correo electrónico válido.')).toBeInTheDocument()
  })

  it('bloquea acceso a tienda que no administra (403) sin exponer NIT ni ID', async () => {
    renderAt('/tienda/informacion?tiendaId=t-999', [{ path: '/tienda/informacion', element: <StoreInfoPage /> }])
    expect(await screen.findByText('No existe o no tienes acceso')).toBeInTheDocument()
    expect(screen.queryByText(/901\.482/)).not.toBeInTheDocument()
  })

  it('valida formato y peso de fotos (400), tope de 6 fotos (422) y verificación en revisión (422) en Mi tienda', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderAt('/mi-tienda', [{ path: '/mi-tienda', element: <MiTiendaPage /> }])

    const input = document.querySelector('#fotos-tienda input[type="file"]') as HTMLInputElement
    expect(input).not.toBeNull()

    await user.upload(input, png('doc.pdf', 100, 'application/pdf'))
    expect(await screen.findByText('Sube una imagen JPG o PNG de máximo 6 MB.')).toBeInTheDocument()

    await user.upload(input, png('pesada.png', 7 * 1024 * 1024, 'image/png'))
    expect(await screen.findByText('Sube una imagen JPG o PNG de máximo 6 MB.')).toBeInTheDocument()

    const validSix = Array.from({ length: 6 }, (_, i) => png(`foto-${i + 1}.png`, 256, 'image/png'))
    await user.upload(input, validSix)
    await waitFor(() => {
      expect(screen.getByText(/6\/6 fotos\./i)).toBeInTheDocument()
    })
    expect(document.querySelector('#fotos-tienda input[type="file"]')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Solicitar verificación' }))
    expect(await screen.findByText(/Quedó en revisión/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Solicitar verificación' }))
    expect(await screen.findByText('Tu solicitud ya está en revisión')).toBeInTheDocument()
  })
})

