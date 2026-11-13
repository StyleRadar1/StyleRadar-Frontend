import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '../ThemeContext'
import { ThemeButton } from '../ThemeButton'

describe('ThemeButton', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.tema
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-cvd')
  })

  it('renderiza con aria-live="polite", el perchero y el label inicial', () => {
    render(
      <ThemeProvider>
        <ThemeButton />
      </ThemeProvider>,
    )

    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-live', 'polite')
    expect(btn).toHaveClass('theme-btn')
    expect(btn.querySelector('.hanger')).toBeInTheDocument()
    expect(btn.querySelector('.mini-shirt')).toBeInTheDocument()
  })

  it('cicla en orden: claro → oscuro → daltónico → claro al hacer clic', () => {
    // Comenzamos forzando modo claro
    localStorage.setItem('sr:tema', 'claro')
    localStorage.setItem('sr:theme-mode', 'light')

    render(
      <ThemeProvider>
        <ThemeButton />
      </ThemeProvider>,
    )

    const btn = screen.getByRole('button')
    const label = btn.querySelector('#label')
    expect(label).toHaveTextContent('Modo claro')

    // Click 1: claro -> oscuro
    fireEvent.click(btn)
    expect(label).toHaveTextContent('Modo oscuro')
    expect(document.documentElement.getAttribute('data-tema')).toBe('oscuro')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('sr:tema')).toBe('oscuro')

    // Click 2: oscuro -> daltónico
    fireEvent.click(btn)
    expect(label).toHaveTextContent('Modo daltónico')
    expect(document.documentElement.getAttribute('data-theme')).toBe('colorblind')
    expect(document.documentElement.getAttribute('data-cvd')).toBe('on')
    expect(localStorage.getItem('sr:tema')).toBe('daltonico')

    // Click 3: daltónico -> claro
    fireEvent.click(btn)
    expect(label).toHaveTextContent('Modo claro')
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('sr:tema')).toBe('claro')
  })

  it('marca el puntito activo con la clase on en cada posición', () => {
    localStorage.setItem('sr:tema', 'oscuro')
    localStorage.setItem('sr:theme-mode', 'dark')

    render(
      <ThemeProvider>
        <ThemeButton />
      </ThemeProvider>,
    )

    const btn = screen.getByRole('button')
    const dots = btn.querySelectorAll('.dots i')
    expect(dots).toHaveLength(3)

    // Inicial en oscuro (index 1)
    expect(dots[0]).not.toHaveClass('on')
    expect(dots[1]).toHaveClass('on')
    expect(dots[2]).not.toHaveClass('on')

    // Cambiar a daltónico (index 2)
    fireEvent.click(btn)
    expect(dots[0]).not.toHaveClass('on')
    expect(dots[1]).not.toHaveClass('on')
    expect(dots[2]).toHaveClass('on')

    // Cambiar a claro (index 0)
    fireEvent.click(btn)
    expect(dots[0]).toHaveClass('on')
    expect(dots[1]).not.toHaveClass('on')
    expect(dots[2]).not.toHaveClass('on')
  })
})
