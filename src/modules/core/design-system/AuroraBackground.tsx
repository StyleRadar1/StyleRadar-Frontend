import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface AuroraBackgroundProps {
  /** Clases CSS adicionales para el contenedor */
  className?: string
  /** Elementos hijos renderizados dentro del contenido de la aurora */
  children?: ReactNode
  /** Si debe tener una altura mínima completa o ajustarse al contenido */
  fullHeight?: boolean
  /** Si debe actuar como fondo fijo global (layout) detrás de todo el contenido */
  fixed?: boolean
}

/**
 * AuroraBackground — Fondo "Amanecer en el radar" animado.
 *
 * Degradado suave, limpio y liso con manchas de color difusas sin grano ni relieve.
 * Paleta malva unificada para toda la aplicación (referencia del Catálogo).
 * - Modo Claro: Base arena (#E6D9C0), manchas suaves moradas/malvas (#e3b3d3, #cfa6e6, #a97fd6, #e8d4f0).
 * - Modo Oscuro: Base negro-violeta (#05030A), manchas violetas/malvas (#c98ab8, #6a2f8a, #b06ae0, #3a1a6a).
 *
 * Rendimiento y Accesibilidad:
 * - will-change: transform en las 4 manchas.
 * - IntersectionObserver / visibilitychange: pausa las animaciones cuando no está visible.
 * - prefers-reduced-motion: desactiva las animaciones por completo.
 */
export function AuroraBackground({
  className = '',
  children,
  fullHeight = false,
  fixed = false,
}: AuroraBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // 1. Pausar animaciones cuando la pestaña está oculta
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false)
      } else {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const hasZeroDims = rect.height === 0 && rect.width === 0
          const inViewport = hasZeroDims || (rect.bottom > 0 && rect.top < window.innerHeight)
          setIsVisible(inViewport)
        } else {
          setIsVisible(true)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 2. IntersectionObserver para pausar si el héroe no está en pantalla (solo si no es fixed)
    const el = containerRef.current
    let observer: IntersectionObserver | null = null

    if (!fixed && el && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (entry) {
            setIsVisible(entry.isIntersecting && !document.hidden)
          }
        },
        { threshold: 0.05 }
      )
      observer.observe(el)
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (observer && el) {
        observer.unobserve(el)
        observer.disconnect()
      }
    }
  }, [fixed])

  return (
    <div
      ref={containerRef}
      data-testid="aurora-background"
      aria-hidden={fixed}
      className={`sr-aurora-container overflow-hidden ${
        fixed ? 'fixed inset-0 pointer-events-none z-0' : 'relative'
      } ${fullHeight ? 'min-h-screen' : ''} ${className}`}
      style={{
        animationPlayState: isVisible ? 'running' : 'paused',
      }}
    >
      {/* Capa de manchas de luz difusas (blobs de aurora sin grano) */}
      <div
        className="sr-aurora-blobs-layer pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
        style={{
          animationPlayState: isVisible ? 'running' : 'paused',
        }}
      >
        {/* Mancha 1: Toque rosado arriba izquierda */}
        <div
          data-testid="aurora-blob-1"
          className="sr-aurora-blob sr-aurora-blob-1 absolute rounded-full"
          style={{
            width: '52vw',
            height: '52vw',
            minWidth: '380px',
            minHeight: '380px',
            left: '-12vw',
            top: '-15vw',
            backgroundColor: 'var(--aurora-c1)',
            filter: 'blur(var(--aurora-blur, 75px))',
            willChange: 'transform',
            animationPlayState: isVisible ? 'running' : 'paused',
          }}
        />

        {/* Mancha 2: Mancha violeta naciendo del borde izquierdo */}
        <div
          data-testid="aurora-blob-2"
          className="sr-aurora-blob sr-aurora-blob-2 absolute rounded-full"
          style={{
            width: '60vw',
            height: '60vw',
            minWidth: '420px',
            minHeight: '420px',
            left: '-14vw',
            top: '15vh',
            backgroundColor: 'var(--aurora-c2)',
            filter: 'blur(var(--aurora-blur, 75px))',
            willChange: 'transform',
            animationPlayState: isVisible ? 'running' : 'paused',
          }}
        />

        {/* Mancha 3: Mancha en esquina inferior derecha */}
        <div
          data-testid="aurora-blob-3"
          className="sr-aurora-blob sr-aurora-blob-3 absolute rounded-full"
          style={{
            width: '56vw',
            height: '56vw',
            minWidth: '400px',
            minHeight: '400px',
            right: '-12vw',
            bottom: '-15vh',
            backgroundColor: 'var(--aurora-c3)',
            filter: 'blur(var(--aurora-blur, 75px))',
            willChange: 'transform',
            animationPlayState: isVisible ? 'running' : 'paused',
          }}
        />

        {/* Mancha 4: Mancha de profundidad arriba a la derecha */}
        <div
          data-testid="aurora-blob-4"
          className="sr-aurora-blob sr-aurora-blob-4 absolute rounded-full"
          style={{
            width: '45vw',
            height: '45vw',
            minWidth: '320px',
            minHeight: '320px',
            right: '8vw',
            top: '-18vw',
            backgroundColor: 'var(--aurora-c4)',
            filter: 'blur(var(--aurora-blur, 75px))',
            willChange: 'transform',
            animationPlayState: isVisible ? 'running' : 'paused',
          }}
        />
      </div>

      {/* Contenido principal si se renderiza como contenedor directo */}
      {children && <div className="relative z-10 w-full">{children}</div>}
    </div>
  )
}
