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
const interruptor = () => screen.getByRole('switch', { name: /daltonismo/i })
const attr = (a: string) => document.documentElement.getAttribute(a)

describe('selector de tema', () => {
  beforeEach(() => {
    localStorage.clear()
    for (const a of ['data-theme', 'data-tema', 'data-cvd', 'data-cvd-sim', 'data-contrast']) document.documentElement.removeAttribute(a)
    window.history.replaceState({}, '', '/')
  })

  it('el botón se llama «Tema» y anuncia que abre un diálogo', () => {
    pintar()
    expect(boton()).toHaveTextContent('Tema')
    expect(boton()).toHaveAttribute('aria-expanded', 'false')
    expect(boton()).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('el panel tiene dos temas (Claro y Oscuro) y, aparte, el interruptor de daltonismo', () => {
    pintar()
    abrir()
    const panel = screen.getByRole('dialog', { name: 'Tema' })
    const temas = within(panel).getByRole('radiogroup', { name: 'Tema' })
    expect(temas.querySelectorAll('[role="radio"]')).toHaveLength(2)
    expect(within(panel).getByRole('radio', { name: 'Claro' })).toBeInTheDocument()
    expect(within(panel).getByRole('radio', { name: 'Oscuro' })).toBeInTheDocument()
    // daltonismo ya no es un tema: es un interruptor aparte
    expect(within(panel).queryByRole('radio', { name: 'Daltonismo' })).toBeNull()
    expect(within(panel).getByRole('switch', { name: /daltonismo/i })).toHaveAttribute('aria-checked', 'false')
    expect(within(panel).getByText('Desactivado')).toBeInTheDocument()
  })

  it('permite cambiar a modo claro y a oscuro', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Claro' }))
    expect(attr('data-theme')).toBe('light')
    expect(attr('data-tema')).toBe('claro')
    expect(screen.getByRole('radio', { name: 'Claro' })).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(attr('data-theme')).toBe('dark')
    expect(screen.getByRole('radio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'true')
  })

  it('el daltonismo se suma al modo CLARO: la página sigue clara y solo cambian los colores', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Claro' }))
    fireEvent.click(interruptor())

    expect(attr('data-cvd')).toBe('on')
    // sigue siendo el tema claro: no pasa a la paleta oscura
    expect(attr('data-theme')).toBe('light')
    expect(attr('data-tema')).toBe('claro')
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(boton()).toHaveAccessibleName(/tema de la aplicación: claro, con filtro de daltonismo/i)
  })

  it('el daltonismo sobre el modo OSCURO usa la paleta oscura de daltonismo', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }))
    fireEvent.click(interruptor())

    expect(attr('data-cvd')).toBe('on')
    expect(attr('data-theme')).toBe('colorblind')
    // el atributo legado no puede quedarse en «claro»: mezclaría estilos del modo claro con la paleta oscura
    expect(attr('data-tema')).toBe('daltonico')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('al activar el daltonismo se cierra el panel y se abre la ventana de modos', () => {
    pintar()
    abrir()
    fireEvent.click(interruptor())

    expect(screen.queryByRole('dialog', { name: 'Tema' })).toBeNull()
    const ventana = screen.getByRole('dialog', { name: /modos de daltonismo/i })
    expect(ventana).toHaveAttribute('aria-modal', 'true')
    expect(within(ventana).getAllByRole('radio')).toHaveLength(MODOS_CVD.length)
    expect(within(ventana).getByRole('radio', { name: 'Sin filtro' })).toHaveAttribute('aria-checked', 'true')
  })

  it('cambiar de tema con el daltonismo activado lo conserva', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Claro' }))
    fireEvent.click(interruptor())
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))

    abrir()
    expect(interruptor()).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Activado')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(interruptor()).toHaveAttribute('aria-checked', 'true')
    expect(attr('data-cvd')).toBe('on')
    expect(attr('data-theme')).toBe('colorblind')

    fireEvent.click(screen.getByRole('radio', { name: 'Claro' }))
    expect(attr('data-cvd')).toBe('on')
    expect(attr('data-theme')).toBe('light')
  })

  it('cada modo de la ventana lleva su símbolo, oculto a lectores de pantalla porque el nombre ya lo dice', () => {
    pintar()
    abrir()
    fireEvent.click(interruptor())
    const ventana = screen.getByRole('dialog', { name: /modos de daltonismo/i })
    for (const modo of MODOS_CVD) {
      const icono = ventana.querySelector(`svg[data-modo="${modo}"]`)
      expect(icono, modo).not.toBeNull()
      expect(icono).toHaveAttribute('aria-hidden', 'true')
    }
    expect(within(ventana).getByText(/barra rayada es el color que ese modo no distingue/i)).toBeInTheDocument()
  })

  it('la ventana trae una muestra de colores con su nombre, para ver cómo cambian con cada modo', () => {
    pintar()
    abrir()
    fireEvent.click(interruptor())
    const ventana = screen.getByRole('dialog', { name: /modos de daltonismo/i })
    const muestra = within(ventana).getByRole('list', { name: /colores de muestra/i })
    const nombres = within(muestra).getAllByRole('listitem').map((li) => li.textContent)
    expect(nombres).toEqual(['Rojo', 'Verde', 'Azul', 'Violeta', 'Naranja', 'Amarillo'])
    expect(within(ventana).getByText(/Observa estos colores/)).toBeInTheDocument()
    // ya no existe la opción «Solo la paleta», que no le mostraba nada a la persona
    expect(within(ventana).queryByText(/Solo la paleta/)).toBeNull()
    expect(within(ventana).getByRole('radio', { name: 'Sin filtro' })).toBeInTheDocument()
  })

  it('el símbolo marca el color afectado con rayas, también en la versión leve', () => {
    pintar()
    abrir()
    fireEvent.click(interruptor())
    const ventana = screen.getByRole('dialog', { name: /modos de daltonismo/i })
    const rayadas = (modo: string) => Array.from(ventana.querySelectorAll(`svg[data-modo="${modo}"] rect[fill^="url(#rayas"]`)).length
    // -opía: una barra completa rayada; -omalía: la barra conserva su color y lleva rayas encima; paleta y grises: ninguna
    for (const m of ['protanopia', 'deuteranopia', 'tritanopia', 'protanomalia', 'deuteranomalia', 'tritanomalia']) expect(rayadas(m), m).toBe(1)
    expect(rayadas('normal')).toBe(0)
    expect(rayadas('acromatopsia')).toBe(0)
    const colorBarra = (modo: string, i: number) => ventana.querySelectorAll(`svg[data-modo="${modo}"] g`)[i].querySelector('rect')!.getAttribute('fill')
    expect(colorBarra('protanopia', 0)).toMatch(/^url\(#rayas/)
    expect(colorBarra('protanomalia', 0)).toBe('#d62839')
    expect(colorBarra('deuteranopia', 1)).toMatch(/^url\(#rayas/)
    expect(colorBarra('tritanopia', 2)).toMatch(/^url\(#rayas/)
  })

  it('en la ventana, cada modo aplica su filtro y «Sin filtro» lo quita', () => {
    pintar()
    abrir()
    fireEvent.click(interruptor())

    fireEvent.click(screen.getByRole('radio', { name: 'Protanopia' }))
    expect(attr('data-cvd-sim')).toBe('protanopia')
    expect(screen.getByRole('radio', { name: 'Protanopia' })).toHaveAttribute('aria-checked', 'true')
    expect(boton()).toHaveAccessibleName(/filtro de daltonismo: protanopia/i)

    fireEvent.click(screen.getByRole('radio', { name: 'Tritanopia' }))
    expect(attr('data-cvd-sim')).toBe('tritanopia')

    fireEvent.click(screen.getByRole('radio', { name: 'Sin filtro' }))
    expect(document.documentElement.hasAttribute('data-cvd-sim')).toBe(false)
  })

  it('«Listo» y Escape cierran la ventana y devuelven el foco al botón', () => {
    pintar()
    abrir()
    fireEvent.click(interruptor())
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(boton())

    abrir()
    fireEvent.click(screen.getByRole('button', { name: /cambiar modo/i }))
    expect(screen.getByRole('dialog', { name: /modos de daltonismo/i })).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('con el daltonismo activo, el panel muestra el modo actual y permite cambiarlo', () => {
    pintar()
    abrir()
    expect(screen.queryByRole('button', { name: /cambiar modo/i })).toBeNull()
    fireEvent.click(interruptor())
    fireEvent.click(screen.getByRole('radio', { name: 'Deuteranopia' }))
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))

    abrir()
    const cambiar = screen.getByRole('button', { name: /cambiar modo/i })
    expect(cambiar).toHaveTextContent('Deuteranopia')
    fireEvent.click(cambiar)
    expect(screen.getByRole('dialog', { name: /modos de daltonismo/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Deuteranopia' })).toHaveAttribute('aria-checked', 'true')
  })

  it('apagar el interruptor quita el daltonismo y el filtro del modo', () => {
    pintar()
    abrir()
    fireEvent.click(screen.getByRole('radio', { name: 'Claro' }))
    fireEvent.click(interruptor())
    fireEvent.click(screen.getByRole('radio', { name: 'Deuteranopia' }))
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))
    expect(attr('data-cvd-sim')).toBe('deuteranopia')

    abrir()
    fireEvent.click(interruptor())
    expect(interruptor()).toHaveAttribute('aria-checked', 'false')
    expect(document.documentElement.hasAttribute('data-cvd-sim')).toBe(false)
    expect(attr('data-cvd')).toBe('off')
    expect(attr('data-tema')).toBe('claro')
    // al apagarlo no se abre ninguna ventana
    expect(screen.queryByRole('dialog', { name: /modos de daltonismo/i })).toBeNull()
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
    fireEvent.click(interruptor())
    expect(screen.getByRole('dialog').innerHTML).not.toMatch(/text-\[10|text-xs|text-\[11/)
  })

  it('si ya había daltonismo y un modo guardados, el botón lo dice', () => {
    localStorage.setItem('sr:cvd', 'true')
    aplicarCvdSim('acromatopsia')
    pintar()
    expect(boton()).toHaveAccessibleName(/con filtro de daltonismo: acromatopsia/i)
  })
})
