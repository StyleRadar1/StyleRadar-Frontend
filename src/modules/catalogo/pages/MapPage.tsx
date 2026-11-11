import { Link } from 'react-router-dom'
import { AuroraBackground } from '@/modules/core/design-system'
import { MapPreview } from '@/components/landing/MapPreview'

export default function MapPage() {
  return (
    <AuroraBackground tone="salvia" fullHeight className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violeta-claro mb-2">
              <Link to="/" className="hover:underline">Inicio</Link>
              <span>/</span>
              <span className="text-[var(--sr-hero-text)]">Mapa de Bogotá</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--sr-hero-text)]">
              Boutiques y Tiendas de Bogotá
            </h1>
            <p className="text-sm md:text-base text-[var(--sr-hero-text-muted)] max-w-2xl mt-2">
              Explora las tiendas aliadas de Chapinero, Usaquén, Teusaquillo, Zona G y Suba. Consulta qué prendas tienen hoy disponibles en tu talla.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/catalogo"
              className="px-5 py-2.5 rounded-full bg-[var(--sr-surface)]/60 hover:bg-[var(--sr-surface)] border border-[var(--sr-border-control)] text-xs font-bold uppercase tracking-wider text-[var(--sr-hero-text)] transition-all shadow-md"
            >
              Ver catálogo completo →
            </Link>
          </div>
        </div>

        {/* Componente real del mapa de Bogotá */}
        <MapPreview />
      </div>
    </AuroraBackground>
  )
}
