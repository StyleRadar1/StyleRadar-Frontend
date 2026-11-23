import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ParaTiSections, PARA_TI_SIZE } from '../components/ParaTiSections'
import { feedService } from '../services/feedService'
import { TEXTOS_FEED } from '../types/feed.dto'
import { reiniciarDatos, renderConSesion, sesionComo } from './helpers'

const abrir = () => renderConSesion('/catalogo', [{ path: '/catalogo', element: <ParaTiSections /> }])
const T = { timeout: 3000 }

describe('«Para ti» y «Recomendado para ti» (SR-RF-05 y 06 · F-23)', () => {
  beforeEach(() => { reiniciarDatos(); localStorage.clear(); sessionStorage.clear() })

  it('muestra las recomendaciones con su motivo y el feed paginado', async () => {
    sesionComo('usuario@styleradar.co')
    const user = userEvent.setup()
    abrir()
    expect(await screen.findByText(TEXTOS_FEED.conPerfil, {}, T)).toBeInTheDocument()
    const rec = screen.getByRole('region', { name: 'Recomendado para ti' })
    expect(within(rec).getAllByText(/^Por qué: /).length).toBeGreaterThan(0)
    expect(within(rec).getAllByText('Por qué: Tu estilo Formal y tu talla M')[0]).toBeInTheDocument()

    const feed = screen.getByRole('region', { name: 'Para ti' })
    const mas = await within(feed).findByRole('button', { name: 'Ver más prendas' }, T)
    const antes = within(feed).getAllByRole('link', { name: /^Probar / }).length
    expect(antes).toBe(PARA_TI_SIZE)
    await user.click(mas)
    await waitFor(() => expect(within(feed).getAllByRole('link', { name: /^Probar / }).length).toBeGreaterThan(antes), T)
  })

  it('no aparece para tiendas, fundaciones ni admin', () => {
    sesionComo('luna@styleradar.co')
    abrir()
    expect(screen.queryByRole('region', { name: 'Para ti' })).not.toBeInTheDocument()
  })

  it('sin estilos ni tallas: feed general y el mensaje del documento con enlace al perfil', async () => {
    localStorage.setItem('sr_token', 'demo-u-99')
    localStorage.setItem('sr_user', JSON.stringify({ id: 'u-99', name: 'Nueva', email: 'nueva@correo.com', role: 'BUYER' }))
    const r = await feedService.getRecommendations('u-99')
    expect(r).toMatchObject({ generalWithoutPreferences: true, content: [], message: TEXTOS_FEED.sinPreferencias })
    abrir()
    expect(await screen.findByText(TEXTOS_FEED.sinPreferencias, {}, T)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Actualizar mi perfil' })).toHaveAttribute('href', '/perfil')
  })
})
