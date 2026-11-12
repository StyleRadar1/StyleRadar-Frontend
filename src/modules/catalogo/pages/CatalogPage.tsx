import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatCOP } from '@/modules/core/utils/format'
import { ItemCard } from '../components/ItemCard'
import { useItems } from '../hooks/useItems'
import { ITEMS } from '../mocks/items'
import { INVENTORY_ITEMS } from '../mocks/inventory'
import type { ItemFiltersDto } from '../types/item.dto'
import './CatalogPage.css'

// Tipos de prenda
const TIPOS_PRENDA = [
  'Todos',
  'Saco',
  'Pantalón',
  'Buzo',
  'Chaqueta',
  'Calzado',
  'Accesorio',
]

// Tallas disponibles
const TALLAS = ['Todas', 'XS', 'S', 'M', 'L', 'XL', '28', '30', '32', '38', '39', '40']

// Presets de precio
const PRECIOS_PRESETS = [
  { label: 'Cualquier precio', min: undefined, max: undefined },
  { label: 'Hasta $100.000', min: undefined, max: 100000 },
  { label: '$100.000 a $250.000', min: 100000, max: 250000 },
  { label: '$250.000 a $400.000', min: 250000, max: 400000 },
  { label: 'Más de $400.000', min: 400000, max: undefined },
]

// Origen de prendas
const ORIGENES = [
  { id: 'Todos', label: 'Todos' },
  { id: 'tiendas', label: 'Tiendas del radar' },
  { id: 'segunda-mano', label: 'Segunda mano' },
]

// Opciones de ubicación Cerca de (localidades y barrios de Bogotá)
const OPCIONES_CERCA_DE = [
  'No especificar',
  'Cerca de mí',
  'Chapinero',
  'Zona G',
  'Chicó',
  'Usaquén',
  'Cedritos',
  'Teusaquillo',
  'Centro',
  'Suba',
  'Engativá',
  'Fontibón',
  'Kennedy',
  'Bosa',
] as const

// Marcas o tiendas del radar
const MARCAS = [
  'Todas',
  'Kicks Local',
  'Luna Store',
  'Nómada Studio',
  'Segunda mano',
  'The Local Lab',
] as const

// Colores disponibles
const COLORES = ['Todos', 'Negro', 'Blanco', 'Azul', 'Crudo', 'Gris', 'Café']

// Los cinco estilos oficiales de StyleRadar
const ESTILOS = [
  'Todos',
  'Streetwear',
  'Elegante',
  'Casual',
  'Vintage',
  'Techwear',
] as const

// Opciones de ordenamiento (con Cercanía)
const OPCIONES_ORDEN = [
  { id: 'rel', label: 'Recomendados' },
  { id: 'new', label: 'Más recientes' },
  { id: 'cerca', label: 'Cercanía' },
  { id: 'rep', label: 'Mejor calificadas' },
  { id: 'asc', label: 'Precio: menor a mayor' },
  { id: 'desc', label: 'Precio: mayor a menor' },
]

