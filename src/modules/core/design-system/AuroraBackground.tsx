import { useEffect, useRef, useState, type ReactNode } from 'react'

export type AuroraTone = 'lila' | 'malva' | 'salvia' | 'rosa'

export interface AuroraBackgroundProps {
  /** Tono de la paleta de manchas: lila (playlists/probador), malva (catálogo), salvia (mapa), rosa (planes/tiendas) */
  tone?: AuroraTone
  /** Clases CSS adicionales para el contenedor */
  className?: string
  /** Elementos hijos renderizados dentro del contenido de la aurora */
  children?: ReactNode
  /** Si debe tener una altura mínima completa o ajustarse al contenido */
  fullHeight?: boolean
}

/**
 * AuroraBackground — Fondo "Amanecer en el radar" animado.
 *
 * En MODO OSCURO (Fase 2): Base negro-violeta (#05030A), manchas de luz morada/violeta
 * desde el borde izquierdo y esquina inferior derecha, y toque rosado arriba a la izquierda.
 * Grano con mix-blend-mode: screen (opacity 0.10), blur 70px.
 *
 * En MODO CLARO (Fase 1): Base arena (#E6D9C0), manchas suaves lila/malva/rosa,
 * grano con mix-blend-mode: multiply (opacity 0.16).
 *
 * Rendimiento y Accesibilidad:
 * - will-change: transform en las 4 manchas.
 * - IntersectionObserver: pausa las animaciones cuando el héroe sale del viewport.
 * - document.visibilityState: pausa cuando la pestaña está en segundo plano.
 * - prefers-reduced-motion: desactiva las animaciones por completo.
 */
export function AuroraBackground({
  tone = 'lila',
  className = '',
  children,
  fullHeight = false,
}: AuroraBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // 1. Pausar animaciones cuando la pestaña está oculta
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false)
      } else {
        // Al regresar, verificar si el contenedor sigue en el viewport
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

    // 2. IntersectionObserver para pausar si el héroe no está en pantalla
    const el = containerRef.current
    let observer: IntersectionObserver | null = null

    if (el && typeof IntersectionObserver !== 'undefined') {
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
  }, [])

  return (
    <div
      ref={containerRef}
      data-aurora-tone={tone}
      data-testid="aurora-background"
      className={`sr-aurora-container relative overflow-hidden ${
        fullHeight ? 'min-h-screen' : ''
      } ${className}`}
      style={{
        animationPlayState: isVisible ? 'running' : 'paused',
      }}
    >
      {/* Capa de manchas de luz (blobs de aurora) */}
      <div
        className="sr-aurora-blobs-layer pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
        style={{
          animationPlayState: isVisible ? 'running' : 'paused',
        }}
      >
        {/* Mancha 1: Toque rosado arriba izquierda (46% tamaño, c1) */}
        <div
          data-testid="aurora-blob-1"
          className="sr-aurora-blob sr-aurora-blob-1 absolute rounded-full"
          style={{
            width: '46%',
            height: '46%',
            left: '-12%',
            top: '-30%',
            backgroundColor: 'var(--aurora-c1)',
            filter: 'blur(var(--aurora-blur, 70px))',
            willChange: 'transform',
            animationPlayState: isVisible ? 'running' : 'paused',
          }}
        />

        {/* Mancha 2: Mancha violeta naciendo del borde izquierdo (56% tamaño, c2) */}
        <div
          data-testid="aurora-blob-2"
          className="sr-aurora-blob sr-aurora-blob-2 absolute rounded-full"
          style={{
            width: '56%',
            height: '56%',
            left: '-8%',
            top: '10%',
            backgroundColor: 'var(--aurora-c2)',
            filter: 'blur(var(--aurora-blur, 70px))',
            willChange: 'transform',
            animationPlayState: isVisible ? 'running' : 'paused',
          }}
        />

        {/* Mancha 3: Mancha en esquina inferior derecha (48% tamaño, c3) */}
        <div
          data-testid="aurora-blob-3"
          className="sr-aurora-blob sr-aurora-blob-3 absolute rounded-full"
          style={{
            width: '48%',
            height: '48%',
            right: '-10%',
            bottom: '-45%',
            backgroundColor: 'var(--aurora-c3)',
            filter: 'blur(var(--aurora-blur, 70px))',
            willChange: 'transform',
            animationPlayState: isVisible ? 'running' : 'paused',
          }}
        />

        {/* Mancha 4: Mancha de profundidad arriba a la derecha (34% tamaño, c4) */}
        <div
          data-testid="aurora-blob-4"
          className="sr-aurora-blob sr-aurora-blob-4 absolute rounded-full"
          style={{
            width: '34%',
            height: '34%',
            right: '18%',
            top: '-35%',
            backgroundColor: 'var(--aurora-c4)',
            filter: 'blur(var(--aurora-blur, 70px))',
            willChange: 'transform',
            animationPlayState: isVisible ? 'running' : 'paused',
          }}
        />
      </div>

      {/* Capa de textura de grano (SVG feTurbulence) */}
      <div
        data-testid="aurora-noise"
        className="sr-aurora-noise pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='noiseFilter'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23noiseFilter)'/></svg>")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Contenido principal en capa superior */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  )
}
