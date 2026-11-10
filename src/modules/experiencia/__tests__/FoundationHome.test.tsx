import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ROLE_HOME } from '@/modules/core/types/roles'
import FoundationHomePage from '../pages/FoundationHomePage'
import { resetDonationMock } from '../services/donationService'

const loginAs = (id: string) => localStorage.setItem('sr_user', JSON.stringify({ id, name: 'Fundación Abrigo Bogotá', email: 'abrigo@styleradar.co', role: 'REPRESENTANTE_FUNDACION' }))
const renderPage = () => render(<MemoryRouter><FoundationHomePage /></MemoryRouter>)

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); resetDonationMock() })

describe('Mi fundación (inicio de la fundación)', () => {
  it('es la primera pantalla de la fundación al iniciar sesión', () => {
    expect(ROLE_HOME.REPRESENTANTE_FUNDACION).toBe('/fundacion')
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
  })

  it('si la cuenta no es de una fundación lo explica', async () => {
    loginAs('u-1')
    renderPage()
    expect(await screen.findByText('No pudimos cargar tu fundación', {}, { timeout: 3000 })).toBeInTheDocument()
  })
})
