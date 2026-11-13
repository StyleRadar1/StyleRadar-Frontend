import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Loading, ErrorState } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { useResource } from '@/modules/core/hooks/useResource'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { tiendaContacto } from '@/modules/soporte/utils/contacts'
import { ItemCard } from '../components/ItemCard'
import { itemService } from '../services/itemService'
import type { ItemResponseDto } from '../types/item.dto'
import './ItemDetailPage.css'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tallaSeleccionada, setTallaSeleccionada] = useState<string>('')
  const [guardado, setGuardado] = useState(false)
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null)
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null)
  const [prevId, setPrevId] = useState(id)
  const [descripcionExpandida, setDescripcionExpandida] = useState(false)

  if (id !== prevId) {
    setPrevId(id)
    setImagenSeleccionada(null)
  }

  // Carga de la prenda principal y similares
  const loader = useCallback(async () => {
    if (!id) throw new Error('ID de prenda no especificado.')
    const prendaData = await itemService.getById(id)
    const similaresData = await itemService.search({ estilo: prendaData.estilo })
    return {
      prenda: prendaData,
      similares: similaresData.filter((x) => x.id !== prendaData.id).slice(0, 4),
    }
  }, [id])

  const { data, loading, error, reload } = useResource<{
    prenda: ItemResponseDto | null
    similares: ItemResponseDto[]
  }>(loader, { prenda: null, similares: [] })

  const prenda = data.prenda
  const similares = data.similares
  const imagenActiva = imagenSeleccionada ?? prenda?.imagen ?? ''

  // Accesibilidad: cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/catalogo')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  const handleGuardar = () => {
    setGuardado((prev) => !prev)
    setMensajeFeedback(guardado ? 'Prenda retirada de tus favoritos.' : '¡Prenda guardada en tus favoritos!')
    setTimeout(() => setMensajeFeedback(null), 3000)
  }

  // Lista de imágenes para miniaturas si tiene más de una
  const imagenesDisponibles = useMemo(() => {
    if (!prenda) return []
    const list: string[] = [prenda.imagen]
    if (prenda.recorte && prenda.recorte !== prenda.imagen) {
      list.push(prenda.recorte)
    }
    return Array.from(new Set(list))
  }, [prenda])

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 text-[var(--color-text)]">
      {/* Barra superior / Migas de pan + botón Cerrar */}
      <nav className="mb-6 flex items-center justify-between text-xs text-[var(--color-text-muted)]" aria-label="Migas de pan">
        <div className="flex items-center gap-2">
          <Link to="/catalogo" className="hover:text-[var(--color-text)] transition font-medium">Catálogo</Link>
          <span>/</span>
          {prenda && (
            <>
              <Link to={`/catalogo?estilo=${encodeURIComponent(prenda.estilo)}`} className="hover:text-[var(--color-text)] transition font-medium">
                {prenda.estilo}
              </Link>
              <span>/</span>
              <span className="truncate text-[var(--color-text)] max-w-xs">{prenda.nombre}</span>
            </>
          )}
        </div>

        <Link
          to="/catalogo"
          aria-label="Cerrar y volver al catálogo"
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sr-border-subtle,var(--color-border))] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--sr-surface-raised,var(--color-surface-raised))] hover:text-[var(--color-text)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))]"
        >
          <span>✕</span>
          <span className="hidden sm:inline">Cerrar</span>
        </Link>
      </nav>

      {/* Estados de carga o error */}
      {loading && <Loading label="Cargando detalles de la prenda..." />}

      {!!error && (
        <ErrorState
          error={error}
          onRetry={reload}
          title="No se pudo encontrar la prenda"
        />
      )}

      {mensajeFeedback && (
        <div role="status" className="mb-6 rounded-xl border border-[var(--color-success-border,rgba(16,185,129,0.3))] bg-[var(--color-success-bg,rgba(16,185,129,0.1))] p-3.5 text-xs text-[var(--color-success-text,#10b981)] flex items-center gap-2 shadow-sm animate-in fade-in">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{mensajeFeedback}</span>
        </div>
      )}

      {prenda && (
        <div className="space-y-14">
          {/* ======================================================== */}
          {/* TARJETA HERO DEL PRODUCTO (3 COLUMNAS EN ESCRITORIO)     */}
          {/* ======================================================== */}
          <article className="sr-detail-hero-card p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              
              {/* ---------------------------------------------------- */}
              {/* COLUMNA CENTRO: Prenda grande + Fondo difuminado      */}
              {/* Desktop: Col 6 centro | Tablet: Top ancho completo    */}
              {/* Mobile: Primero en el orden visual (order-1)         */}
              {/* ---------------------------------------------------- */}
              <div className="flex flex-col items-center justify-center md:col-span-2 lg:col-span-6 md:order-1 lg:order-2 order-1">
                <div className="relative w-full max-w-[23.75rem] sm:max-w-[26.25rem] aspect-[3/4] flex items-center justify-center overflow-hidden rounded-2xl">
                  {/* Fondo difuminado de la misma imagen con máscara lateral */}
                  <img
                    src={imagenActiva || prenda.imagen}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none absolute inset-0 h-full w-full scale-[1.35] object-cover opacity-60 blur-[36px] saturate-[1.2]"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-radial from-transparent via-transparent to-[var(--sr-superficie,var(--color-surface))]/70"
                    aria-hidden="true"
                  />

                  {/* Prenda grande completa, sin recorte (object-contain) */}
                  <img
                    src={imagenActiva || prenda.imagen}
                    alt={prenda.nombre}
                    className="relative z-10 max-h-[92%] max-w-[92%] w-auto h-auto object-contain sr-hero-image-animate sr-hero-image-fade drop-shadow-xl"
                  />
                </div>

                {/* Texto de etiqueta entre la prenda y la sombra */}
                <div className="mt-4 text-center z-10">
                  <p className="text-[0.625rem] font-bold uppercase tracking-[.24em] text-[var(--sr-acento-primario,var(--color-accent))]">
                    {prenda.tienda === 'Segunda mano' ? 'MODA CIRCULAR BOGOTÁ' : 'DISEÑO LOCAL BOGOTÁ'}
                  </p>
                  <p className="mt-0.5 text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
                    {prenda.tienda === 'Segunda mano' ? 'SEGUNDA MANO' : `${prenda.tipo} · ${prenda.barrio}`}
                  </p>
                </div>

                {/* Sombra elíptica difusa en el suelo */}
                <div className="sr-hero-shadow" aria-hidden="true" />
              </div>

              {/* ---------------------------------------------------- */}
              {/* COLUMNA IZQUIERDA: Información del producto (~28%)   */}
              {/* Desktop: Col 3 izq | Tablet: Col 1 | Mobile: order-2 */}
              {/* ---------------------------------------------------- */}
              <div className="flex flex-col justify-between md:col-span-1 lg:col-span-3 md:order-2 lg:order-1 order-2 sr-hero-col-left">
                <div>
                  {/* a) Marca o tienda en pequeño, mayúsculas, letter-spacing y color de acento */}
                  <p className="text-xs font-bold uppercase tracking-[.22em] text-[var(--sr-acento-primario,var(--color-accent))]">
                    {prenda.tienda}
                  </p>

                  {/* b) Nombre del producto grande, en mayúsculas, en 2 líneas como máximo */}
                  <h1 className="mt-1.5 text-2xl sm:text-3xl lg:text-[1.75rem] font-black uppercase tracking-tight text-[var(--color-text)] leading-tight line-clamp-2">
                    {prenda.nombre}
                  </h1>

                  {/* Precio destacado */}
                  <p className="mt-3 text-2xl font-black text-[var(--sr-acento-primario,var(--color-accent))]">
                    {formatCOP(prenda.precio)}
                  </p>

                  {/* c) Descripción corta (3-5 líneas) con "Leer más" (si existe en los datos) */}
                  {prenda.descripcion && (
                    <div className="mt-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
                      <p className={descripcionExpandida ? '' : 'line-clamp-4'}>
                        {prenda.descripcion}
                      </p>
                      <button
                        type="button"
                        onClick={() => setDescripcionExpandida((prev) => !prev)}
                        className="mt-1.5 inline-block text-xs font-semibold text-[var(--sr-acento-primario,var(--color-accent))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))] rounded"
                      >
                        {descripcionExpandida ? 'Leer menos' : 'Leer más'}
                      </button>
                    </div>
                  )}

                  {/* d) Miniaturas de la prenda (solo si tiene más de una imagen) */}
                  {imagenesDisponibles.length > 1 && (
                    <div className="mt-6">
                      <span className="block text-[0.625rem] font-bold uppercase tracking-[.18em] text-[var(--color-text-muted)] mb-2">
                        VISTAS
                      </span>
                      <div className="flex gap-2.5 overflow-x-auto pb-1">
                        {imagenesDisponibles.map((imgUrl, idx) => (
                          <button
                            key={imgUrl}
                            type="button"
                            aria-label={`Ver imagen ${idx + 1} de ${prenda.nombre}`}
                            onClick={() => setImagenSeleccionada(imgUrl)}
                            className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))] ${
                              imagenActiva === imgUrl
                                ? 'border-[var(--sr-acento-primario,var(--color-accent))] shadow-md scale-105'
                                : 'border-[var(--sr-border-subtle,var(--color-border))] opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tarjeta de disponibilidad en tienda real (RF-22) */}
                  <div className="mt-6 rounded-2xl border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] p-4 text-xs text-[var(--color-text)]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success-bg,rgba(16,185,129,0.15))] border border-[var(--color-success-border,rgba(16,185,129,0.3))] px-2.5 py-0.5 text-[0.625rem] font-bold text-[var(--color-success-text,#10b981)]">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Disponible hoy
                      </span>
                      <span className="font-semibold text-[var(--color-text)]">Disponibilidad en tienda real</span>
                    </div>
                    <p className="mt-1 text-[var(--color-text-muted)] text-[0.6875rem] leading-relaxed">
                      Disponible hoy para entrega o retiro inmediato en <strong>{prenda.tienda}</strong> ({prenda.barrio}).
                    </p>
                    {/* RF-73: Contactar a la tienda */}
                    <ContactButton
                      className="mt-3 w-full"
                      label="Enviar mensaje a la tienda"
                      contacto={tiendaContacto(prenda.tienda)}
                      asunto={prenda.nombre}
                      referenciaId={prenda.id}
                    />
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* COLUMNA DERECHA: Selectores de Talla y Color (~28%)   */}
              {/* Desktop: Col 3 der | Tablet: Col 2 | Mobile: order-3 */}
              {/* ---------------------------------------------------- */}
              <div className="flex flex-col justify-between md:col-span-1 lg:col-span-3 md:order-3 lg:order-3 order-3 sr-hero-col-right">
                <div>
                  {/* a) TALLA como título con letter-spacing y chips redondos */}
                  {prenda.tallas && prenda.tallas.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-[0.6875rem] font-bold uppercase tracking-[.18em] text-[var(--color-text-muted)]">
                        <span>TALLA</span>
                        {tallaSeleccionada && (
                          <span className="text-[var(--sr-acento-primario,var(--color-accent))] font-bold text-xs lowercase first-letter:uppercase">
                            Talla elegida: {tallaSeleccionada}
                          </span>
                        )}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Tallas disponibles">
                        {prenda.tallas.map((talla) => {
                          const isSelected = tallaSeleccionada === talla
                          return (
                            <button
                              key={talla}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              aria-label={talla}
                              onClick={() => setTallaSeleccionada(isSelected ? '' : talla)}
                              className={`h-10 w-10 rounded-full border text-xs font-bold transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))] ${
                                isSelected
                                  ? 'border-[var(--sr-acento-primario,var(--color-accent))] bg-[var(--sr-acento-primario,var(--color-accent))] text-[var(--sr-texto-sobre-oscuro,var(--color-text-on-accent))] shadow-md scale-105'
                                  : 'border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] text-[var(--color-text)] hover:border-[var(--sr-acento-primario,var(--color-accent))] hover:bg-[var(--sr-superficie,var(--color-surface))]'
                              }`}
                            >
                              {talla}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* b) COLOR como título y muestra de color */}
                  {prenda.color && (
                    <div className="mt-6">
                      <span className="block text-[0.6875rem] font-bold uppercase tracking-[.18em] text-[var(--color-text-muted)]">
                        COLOR
                      </span>
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-[var(--sr-acento-primario,var(--color-accent))] p-0.5 bg-[var(--sr-surface-raised,var(--color-surface-raised))] shadow-sm">
                            <img
                              src={prenda.recorte || prenda.imagen}
                              alt={prenda.color}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="text-[0.625rem] font-semibold text-[var(--color-text)]">
                            {prenda.color}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* c) Botones de acción principales */}
                  <div className="mt-8 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {/* Botón secundario Favorito (solo borde, con corazón) */}
                      <button
                        type="button"
                        onClick={handleGuardar}
                        aria-pressed={guardado}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))] ${
                          guardado
                            ? 'border-[var(--sr-acento-primario,var(--color-accent))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] text-[var(--sr-acento-primario,var(--color-accent))] shadow-sm'
                            : 'border-[var(--sr-border-subtle,var(--color-border))] bg-transparent text-[var(--color-text)] hover:border-[var(--sr-acento-primario,var(--color-accent))] hover:bg-[var(--sr-surface-raised,var(--color-surface-raised))]'
                        }`}
                      >
                        <svg
                          className={`h-4 w-4 ${guardado ? 'fill-[var(--color-danger,#ef4444)] text-[var(--color-danger,#ef4444)]' : 'fill-none text-current'}`}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        <span>Favorito</span>
                      </button>

                      {/* Botón primario Ir a la tienda (relleno, píldora, color de acento) */}
                      <Link
                        to={`/catalogo?marca=${encodeURIComponent(prenda.tienda)}`}
                        className="flex-1 inline-flex items-center justify-center rounded-full bg-[var(--sr-acento-primario,var(--color-accent))] px-6 py-3 text-xs font-black text-[var(--sr-texto-sobre-oscuro,var(--color-text-on-accent))] shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))]"
                      >
                        Ir a la tienda
                      </Link>
                    </div>

                    {/* Enlace directo para probarse la prenda en el probador virtual (RF-57) */}
                    <Link
                      to={`/probador?prenda=${prenda.id}${tallaSeleccionada ? `&talla=${tallaSeleccionada}` : ''}`}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] px-4 py-2.5 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[var(--sr-superficie,var(--color-surface))] hover:text-[var(--sr-acento-primario,var(--color-accent))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))]"
                    >
                      <span>✨ Probarme esta prenda en el probador</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* FRANJA INFERIOR: Atributos reales con iconos redondos */}
            {/* ---------------------------------------------------- */}
            <div className="mt-12 pt-8 border-t border-[var(--sr-border-subtle,var(--color-border))]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {/* 1. Tienda */}
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] flex items-center justify-center text-[var(--sr-acento-primario,var(--color-accent))] shadow-sm">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">TIENDA</p>
                    <p className="text-xs font-bold text-[var(--color-text)] truncate max-w-[8.125rem]">{prenda.tienda}</p>
                  </div>
                </div>

                {/* 2. Barrio */}
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] flex items-center justify-center text-[var(--sr-acento-primario,var(--color-accent))] shadow-sm">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">SECTOR</p>
                    <p className="text-xs font-bold text-[var(--color-text)]">{prenda.barrio}</p>
                  </div>
                </div>

                {/* 3. Distancia */}
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] flex items-center justify-center text-[var(--sr-acento-primario,var(--color-accent))] shadow-sm">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">CERCANÍA</p>
                    <p className="text-xs font-bold text-[var(--color-text)]">a {prenda.distanciaKm} km</p>
                  </div>
                </div>

                {/* 4. Estilo */}
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface-raised,var(--color-surface-raised))] flex items-center justify-center text-[var(--sr-acento-primario,var(--color-accent))] shadow-sm">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">ESTILO</p>
                    <p className="text-xs font-bold text-[var(--color-text)]">{prenda.estilo}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* ======================================================== */}
          {/* SECCIÓN PRENDAS SIMILARES (RF-16)                        */}
          {/* ======================================================== */}
          {similares.length > 0 && (
            <div className="border-t border-[var(--sr-border-subtle,var(--color-border))] pt-10">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--sr-acento-primario,var(--color-accent))]">RF-16</span>
                  <h2 className="mt-1 text-2xl font-bold text-[var(--color-text)]">Prendas similares de estilo {prenda.estilo}</h2>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Otras opciones disponibles en almacenes de Bogotá con estética compatible.
                  </p>
                </div>
                <Link to={`/catalogo?estilo=${encodeURIComponent(prenda.estilo)}`} className="text-xs font-semibold text-[var(--sr-acento-primario,var(--color-accent))] hover:underline">
                  Ver todas →
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(10.625rem,1fr))]">
                {similares.map((sim) => (
                  <ItemCard key={sim.id} item={sim} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
