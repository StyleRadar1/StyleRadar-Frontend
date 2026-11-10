import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BubbleColumn from '../components/BubbleColumn'
import { ALL_PINS } from '../mocks/mapData'

const renderColumn = () => render(
  <BubbleColumn pins={ALL_PINS} selectedId={null} onSelect={vi.fn()} onHover={vi.fn()} />,
)

describe('burbujas del mapa', () => {
  it('cada tienda y fundación muestra su foto', () => {
    const { container } = renderColumn()
    const fotos = [...container.querySelectorAll('img')].map((i) => i.getAttribute('src'))
    expect(fotos).toHaveLength(ALL_PINS.length)
    expect(fotos).toContain('/img/mapa/luna.jpg')
    expect(fotos).toContain('/img/mapa/abrigo.jpg')
  })

  it('si la foto no carga muestra la inicial del nombre', () => {
    const { container } = renderColumn()
    const antes = container.querySelectorAll('img').length
    fireEvent.error(container.querySelector('img') as HTMLImageElement)
    expect(container.querySelectorAll('img')).toHaveLength(antes - 1)
    expect(screen.getAllByRole('button')).toHaveLength(ALL_PINS.length)
  })

  it('la rueda del mouse pasa a la siguiente tienda y a la anterior', () => {
    const onSelect = vi.fn()
    const { container, rerender } = render(
      <BubbleColumn pins={ALL_PINS} selectedId={null} onSelect={onSelect} onHover={vi.fn()} />,
    )
    const raiz = container.querySelector('.sr-bubbles') as HTMLElement
    fireEvent.wheel(raiz, { deltaY: 100 })
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'lab' }))

    rerender(<BubbleColumn pins={ALL_PINS} selectedId="lab" onSelect={onSelect} onHover={vi.fn()} />)
    // evita el límite de velocidad entre pasos
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000)
    fireEvent.wheel(raiz, { deltaY: 100 })
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'luna' }))
    vi.restoreAllMocks()
  })
})
