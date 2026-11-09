import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/modules/core/design-system'
import { heroSlides } from '@/data/landingData'

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [])

  const handleScrollToNext = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById('pe-que-es') || document.getElementById('como-funciona')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      id="inicio"
      className="relative min-h-[100svh] w-full flex items-center justify-center overflow-hidden bg-[#18151d] text-white"
      aria-label="StyleRadar, descubre tu estilo en tu ciudad"
    >
      {/* Carrusel de diapositivas de fondo */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {heroSlides.map((slide, index) => (
          <img
            key={slide.id}
            src={slide.src}
            alt={slide.alt}
            style={{ objectPosition: slide.position || 'center' }}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${
              index === currentSlide
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105 pointer-events-none'
            }`}
          />
        ))}

        {/* Gradientes oscurecedores para legibilidad de marca y textos */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(180deg, rgba(17,12,27,0.45) 0%, rgba(17,12,27,0.1) 36%, rgba(17,12,27,0.4) 64%, #15121b 100%), radial-gradient(90% 95% at 50% 48%, transparent 45%, rgba(0,0,0,0.65))',
          }}
        />
      </div>

      {/* Contenido Central */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl mx-auto pt-20">
        <h1 className="flex items-center justify-center gap-3 sm:gap-6 text-white text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter drop-shadow-2xl">
          <Logo className="h-[1.1em] w-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
          <span className="tracking-tight">StyleRadar</span>
        </h1>

        <p className="mt-8 px-6 py-2.5 rounded-full bg-[#231e25]/75 border border-white/20 backdrop-blur-md text-white font-extrabold text-xs sm:text-sm tracking-[0.2em] uppercase shadow-lg">
          Descubre tu estilo. En tu ciudad.
        </p>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#48119a] hover:bg-[#5b17c2] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-[0_8px_32px_#48119a77] hover:-translate-y-0.5 transition-all"
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
            href="#pe-que-es"
            onClick={handleScrollToNext}
            className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-white/40 hover:border-white/80 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase backdrop-blur-md hover:-translate-y-0.5 transition-all"
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

      {/* Pie del hero con indicador de scroll y contador de diapositivas */}
      <div className="absolute z-20 bottom-8 inset-x-6 md:inset-x-14 flex items-center justify-between text-xs font-extrabold tracking-widest uppercase text-white/80">
        <a
          href="#pe-que-es"
          onClick={handleScrollToNext}
          className="flex items-center gap-2 hover:text-white transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Desliza</span>
          <span aria-hidden="true">↓</span>
        </a>

        <div className="text-sm font-semibold tracking-widest">
          <span className="text-white font-black">
            {String(currentSlide + 1).padStart(2, '0')}
          </span>{' '}
          <span className="text-white/40">/</span>{' '}
          <span>{String(heroSlides.length).padStart(2, '0')}</span>
        </div>
      </div>
    </section>
  )
}

