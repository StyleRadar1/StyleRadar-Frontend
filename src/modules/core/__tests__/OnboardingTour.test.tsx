import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingTour, TOUR_STORAGE_KEY } from '../components/OnboardingTour'

describe('OnboardingTour (P15)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('no se renderiza si isOpen es falso', () => {
    const { container } = render(<OnboardingTour isOpen={false} onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza el primer paso y navega con Siguiente', () => {
    render(<OnboardingTour isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('¡Te damos la bienvenida a tu radar!')).toBeInTheDocument()
    expect(screen.getByText('01 / 06 · Tu espacio')).toBeInTheDocument()

    // En el primer paso no debe aparecer botón Atrás
    expect(screen.queryByText('Atrás')).toBeNull()

    // Avanzamos al siguiente paso
    const nextBtn = screen.getByRole('button', { name: /Siguiente/i })
    fireEvent.click(nextBtn)

    expect(screen.getByText('Buscador de prendas y tiendas')).toBeInTheDocument()
    expect(screen.getByText('Atrás')).toBeInTheDocument()
  })

  it('permite saltar la guía y guarda en localStorage', () => {
    const onClose = vi.fn()
    render(<OnboardingTour isOpen={true} onClose={onClose} />)

    const skipBtn = screen.getByRole('button', { name: /Saltar guía/i })
    fireEvent.click(skipBtn)

    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true')
    expect(onClose).toHaveBeenCalledWith(false)
  })

  it('permite completar todos los pasos y guarda en localStorage', () => {
    const onClose = vi.fn()
    render(<OnboardingTour isOpen={true} onClose={onClose} />)

    // Avanzamos por los 6 pasos
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }))
    }

    // Último botón dice '¡Empezar a explorar!'
    const finishBtn = screen.getByRole('button', { name: /¡Empezar a explorar!/i })
    expect(finishBtn).toBeInTheDocument()
    fireEvent.click(finishBtn)

    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true')
    expect(onClose).toHaveBeenCalledWith(true)
  })
})

