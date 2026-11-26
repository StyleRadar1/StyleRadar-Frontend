import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROLE_HOME } from '@/modules/core/types/roles'
import FoundationHomePage from '../pages/FoundationHomePage'
import { donationService, normalizeDonation, resetDonationMock } from '../services/donationService'

const loginAs = (id: string) => localStorage.setItem('sr_user', JSON.stringify({ id, name: 'Fundación Abrigo Bogotá', email: 'abrigo@styleradar.co', role: 'FOUNDATION_REPRESENTATIVE' }))
const renderPage = () => render(<MemoryRouter><FoundationHomePage /></MemoryRouter>)

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); resetDonationMock() })

describe('Mi fundación (inicio de la fundación)', () => {
  it('es la primera pantalla de la fundación al iniciar sesión', () => {
    expect(ROLE_HOME.FOUNDATION_REPRESENTATIVE).toBe('/fundacion')
  })

  it('muestra su página como la ven quienes donan y avisa de las pendientes', async () => {
    loginAs('f-1')
    renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'Fundación Abrigo Bogotá' }, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('Así ven tu página las personas que quieren donar')).toBeInTheDocument()
    expect(screen.getByText('Activa')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Tienes 2 donaciones pendientes')
    expect(screen.getByRole('link', { name: 'Revisar' })).toHaveAttribute('href', '/fundacion/donaciones')

    expect(within(screen.getByRole('list', { name: 'Qué recibimos' })).getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByRole('progressbar', { name: 'Chaquetas talla M y L' })).toHaveAttribute('aria-valuenow', '82')
    expect(screen.getByText('Cl. 45 #13-40, Chapinero')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Ropa donada lista para entregar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver donaciones' })).toHaveAttribute('href', '/fundacion/donaciones')

    const imgSrcs = Array.from(document.querySelectorAll('img')).map((img) => img.getAttribute('src'))
    expect(imgSrcs).toHaveLength(5)
    expect(new Set(imgSrcs).size).toBe(5)
  })

  it('si la cuenta no es de una fundación lo explica', async () => {
    loginAs('u-1')
    renderPage()
    expect(await screen.findByText('No pudimos cargar tu fundación', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('BUG-12: cuenta pendientes y entregadas aun con estados PENDING/SOLICITADA/DELIVERED', async () => {
    loginAs('f-1')
    const spy = vi.spyOn(donationService, 'forMyFoundation').mockResolvedValueOnce([
      normalizeDonation({ id: 1, status: 'PENDING' }),
      normalizeDonation({ id: 2, status: 'DELIVERED' }),
      normalizeDonation({ id: 3, status: 'DELIVERED' }),
      normalizeDonation({ id: 4, status: 'DELIVERED' }),
    ])
    try {
      renderPage()
      expect(await screen.findByRole('heading', { level: 1, name: 'Fundación Abrigo Bogotá' }, { timeout: 3000 })).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Tienes 1 donación pendiente')
      expect(screen.getByText(/3 prendas recibidas en 3 entregas confirmadas/)).toBeInTheDocument()
    } finally {
      spy.mockRestore()
    }
  })
})
