import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import ProfilePage from '../pages/ProfilePage'
import { reiniciarDatos, renderConSesion, sesionComo } from './helpers'
import { saveBodyMeasurements } from '@/modules/experiencia/utils/bodyMeasurementsEngine'

const routes = [{ path: '/perfil', element: <ProfilePage /> }]
const abrir = () => renderConSesion('/perfil', routes)

describe('ProfilePage (RF-03 a RF-06)', () => {
  beforeEach(() => { reiniciarDatos(); sesionComo('usuario@styleradar.co') })

  it('carga los datos, las tallas y los estilos de la persona', async () => {
    abrir()
    expect(screen.getByRole('status')).toHaveTextContent(/Cargando tu perfil/i)
    expect(await screen.findByRole('heading', { name: 'Hola, Valentina' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Valentina Rojas')
    expect(screen.getByLabelText('Correo')).toBeDisabled()
    expect(screen.getByLabelText('Talla superior')).toHaveValue('M')
    expect(screen.getByLabelText('Talla inferior')).toHaveValue('30')
    expect(screen.getByLabelText('Calzado')).toHaveValue('38')
    expect(screen.getByRole('button', { name: /Formal/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Vintage/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('radio', { name: /Hombre/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('valida el nombre y el celular antes de guardar', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.clear(screen.getByLabelText('Nombre completo'))
    await user.type(screen.getByLabelText('Nombre completo'), 'Va')
    await user.clear(screen.getByLabelText('Celular'))
    await user.type(screen.getByLabelText('Celular'), '123')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByText(/mínimo 3 letras/)).toBeInTheDocument()
    expect(screen.getByText(/10 dígitos/)).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toHaveFocus()
  })

  it('permite hasta 4 estilos y exige al menos uno', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.click(screen.getByRole('button', { name: /Deportivo/ }))
    await user.click(screen.getByRole('button', { name: /Vintage/ }))
    expect(screen.getByText(/hasta 4 estilos/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Vintage/ })).toHaveAttribute('aria-pressed', 'false')
    for (const s of ['Formal', 'Casual', 'Urbana', 'Deportivo']) await user.click(screen.getByRole('button', { name: new RegExp(s) }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByText('Elige al menos un estilo.')).toBeInTheDocument()
  })

  it('guarda tallas, maniquí y estilos y avisa', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.selectOptions(screen.getByLabelText('Talla superior'), 'L')
    await user.selectOptions(screen.getByLabelText('Calzado'), '40')
    await user.click(screen.getByRole('radio', { name: /Mujer/ }))
    await user.click(screen.getByRole('button', { name: /Vintage/ }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
    expect(screen.getByLabelText('Talla superior')).toHaveValue('L')
    expect(screen.getByLabelText('Calzado')).toHaveValue('40')
    expect(screen.getByRole('radio', { name: /Mujer/ })).toHaveAttribute('aria-checked', 'true')
    expect(JSON.parse(localStorage.getItem('sr_user') ?? '{}').name).toBe('Valentina Rojas')
  })

  it('descarta los cambios sin guardar', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.selectOptions(screen.getByLabelText('Talla superior'), 'XS')
    await user.click(screen.getByRole('button', { name: 'Descartar cambios' }))
    expect(screen.getByLabelText('Talla superior')).toHaveValue('M')
    expect(screen.getByText('Cambios descartados.')).toBeInTheDocument()
  })

  it('muestra un error si el servicio no responde', async () => {
    sessionStorage.setItem('sr_mock', 'sin-red')
    abrir()
    expect(await screen.findByText('No pudimos cargar tu perfil')).toBeInTheDocument()
  })

  it('permite ver y modificar las medidas corporales para el probador virtual desde el perfil', async () => {
    saveBodyMeasurements(
      {
        cuerpoBase: 'femenino',
        unidades: 'metric',
        estatura: 168,
        peso: 58,
        tallaHabitual: 'S',
        pecho: 90,
        cintura: 72,
        cadera: 94,
        hombros: 40,
        largoBrazo: 58,
        largoTorso: 46,
        largoPierna: 98,
        esAproximado: false,
        consentimientoGuardado: true,
        esTemporal: false,
        fechaActualizacion: new Date().toISOString(),
      },
      true,
      'u-1',
    )

    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })

    // Comprobar que la sección de medidas corporales está visible en el perfil
    expect(screen.getByText('Mis medidas corporales')).toBeInTheDocument()
    expect(screen.getByText('1,68 m')).toBeInTheDocument()
    expect(screen.getByText('90 cm')).toBeInTheDocument()
    expect(screen.getByText('72 cm')).toBeInTheDocument()
    expect(screen.getByText('94 cm')).toBeInTheDocument()

    // Abrir asistente para modificar medidas
    const btnModificar = screen.getByRole('button', { name: /Modificar medidas del probador/i })
    fireEvent.click(btnModificar)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Elige tu silueta base y unidades/i })).toBeInTheDocument()
    })

    // Cerrar modal
    fireEvent.click(screen.getByRole('button', { name: /Cerrar asistente/i }))
  })

  it('permite restablecer las medidas del probador desde el perfil', async () => {
    saveBodyMeasurements(
      {
        cuerpoBase: 'femenino',
        unidades: 'metric',
        estatura: 170,
        peso: 60,
        tallaHabitual: 'M',
        pecho: 92,
        cintura: 75,
        cadera: 96,
        hombros: 42,
        largoBrazo: 60,
        largoTorso: 48,
        largoPierna: 100,
        esAproximado: false,
        consentimientoGuardado: true,
        esTemporal: false,
        fechaActualizacion: new Date().toISOString(),
      },
      true,
      'u-1',
    )

    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })

    const btnRestablecer = screen.getByRole('button', { name: /Restablecer medidas/i })
    fireEvent.click(btnRestablecer)

    await waitFor(() => {
      expect(screen.getByText(/Medidas anatómicas del probador restablecidas/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Configurar medidas del probador/i })).toBeInTheDocument()
    })
  })
})
