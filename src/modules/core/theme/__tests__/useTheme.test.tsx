import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { ThemeProvider, useTheme, getSavedTheme, applyThemeToDom } from '../ThemeContext'

describe('useTheme hook y ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-tema')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>

  it('inicia en oscuro por defecto si no hay localStorage y el sistema no prefiere claro', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('oscuro')
    expect(document.documentElement.getAttribute('data-theme')).toBe('oscuro')
    expect(document.documentElement.getAttribute('data-tema')).toBe('oscuro')
  })

  it('permite cambiar de tema y actualiza localStorage y el DOM', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setTheme('claro')
    })

    expect(result.current.theme).toBe('claro')
    expect(localStorage.getItem('sr:tema')).toBe('claro')
    expect(document.documentElement.getAttribute('data-theme')).toBe('claro')
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro')

    act(() => {
      result.current.setTheme('daltonico')
    })

    expect(result.current.theme).toBe('daltonico')
    expect(localStorage.getItem('sr:tema')).toBe('daltonico')
    expect(document.documentElement.getAttribute('data-theme')).toBe('daltonico')
  })

  it('alterna entre temas en orden oscuro -> claro -> daltonico -> oscuro con toggleTheme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('oscuro')

    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('claro')

    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('daltonico')

    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('oscuro')
  })

  it('detecta correctamente el tema guardado en localStorage', () => {
    localStorage.setItem('sr:tema', 'claro')
    expect(getSavedTheme()).toBe('claro')
  })

  it('aplica los atributos correctos en el DOM con applyThemeToDom', () => {
    applyThemeToDom('claro')
    expect(document.documentElement.getAttribute('data-theme')).toBe('claro')
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro')
    expect(document.documentElement.style.colorScheme).toBe('light')

    applyThemeToDom('oscuro')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('lanza un error claro si se usa fuera de ThemeProvider', () => {
    // Silenciamos el error de consola de react para esta prueba
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useTheme())).toThrow('useTheme debe ser utilizado dentro de un ThemeProvider')
    spy.mockRestore()
  })
})
