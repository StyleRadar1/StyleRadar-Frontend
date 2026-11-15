import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Aviso, ErrorCampo, EscenaError, useToasts } from '../components/errores'
import { NotFound } from '../components/NotFound'

describe('piezas comunes de error', () => {
  afterEach(() => { vi.useRealTimers() })

  it('la escena muestra el código arriba, el mensaje y las acciones', () => {
    render(<EscenaError escena="tornamesa" codigo="503" etiqueta="Servicio caído" titulo="El servicio no está disponible"
      texto="Intenta en unos minutos." acciones={<button type="button">Reintentar</button>} />)
    expect(screen.getByTestId('codigo-error')).toHaveTextContent('código503')
    expect(screen.getByRole('heading', { level: 2, name: 'El servicio no está disponible' })).toBeInTheDocument()
    expect(screen.getByText('Intenta en unos minutos.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Servicio caído/ })).toBeInTheDocument()
  })

  it('sin código del plan no se inventa un número', () => {
    render(<EscenaError escena="radar" etiqueta="Sin resultados" titulo="No encontramos prendas" texto="Quita algún filtro." />)
    expect(screen.queryByTestId('codigo-error')).not.toBeInTheDocument()
  })

  it('429: el botón se activa cuando la cuenta regresiva llega a cero', () => {
    vi.useFakeTimers()
    render(<EscenaError escena="maniqui" codigo="429" etiqueta="Demasiados intentos" titulo="Espera un momento" texto="…" segundos={2}
      acciones={(restante) => <button type="button" disabled={restante > 0}>Pedir otro código</button>} />)
    expect(screen.getByRole('button', { name: 'Pedir otro código' })).toBeDisabled()
    expect(screen.getByText('0:02')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1000) })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('button', { name: 'Pedir otro código' })).toBeEnabled()
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('el error de campo se anuncia y se enlaza con el input', () => {
    render(<><input aria-describedby="correo-err" aria-invalid /><ErrorCampo id="correo">Escribe un correo válido</ErrorCampo></>)
    const err = screen.getByRole('alert')
    expect(err).toHaveAttribute('id', 'correo-err')
    expect(err).toHaveTextContent('Escribe un correo válido')
  })

  it('el aviso de error se anuncia como alerta y el informativo como estado', () => {
    render(<><Aviso tono="error" titulo="No pudimos entrar con Google" /><Aviso tono="info" titulo="Tu búsqueda se está guardando" /></>)
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos entrar con Google')
    expect(screen.getByRole('status')).toHaveTextContent('Tu búsqueda se está guardando')
  })

  it('los toasts se van solos a los 5 segundos', () => {
    vi.useFakeTimers()
    function Prueba() {
      const { items, mostrar } = useToasts()
      return <><p>toasts: {items.length}</p><button type="button" onClick={() => mostrar({ tono: 'error', titulo: 'No se pudo cambiar el estado' })}>mostrar</button></>
    }
    render(<Prueba />)
    act(() => { screen.getByRole('button', { name: 'mostrar' }).click() })
    expect(screen.getByText('toasts: 1')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByText('toasts: 0')).toBeInTheDocument()
  })

  it('el 404 general usa la escena del perchero', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'No encontramos esta página' })).toBeInTheDocument()
    expect(screen.getByTestId('codigo-error')).toHaveTextContent('404')
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
  })
})
