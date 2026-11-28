import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/modules/core/design-system'
import { heroSlides } from '@/data/landingData'
import { CursorHanger } from './CursorHanger'

/** Botón redondo de 44 px del pie del hero (flechas y «seguir bajando»). */
const CONTROL_HERO =
  'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--hero-sub-border)] bg-black/30 text-[var(--hero-fg)] backdrop-blur-md transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8dccb]'

export function Hero() {
  const heroRef = useRef<HTMLElement | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
  )

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return
    const syncPreference = () => setPrefersReducedMotion(media.matches)
    syncPreference()
    media.addEventListener?.('change', syncPreference)
    return () => media.removeEventListener?.('change', syncPreference)
  }, [])

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [isPaused, prefersReducedMotion])

  /** Cambio manual de foto: quien elige a mano ya no necesita que el carrusel siga solo. */
  const irA = (delta: number) => {
    setIsPaused(true)
    setCurrentSlide((prev) => (prev + delta + heroSlides.length) % heroSlides.length)
  }

  const irAFoto = (indice: number) => {
    setIsPaused(true)
    setCurrentSlide(indice)
  }

  /** Deslizar con el dedo (móvil): solo cuenta un gesto claramente horizontal, así no pelea con el scroll vertical. */
  const toque = useRef<{ x: number; y: number } | null>(null)
  const alTocar = (e: React.TouchEvent) => {
    const t = e.touches[0]
    toque.current = { x: t.clientX, y: t.clientY }
  }
  const alSoltar = (e: React.TouchEvent) => {
    const inicio = toque.current
    toque.current = null
    if (!inicio) return
    const t = e.changedTouches[0]
    const dx = t.clientX - inicio.x
    const dy = t.clientY - inicio.y
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) irA(dx < 0 ? 1 : -1)
  }

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const targetId = e.currentTarget.getAttribute('href')?.slice(1)
    const target = targetId ? document.getElementById(targetId) : null
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      id="inicio"
      ref={heroRef}
      onTouchStart={alTocar}
      onTouchEnd={alSoltar}
      className="relative [touch-action:pan-y] min-h-[100svh] w-full flex items-center justify-center overflow-hidden bg-transparent text-[var(--hero-fg)]"
      style={{
        '--color-white': '#ffffff',
        '--color-blanco': '#ffffff',
        color: 'var(--hero-fg)',
      } as React.CSSProperties}
      aria-label="StyleRadar, descubre tu estilo en tu ciudad"
    >
      {/* Carrusel de diapositivas de fondo */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {heroSlides.map((slide, index) => (
          <img
            key={slide.id}
            src={slide.src}
            alt={slide.alt}
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            decoding="async"
            style={{ objectPosition: slide.position || 'center' }}
            className={`pointer-events-none absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${
              index === currentSlide
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105'
            }`}
          />
        ))}

        {/* Gradientes oscurecedores para legibilidad de marca y textos */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: 'var(--hero-overlay)',
          }}
        />
      </div>

      {/* Efecto de percha y prenda en cursor */}
      <CursorHanger containerRef={heroRef} />

      {/* Contenido Central */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl mx-auto pt-20">
        <h1 className="flex items-center justify-center gap-3 sm:gap-6 text-[var(--hero-fg)] text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter drop-shadow-2xl">
          <Logo className="h-[1.1em] w-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
          <span className="tracking-tight text-[var(--hero-fg)]">StyleRadar</span>
        </h1>

        <p className="mt-8 px-6 py-2.5 rounded-full bg-white/10 dark:bg-purple-950/40 border border-white/20 dark:border-purple-400/30 backdrop-blur-xl text-[var(--hero-fg)] font-extrabold text-xs sm:text-sm tracking-[0.2em] uppercase shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(139,92,246,0.25)]">
          Descubre tu estilo. En tu ciudad.
        </p>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-violeta hover:bg-violeta-claro text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-[0_6px_18px_rgba(0,0,0,0.35)] border border-white/25 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <span>Entrar a StyleRadar</span>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </Link>

          <a
            href="#pe-videos"
            onClick={handleScrollTo}
            className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-purple-400/30 hover:border-purple-300/60 bg-purple-500/10 hover:bg-purple-500/25 text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase backdrop-blur-xl shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <span>Conoce cómo funciona</span>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </a>
        </div>
      </div>

      {/* Anterior y siguiente: a media altura, en los extremos izquierdo y derecho */}
      <button
        type="button"
        onClick={() => irA(-1)}
        aria-label="Foto anterior"
        className={`${CONTROL_HERO} max-md:hidden absolute z-20 top-1/2 -translate-y-1/2 md:left-8`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 6 9 12 15 18" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => irA(1)}
        aria-label="Foto siguiente"
        className={`${CONTROL_HERO} max-md:hidden absolute z-20 top-1/2 -translate-y-1/2 md:right-8`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>

      {/* Puntos indicadores (móvil): dónde estás y salto directo a una foto */}
      <div role="group" aria-label="Fotos de la portada" className="md:hidden absolute z-20 inset-x-0 bottom-[84px] flex items-center justify-center">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => irAFoto(index)}
            aria-label={`Ir a la foto ${index + 1} de ${heroSlides.length}`}
            aria-current={index === currentSlide ? 'true' : undefined}
            className="grid h-11 w-8 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8dccb]"
          >
            <span
              aria-hidden="true"
              className={`block h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-6 bg-[var(--hero-fg)]' : 'w-2 bg-[var(--hero-fg)] opacity-50'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Pie del hero con indicador de scroll y contador de diapositivas */}
      <div className="absolute z-20 bottom-6 inset-x-6 md:inset-x-14 grid grid-cols-3 items-center text-xs font-extrabold tracking-widest uppercase text-[var(--hero-fg-muted)]">
        <span aria-live="polite" aria-atomic="true" className="text-sm font-semibold tracking-widest">
          <span className="text-[var(--hero-fg)] font-black">
            {String(currentSlide + 1).padStart(2, '0')}
          </span>{' '}
          <span className="opacity-60">/</span>{' '}
          <span>{String(heroSlides.length).padStart(2, '0')}</span>
        </span>

        {/* Flecha hacia abajo: avisa que la página sigue */}
        <a
          href="#pe-que-es"
          onClick={handleScrollTo}
          aria-label="Seguir bajando para ver más"
          className={`${CONTROL_HERO} justify-self-center motion-safe:animate-bounce`}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </a>

        <span aria-hidden="true" />
      </div>
    </section>
  )
}