export default function CatalogPage() {
  const [params, setParams] = useSearchParams()

  // Estados de búsqueda y orden
  const [texto, setTexto] = useState(params.get('q') ?? '')
  const [orden, setOrden] = useState<string>(params.get('orden') ?? 'rel')

  // Menús desplegables
  const [menuFiltrosAbierto, setMenuFiltrosAbierto] = useState(false)
  const [menuOrdenAbierto, setMenuOrdenAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const ordenRef = useRef<HTMLDivElement>(null)

  // Filtros del catálogo
  const [filtroCercaDe, setFiltroCercaDe] = useState<string>(params.get('cerca') ?? 'No especificar')
  const [filtroTipo, setFiltroTipo] = useState<string>(params.get('tipo') ?? 'Todos')
  const [filtroTalla, setFiltroTalla] = useState<string>(params.get('talla') ?? 'Todas')
  const [filtroPrecio, setFiltroPrecio] = useState<number>(0)
  const [filtroOrigen, setFiltroOrigen] = useState<string>(params.get('origen') ?? 'Todos')
  const [filtroMarca, setFiltroMarca] = useState<string>(params.get('marca') ?? 'Todas')
  const [filtroColor, setFiltroColor] = useState<string>(params.get('color') ?? 'Todos')
  const [filtroEstilo, setFiltroEstilo] = useState<string>(params.get('estilo') ?? 'Todos')

  // Feedback toast
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuFiltrosAbierto(false)
      }
      if (ordenRef.current && !ordenRef.current.contains(event.target as Node)) {
        setMenuOrdenAbierto(false)
      }
    }
    if (menuFiltrosAbierto || menuOrdenAbierto) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuFiltrosAbierto, menuOrdenAbierto])

  // Contador de filtros activos (excluyendo defaults)
  const filtrosActivosCount = useMemo(() => {
    let count = 0
    if (filtroCercaDe !== 'No especificar') count++
    if (filtroTipo !== 'Todos') count++
    if (filtroTalla !== 'Todas') count++
    if (filtroPrecio !== 0) count++
    if (filtroOrigen !== 'Todos') count++
    if (filtroMarca !== 'Todas') count++
    if (filtroColor !== 'Todos') count++
    if (filtroEstilo !== 'Todos') count++
    return count
  }, [filtroCercaDe, filtroTipo, filtroTalla, filtroPrecio, filtroOrigen, filtroMarca, filtroColor, filtroEstilo])

  // Filtros combinados para el hook
  const activeFilters = useMemo<ItemFiltersDto>(() => {
    const selectedPreset = PRECIOS_PRESETS[filtroPrecio]
    return {
      texto: texto.trim() || undefined,
      tipo: filtroTipo !== 'Todos' ? filtroTipo : undefined,
      talla: filtroTalla !== 'Todas' ? filtroTalla : undefined,
      precioMin: selectedPreset?.min,
      precioMax: selectedPreset?.max,
      origen: filtroOrigen !== 'Todos' ? filtroOrigen : undefined,
      marca: filtroMarca !== 'Todas' ? filtroMarca : undefined,
      cercaDe: filtroCercaDe !== 'No especificar' ? filtroCercaDe : undefined,
      color: filtroColor !== 'Todos' ? filtroColor : undefined,
      estilo: filtroEstilo !== 'Todos' ? filtroEstilo : undefined,
      orden,
    }
  }, [texto, filtroTipo, filtroTalla, filtroPrecio, filtroOrigen, filtroMarca, filtroCercaDe, filtroColor, filtroEstilo, orden])

  const { items, loading, error } = useItems(activeFilters)

  // Manejo de búsqueda
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(params)
    if (texto.trim()) next.set('q', texto.trim()); else next.delete('q')
    setParams(next)
  }

  const handleCambiarOrden = (nuevoOrden: string) => {
    setOrden(nuevoOrden)
    const next = new URLSearchParams(params)
    if (nuevoOrden && nuevoOrden !== 'rel') next.set('orden', nuevoOrden); else next.delete('orden')
    setParams(next)
  }

  // Guardar búsqueda
  const handleGuardarBusqueda = () => {
    const queryTerm = texto.trim() || 'Catálogo completo'
    setToastMsg(`Búsqueda «${queryTerm}» guardada en «Mis búsquedas y alertas».`)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Limpiar todos los filtros
  const handleResetFiltros = () => {
    setFiltroCercaDe('No especificar')
    setFiltroTipo('Todos')
    setFiltroTalla('Todas')
    setFiltroPrecio(0)
    setFiltroOrigen('Todos')
    setFiltroMarca('Todas')
    setFiltroColor('Todos')
    setFiltroEstilo('Todos')
    setTexto('')
    setParams(new URLSearchParams())
  }

  const opcionOrdenActual = OPCIONES_ORDEN.find((op) => op.id === orden)

  return (
    <div
      className="min-h-screen bg-[#110e17] text-white px-4 py-8 sm:px-8 selection:bg-violeta selection:text-white"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 90% 40% at 50% 0%, rgba(80, 19, 184, 0.18), transparent 70%)',
      }}
    >
      <section className="mx-auto max-w-6xl">
        {/* Migas de pan */}
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
          <Link to="/" className="hover:text-white">← Volver</Link>
          <span>·</span>
          <span>Inicio</span>
          <span>/</span>
          <span className="text-white/80">Catálogo</span>
        </div>

        {/* Encabezado del catálogo */}
        <div className="mb-6">
          <span className="text-[11px] font-bold uppercase tracking-[.2em] text-white/50">
            Catálogo
          </span>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-5xl">
            Todas las prendas
          </h1>
        </div>

        {/* Barra de búsqueda interactiva */}
        <form onSubmit={handleSearchSubmit} className="relative mb-4 flex gap-2">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Busca «camisa blanca manga larga talla M», «blazer», «cuero»…"
              aria-label="Buscar prendas"
              className="w-full rounded-2xl border border-white/15 bg-white/[0.04] py-3.5 pl-11 pr-10 text-sm text-white placeholder-white/40 outline-none backdrop-blur-xl focus:border-violeta focus:ring-1 focus:ring-violeta"
            />
            {texto && (
              <button
                type="button"
                onClick={() => setTexto('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
                aria-label="Borrar texto"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-violeta px-7 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:bg-violeta-hover"
          >
            Buscar
          </button>
        </form>

        {/* BARRA DE HERRAMIENTAS: Filtros (botón mediano) + Guardar búsqueda + Ordenar (diseño uniforme) */}
        <div className="relative z-20 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-xl">
          {/* LADO IZQUIERDO: Botón Filtros mediano con badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuFiltrosAbierto((prev) => !prev)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                menuFiltrosAbierto || filtrosActivosCount > 0
                  ? 'border-violeta bg-violeta/20 text-white shadow-purple-950/30'
                  : 'border-white/20 bg-white/5 text-white/90 hover:bg-white/10 hover:border-white/30'
              }`}
              aria-expanded={menuFiltrosAbierto}
              aria-label="Filtros del catálogo"
            >
              <svg className="h-4 w-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              <span>Filtros</span>
              {filtrosActivosCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violeta text-[10px] font-black text-white">
                  {filtrosActivosCount}
                </span>
              )}
              <svg className={`h-3 w-3 text-white/50 transition-transform ${menuFiltrosAbierto ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <span className="hidden text-xs text-white/50 sm:inline">
              {filtrosActivosCount === 0 ? 'Sin filtros aplicados' : `${filtrosActivosCount} filtros activos`}
            </span>
          </div>

          {/* LADO DERECHO: Guardar búsqueda + Selector Ordenar (con diseño similar a Filtros) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Botón de Guardar Búsqueda */}
            <button
              type="button"
              onClick={handleGuardarBusqueda}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              title="Guardar esta búsqueda en tu perfil para recibir avisos"
            >
              <svg className="h-3.5 w-3.5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span>Guardar búsqueda</span>
            </button>

            {/* Selector Ordenar rediseñado (mismo estilo que botón Filtros) */}
            <div className="relative" ref={ordenRef}>
              <button
                type="button"
                onClick={() => setMenuOrdenAbierto((prev) => !prev)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition shadow-sm ${
                  menuOrdenAbierto
                    ? 'border-violeta bg-violeta/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/90 hover:bg-white/10 hover:border-white/30'
                }`}
                aria-expanded={menuOrdenAbierto}
                aria-label="Ordenar resultados"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  Ordenar:
                </span>
                <span className="text-white text-xs">
                  {opcionOrdenActual?.label ?? 'Recomendados'}
                </span>
                <svg
                  className={`h-3 w-3 text-white/50 transition-transform ${menuOrdenAbierto ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {menuOrdenAbierto && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/15 bg-[#17141f]/95 p-1.5 shadow-2xl backdrop-blur-2xl z-30 animate-in fade-in zoom-in-95 duration-100">
                  {OPCIONES_ORDEN.map((op) => {
                    const isSelected = orden === op.id
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => {
                          handleCambiarOrden(op.id)
                          setMenuOrdenAbierto(false)
                        }}
                        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition text-left ${
                          isSelected
                            ? 'bg-violeta text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span>{op.label}</span>
                        {isSelected && (
                          <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* MENÚ DESPLEGABLE DE FILTROS COMPACTO */}
          {/* ======================================================== */}
          {menuFiltrosAbierto && (
            <div
              ref={menuRef}
              className="absolute left-0 top-full mt-2 w-full max-w-xl rounded-2xl border border-white/15 bg-[#16131e]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[72vh] overflow-y-auto"
            >
              {/* Encabezado del menú */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3.5">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-violeta-claro" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Filtrar catálogo
                  </h3>
                  {filtrosActivosCount > 0 && (
                    <span className="rounded-full bg-violeta/30 border border-violeta/50 px-2 py-0.5 text-[9px] font-bold text-violeta-claro">
                      {filtrosActivosCount} activos
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMenuFiltrosAbierto(false)}
                  className="text-white/50 hover:text-white p-1"
                  aria-label="Cerrar filtros"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* LISTA COMPLETA DE FILTROS CON DISEÑO COMPACTO */}
              <div className="space-y-3.5">
                {/* 1. Cerca de (localidades y barrios con 'No especificar' primero y 'Cerca de mí' segundo) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Cerca de
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {OPCIONES_CERCA_DE.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setFiltroCercaDe(loc)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                          filtroCercaDe === loc
                            ? 'bg-violeta text-white ring-1 ring-violeta-claro shadow-sm'
                            : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Tipo de prenda */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Tipo de prenda
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TIPOS_PRENDA.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFiltroTipo(t)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                          filtroTipo === t
                            ? 'bg-violeta text-white ring-1 ring-violeta-claro shadow-sm'
                            : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Talla disponible */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Talla disponible
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TALLAS.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setFiltroTalla(sz)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                          filtroTalla === sz
                            ? 'bg-violeta text-white ring-1 ring-violeta-claro shadow-sm'
                            : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Rango de precio */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Rango de precio
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRECIOS_PRESETS.map((preset, idx) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFiltroPrecio(idx)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                          filtroPrecio === idx
                            ? 'bg-violeta text-white ring-1 ring-violeta-claro shadow-sm'
                            : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Origen */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Origen
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ORIGENES.map((orig) => (
                      <button
                        key={orig.id}
                        type="button"
                        onClick={() => setFiltroOrigen(orig.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                          filtroOrigen === orig.id
                            ? 'bg-violeta text-white ring-1 ring-violeta-claro shadow-sm'
                            : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {orig.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Marca */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Marca
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MARCAS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFiltroMarca(m)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                          filtroMarca === m
                            ? 'bg-violeta text-white ring-1 ring-violeta-claro shadow-sm'
                            : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Color (en la parte de abajo, mismo estilo) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLORES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFiltroColor(c)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                          filtroColor === c
                            ? 'bg-violeta text-white ring-1 ring-violeta-claro shadow-sm'
                            : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8. Estilo (los 5 estilos del prototipo) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Estilo
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ESTILOS.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFiltroEstilo(st)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                          filtroEstilo === st
                            ? 'bg-violeta text-white ring-1 ring-violeta-claro shadow-sm'
                            : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pie del menú */}
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={handleResetFiltros}
                  className="text-xs font-semibold text-white/50 hover:text-rose-400 transition"
                >
                  Restablecer filtros
                </button>
                <button
                  type="button"
                  onClick={() => setMenuFiltrosAbierto(false)}
                  className="rounded-xl bg-violeta px-5 py-2 text-xs font-bold text-white hover:bg-violeta-hover shadow-lg shadow-purple-900/30 transition"
                >
                  Aplicar filtros {filtrosActivosCount > 0 ? `(${filtrosActivosCount})` : ''}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CHIPS DE FILTROS ACTIVOS (para remover rápido) */}
        {filtrosActivosCount > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-white/40">Filtros aplicados:</span>
            {filtroCercaDe !== 'No especificar' && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-semibold text-white">
                Cerca de: {filtroCercaDe}
                <button type="button" onClick={() => setFiltroCercaDe('No especificar')} className="text-white/60 hover:text-white" aria-label="Quitar filtro de ubicación">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroTipo !== 'Todos' && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-semibold text-white">
                Tipo: {filtroTipo}
                <button type="button" onClick={() => setFiltroTipo('Todos')} className="text-white/60 hover:text-white" aria-label="Quitar filtro de tipo">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroTalla !== 'Todas' && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-semibold text-white">
                Talla: {filtroTalla}
                <button type="button" onClick={() => setFiltroTalla('Todas')} className="text-white/60 hover:text-white" aria-label="Quitar filtro de talla">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroPrecio !== 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-semibold text-white">
                {PRECIOS_PRESETS[filtroPrecio].label}
                <button type="button" onClick={() => setFiltroPrecio(0)} className="text-white/60 hover:text-white" aria-label="Quitar filtro de precio">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroOrigen !== 'Todos' && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-semibold text-white">
                {ORIGENES.find((o) => o.id === filtroOrigen)?.label}
                <button type="button" onClick={() => setFiltroOrigen('Todos')} className="text-white/60 hover:text-white" aria-label="Quitar filtro de origen">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroMarca !== 'Todas' && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-semibold text-white">
                Marca: {filtroMarca}
                <button type="button" onClick={() => setFiltroMarca('Todas')} className="text-white/60 hover:text-white" aria-label="Quitar filtro de marca">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroColor !== 'Todos' && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-semibold text-white">
                Color: {filtroColor}
                <button type="button" onClick={() => setFiltroColor('Todos')} className="text-white/60 hover:text-white" aria-label="Quitar filtro de color">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            {filtroEstilo !== 'Todos' && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-semibold text-white">
                Estilo: {filtroEstilo}
                <button type="button" onClick={() => setFiltroEstilo('Todos')} className="text-white/60 hover:text-white" aria-label="Quitar filtro de estilo">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFiltros}
              className="text-xs text-rose-400 hover:underline font-semibold ml-2"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Feedback toast */}
        {toastMsg && (
          <div role="status" className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200 backdrop-blur-md">
            {toastMsg}
          </div>
        )}

        {/* SECCIÓN DE PRENDAS COLGADAS EN BARRA (ESTILO REFERENCIA EDITORIAL) */}
        <div className="mb-10">
          <HangingCollectionRack
            onApplyCollectionFilter={(tipo, estilo) => {
              setFiltroTipo(tipo)
              setFiltroEstilo(estilo)
              const next = new URLSearchParams(params)
              if (tipo !== 'Todos') next.set('tipo', tipo)
              else next.delete('tipo')
              if (estilo !== 'Todos') next.set('estilo', estilo)
              else next.delete('estilo')
              setParams(next)
            }}
          />
        </div>

        {/* LISTADO PRINCIPAL DEL CATÁLOGO */}
        <div>
          <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">
              Prendas encontradas ({items.length})
            </h2>
            <span className="text-xs text-white/40 font-mono">
              {orden === 'cerca' ? 'Ordenado por cercanía' : `Orden: ${opcionOrdenActual?.label}`}
            </span>
          </div>

          {error && <p role="alert" className="my-8 text-rose-400">{error}</p>}

          {loading ? (
            <div className="py-16 text-center text-white/50">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violeta" />
              <p className="text-sm">Buscando prendas en el catálogo…</p>
            </div>
          ) : items.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 sm:gap-6">
              {items.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-white/40 border border-white/10">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">No encontramos prendas con esos filtros</h3>
              <p className="mt-2 text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                Prueba cambiando el tipo de prenda, ajustando la ubicación o eliminando algún filtro.
              </p>
              <button
                type="button"
                onClick={handleResetFiltros}
                className="mt-6 rounded-xl bg-violeta px-6 py-2.5 text-xs font-bold text-white hover:bg-violeta-hover shadow-lg shadow-purple-900/30 transition"
              >
                Quitar filtros
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

/* ============================================================================
 * Sección de "Prendas colgadas en una barra" (Nueva Colección | Moda Local Bogotá)
 * ============================================================================ */

type RackBadgeVariant = 'discount' | 'new' | 'stock'

interface HangingRackGarment {
  id: string
  nombre: string
  tienda: string
  barrio: string
  precio: number
  imagen: string
  tipoFiltro: string
  estilo: string
  badge?: {
    text: string
    variant: RackBadgeVariant
  }
}

const LOW_STOCK_INV =
  INVENTORY_ITEMS.find((inv) => inv.id === 'inv-2') ??
  INVENTORY_ITEMS.find((inv) => inv.estado === 'BAJO_STOCK' && inv.stockTotal > 0)

const LOW_STOCK_COUNT = LOW_STOCK_INV?.stockTotal ?? 2

const RACK_IDS = ['p1', 'p3', 'p5', 'p6', 'p8', 'p13', 'p2', 'p4'] as const

const HANGING_RACK_GARMENTS: HangingRackGarment[] = RACK_IDS.map((id) => {
  const found = ITEMS.find((it) => it.id === id) ?? ITEMS[0]
  const tipoNorm = found.tipo === 'Suéter' ? 'Saco' : found.tipo
  let badge: HangingRackGarment['badge']

  if (id === 'p3') {
    badge = { text: '-20%', variant: 'discount' }
  } else if (id === 'p6') {
    badge = {
      text: `SOLO ${LOW_STOCK_COUNT} ${LOW_STOCK_COUNT === 1 ? 'UNIDAD' : 'UNIDADES'}`,
      variant: 'stock',
    }
  } else if (id === 'p13') {
    badge = { text: 'NUEVO', variant: 'new' }
  }

  return {
    id: found.id,
    nombre: found.nombre,
    tienda: found.tienda,
    barrio: found.barrio,
    precio: found.precio,
    imagen: found.imagen,
    tipoFiltro: tipoNorm,
    estilo: found.estilo,
    badge,
  }
})

function HangerSvg({ isCenter }: { isCenter: boolean }) {
  return (
    <svg
      className="sr-rack-hanger"
      viewBox="0 0 120 56"
      fill="none"
      aria-hidden="true"
    >
      {/* Gancho metálico superior apoyado sobre la barra horizontal */}
      <path
        d="M60 20 C60 12, 51 9, 54 3 C56 -1, 65 -1, 66 5 C67 9, 60 12, 60 16"
        stroke="#262626"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Cuello del gancho */}
      <line
        x1="60"
        y1="16"
        x2="60"
        y2="25"
        stroke="#262626"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Hombros minimalistas en grafito */}
      <path
        d="M10 50 L56 25 Q60 23 64 25 L110 50"
        stroke={isCenter ? '#262626' : '#3a3a40'}
        strokeWidth={isCenter ? '4' : '3.4'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Detalle central sutil */}
      <circle cx="60" cy="25" r="2.2" fill="#48119A" />
    </svg>
  )
}

function HangingCollectionRack({
  onApplyCollectionFilter,
}: {
  onApplyCollectionFilter: (tipo: string, estilo: string) => void
}) {
  // Índice 3 corresponde a "Chaqueta de cuero" (p6) en el centro al iniciar
  const [activeIndex, setActiveIndex] = useState<number>(3)
  const dragStartX = useRef<number | null>(null)
  const dragDeltaX = useRef<number>(0)
  const didDrag = useRef<boolean>(false)

  const total = HANGING_RACK_GARMENTS.length

  const moveBy = useCallback(
    (delta: number) => {
      setActiveIndex((prev) => (prev + delta + total) % total)
    },
    [total]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      moveBy(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      moveBy(1)
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX
    dragDeltaX.current = 0
    didDrag.current = false
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return
    dragDeltaX.current = e.clientX - dragStartX.current
    if (Math.abs(dragDeltaX.current) > 10) {
      didDrag.current = true
    }
  }

  const handlePointerEnd = () => {
    if (dragStartX.current === null) return
    const dx = dragDeltaX.current
    dragStartX.current = null
    dragDeltaX.current = 0
    if (Math.abs(dx) > 36) {
      moveBy(dx < 0 ? 1 : -1)
    }
  }

  const featured = HANGING_RACK_GARMENTS[activeIndex] ?? HANGING_RACK_GARMENTS[0]

  // Calculamos el desplazamiento circular más corto (-3..+3) para cada prenda
  const visibleGarments = useMemo(() => {
    return HANGING_RACK_GARMENTS.map((garment, index) => {
      let offset = index - activeIndex
      if (offset > total / 2) offset -= total
      if (offset < -total / 2) offset += total
      return { garment, index, offset }
    }).filter(({ offset }) => offset >= -3 && offset <= 3)
  }, [activeIndex, total])

  const collectionHref = `/catalogo?tipo=${encodeURIComponent(featured.tipoFiltro)}&estilo=${encodeURIComponent(featured.estilo)}`

  return (
    <section
      className="sr-rack-section"
      aria-label="Nueva colección de moda local en Bogotá"
      onKeyDown={handleKeyDown}
    >
      {/* 1. Encabezado pequeño centrado en mayúsculas con separador vertical fino */}
      <header className="sr-rack-header">
        <span className="sr-rack-kicker">NUEVA COLECCIÓN</span>
        <span className="sr-rack-divider" aria-hidden="true" />
        <span className="sr-rack-kicker sr-rack-kicker--muted">MODA LOCAL BOGOTÁ</span>
      </header>

      {/* 2. Barra metálica horizontal fina + prendas colgadas de ganchos */}
      <div
        className="sr-rack-viewport"
        tabIndex={0}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Perchero interactivo de prendas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
      >
        {/* Barra metálica horizontal de lado a lado */}
        <div className="sr-rack-bar" aria-hidden="true" />

        {/* Prendas colgadas */}
        <div className="sr-rack-stage">
          {visibleGarments.map(({ garment, index, offset }) => {
            const isCenter = offset === 0

            return (
              <button
                key={garment.id}
                type="button"
                data-offset={offset}
                aria-pressed={isCenter}
                aria-label={`${garment.nombre}${garment.badge ? ` (${garment.badge.text})` : ''}`}
                onClick={() => {
                  if (didDrag.current) {
                    didDrag.current = false
                    return
                  }
                  setActiveIndex(index)
                }}
                className="sr-rack-item"
              >
                <div className="sr-rack-sway">
                  {/* Gancho minimalista apoyado en la barra */}
                  <HangerSvg isCenter={isCenter} />

                  {/* Etiqueta en pill sobre algunas prendas */}
                  {garment.badge && (
                    <span
                      className={`sr-rack-badge sr-rack-badge--${garment.badge.variant}`}
                    >
                      {garment.badge.text}
                    </span>
                  )}

                  {/* Foto de la prenda */}
                  <div className="sr-rack-garment-frame">
                    <div className="sr-rack-garment-card">
                      <img
                        src={garment.imagen}
                        alt={garment.nombre}
                        draggable={false}
                        className="sr-rack-garment-img"
                      />
                    </div>
                  </div>
                </div>

                {/* Sombra suave bajo cada prenda */}
                <div className="sr-rack-shadow" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Detalle inferior de la prenda destacada + botón "Ver la colección" */}
      <div className="sr-rack-footer">
        <p className="sr-rack-title">{featured.nombre}</p>
        <p className="sr-rack-meta">
          {featured.tienda} · {formatCOP(featured.precio)}
        </p>

        <Link
          to={collectionHref}
          onClick={() => onApplyCollectionFilter(featured.tipoFiltro, featured.estilo)}
          className="sr-rack-cta"
        >
          Ver la colección
        </Link>
      </div>
    </section>
  )
}
