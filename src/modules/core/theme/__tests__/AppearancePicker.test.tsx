import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { ThemeProvider } from '../ThemeContext'
import { AppearancePicker } from '../AppearancePicker'
import { MODOS_CVD, aplicarCvdSim } from '../cvdSim'

const pintar = () =>
  render(
    <ThemeProvider>
      <AppearancePicker />
    </ThemeProvider>,
  )
const boton = () => screen.getByRole('button', { name: /tema de la aplicación/i })
const abrir = () => fireEvent.click(boton())

describe('selector de tema', () => {
  beforeEach(() => {
    localStorage.clear()
    for (const a of ['data-theme', 'data-tema', 'data-cvd', 'data-cvd-sim']) document.documentElement.removeAttribute(a)
    window.history.replaceState({}, '', '/')
  })

  it('el botón se llama «Tema» y anuncia que abre un diálogo', () => {
    pintar()
    expect(boton()).toHaveTextContent('Tema')
    expect(boton()).toHaveAttribute('aria-expanded', 'false')
    expect(boton()).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('el panel es solo de tema: Claro, Oscuro y Daltonismo, sin interruptor ni simulador', () => {
    pintar()
    abrir()
    const panel = screen.getByRole('dialog', { name: 'Tema' })
    const grupo = within(panel).getByRole('radiogroup', { name: 'Tema' })
    expect(grupo.querySelectorAll('[role="radio"]')).toHaveLength(3)
    for (const nombre of ['Claro', 'Oscuro', 'Daltonismo']) expect(within(panel).getByRole('radio', { name: nombre })).toBeInTheDocument()
    expect(within(panel).queryByRole('switch')).toBeNull()
    expect(panel.textContent).not.toMatch(/simulador|accesibilidad|revisar el diseño/i)
  })

  it('permite cambiar a modo claro y a oscuro', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Claro' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro')
    expect(screen.getByRole('radio', { name: 'Claro' })).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(screen.getByRole('radio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'true')
  })

  it('elegir Daltonismo activa la paleta segura y abre la ventana de modos', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Daltonismo' }))

    expect(document.documentElement.getAttribute('data-cvd')).toBe('on')
    expect(document.documentElement.getAttribute('data-theme')).toBe('colorblind')
    // el atributo legado no puede quedarse en «claro»: mezclaría estilos del modo claro con la paleta oscura
    expect(document.documentElement.getAttribute('data-tema')).toBe('daltonico')

    expect(screen.queryByRole('dialog', { name: 'Tema' })).toBeNull()
    const ventana = screen.getByRole('dialog', { name: /modos de daltonismo/i })
    expect(ventana).toHaveAttribute('aria-modal', 'true')
    expect(within(ventana).getAllByRole('radio')).toHaveLength(MODOS_CVD.length)
    expect(within(ventana).getByRole('radio', { name: 'Solo la paleta' })).toHaveAttribute('aria-checked', 'true')
    expect(boton()).toHaveAccessibleName(/tema de la aplicación: daltonismo/i)
  })

  it('cada modo de la ventana lleva su símbolo, oculto a lectores de pantalla porque el nombre ya lo dice', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Daltonismo' }))
    const ventana = screen.getByRole('dialog', { name: /modos de daltonismo/i })
    for (const modo of MODOS_CVD) {
      const icono = ventana.querySelector(`svg[data-modo="${modo}"]`)
      expect(icono, modo).not.toBeNull()
      expect(icono).toHaveAttribute('aria-hidden', 'true')
    }
    expect(within(ventana).getByText(/barra rayada es el color que ese modo no distingue/i)).toBeInTheDocument()
  })

  it('el símbolo marca el color afectado con rayas, también en la versión leve', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Daltonismo' }))
    const ventana = screen.getByRole('dialog', { name: /modos de daltonismo/i })
    const rayadas = (modo: string) =>
      Array.from(ventana.querySelectorAll(`svg[data-modo="${modo}"] rect[fill^="url(#rayas"]`)).length
    // -opía: una barra completa rayada; -omalía: la barra conserva su color y lleva rayas encima; paleta y grises: ninguna
    for (const m of ['protanopia', 'deuteranopia', 'tritanopia', 'protanomalia', 'deuteranomalia', 'tritanomalia']) expect(rayadas(m), m).toBe(1)
    expect(rayadas('normal')).toBe(0)
    expect(rayadas('acromatopsia')).toBe(0)
    // la barra rayada de -opía no tiene color propio; la de -omalía sí
    const colorBarra = (modo: string, i: number) =>
      ventana.querySelectorAll(`svg[data-modo="${modo}"] g`)[i].querySelector('rect')!.getAttribute('fill')
    expect(colorBarra('protanopia', 0)).toMatch(/^url\(#rayas/)
    expect(colorBarra('protanomalia', 0)).toBe('#d62839')
    expect(colorBarra('deuteranopia', 1)).toMatch(/^url\(#rayas/)
    expect(colorBarra('tritanopia', 2)).toMatch(/^url\(#rayas/)
  })

  it('en la ventana, cada modo aplica su filtro y «Solo la paleta» lo quita', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Daltonismo' }))

    fireEvent.click(screen.getByRole('radio', { name: 'Protanopia' }))
    expect(document.documentElement.getAttribute('data-cvd-sim')).toBe('protanopia')
    expect(screen.getByRole('radio', { name: 'Protanopia' })).toHaveAttribute('aria-checked', 'true')
    expect(boton()).toHaveAccessibleName(/modo de daltonismo: protanopia/i)

    fireEvent.click(screen.getByRole('radio', { name: 'Tritanopia' }))
    expect(document.documentElement.getAttribute('data-cvd-sim')).toBe('tritanopia')

    fireEvent.click(screen.getByRole('radio', { name: 'Solo la paleta' }))
    expect(document.documentElement.hasAttribute('data-cvd-sim')).toBe(false)
  })

  it('«Listo» y Escape cierran la ventana y devuelven el foco al botón', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Daltonismo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(boton())

    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Daltonismo' }))
    expect(screen.getByRole('dialog', { name: /modos de daltonismo/i })).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('con Daltonismo ya elegido, volver a pulsarlo reabre la ventana para cambiar de modo', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Daltonismo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))

    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Daltonismo' }))
    expect(screen.getByRole('dialog', { name: /modos de daltonismo/i })).toBeInTheDocument()
  })

  it('volver a Claro u Oscuro quita el modo de daltonismo y la paleta', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Daltonismo' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Deuteranopia' }))
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))
    expect(document.documentElement.getAttribute('data-cvd-sim')).toBe('deuteranopia')

    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Claro' }))
    expect(document.documentElement.hasAttribute('data-cvd-sim')).toBe(false)
    expect(document.documentElement.getAttribute('data-cvd')).toBe('off')
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro')
  })

  it('cierra el panel con Escape, con el botón de cerrar y al pulsar fuera', () => {
    pintar()
    abrir()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(boton())

    abrir()
    fireEvent.click(screen.getByRole('button', { name: /cerrar el selector de tema/i }))
    expect(screen.queryByRole('dialog')).toBeNull()

    abrir()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('el panel se dibuja en <body>, fuera del encabezado, para que nada lo desplace', () => {
    const { container } = pintar()
    abrir()
    const panel = screen.getByRole('dialog', { name: 'Tema' })
    expect(container.contains(panel)).toBe(false)
    expect(panel.parentElement).toBe(document.body)
  })

  it('sin estilos de texto pequeño en el panel ni en la ventana', () => {
    pintar()
    abrir()
    expect(screen.getByRole('dialog').innerHTML).not.toMatch(/text-\[10|text-xs|text-\[11/)
    fireEvent.click(screen.getByRole('radio', { name: 'Daltonismo' }))
    expect(screen.getByRole('dialog').innerHTML).not.toMatch(/text-\[10|text-xs|text-\[11/)
  })

  it('si ya había un modo guardado, el botón lo dice', () => {
    aplicarCvdSim('acromatopsia')
    pintar()
    expect(boton()).toHaveAccessibleName(/modo de daltonismo: acromatopsia/i)
  })
})
