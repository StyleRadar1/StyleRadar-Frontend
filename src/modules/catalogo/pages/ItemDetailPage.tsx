import { useState, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Badge } from '@/modules/core/design-system'
import { Loading, ErrorState } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { useResource } from '@/modules/core/hooks/useResource'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { tiendaContacto } from '@/modules/soporte/utils/contacts'
import { ItemCard } from '../components/ItemCard'
import { itemService } from '../services/itemService'
import { ITEMS } from '../mocks/items'
import { getStoreIdByName } from '../services/storePublicService'
import type { ItemResponseDto } from '../types/item.dto'
import './ItemDetailPage.css'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tallaSeleccionada, setTallaSeleccionada] = useState<string>('')
  const [guardado, setGuardado] = useState(false)
  const [guardadoPlaylist, setGuardadoPlaylist] = useState(false)
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null)

  // Carga de la prenda principal
  const loader = useCallback(async () => {
    if (!id) throw new Error('ID de prenda no especificado.')
    const prenda = await itemService.getById(id)
    const similares = await itemService.search({ estilo: prenda.estilo })
    return {
      prenda,
      similares: similares.filter((x) => x.id !== prenda.id).slice(0, 4),
    }
  }, [id])

  const { data, loading, error, reload } = useResource<{
    prenda: ItemResponseDto | null
    similares: ItemResponseDto[]
  }>(loader, { prenda: null, similares: [] })

  const prenda = data.prenda
  const similares = data.similares

  // Navegación entre prendas del catálogo con las flechas < >
  const { prevItem, nextItem } = useMemo(() => {
    if (!prenda) return { prevItem: null, nextItem: null }
    const currentIndex = ITEMS.findIndex((it) => it.id === prenda.id)
    const validIndex = currentIndex >= 0 ? currentIndex : 0
    const prevIdx = validIndex > 0 ? validIndex - 1 : ITEMS.length - 1
    const nextIdx = validIndex < ITEMS.length - 1 ? validIndex + 1 : 0
    return {
      prevItem: ITEMS[prevIdx] || null,
      nextItem: ITEMS[nextIdx] || null,
    }
  }, [prenda])

  // Inventario mock por talla (la última talla agotada como ejemplo visual de stock cero)
  const stockPorTalla = useMemo(() => {
    if (!prenda) return {} as Record<string, number>
    const res: Record<string, number> = {}
    prenda.tallas.forEach((t, idx) => {
      const isOut = idx === prenda.tallas.length - 1 && prenda.tallas.length > 1
      res[t] = isOut ? 0 : ((prenda.nombre.length + idx * 3) % 4) + 2
    })
    return res
  }, [prenda])

  const handleGuardar = () => {
    setGuardado((prev) => !prev)
    setMensajeFeedback(
      guardado ? 'Prenda retirada de tu wishlist.' : '¡Prenda guardada en tu wishlist!'
    )
    setTimeout(() => setMensajeFeedback(null), 3000)
  }

  const handleGuardarPlaylist = () => {
    setGuardadoPlaylist((prev) => !prev)
    setMensajeFeedback(
      guardadoPlaylist
        ? 'Prenda retirada de tu playlist.'
        : '¡Prenda guardada en tu playlist de estilo!'
    )
    setTimeout(() => setMensajeFeedback(null), 3000)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 text-[var(--sr-text-primary,#ffffff)]">
      {/* Breadcrumb superior */}
      <nav
        className="mb-6 flex items-center gap-2 text-xs font-semibold text-[var(--sr-text-muted,#b9b9ca)]"
        aria-label="Migas de pan"
      >
        <Link to="/catalogo" className="hover:text-[var(--sr-text-primary,#ffffff)]">
          Catálogo
        </Link>
        <span>/</span>
        {prenda && (
          <>
            <Link
              to={`/catalogo?estilo=${prenda.estilo}`}
              className="hover:text-[var(--sr-text-primary,#ffffff)]"
            >
              {prenda.estilo}
            </Link>
            <span>/</span>
            <span className="truncate text-[var(--sr-text-primary,#ffffff)]">{prenda.nombre}</span>
          </>
        )}
      </nav>

      {/* Estados de Carga y Error */}
      {loading && <Loading label="Cargando detalles de la prenda..." />}

      {!!error && (
        <ErrorState
          error={error}
          onRetry={reload}
          title="No se pudo encontrar la prenda"
        />
      )}

      {mensajeFeedback && (
        <div
          role="status"
          className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 text-xs font-bold text-emerald-300 flex items-center gap-2 shadow-lg backdrop-blur-md"
        >
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{mensajeFeedback}</span>
        </div>
      )}

      {prenda && (
        <div className="space-y-16">
          {/* ========================================================== */}
          {/* HERO REDISEÑADO: COMPOSICIÓN EDITORIAL DE 3 COLUMNAS */}
          {/* ========================================================== */}
          <div className="sr-item-hero" role="region" aria-label={`Detalle de ${prenda.nombre}`}>
            {/* Halo ambiental suave detrás de la prenda */}
            <div className="sr-item-hero__ambient-glow" aria-hidden="true" />

            {/* Barra superior del Hero: Tags + Acciones Rápidas */}
            <div className="sr-item-hero__topbar">
              <div className="sr-item-hero__badge-group">
                <Badge tone="arena">{prenda.estilo}</Badge>
                <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  {prenda.tipo}
                </span>
                <span className="sr-item-hero__rf22-pill">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Disponible hoy en tienda (RF-22)
                </span>
              </div>

              <div className="sr-item-hero__actions-top">
                <button
                  type="button"
                  onClick={handleGuardar}
                  className={`sr-item-hero__action-btn ${guardado ? 'is-active' : ''}`}
                  aria-label={guardado ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                  title={guardado ? 'En tu wishlist' : 'Guardar en favoritos'}
                >
                  {guardado ? '❤️' : '🤍'}
                </button>
                <button
                  type="button"
                  onClick={handleGuardarPlaylist}
                  className={`sr-item-hero__action-btn ${guardadoPlaylist ? 'is-active' : ''}`}
                  aria-label="Guardar en playlist"
                  title="Guardar en playlist"
                >
                  📑
                </button>
              </div>
            </div>

            {/* Rejilla de 3 columnas */}
            <div className="sr-item-hero__grid">
              {/* ────────────────────────────────────────────────────────── */}
              {/* COLUMNA IZQUIERDA: Flechas, Nombre, Frase, Botón Principal */}
              {/* ────────────────────────────────────────────────────────── */}
              <div className="sr-item-hero__col-left">
                {/* Flechas pequeñas para navegar entre prendas */}
                {prevItem && nextItem && (
                  <div
                    className="sr-item-hero__arrows"
                    aria-label="Navegar entre prendas del catálogo"
                  >
                    <Link
                      to={`/catalogo/${prevItem.id}`}
                      className="sr-item-hero__arrow-btn"
                      aria-label={`Prenda anterior: ${prevItem.nombre}`}
                      title={`Prenda anterior: ${prevItem.nombre}`}
                    >
                      ‹
                    </Link>
                    <Link
                      to={`/catalogo/${nextItem.id}`}
                      className="sr-item-hero__arrow-btn"
                      aria-label={`Prenda siguiente: ${nextItem.nombre}`}
                      title={`Prenda siguiente: ${nextItem.nombre}`}
                    >
                      ›
                    </Link>
                  </div>
                )}

                {/* Título en tipografía Poppins destacada */}
                <h1 className="sr-item-hero__title">{prenda.nombre}</h1>

                {/* Frase corta de apoyo con datos reales */}
                <p className="sr-item-hero__subtitle">
                  {prenda.tipo} estilo {prenda.estilo.toLowerCase()} en tono {prenda.color.toLowerCase()}
                </p>

                {/* Párrafo con descripción real del producto y tienda */}
                <p className="sr-item-hero__desc">
                  Pieza destacada de <strong>{prenda.tienda}</strong> en {prenda.barrio}. Disponible hoy
                  para probarte con tu avatar en el probador virtual y coordinar entrega local en Bogotá.
                </p>

                {/* Botón píldora blanca con la acción principal existente */}
                <div className="sr-item-hero__cta-wrap">
                  <Link
                    to={`/probador?prenda=${prenda.id}${
                      tallaSeleccionada ? `&talla=${tallaSeleccionada}` : ''
                    }`}
                    className="sr-item-hero__cta-btn"
                  >
                    <span>✨ Probarme esta prenda en el probador</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* COLUMNA CENTRAL: Prenda Flotante con Sombra y Tienda */}
              {/* ────────────────────────────────────────────────────────── */}
              <div className="sr-item-hero__col-center">
                <div className="sr-item-hero__stage">
                  <div className="sr-item-hero__floating-card">
                    <img
                      src={prenda.imagen}
                      alt={prenda.nombre}
                      className="sr-item-hero__img"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLElement).style.display = 'none'
                      }}
                    />
                  </div>

                  {/* Sombra elíptica suave */}
                  <div className="sr-item-hero__shadow" aria-hidden="true" />

                  {/* Nombre de la tienda y distancia */}
                  <div className="sr-item-hero__store-caption">
                    <Link
                      to={`/tiendas/${getStoreIdByName(prenda.tienda)}`}
                      className="sr-item-hero__store-name hover:underline inline-flex items-center gap-1 text-white"
                      title={`Ver tienda ${prenda.tienda}`}
                    >
                      <span>{prenda.tienda} →</span>
                    </Link>
                    <span className="sr-item-hero__store-meta">
                      {prenda.barrio} · A {prenda.distanciaKm} km de ti
                    </span>
                  </div>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* COLUMNA DERECHA: Precio, Tallas Circulares, Stock, Contacto */}
              {/* ────────────────────────────────────────────────────────── */}
              <div className="sr-item-hero__col-right">
                {/* Precio grande en COP */}
                <div className="sr-item-hero__price-box">
                  <span className="sr-item-hero__price-main">
                    {formatCOP(prenda.precio)}
                  </span>
                </div>

                {/* Selector de tallas con chips circulares */}
                <div className="sr-item-hero__sizes-section">
                  <div className="flex items-center justify-between mb-2">
                    <span className="sr-item-hero__sizes-label">Elige tu talla:</span>
                    {tallaSeleccionada && (
                      <span className="text-xs font-bold text-violeta-claro">
                        Talla elegida: {tallaSeleccionada}
                      </span>
                    )}
                  </div>

                  <div
                    className="sr-item-hero__sizes-row"
                    role="radiogroup"
                    aria-label="Tallas disponibles"
                  >
                    {prenda.tallas.map((talla) => {
                      const stock = stockPorTalla[talla] ?? 1
                      const agotada = stock === 0
                      const seleccionada = tallaSeleccionada === talla

                      return (
                        <button
                          key={talla}
                          type="button"
                          role="radio"
                          aria-checked={seleccionada}
                          disabled={agotada}
                          onClick={() => setTallaSeleccionada(talla)}
                          className={`sr-item-hero__size-circle ${
                            seleccionada ? 'is-selected' : ''
                          }`}
                          aria-label={agotada ? `${talla} (agotada)` : talla}
                          title={agotada ? `${talla} - Agotada` : `Talla ${talla}`}
                        >
                          {talla}
                        </button>
                      )
                    })}
                  </div>

                  {/* Unidades disponibles según la talla elegida */}
                  {tallaSeleccionada && (
                    <div
                      className={`sr-item-hero__stock-info ${
                        stockPorTalla[tallaSeleccionada] === 0 ? 'is-out' : ''
                      }`}
                      role="status"
                    >
                      {stockPorTalla[tallaSeleccionada] === 0 ? (
                        <span>✕ Talla {tallaSeleccionada} agotada en tienda</span>
                      ) : (
                        <span>
                          ✓ Quedan {stockPorTalla[tallaSeleccionada]} unidades en {prenda.tienda}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Caja de disponibilidad local y botón de contacto (RF-22 y RF-73) */}
                <div className="sr-item-hero__local-box">
                  <div className="sr-item-hero__local-header">
                    <span className="text-xs font-bold text-white">Disponibilidad en tienda real</span>
                  </div>
                  <p className="sr-item-hero__local-text">
                    Disponible para retiro inmediato en <strong>{prenda.tienda}</strong> ({prenda.barrio}).
                  </p>
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
          </div>

          {/* ========================================================== */}
          {/* SECCIÓN PRENDAS SIMILARES (RF-16) */}
          {/* ========================================================== */}
          {similares.length > 0 && (
            <div className="border-t border-[var(--sr-border-subtle,rgba(255,255,255,0.1))] pt-12">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-violeta-claro">
                    RF-16
                  </span>
                  <h2 className="mt-1 text-2xl font-bold text-[var(--sr-text-primary,#ffffff)]">
                    Prendas similares de estilo {prenda.estilo}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--sr-text-muted,#b9b9ca)]">
                    Otras opciones disponibles en almacenes de Bogotá con estética compatible.
                  </p>
                </div>
                <Link
                  to={`/catalogo?estilo=${prenda.estilo}`}
                  className="text-xs font-semibold text-violeta-claro hover:underline"
                >
                  Ver todas →
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
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
