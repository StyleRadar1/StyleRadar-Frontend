import { Link } from 'react-router-dom'
import { MapPreview } from '@/components/landing/MapPreview'

export default function MapPage() {
  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#a98be0] mb-2">
              <Link to="/" className="hover:underline">Inicio</Link>
              <span>/</span>
              <span className="text-[#e8dccb]">Mapa de Bogotá</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              Boutiques y Tiendas de Bogotá
            </h1>
            <p className="text-sm md:text-base text-[#d1ced7] max-w-2xl mt-2">
              Explora las tiendas aliadas de Chapinero, Usaquén, Teusaquillo, Zona G y Suba. Consulta qué prendas tienen hoy disponibles en tu talla.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/catalogo"
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold uppercase tracking-wider transition-all"
            >
              Ver catálogo completo →
            </Link>
          </div>
        </div>

        {/* Componente real del mapa de Bogotá */}
        <MapPreview />
      </div>
    </div>
  )
}
