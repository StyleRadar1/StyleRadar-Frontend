import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

describe('portada: móvil (deslizar y puntos)', () => {
  const contador = () => document.querySelector('[aria-live="polite"]')?.textContent?.replace(/\s/g, '')
  const total = String(heroSlides.length).padStart(2, '0')
  const deslizar = (de: [number, number], a: [number, number]) => {
    const portada = document.getElementById('inicio') as HTMLElement
    fireEvent.touchStart(portada, { touches: [{ clientX: de[0], clientY: de[1] }] })
    fireEvent.touchEnd(portada, { changedTouches: [{ clientX: a[0], clientY: a[1] }] })
  }

  it('deslizar a la izquierda avanza y a la derecha retrocede', () => {
    pintar()
    deslizar([300, 400], [150, 405])
    expect(contador()).toBe(`02/${total}`)
    deslizar([100, 400], [260, 395])
    expect(contador()).toBe(`01/${total}`)
  })

  it('un gesto vertical o muy corto no cambia la foto', () => {
    pintar()
    deslizar([200, 300], [240, 520])
    deslizar([200, 400], [230, 400])
    expect(contador()).toBe(`01/${total}`)
  })

  it('hay un punto por foto, con área táctil propia, y tocarlo salta a esa foto', async () => {
    const user = userEvent.setup()
    pintar()
    const puntos = screen.getAllByRole('button', { name: /Ir a la foto/ })
    expect(puntos).toHaveLength(heroSlides.length)
    expect(puntos[0]).toHaveAttribute('aria-current', 'true')
    await user.click(puntos[2])
    expect(contador()).toBe(`03/${total}`)
    expect(puntos[2]).toHaveAttribute('aria-current', 'true')
  })
})
