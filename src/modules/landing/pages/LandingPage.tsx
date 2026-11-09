import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/modules/core/design-system'
import { useMapData } from '@/modules/mapa/hooks/useMapData'
import MapaBogota from '@/modules/mapa/components/MapaBogota'
import MapCard from '@/modules/mapa/components/MapCard'
import type { MapPinDto } from '@/modules/mapa/types/map.dto'

/** Landing de bienvenida: atrae y explica; para usar la app se entra con un botón. */
export default function LandingPage() {
  const { data: pins } = useMapData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const selectedPin = pins.find((p) => p.id === selectedId) ?? null

  const handleSelect = useCallback((pin: MapPinDto | null) => {
    setSelectedId(pin?.id ?? null)
  }, [])

  const handleHover = useCallback((pin: MapPinDto | null) => {
    setHoveredId(pin?.id ?? null)
  }, [])

  return (
    <>
      <section className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden">
        <img src="/img/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_35%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e0a16]/70 via-[#0e0a16]/35 to-[#120826]/95" />
        <div className="relative px-4 text-center">
          <h1 className="flex items-center justify-center gap-3 text-6xl font-extrabold tracking-[-.045em] md:text-8xl">
            <Logo className="h-20 w-auto md:h-28" />StyleRadar
          </h1>
          <p className="mx-auto mt-6 inline-block rounded-full bg-[#1e1a28]/60 px-6 py-3 text-xs font-bold uppercase tracking-[.22em] md:text-sm">Descubre tu estilo. En tu ciudad.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/catalogo" className="rounded-xl bg-violeta px-6 py-3 text-sm font-semibold shadow-[0_8px_24px_rgba(72,17,154,.45)]">Entrar a StyleRadar</Link>
            <Link to="/login?jurado" className="rounded-xl border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold">Acceso para jurados</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-3">
        {[
          ['Encuentra tu talla', 'Busca una prenda y mira en el mapa qué tienda de Bogotá la tiene en tu talla.'],
          ['Pruébatela antes de salir', 'Mírala en el maniquí virtual o sobre tu propia foto.'],
          ['Dale una segunda vida', 'Vende lo que ya no usas o dónalo a una fundación cercana.'],
        ].map(([t, d], i) => (
          <article key={t} className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-violeta text-xs font-bold">0{i + 1}</span>
            <h2 className="mt-4 text-lg font-bold">{t}</h2>
            <p className="mt-2 text-sm text-white/70">{d}</p>
          </article>
        ))}
        <p className="text-sm text-white/55 md:col-span-3">
          ¿Quieres ver el diseño completo? Mira el <a href="/prototipo/index.html" className="font-semibold text-arena underline underline-offset-4">prototipo navegable</a>.
        </p>
      </section>

      {/* ── Sección del mapa interactivo (como en el prototipo: #pe-mapa) ── */}
      {pins.length > 0 && (
        <section className="bg-[#1c1c1c] px-4 py-8 sm:px-6 md:py-10" aria-labelledby="lmTitle">
          <div className="mx-auto max-w-6xl">
            {/* Encabezado */}
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-lavanda">Mapa interactivo</p>
                <h2 id="lmTitle" className="text-2xl font-extrabold leading-tight md:text-3xl">
                  El radar en el <span className="text-lavanda">mapa</span>
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="max-w-[460px] text-sm leading-relaxed text-lavanda">
                  Toca una tienda o fundación para ver sus detalles sin salir del mapa.
                </p>
                <Link
                  to="/mapa"
                  className="flex-shrink-0 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold transition hover:bg-white/10"
                >
                  Abrir el mapa completo →
                </Link>
              </div>
            </div>

            {/* Mapa */}
            <div className="sr-store-map relative overflow-hidden rounded-[22px] border border-white/[.14] shadow-[0_20px_50px_rgba(0,0,0,.55)]">
              <MapaBogota
                pins={pins}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onSelect={handleSelect}
                onHover={handleHover}
                showControls={true}
                className="h-[min(calc(100dvh-195px),700px)] min-h-[420px] w-full"
              />
              {selectedPin && (
                <MapCard
                  pin={selectedPin}
                  onClose={() => setSelectedId(null)}
                />
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
