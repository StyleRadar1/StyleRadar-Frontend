import { useEffect, useState, useCallback } from 'react'
import { Button, Badge } from '@/modules/core/design-system'

export interface TourStep {
  targetSelector: string
  badge: string
  title: string
  desc: string
}

export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="saludo"]',
    badge: '01 / 06 · Tu espacio',
    title: '¡Te damos la bienvenida a tu radar!',
    desc: 'Este es tu punto de partida: consulta tu saludo personalizado, tu barrio configurado y el pulso de la moda local en Bogotá.',
  },
  {
    targetSelector: '[data-tour="buscador"]',
    badge: '02 / 06 · Exploración',
    title: 'Buscador de prendas y tiendas',
    desc: 'Escribe lo que buscas (por ejemplo «botas», «chaqueta de cuero» o «Chapinero») para ver qué almacenes lo tienen disponible hoy.',
  },
  {
    targetSelector: '[data-tour="accesos"]',
    badge: '03 / 06 · Atajos rápidos',
    title: 'Accesos directos a tus herramientas',
    desc: 'Entra en un clic al Probador virtual, tus Playlists guardadas, el Mapa de tiendas cercanas o el catálogo de Segunda vida.',
  },
  {
    targetSelector: '[data-tour="cerca"]',
    badge: '04 / 06 · Para ti',
    title: 'En tu talla, cerca de ti',
    desc: 'Filtramos automáticamente las prendas de tiendas de Bogotá que coinciden con tus tallas y están a menor distancia.',
  },
  {
    targetSelector: '[data-tour="pendiente"]',
    badge: '05 / 06 · Continuar',
    title: 'Sigue donde quedaste',
    desc: 'Retoma fácilmente tu último look armado en el probador, tus playlists en edición o tus prendas favoritas de la wishlist.',
  },
  {
    targetSelector: '[data-tour="novedades"]',
    badge: '06 / 06 · Al día',
    title: 'Novedades y alertas',
    desc: 'Recibe avisos cuando vuelva a estar disponible una prenda agotada, novedades de tiendas que sigues y el estado de tu suscripción.',
  },
]

export const TOUR_STORAGE_KEY = 'styleradar_tour_completed'

interface OnboardingTourProps {
  steps?: TourStep[]
  isOpen: boolean
  onClose: (completed: boolean) => void
}

export function OnboardingTour({ steps = DEFAULT_TOUR_STEPS, isOpen, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 100, left: 100 })

  const updatePosition = useCallback((targetEl: HTMLElement) => {
    const rect = targetEl.getBoundingClientRect()
    const popoverWidth = 380
    const popoverHeight = 220
    const gap = 14

    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    let top = 0
    if (spaceBelow >= popoverHeight + gap || spaceBelow >= spaceAbove) {
      top = rect.bottom + gap
    } else {
      top = Math.max(20, rect.top - popoverHeight - gap)
    }

    const targetCenterX = rect.left + rect.width / 2
    let left = targetCenterX - popoverWidth / 2
    left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, left))

    setPosition({ top: Math.round(top), left: Math.round(left) })
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const step = steps[currentStep]
    if (!step) return

    const targetEl = document.querySelector<HTMLElement>(step.targetSelector)
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      targetEl.classList.add('tour-highlight')
      updatePosition(targetEl)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose(false)
      } else if (e.key === 'ArrowRight' && currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1)
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        setCurrentStep((prev) => prev - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      if (targetEl) {
        targetEl.classList.remove('tour-highlight')
      }
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, currentStep, steps, updatePosition, onClose])

  if (!isOpen) return null

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      try {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      } catch {
        // no-op
      }
      onClose(true)
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    } catch {
      // no-op
    }
    onClose(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-[#08040f]/78 backdrop-blur-sm transition-opacity"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Popover Card */}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tourTitle"
        aria-describedby="tourDesc"
        className="fixed z-[10000] w-[min(25rem,calc(100vw-2rem))] rounded-[1.125rem] border border-violeta/40 bg-[#140d22] p-5 text-blanco shadow-[0_20px_48px_rgba(0,0,0,0.75)] max-sm:bottom-5 max-sm:left-4 max-sm:right-4 max-sm:top-auto max-sm:w-auto"
        style={window.innerWidth > 600 ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
      >
        <div className="flex items-center justify-between gap-2.5">
          <Badge tone="violeta">{step.badge}</Badge>
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Cerrar guía"
            className="flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-white/50 transition hover:bg-white/10 hover:text-blanco"
          >
            ×
          </button>
        </div>

        <h3 id="tourTitle" className="mt-3 text-[1.0625rem] font-bold tracking-tight text-blanco">
          {step.title}
        </h3>
        <p id="tourDesc" className="mt-1 text-xs leading-relaxed text-[#B9B9CA]">
          {step.desc}
        </p>

        {/* Progress dots */}
        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === currentStep ? 'w-5 bg-arena shadow-[0_0_8px_#E8DCCB]' : i < currentStep ? 'w-2 bg-violeta' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Footer controls */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-medium text-white/50 underline underline-offset-4 hover:text-blanco"
          >
            Saltar guía
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="secundario" onClick={handlePrev} className="px-3.5 py-1.5 text-xs">
                Atrás
              </Button>
            )}
            <Button variant="primario" onClick={handleNext} className="px-4 py-1.5 text-xs">
              {isLast ? '¡Empezar a explorar!' : 'Siguiente →'}
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

