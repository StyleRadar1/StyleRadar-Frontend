import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ThemeSelect } from '../theme/ThemeSelect'
import { leerTema } from '../theme/tema'

describe('ThemeSelect (P13)', () => {
  afterEach(() => { delete document.documentElement.dataset.tema })

  it('empieza en oscuro y ofrece los tres temas', () => {
    render(<ThemeSelect />)
    const sel = screen.getByLabelText('Tema de color')
    expect(sel).toHaveValue('oscuro')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Oscuro', 'Claro', 'Daltónico'])
  })

  it('aplica el tema en <html>, lo guarda y sincroniza los demás selectores', async () => {
    const user = userEvent.setup()
    render(<><ThemeSelect /><ThemeSelect /></>)
    const [a, b] = screen.getAllByLabelText('Tema de color')
    await user.selectOptions(a, 'claro')
    expect(document.documentElement.dataset.tema).toBe('claro')
    expect(localStorage.getItem('sr:tema')).toBe('claro')
    expect(b).toHaveValue('claro')
    expect(leerTema()).toBe('claro')
  })

  it('recupera el tema guardado', () => {
    localStorage.setItem('sr:tema', 'daltonico')
    render(<ThemeSelect />)
    expect(screen.getByLabelText('Tema de color')).toHaveValue('daltonico')
  })

  it('ignora un valor guardado que no es un tema', () => {
    localStorage.setItem('sr:tema', 'rosado')
    expect(leerTema()).toBe('oscuro')
  })
})
