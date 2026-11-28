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
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
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
    const panel = screen.getByRole('dialog', { name: /apariencia y accesibilidad/i })
    expect(panel).toBeInTheDocument()

    // Seleccionar Claro
    const claroOption = screen.getByRole('radio', { name: 'Claro' })
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

    const cvdSwitch = screen.getByRole('switch', { name: /modo para daltonismo/i })
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

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('el panel se dibuja en <body>, fuera del encabezado, para que nada lo desplace', () => {
    const { container } = render(
      <ThemeProvider>
        <AppearancePicker />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /apariencia y accesibilidad/i }))
    const panel = screen.getByRole('dialog', { name: /apariencia y accesibilidad/i })
    expect(container.contains(panel)).toBe(false)
    expect(panel.parentElement).toBe(document.body)
  })

  it('se cierra con el botón de cerrar y al pulsar fuera', () => {
    render(
      <ThemeProvider>
        <AppearancePicker />
      </ThemeProvider>,
    )
    const trigger = screen.getByRole('button', { name: /apariencia y accesibilidad/i })

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: /cerrar el panel de apariencia/i }))
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('las opciones son botones grandes: sin estilos de texto pequeño en el panel', () => {
    render(
      <ThemeProvider>
        <AppearancePicker />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /apariencia y accesibilidad/i }))
    const panel = screen.getByRole('dialog')
    // El panel no usa las clases de Tailwind de 10-12 px que tenía el desplegable anterior
    expect(panel.innerHTML).not.toMatch(/text-\[10|text-xs|text-\[11/)
    expect(screen.getByRole('radio', { name: 'Oscuro' })).toBeInTheDocument()
  })
})
