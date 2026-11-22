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

  const talla = (tipo: string, t: string) => screen.getByRole('button', { name: `${tipo} ${t}` })

  it('carga los datos, las tallas y los estilos de la persona', async () => {
    abrir()
    expect(screen.getByRole('status')).toHaveTextContent(/Cargando tu perfil/i)
    expect(await screen.findByRole('heading', { name: 'Hola, Valentina' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Valentina Rojas')
    expect(screen.getByLabelText('Correo')).toBeDisabled()
    expect(talla('Talla superior', 'M')).toHaveAttribute('aria-pressed', 'true')
    expect(talla('Talla superior', 'XXL')).toHaveAttribute('aria-pressed', 'false')
    expect(talla('Talla inferior', '30')).toHaveAttribute('aria-pressed', 'true')
    expect(talla('Calzado', '38')).toHaveAttribute('aria-pressed', 'true')
    expect(talla('Calzado', '45')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Formal/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Vintage/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('radio', { name: /Hombre/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('valida el nombre (2 a 100) y el teléfono (7 a 20) antes de guardar', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.clear(screen.getByLabelText('Nombre completo'))
    await user.type(screen.getByLabelText('Nombre completo'), 'V')
    await user.clear(screen.getByLabelText('Teléfono'))
    await user.type(screen.getByLabelText('Teléfono'), '123')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByText(/de 2 a 100 caracteres/)).toBeInTheDocument()
    expect(screen.getByText(/de 7 a 20 caracteres/)).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toHaveFocus()
  })

  it('permite los 5 estilos del documento y exige al menos uno', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.click(screen.getByRole('button', { name: /Deportivo/ }))
    await user.click(screen.getByRole('button', { name: /Vintage/ }))
    expect(screen.getByRole('button', { name: /Vintage/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Urbano/ })).toHaveAttribute('aria-pressed', 'true')
    for (const s of ['Formal', 'Casual', 'Urbano', 'Deportivo', 'Vintage']) await user.click(screen.getByRole('button', { name: new RegExp(s) }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByText('Elige al menos un estilo.')).toBeInTheDocument()
  })

  it('guarda varias tallas por tipo, maniquí y estilos y avisa', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.click(talla('Talla superior', 'L'))
    await user.click(talla('Calzado', '44'))
    await user.click(screen.getByRole('radio', { name: /Mujer/ }))
    await user.click(screen.getByRole('button', { name: /Vintage/ }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
    expect(talla('Talla superior', 'M')).toHaveAttribute('aria-pressed', 'true')
    expect(talla('Talla superior', 'L')).toHaveAttribute('aria-pressed', 'true')
    expect(talla('Calzado', '44')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('radio', { name: /Mujer/ })).toHaveAttribute('aria-checked', 'true')
    expect(JSON.parse(localStorage.getItem('sr_user') ?? '{}').name).toBe('Valentina Rojas')
  })

  it('descarta los cambios sin guardar', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.click(talla('Talla superior', 'XS'))
    await user.click(screen.getByRole('button', { name: 'Descartar cambios' }))
    expect(talla('Talla superior', 'XS')).toHaveAttribute('aria-pressed', 'false')
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
