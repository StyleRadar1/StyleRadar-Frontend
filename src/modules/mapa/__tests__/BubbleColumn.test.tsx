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
})
