import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  CVD_INFO,
  CVD_MATRIZ,
  MODOS_CVD,
  aplicarCvdSim,
  idFiltroCvd,
  leerCvdSim,
  matrizSvg,
  type ModoCvdActivo,
} from '../cvdSim'
import { CvdFilters } from '../CvdFilters'
import { ThemeProvider } from '../ThemeContext'
import { AppearancePicker } from '../AppearancePicker'

const ACTIVOS = MODOS_CVD.filter((m): m is ModoCvdActivo => m !== 'normal')

const limpiar = () => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-cvd-sim')
  window.history.replaceState({}, '', '/')
}

describe('simulador de daltonismo: matrices', () => {
  it('cada modo tiene nombre y descripción, y los activos tienen matriz 3×3', () => {
    for (const m of MODOS_CVD) expect(CVD_INFO[m].etiqueta).toBeTruthy()
    for (const m of ACTIVOS) expect(CVD_MATRIZ[m]).toHaveLength(9)
  })

  it('cada fila suma 1: los grises no cambian de color (solo se mueven los tonos)', () => {
    for (const m of ACTIVOS) {
      const f = CVD_MATRIZ[m]
      for (let fila = 0; fila < 3; fila++) {
        const suma = f[fila * 3] + f[fila * 3 + 1] + f[fila * 3 + 2]
        expect(suma, `${m} fila ${fila}`).toBeCloseTo(1, 4)
      }
    }
  })

  it('la acromatopsia da el mismo valor a los tres canales', () => {
    const f = CVD_MATRIZ.acromatopsia
    expect(f.slice(0, 3)).toEqual(f.slice(3, 6))
    expect(f.slice(3, 6)).toEqual(f.slice(6, 9))
  })

  it('cada versión leve altera menos los colores que la total del mismo tipo', () => {
    const identidad = [1, 0, 0, 0, 1, 0, 0, 0, 1]
    const distancia = (m: readonly number[]) => Math.sqrt(m.reduce((s, v, i) => s + (v - identidad[i]) ** 2, 0))
    for (const [leve, total] of [['protanomalia', 'protanopia'], ['deuteranomalia', 'deuteranopia'], ['tritanomalia', 'tritanopia']] as const) {
      expect(distancia(CVD_MATRIZ[leve]), leve).toBeGreaterThan(0)
      expect(distancia(CVD_MATRIZ[leve]), leve).toBeLessThan(distancia(CVD_MATRIZ[total]))
    }
  })

  it('arma la matriz 4×5 del filtro SVG sin tocar el alfa', () => {
    const v = matrizSvg(CVD_MATRIZ.protanopia).split(/\s+/).map(Number)
    expect(v).toHaveLength(20)
    expect(v.slice(15)).toEqual([0, 0, 0, 1, 0])
  })
})

describe('simulador de daltonismo: aplicar y recordar', () => {
  beforeEach(limpiar)
  afterEach(limpiar)

  it('por defecto es visión normal y no deja marca en <html>', () => {
    expect(leerCvdSim()).toBe('normal')
    aplicarCvdSim('normal')
    expect(document.documentElement.hasAttribute('data-cvd-sim')).toBe(false)
  })

  it('aplica el modo en <html>, lo guarda y lo avisa', () => {
    let avisado = ''
    const oir = (e: Event) => { avisado = (e as CustomEvent<string>).detail }
    window.addEventListener('sr:cvd-sim', oir)
    aplicarCvdSim('deuteranopia')
    window.removeEventListener('sr:cvd-sim', oir)
    expect(document.documentElement.getAttribute('data-cvd-sim')).toBe('deuteranopia')
    expect(localStorage.getItem('sr:cvd-sim')).toBe('deuteranopia')
    expect(avisado).toBe('deuteranopia')
    expect(leerCvdSim()).toBe('deuteranopia')
  })

  it('volver a visión normal quita la marca y lo guardado', () => {
    aplicarCvdSim('tritanopia')
    aplicarCvdSim('normal')
    expect(document.documentElement.hasAttribute('data-cvd-sim')).toBe(false)
    expect(localStorage.getItem('sr:cvd-sim')).toBeNull()
  })

  it('el enlace con ?cvd= manda sobre lo guardado, y un valor inventado se ignora', () => {
    localStorage.setItem('sr:cvd-sim', 'protanopia')
    window.history.replaceState({}, '', '/?cvd=acromatopsia')
    expect(leerCvdSim()).toBe('acromatopsia')
    window.history.replaceState({}, '', '/?cvd=inventado')
    expect(leerCvdSim()).toBe('protanopia')
  })

  it('un valor guardado inválido cae a visión normal', () => {
    localStorage.setItem('sr:cvd-sim', 'rojo')
    expect(leerCvdSim()).toBe('normal')
  })
})

describe('simulador de daltonismo: filtros y menú', () => {
  beforeEach(limpiar)
  afterEach(limpiar)

  it('define un filtro SVG por cada modo activo', () => {
    const { container } = render(<CvdFilters />)
    for (const m of ACTIVOS) expect(container.querySelector(`filter#${idFiltroCvd(m)}`)).not.toBeNull()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('en el menú de apariencia, el simulador está plegado y al abrirlo se elige un modo', () => {
    render(
      <ThemeProvider>
        <AppearancePicker />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /apariencia y accesibilidad/i }))
    expect(screen.queryByRole('radiogroup', { name: /simulador de daltonismo/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /simulador de daltonismo/i }))
    const grupo = screen.getByRole('radiogroup', { name: /simulador de daltonismo/i })
    expect(grupo.querySelectorAll('[role="radio"]')).toHaveLength(MODOS_CVD.length)

    fireEvent.click(screen.getByRole('radio', { name: 'Protanopia' }))
    expect(document.documentElement.getAttribute('data-cvd-sim')).toBe('protanopia')
    expect(screen.getByRole('radio', { name: 'Protanopia' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('status')).toHaveTextContent(/Simulador activo: Protanopia/)

    fireEvent.click(screen.getByRole('radio', { name: 'Visión normal' }))
    expect(document.documentElement.hasAttribute('data-cvd-sim')).toBe(false)
  })

  it('si ya hay un modo activo, el menú abre el simulador y dice cuál es', () => {
    aplicarCvdSim('tritanopia')
    render(
      <ThemeProvider>
        <AppearancePicker />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /apariencia y accesibilidad/i }))
    expect(screen.getByRole('radiogroup', { name: /simulador de daltonismo/i })).toBeInTheDocument()
    expect(screen.getByText(/Viendo: Tritanopia/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Tritanopia' })).toHaveAttribute('aria-checked', 'true')
  })
})
