import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MarqueeTape } from '../MarqueeTape'
import * as themeModule from '@/modules/core/theme'

describe('MarqueeTape Component', () => {
  it('renderiza la cinta inclinada con el texto editorial', () => {
    vi.spyOn(themeModule, 'useTheme').mockReturnValue({
      theme: 'oscuro',
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })

    render(<MarqueeTape />)
    const tape = screen.getByLabelText(/Cinta editorial/i)
    expect(tape).toBeDefined()
    expect(tape.textContent).toContain('NUEVA COLECCIÓN • MODA LOCAL BOGOTÁ')
  })

  it('aplica colores de noche en modo oscuro (#F4EEE3 fondo, #05030A texto)', () => {
    vi.spyOn(themeModule, 'useTheme').mockReturnValue({
      theme: 'oscuro',
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })

    render(<MarqueeTape />)
    const tape = screen.getByLabelText(/Cinta editorial/i)
    expect(tape.style.backgroundColor).toBe('rgb(244, 238, 227)') // #F4EEE3
    expect(tape.style.color).toBe('rgb(5, 3, 10)') // #05030A
  })

  it('aplica colores de día en modo claro (#1F1433 fondo, #F7F1E4 texto)', () => {
    vi.spyOn(themeModule, 'useTheme').mockReturnValue({
      theme: 'claro',
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })

    render(<MarqueeTape />)
    const tape = screen.getByLabelText(/Cinta editorial/i)
    expect(tape.style.backgroundColor).toBe('rgb(31, 20, 51)') // #1F1433
    expect(tape.style.color).toBe('rgb(247, 241, 228)') // #F7F1E4
  })
})
