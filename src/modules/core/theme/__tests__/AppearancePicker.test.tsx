import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { ThemeProvider } from '../ThemeContext'
import { AppearancePicker } from '../AppearancePicker'

describe('AppearancePicker', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-tema')
    document.documentElement.removeAttribute('data-cvd')
  })

  it('renderiza el botón con accesibilidad aria-expanded y aria-haspopup', () => {
    render(
      <ThemeProvider>
        <AppearancePicker />
      </ThemeProvider>,
    )

    const trigger = screen.getByRole('button', { name: /apariencia y accesibilidad/i })
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('abre el menú al hacer clic y permite cambiar a modo claro', () => {
    render(
      <ThemeProvider>
        <AppearancePicker />
      </ThemeProvider>,
    )

    const trigger = screen.getByRole('button', { name: /apariencia y accesibilidad/i })
    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu', { name: /preferencias de apariencia/i })
    expect(menu).toBeInTheDocument()

    // Seleccionar Claro
    const claroOption = screen.getByRole('menuitemradio', { name: /claro/i })
    fireEvent.click(claroOption)

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro')
  })

  it('permite alternar el interruptor de modo daltónico', () => {
    render(
      <ThemeProvider>
        <AppearancePicker />
      </ThemeProvider>,
    )

    const trigger = screen.getByRole('button', { name: /apariencia y accesibilidad/i })
    fireEvent.click(trigger)

    const cvdSwitch = screen.getByRole('switch', { name: /modo daltónico/i })
    expect(cvdSwitch).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(cvdSwitch)
    expect(cvdSwitch).toHaveAttribute('aria-checked', 'true')
    expect(document.documentElement.getAttribute('data-cvd')).toBe('on')
  })

  it('cierra el menú al presionar Escape', () => {
    render(
      <ThemeProvider>
        <AppearancePicker />
      </ThemeProvider>,
    )

    const trigger = screen.getByRole('button', { name: /apariencia y accesibilidad/i })
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    const menu = screen.getByRole('menu', { name: /preferencias de apariencia/i })
    fireEvent.keyDown(menu, { key: 'Escape' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
