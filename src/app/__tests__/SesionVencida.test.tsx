import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { tomarRetorno } from '@/modules/core/api/retorno'
import { marcarSalidaVoluntaria } from '@/modules/identidad/states/salida'
import { SesionVencida } from '../SesionVencida'

function Donde() {
  const l = useLocation()
  return <p data-testid="ruta">{l.pathname + l.search}</p>
}

const abrir = (ruta: string) => {
  window.history.replaceState(null, '', ruta)
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionVencida />
      <Routes><Route path="*" element={<Donde />} /></Routes>
    </MemoryRouter>,
  )
}

describe('401 en cualquier pantalla (plan de errores · antes de empezar)', () => {
  afterEach(() => { sessionStorage.clear(); window.history.replaceState(null, '', '/') })

  it('en una pantalla pública lleva al inicio de sesión y guarda la página para volver', () => {
    abrir('/playlists/u-weekend')
    act(() => { window.dispatchEvent(new Event('sr:sesion-expirada')) })
    expect(screen.getByTestId('ruta')).toHaveTextContent('/?login')
    expect(tomarRetorno()).toBe('/playlists/u-weekend')
  })

  it('si la persona cerró sesión ella misma, no la manda al inicio de sesión', () => {
    abrir('/planes')
    marcarSalidaVoluntaria()
    act(() => { window.dispatchEvent(new Event('sr:sesion-expirada')) })
    expect(screen.getByTestId('ruta')).toHaveTextContent('/planes')
    expect(tomarRetorno()).toBeNull()
  })
})
