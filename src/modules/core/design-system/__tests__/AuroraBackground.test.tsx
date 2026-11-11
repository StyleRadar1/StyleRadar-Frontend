import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuroraBackground } from '../AuroraBackground'

describe('AuroraBackground Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza correctamente el contenedor y los 4 blobs de luz de aurora', () => {
    render(
      <AuroraBackground tone="lila">
        <h1>Contenido del Hero</h1>
      </AuroraBackground>
    )

    const container = screen.getByTestId('aurora-background')
    expect(container).toBeDefined()
    expect(container.getAttribute('data-aurora-tone')).toBe('lila')

    expect(screen.getByTestId('aurora-blob-1')).toBeDefined()
    expect(screen.getByTestId('aurora-blob-2')).toBeDefined()
    expect(screen.getByTestId('aurora-blob-3')).toBeDefined()
    expect(screen.getByTestId('aurora-blob-4')).toBeDefined()
    expect(screen.getByTestId('aurora-noise')).toBeDefined()
    expect(screen.getByText('Contenido del Hero')).toBeDefined()
  })

  it('aplica los diferentes tonos (lila, malva, salvia, rosa)', () => {
    const { rerender } = render(<AuroraBackground tone="malva" />)
    expect(screen.getByTestId('aurora-background').getAttribute('data-aurora-tone')).toBe('malva')

    rerender(<AuroraBackground tone="salvia" />)
    expect(screen.getByTestId('aurora-background').getAttribute('data-aurora-tone')).toBe('salvia')

    rerender(<AuroraBackground tone="rosa" />)
    expect(screen.getByTestId('aurora-background').getAttribute('data-aurora-tone')).toBe('rosa')
  })

  it('renderiza los anillos de radar solo cuando showRadar es true', () => {
    const { rerender } = render(<AuroraBackground showRadar={false} />)
    expect(screen.queryByTestId('aurora-radar-rings')).toBeNull()

    rerender(<AuroraBackground showRadar={true} />)
    expect(screen.getByTestId('aurora-radar-rings')).toBeDefined()
  })

  it('pausa las animaciones cuando el documento cambia a hidden', () => {
    render(<AuroraBackground tone="lila" />)
    const container = screen.getByTestId('aurora-background')

    const spy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(container.style.animationPlayState).toBe('paused')

    spy.mockReturnValue(false)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(container.style.animationPlayState).toBe('running')
  })
})
