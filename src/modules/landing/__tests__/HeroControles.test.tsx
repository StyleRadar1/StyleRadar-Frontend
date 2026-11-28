import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Hero } from '@/components/landing/Hero'
import { heroSlides } from '@/data/landingData'

const pintar = () => render(<MemoryRouter><Hero /></MemoryRouter>)

describe('portada: controles de las fotos', () => {
  it('ya no hay botón «Pausar» y sí flechas anterior y siguiente', () => {
    pintar()
    expect(screen.queryByRole('button', { name: /pausar|reanudar/i })).toBeNull()
    expect(screen.getByRole('button', { name: 'Foto anterior' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Foto siguiente' })).toBeInTheDocument()
  })

  it('las flechas cambian de foto y dan la vuelta en los extremos', async () => {
    const user = userEvent.setup()
    pintar()
    const total = String(heroSlides.length).padStart(2, '0')
    const contador = () => document.querySelector('[aria-live="polite"]')?.textContent?.replace(/\s/g, '')
    expect(contador()).toBe(`01/${total}`)
    await user.click(screen.getByRole('button', { name: 'Foto siguiente' }))
    expect(contador()).toBe(`02/${total}`)
    await user.click(screen.getByRole('button', { name: 'Foto anterior' }))
    await user.click(screen.getByRole('button', { name: 'Foto anterior' }))
    expect(contador()).toBe(`${total}/${total}`)
  })

  it('hay una flecha para seguir bajando que apunta a la sección siguiente', () => {
    pintar()
    expect(screen.getByRole('link', { name: 'Seguir bajando para ver más' })).toHaveAttribute('href', '#pe-que-es')
  })

  it('la foto de la gabardina ya no está en el carrusel', () => {
    expect(heroSlides.some((s) => s.src.includes('slide-2'))).toBe(false)
    expect(heroSlides).toHaveLength(4)
  })
})
