import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { consentService } from '../services/consentService'
import { pqrsService } from '../services/pqrsService'
import { CookieBanner } from '../components/CookieBanner'
import { LegalFooter } from '../components/LegalFooter'
import { LEGAL_VERSIONS, PROVIDER_INFO } from '../config/legalConfig'

describe('Cumplimiento Legal y Consentimiento de Cookies (Colombia)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('consentService: guarda y recupera el consentimiento de cookies correctamente', async () => {
    expect(consentService.getCookieConsent()).toBeNull()

    const saved = await consentService.saveCookieConsent({
      functional: true,
      analytics: false,
      marketing: false,
    })

    expect(saved.necessary).toBe(true)
    expect(saved.functional).toBe(true)
    expect(saved.analytics).toBe(false)
    expect(saved.marketing).toBe(false)
    expect(saved.version).toBe(LEGAL_VERSIONS.cookiesVersion)

    const retrieved = consentService.getCookieConsent()
    expect(retrieved).not.toBeNull()
    expect(retrieved?.functional).toBe(true)
  })

  it('consentService: detecta cuando la política de datos fue actualizada para usuarios existentes', () => {
    // Si no tiene consentimiento de cookies (primera visita), no debe mostrar la alerta apilada
    expect(consentService.shouldShowDataPolicyUpdateNotice()).toBe(false)

    // Simular que el usuario ya aceptó cookies pero con una versión vieja de datos
    localStorage.setItem('sr_cookie_consent_v1', JSON.stringify({ version: LEGAL_VERSIONS.cookiesVersion }))
    localStorage.setItem('sr_data_policy_acknowledged_version', '1.0') // Versión antigua

    expect(consentService.shouldShowDataPolicyUpdateNotice()).toBe(true)

    // Reconocer la versión actual
    consentService.acknowledgeDataPolicyUpdate()
    expect(consentService.shouldShowDataPolicyUpdateNotice()).toBe(false)
  })

  it('CookieBanner: se muestra en primera visita y permite aceptar todas las cookies', async () => {
    render(
      <MemoryRouter>
        <CookieBanner />
      </MemoryRouter>
    )

    expect(
      screen.getByText(/Este sitio web utiliza cookies con diversas finalidades/i)
    ).toBeInTheDocument()

    const acceptBtn = screen.getByRole('button', { name: /Aceptar todas/i })
    fireEvent.click(acceptBtn)

    await waitFor(() => {
      const consent = consentService.getCookieConsent()
      expect(consent?.functional).toBe(true)
      expect(consent?.analytics).toBe(true)
      expect(consent?.marketing).toBe(true)
    })
  })

  it('CookieBanner: abrir modal con "Configurar" permite ver las 4 categorías con necesarias bloqueadas', async () => {
    render(
      <MemoryRouter>
        <CookieBanner />
      </MemoryRouter>
    )

    const configBtn = screen.getByRole('button', { name: /Configurar/i })
    fireEvent.click(configBtn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Configuración de Cookies y Privacidad/i)).toBeInTheDocument()
    expect(screen.getByText(/Cookies Técnicas y Necesarias/i)).toBeInTheDocument()
    expect(screen.getByText(/Cookies Funcionales y de Preferencia/i)).toBeInTheDocument()
    expect(screen.getByText(/Cookies Analíticas/i)).toBeInTheDocument()
    expect(screen.getByText(/Cookies de Publicidad y Campañas Locales/i)).toBeInTheDocument()

    // Las necesarias deben estar bloqueadas
    const necessaryCheckbox = screen.getByLabelText(/Cookies necesarias siempre activas/i)
    expect(necessaryCheckbox).toBeDisabled()
    expect(necessaryCheckbox).toBeChecked()
  })

  it('pqrsService: genera radicado formal y asigna tiempos legales de respuesta', async () => {
    // 1. Solicitud de Derecho de Retracto (5 días hábiles según Ley 1480 de 2011)
    const retractoRes = await pqrsService.submitPqrs({
      tipo: 'RETRACTO',
      nombreCompleto: 'Andrés López',
      email: 'andres@example.com',
      descripcion: 'Deseo ejercer mi derecho de retracto de la chaqueta comprada hace 2 días.',
      autorizaTratamientoDatos: true,
    })

    expect(retractoRes.radicado).toMatch(/^SR-PQRS-\d{8}-[0-9A-F]{4}$/)
    expect(retractoRes.tiempoRespuestaDiasHabiles).toBe(5)
    expect(retractoRes.estado).toBe('RECIBIDO')

    // 2. Queja o Reclamo (15 días hábiles)
    const reclamoRes = await pqrsService.submitPqrs({
      tipo: 'RECLAMO',
      nombreCompleto: 'Mariana Gómez',
      email: 'mariana@example.com',
      descripcion: 'La costura del pantalón se descosió en el primer uso.',
      autorizaTratamientoDatos: true,
    })

    expect(reclamoRes.tiempoRespuestaDiasHabiles).toBe(15)

    // 3. Petición (10 días hábiles)
    const peticionRes = await pqrsService.submitPqrs({
      tipo: 'PETICION',
      nombreCompleto: 'Juan Castro',
      email: 'juan@example.com',
      descripcion: 'Consulta sobre tabla de medidas en centímetros.',
      autorizaTratamientoDatos: true,
    })

    expect(peticionRes.tiempoRespuestaDiasHabiles).toBe(10)
  })

  it('pqrsService: rechaza la radicación si no se autoriza el tratamiento de datos personales', async () => {
    await expect(
      pqrsService.submitPqrs({
        tipo: 'PETICION',
        nombreCompleto: 'Juan Pérez',
        email: 'juan@example.com',
        descripcion: 'Consulta',
        autorizaTratamientoDatos: false,
      })
    ).rejects.toThrow(/Debes autorizar el tratamiento de datos personales/i)
  })

  it('LegalFooter: renderiza datos del proveedor con corchetes, enlace a la SIC y canal de datos', () => {
    render(
      <MemoryRouter>
        <LegalFooter />
      </MemoryRouter>
    )

    // Información del proveedor
    expect(screen.getByText(PROVIDER_INFO.razonSocial)).toBeInTheDocument()
    expect(screen.getByText(`NIT ${PROVIDER_INFO.nit}`)).toBeInTheDocument()
    expect(screen.getByText(PROVIDER_INFO.direccion)).toBeInTheDocument()

    // Enlace a la SIC
    const sicLinks = screen.getAllByRole('link', { name: /Superintendencia de Industria y Comercio|Portal SIC/i })
    expect(sicLinks.length).toBeGreaterThan(0)
    expect(sicLinks[0]).toHaveAttribute('href', PROVIDER_INFO.sicUrl)

    // Enlace a derecho de retracto
    expect(screen.getAllByText(/Retracto legal|Derecho de Retracto/i).length).toBeGreaterThan(0)
  })
})
