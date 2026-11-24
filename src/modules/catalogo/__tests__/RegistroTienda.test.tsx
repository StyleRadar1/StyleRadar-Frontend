import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { renderConSesion, sesionComo } from '@/modules/identidad/__tests__/helpers'
import StoreRegisterPage from '../pages/StoreRegisterPage'
import { cuerpoRegistro, errorDeRut, erroresRegistroTienda, TEXTOS_REGISTRO, type StoreRegisterForm } from '../services/storeRegistrationService'

const pdf = (bytes = 1000, nombre = 'rut.pdf', tipo = 'application/pdf') => new File([new Uint8Array(bytes)], nombre, { type: tipo })
const FORM: StoreRegisterForm = {
  nit: '900123456-1', tradeName: 'Atelier Urbano', description: '', phone: '', contactEmail: 'Hola@Atelier.co',
  latitude: '', longitude: '', categories: ['CASUAL'],
}
const NO_TIENE = new ApiError(404, 'no', 'RESOURCE_NOT_FOUND')

const abrir = () => {
  sesionComo('luna@styleradar.co')
  return renderConSesion('/tienda/registro', [{ path: '/tienda/registro', element: <StoreRegisterPage /> }])
}

describe('F-21: registrar el almacén con RUT', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
  afterEach(() => { vi.restoreAllMocks() })

  it('valida con los mensajes de ms-tiendas', () => {
    const e = erroresRegistroTienda({ ...FORM, nit: '900.123.456', tradeName: 'A', contactEmail: 'x', categories: [], latitude: '100' }, null)
    expect(e).toMatchObject({
      nit: 'El NIT debe tener un formato válido (ej. 900123456-1)',
      tradeName: 'El nombre comercial debe tener entre 2 y 120 caracteres',
      contactEmail: 'El correo de contacto debe tener un formato válido',
      categories: 'Debe indicar al menos una categoría comercial',
      latitude: 'La latitud debe estar entre -90 y 90',
      rut: TEXTOS_REGISTRO.rutFalta,
    })
    expect(erroresRegistroTienda(FORM, pdf())).toEqual({})
  })

  it('el RUT es un PDF de máximo 5 MB', () => {
    expect(errorDeRut(pdf())).toBe('')
    expect(errorDeRut(pdf(5 * 1024 * 1024 + 1))).toBe(TEXTOS_REGISTRO.rut)
    expect(errorDeRut(pdf(100, 'rut.png', 'image/png'))).toBe(TEXTOS_REGISTRO.rut)
  })

  it('el cuerpo usa los nombres del JSON y no manda opcionales vacíos', () => {
    expect(cuerpoRegistro({ ...FORM, latitude: '4,65' }, 'https://blob/rut.pdf')).toEqual({
      nit: '900123456-1', tradeName: 'Atelier Urbano', contactEmail: 'hola@atelier.co', latitude: 4.65, categories: ['CASUAL'], rutPdfUrl: 'https://blob/rut.pdf',
    })
  })

  it('sube el RUT en el campo file y registra con su URL: queda en revisión', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(NO_TIENE)
    const post = vi.spyOn(apiClient, 'post').mockImplementation(async (url: string) => {
      if (url === '/api/v1/stores/documents/rut') return { data: { url: 'https://blob/rut/1.pdf' } }
      return { data: { nit: '900123456-1', tradeName: 'Atelier Urbano', verificationStatus: 'PENDING' } }
    })
    abrir()
    const u = userEvent.setup()
    await u.type(await screen.findByLabelText('Nombre comercial'), 'Atelier Urbano')
    await u.type(screen.getByLabelText('NIT'), '900123456-1')
    await u.type(screen.getByLabelText('Correo de contacto'), 'hola@atelier.co')
    await u.click(screen.getByLabelText('Casual'))
    const rut = pdf()
    await u.upload(screen.getByLabelText(/RUT en PDF/), rut)
    await u.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(await screen.findByText(TEXTOS_REGISTRO.enviado)).toBeInTheDocument()
    const [urlRut, cuerpoRut] = post.mock.calls[0]
    expect(urlRut).toBe('/api/v1/stores/documents/rut')
    expect((cuerpoRut as FormData).get('file')).toBe(rut)
    expect(post.mock.calls[1][0]).toBe('/api/v1/stores')
    expect(post.mock.calls[1][1]).toMatchObject({ nit: '900123456-1', rutPdfUrl: 'https://blob/rut/1.pdf', categories: ['CASUAL'] })
  })

  it('el NIT repetido (409) se muestra en su campo y no vuelve a subir el RUT al reintentar', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(NO_TIENE)
    let intentos = 0
    const post = vi.spyOn(apiClient, 'post').mockImplementation(async (url: string) => {
      if (url === '/api/v1/stores/documents/rut') return { data: { url: 'https://blob/rut/1.pdf' } }
      intentos++
      throw new ApiError(409, 'conflicto', { nit: 'Ya existe un almacén registrado con el NIT: 900123456-1' }, 'CONFLICT')
    })
    abrir()
    const u = userEvent.setup()
    await u.type(await screen.findByLabelText('Nombre comercial'), 'Atelier Urbano')
    await u.type(screen.getByLabelText('NIT'), '900123456-1')
    await u.type(screen.getByLabelText('Correo de contacto'), 'hola@atelier.co')
    await u.click(screen.getByLabelText('Formal'))
    await u.upload(screen.getByLabelText(/RUT en PDF/), pdf())
    await u.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(await screen.findByText('Ya existe un almacén registrado con el NIT: 900123456-1')).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    await screen.findByRole('button', { name: 'Enviar solicitud' })
    expect(intentos).toBe(2)
    expect(post.mock.calls.filter(([url]) => url === '/api/v1/stores/documents/rut')).toHaveLength(1)
  })

  it('si la cuenta ya tiene almacén muestra su estado y no el formulario', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { nit: '9014823371', tradeName: 'Luna Store', verificationStatus: 'APPROVED' } })
    abrir()
    expect(await screen.findByText('Tu cuenta ya tiene un almacén registrado.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar solicitud' })).toBeNull()
  })
})
