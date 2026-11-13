import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import {
  ThemeProvider,
  useTheme,
  getSavedTheme,
  getSavedMode,
  getSavedColorblind,
  applyThemeToDom,
} from '../ThemeContext'

describe('useTheme hook y ThemeProvider (Sistema de 3 modos + daltonismo)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-tema')
    document.documentElement.removeAttribute('data-cvd')
    document.documentElement.removeAttribute('data-contrast')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>

  it('inicia en modo system (dark por defecto) si no hay configuración previa', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.mode).toBe('system')
    expect(result.current.resolvedTheme).toBe('dark')
    expect(result.current.colorblind).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-tema')).toBe('oscuro')
    expect(document.documentElement.getAttribute('data-cvd')).toBe('off')
  })

  it('permite cambiar a modo claro con setMode("light")', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setMode('light')
    })

    expect(result.current.mode).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro')
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(localStorage.getItem('sr:theme-mode')).toBe('light')
  })

  it('permite activar y desactivar modo daltónico independientemente con toggleColorblind', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.toggleColorblind()
    })

    expect(result.current.colorblind).toBe(true)
    expect(document.documentElement.getAttribute('data-cvd')).toBe('on')
    expect(document.documentElement.getAttribute('data-contrast')).toBe('on')
    expect(localStorage.getItem('sr:cvd')).toBe('true')

    act(() => {
      result.current.toggleColorblind()
    })

    expect(result.current.colorblind).toBe(false)
    expect(document.documentElement.getAttribute('data-cvd')).toBe('off')
    expect(localStorage.getItem('sr:cvd')).toBe('false')
  })

  it('conserva compatibilidad con setTheme("claro") y setTheme("daltonico")', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setTheme('claro')
    })
    expect(result.current.resolvedTheme).toBe('light')
    expect(result.current.theme).toBe('claro')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro')

    act(() => {
      result.current.setTheme('daltonico')
    })
    expect(result.current.colorblind).toBe(true)
    expect(result.current.theme).toBe('daltonico')
    expect(document.documentElement.getAttribute('data-cvd')).toBe('on')
  })

  it('detecta correctamente valores guardados en localStorage', () => {
    localStorage.setItem('sr:theme-mode', 'light')
    localStorage.setItem('sr:cvd', 'true')

    expect(getSavedMode()).toBe('light')
    expect(getSavedColorblind()).toBe(true)
    expect(getSavedTheme()).toBe('daltonico')
  })

  it('aplica los atributos correctos en el DOM con applyThemeToDom', () => {
    applyThemeToDom('light', false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro')
    expect(document.documentElement.getAttribute('data-cvd')).toBe('off')
    expect(document.documentElement.style.colorScheme).toBe('light')

    applyThemeToDom('dark', true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('colorblind')
    expect(document.documentElement.getAttribute('data-tema')).toBe('oscuro')
    expect(document.documentElement.getAttribute('data-cvd')).toBe('on')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('lanza un error claro si se usa fuera de ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useTheme())).toThrow('useTheme debe ser utilizado dentro de un ThemeProvider')
    spy.mockRestore()
  })
})
