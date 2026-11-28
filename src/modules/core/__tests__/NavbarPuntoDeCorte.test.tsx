import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import type { Role } from '@/modules/core/types/roles'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { ThemeProvider } from '../theme/ThemeContext'
import { Navbar } from '../components/Navbar'

const loginAs = (role: Role) => {
  localStorage.setItem('sr_token', 'demo-u-1')
  localStorage.setItem('sr_user', JSON.stringify({ id: 'u-1', name: 'Valentina Rojas', email: 'usuario@styleradar.co', role }))
}

/**
 * En tableta (768 px) el menú completo no cabía: se desbordaba y los íconos de mensajes, campana y perfil quedaban
 * fuera de la pantalla. El menú completo necesita ~1.100 px, así que aparece desde `xl` (1280) y antes hay hamburguesa.
 */
describe('encabezado: el menú completo solo aparece cuando cabe', () => {
  afterEach(() => { localStorage.clear() })

  it('los enlaces de escritorio se muestran desde xl y el botón hamburguesa se oculta desde xl', () => {
    loginAs('BUYER')
    render(<ThemeProvider><AuthProvider><MemoryRouter><Navbar /></MemoryRouter></AuthProvider></ThemeProvider>)
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    const enlaces = nav.querySelector('a[href="/catalogo"]')!.parentElement!
    expect(enlaces).toHaveClass('hidden', 'xl:flex')
    expect(enlaces).not.toHaveClass('md:flex', 'lg:flex')
    const hamburguesa = screen.getByRole('button', { name: 'Abrir menú' })
    expect(hamburguesa).toHaveClass('xl:hidden')
    expect(hamburguesa).not.toHaveClass('md:hidden', 'lg:hidden')
  })

  it('los íconos de mensajes, campana y cuenta no dependen del punto de corte: siempre están en la barra', () => {
    loginAs('BUYER')
    render(<ThemeProvider><AuthProvider><MemoryRouter><Navbar /></MemoryRouter></AuthProvider></ThemeProvider>)
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(nav.querySelector('a[href="/mensajes"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: /Notificaciones/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mi cuenta/ })).toBeInTheDocument()
  })
})
