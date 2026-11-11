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
      <AuroraBackground>
        <h1>Contenido del Hero</h1>
      </AuroraBackground>
    )

    const container = screen.getByTestId('aurora-background')
    expect(container).toBeDefined()

    expect(screen.getByTestId('aurora-blob-1')).toBeDefined()
    expect(screen.getByTestId('aurora-blob-2')).toBeDefined()
    expect(screen.getByTestId('aurora-blob-3')).toBeDefined()
    expect(screen.getByTestId('aurora-blob-4')).toBeDefined()
    expect(screen.getByText('Contenido del Hero')).toBeDefined()
  })

  it('soporta la variante fija para layout global', () => {
    render(<AuroraBackground fixed />)
    const container = screen.getByTestId('aurora-background')
    expect(container.getAttribute('aria-hidden')).toBe('true')
    expect(container.className).toContain('fixed inset-0')
  })

  it('pausa las animaciones cuando el documento cambia a hidden', () => {
    render(<AuroraBackground />)
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
