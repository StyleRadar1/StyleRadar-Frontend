import { useState, useMemo, useEffect, useCallback } from 'react'
import { Button } from '@/modules/core/design-system'
import { Loading, EmptyState, ErrorState } from '@/modules/core/components/Status'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { formatCOP } from '@/modules/core/utils/format'
import { useInventory } from '../hooks/useInventory'
import type { InventoryItemDto, InventoryItemStatus } from '../types/inventory.dto'
import './InventoryPage.css'

/* Foto existente de la tienda (Luna Store) */
const HERO_PHOTO = '/img/sesion/rol-tienda.jpg'
const ITEMS_PER_PAGE = 8

export default function InventoryPage() {
  const {
    items,
    summary,
    loading,
    error,
    reload,
    updateStock,
    updatePrice,
    toggleActive,
    addItem,
    deleteItem,
  } = useInventory()

  const [filtroEstado, setFiltroEstado] = useState<InventoryItemStatus | 'TODAS'>('TODAS')
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS')
  const [tallaFiltro, setTallaFiltro] = useState('TODAS')
  const [ordenPor, setOrdenPor] = useState<'recientes' | 'precio_menor' | 'precio_mayor' | 'menos_unidades'>('recientes')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [paginaActual, setPaginaActual] = useState(1)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Diálogo para asignar a colección
  const [itemParaColeccion, setItemParaColeccion] = useState<InventoryItemDto | null>(null)
  const [coleccionElegida, setColeccionElegida] = useState('Running de ciudad')

  // Panel lateral "Actualizar unidades"
  const [itemParaUnidades, setItemParaUnidades] = useState<InventoryItemDto | null>(null)
  const [tallaUnidades, setTallaUnidades] = useState<string>('M')
  const [cantidadUnidades, setCantidadUnidades] = useState<number>(0)
  const [guardandoUnidades, setGuardandoUnidades] = useState(false)

  // Diálogo para agregar prenda nueva
  const [mostrarAgregar, setMostrarAgregar] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaImagen, setNuevaImagen] = useState('')
  const [nuevoEstilo, setNuevoEstilo] = useState('Streetwear')
  const [nuevaCategoria, setNuevaCategoria] = useState('Chaquetas')
  const [nuevoPrecio, setNuevoPrecio] = useState(120000)
  const [stockS, setStockS] = useState(2)
  const [stockM, setStockM] = useState(4)
  const [stockL, setStockL] = useState(2)
  const [guardando, setGuardando] = useState(false)
  const [errorCrear, setErrorCrear] = useState<string | null>(null)

  // Diálogo para eliminar prenda
  const [itemParaEliminar, setItemParaEliminar] = useState<InventoryItemDto | null>(null)
  const [eliminando, setEliminando] = useState(false)

  // Diálogo para editar precio
  const [itemParaPrecio, setItemParaPrecio] = useState<InventoryItemDto | null>(null)
  const [precioEditado, setPrecioEditado] = useState<number>(0)

  // Diálogo para retirar / reactivar prenda en vitrina
  const [itemParaToggle, setItemParaToggle] = useState<InventoryItemDto | null>(null)

  // Categorías y tallas únicas disponibles a partir de los datos mock
  const categoriasDisponibles = useMemo(() => {
    const set = new Set(items.map((x) => x.categoria).filter(Boolean))
    return Array.from(set)
  }, [items])

  const tallasDisponiblesList = useMemo(() => {
    const set = new Set<string>()
    items.forEach((item) => {
      item.tallasDisponibles?.forEach((t) => set.add(t))
      Object.keys(item.stockPorTalla || {}).forEach((t) => set.add(t))
    })
    return Array.from(set)
  }, [items])

  // Filtrado reactivo de prendas
  const itemsFiltrados = useMemo(() => {
    let list = items
    if (filtroEstado !== 'TODAS') {
      list = list.filter((x) => x.estado === filtroEstado)
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      list = list.filter(
        (x) =>
          x.nombre.toLowerCase().includes(q) ||
          x.estilo.toLowerCase().includes(q) ||
          x.categoria.toLowerCase().includes(q)
      )
    }
    if (categoriaFiltro !== 'TODAS') {
      list = list.filter((x) => x.categoria === categoriaFiltro)
    }
    if (tallaFiltro !== 'TODAS') {
      list = list.filter(
        (x) =>
          (x.tallasDisponibles && x.tallasDisponibles.includes(tallaFiltro)) ||
          (x.stockPorTalla && x.stockPorTalla[tallaFiltro] !== undefined)
      )
    }

    // Ordenamiento
    if (ordenPor === 'precio_menor') {
      list = [...list].sort((a, b) => a.precio - b.precio)
    } else if (ordenPor === 'precio_mayor') {
      list = [...list].sort((a, b) => b.precio - a.precio)
    } else if (ordenPor === 'menos_unidades') {
      list = [...list].sort((a, b) => a.stockTotal - b.stockTotal)
    } else {
      list = [...list].sort((a, b) => new Date(b.actualizadoEn).getTime() - new Date(a.actualizadoEn).getTime())
    }

    return list
  }, [items, filtroEstado, busqueda, categoriaFiltro, tallaFiltro, ordenPor])

  // Paginación calculada sobre los datos filtrados
  const totalPaginas = Math.max(1, Math.ceil(itemsFiltrados.length / ITEMS_PER_PAGE))
  const itemsPaginados = useMemo(() => {
    const start = (paginaActual - 1) * ITEMS_PER_PAGE
    return itemsFiltrados.slice(start, start + ITEMS_PER_PAGE)
  }, [itemsFiltrados, paginaActual])

  // Reiniciar a página 1 si cambian los filtros
  useEffect(() => {
    setPaginaActual(1)
  }, [filtroEstado, busqueda, categoriaFiltro, tallaFiltro])

  // Cerrar panel de unidades con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && itemParaUnidades) {
        setItemParaUnidades(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [itemParaUnidades])

  const showToast = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3500)
  }

  // Abrir panel lateral de unidades
  const openUnidadesPanel = (item: InventoryItemDto) => {
    setItemParaUnidades(item)
    const tallas = item.tallasDisponibles?.length
      ? item.tallasDisponibles
      : Object.keys(item.stockPorTalla || {})
    const primeraTalla = tallas[0] || 'M'
    setTallaUnidades(primeraTalla)
    setCantidadUnidades(item.stockPorTalla?.[primeraTalla] ?? 0)
  }

  const handleCambiarTallaUnidades = (talla: string) => {
    setTallaUnidades(talla)
    if (itemParaUnidades) {
      setCantidadUnidades(itemParaUnidades.stockPorTalla?.[talla] ?? 0)
    }
  }

  const handleGuardarUnidades = async () => {
    if (!itemParaUnidades) return
    setGuardandoUnidades(true)
    try {
      await updateStock(itemParaUnidades.id, tallaUnidades, cantidadUnidades)
      setItemParaUnidades(null)
      showToast(`Unidades de «${itemParaUnidades.nombre}» actualizadas a ${cantidadUnidades}.`)
    } catch {
      showToast('Error al actualizar las unidades.')
    } finally {
      setGuardandoUnidades(false)
    }
  }

  const handleCerrarAgregar = useCallback(() => {
    setMostrarAgregar(false)
    setNuevaImagen('')
    setErrorCrear(null)
  }, [])

  // Subir foto para la nueva prenda
  const handleSubirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorCrear('Por favor selecciona un archivo de imagen válido.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNuevaImagen(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Crear prenda nueva
  const handleCrearPrenda = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!nuevoNombre.trim()) {
      setErrorCrear('Indica el nombre de la prenda.')
      return
    }
    if (nuevoPrecio <= 0) {
      setErrorCrear('El precio debe ser mayor a 0.')
      return
    }

    setGuardando(true)
    setErrorCrear(null)
    try {
      await addItem({
        nombre: nuevoNombre.trim(),
        estilo: nuevoEstilo,
        categoria: nuevaCategoria,
        precio: nuevoPrecio,
        imagenUrl: nuevaImagen || undefined,
        stockPorTalla: {
          S: Number(stockS) || 0,
          M: Number(stockM) || 0,
          L: Number(stockL) || 0,
        },
      })
      setMostrarAgregar(false)
      setNuevoNombre('')
      setNuevaImagen('')
      showToast('¡Prenda incorporada al inventario del almacén!')
    } catch (err) {
      setErrorCrear(err instanceof Error ? err.message : 'Error al registrar prenda.')
    } finally {
      setGuardando(false)
    }
  }

  // Eliminar prenda del inventario
  const handleConfirmarEliminar = async () => {
    if (!itemParaEliminar) return
    setEliminando(true)
    try {
      await deleteItem(itemParaEliminar.id)
      const nombre = itemParaEliminar.nombre
      setItemParaEliminar(null)
      showToast(`Prenda «${nombre}» eliminada del inventario.`)
    } catch {
      showToast('Error al eliminar la prenda del inventario.')
    } finally {
      setEliminando(false)
    }
  }

  // Modificar precio
  const handleConfirmarPrecio = async () => {
    if (!itemParaPrecio || precioEditado <= 0) return
    try {
      await updatePrice(itemParaPrecio.id, precioEditado)
      setItemParaPrecio(null)
      showToast('Precio actualizado correctamente.')
    } catch {
      showToast('Error al actualizar el precio.')
    }
  }

  // Retirar o reactivar en vitrina
  const handleConfirmarToggle = async () => {
    if (!itemParaToggle) return
    try {
      await toggleActive(itemParaToggle.id)
      const eraRetirado = itemParaToggle.estado === 'RETIRADO'
      setItemParaToggle(null)
      showToast(eraRetirado ? 'Prenda devuelta a vitrina activa.' : 'Prenda retirada de vitrina pública.')
    } catch {
      showToast('Error al modificar estado de la prenda.')
    }
  }

  // Asignar prenda a colección
  const handleGuardarColeccion = () => {
    if (!itemParaColeccion) return
    const nombrePrenda = itemParaColeccion.nombre
    const coleccion = coleccionElegida
    setItemParaColeccion(null)
    showToast(`Prenda «${nombrePrenda}» añadida a la colección «${coleccion}».`)
  }

  // Métricas calculadas sobre los datos del inventario
  const totalPrendas = summary?.totalPrendas ?? items.length
  const disponibles = items.filter((x) => x.estado === 'DISPONIBLE').length
  const bajoStock = summary?.bajoStock ?? items.filter((x) => x.estado === 'BAJO_STOCK').length
  const agotados = summary?.agotados ?? items.filter((x) => x.estado === 'AGOTADO').length

  const nombreTienda = items[0]?.tiendaNombre?.toUpperCase() || 'LUNA STORE'

  return (
    <div className="inv-page">
      {/* ── Cabecera compacta a todo el ancho bajo el navbar ── */}
      <header className="inv-hero" aria-labelledby="inv-heading">
        <div className="inv-hero__media" aria-hidden="true">
          <img src={HERO_PHOTO} alt="" />
        </div>
        <div className="inv-hero__shade" aria-hidden="true" />
        <div className="inv-hero__inner">
          <span className="inv-hero__eyebrow">INVENTARIO · {nombreTienda}</span>
          <h1 id="inv-heading" className="inv-hero__title" aria-label="Mi inventario · Inventario de la tienda">
            Mi inventario <span className="sr-only">de la tienda (RF-50 a RF-60)</span>
          </h1>
          <p className="inv-hero__subtitle">
            Gestiona tus prendas, tallas y unidades disponibles.
          </p>
          <div className="inv-hero__actions">
            <button
              type="button"
              className="inv-btn inv-btn--primary"
              aria-label="+ Nueva prenda en inventario"
              onClick={() => {
                setErrorCrear(null)
                setNuevaImagen('')
                setMostrarAgregar(true)
              }}
            >
              + Nueva prenda
            </button>
            <button
              type="button"
              disabled
              className="inv-btn inv-btn--ghost"
              aria-label="Exportar inventario (función próximamente disponible)"
              title="Exportar inventario (próximamente)"
            >
              Exportar
            </button>
          </div>
        </div>
      </header>

      <div className="inv-container">
        {/* Toast de retroalimentación */}
        {feedback && (
          <div
            role="status"
            className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 shadow-sm"
          >
            {feedback}
          </div>
        )}

        {/* ── Fila de 4 tarjetas de resumen con números calculados del inventario ── */}
        <ul className="inv-kpis" aria-label="Resumen de inventario">
          <li className="inv-kpi">
            <span className="inv-kpi__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 6a2 2 0 1 1 2 2c-1 0-2 .7-2 1.6V10l9 6.2c.8.6.4 1.8-.6 1.8H3.6c-1 0-1.4-1.2-.6-1.8L12 10" />
              </svg>
            </span>
            <div className="inv-kpi__body">
              <b>{totalPrendas}</b>
              <span>Prendas <span className="sr-only">Total referencias</span></span>
            </div>
          </li>

          <li className="inv-kpi">
            <span className="inv-kpi__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="m8.5 12 2.5 2.5 4.5-5" />
              </svg>
            </span>
            <div className="inv-kpi__body">
              <b>{disponibles}</b>
              <span>Disponibles <span className="sr-only">Unidades en stock</span></span>
            </div>
          </li>

          <li className="inv-kpi">
            <span className="inv-kpi__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3 2 20h20L12 3Zm0 6v5m0 3v.5" />
              </svg>
            </span>
            <div className="inv-kpi__body">
              <b>{bajoStock}</b>
              <span>Pocas unidades</span>
            </div>
          </li>

          <li className="inv-kpi">
            <span className="inv-kpi__icon inv-kpi__icon--red" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="m9 9 6 6m0-6-6 6" />
              </svg>
            </span>
            <div className="inv-kpi__body">
              <b>{agotados}</b>
              <span>Agotadas</span>
            </div>
          </li>
        </ul>

        {/* ── Barra de herramientas (Búsqueda, Filtros en píldora, Selectores, Vista) ── */}
        <section className="inv-toolbar" aria-label="Filtros y búsqueda de inventario">
          <div className="inv-toolbar__left">
            {/* Campo de búsqueda */}
            <div className="inv-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar prenda..."
                aria-label="Buscar prenda por nombre o categoría"
              />
            </div>

            {/* Filtros en píldora */}
            <div className="inv-pills" role="tablist" aria-label="Filtrar por estado">
              <button
                type="button"
                role="tab"
                aria-selected={filtroEstado === 'TODAS'}
                className={`inv-pill ${filtroEstado === 'TODAS' ? 'is-active' : ''}`}
                onClick={() => setFiltroEstado('TODAS')}
              >
                Todo
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filtroEstado === 'DISPONIBLE'}
                className={`inv-pill ${filtroEstado === 'DISPONIBLE' ? 'is-active' : ''}`}
                onClick={() => setFiltroEstado('DISPONIBLE')}
              >
                Disponible
              </button>
              <button
                type="button"
                role="tab"
                aria-label="Pocas unidades (Bajo stock)"
                aria-selected={filtroEstado === 'BAJO_STOCK'}
                className={`inv-pill ${filtroEstado === 'BAJO_STOCK' ? 'is-active' : ''}`}
                onClick={() => setFiltroEstado('BAJO_STOCK')}
              >
                Pocas unidades <span className="sr-only">Bajo stock</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filtroEstado === 'AGOTADO'}
                className={`inv-pill ${filtroEstado === 'AGOTADO' ? 'is-active' : ''}`}
                onClick={() => setFiltroEstado('AGOTADO')}
              >
                Agotado
              </button>
            </div>
          </div>

          <div className="inv-toolbar__right">
            {/* Selector de Categoría */}
            <div className="inv-select-wrap">
              <select
                aria-label="Filtrar por categoría"
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
              >
                <option value="TODAS">Categoría</option>
                {categoriasDisponibles.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            {/* Selector de Talla */}
            <div className="inv-select-wrap">
              <select
                aria-label="Filtrar por talla"
                value={tallaFiltro}
                onChange={(e) => setTallaFiltro(e.target.value)}
              >
                <option value="TODAS">Talla</option>
                {tallasDisponiblesList.map((talla) => (
                  <option key={talla} value={talla}>
                    {talla}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            {/* Selector de Ordenamiento */}
            <div className="inv-select-wrap">
              <select
                aria-label="Ordenar prendas"
                value={ordenPor}
                onChange={(e) => setOrdenPor(e.target.value as any)}
              >
                <option value="recientes">Recientes</option>
                <option value="precio_menor">Precio menor</option>
                <option value="precio_mayor">Precio mayor</option>
                <option value="menos_unidades">Menos unidades</option>
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            {/* Alternador Cuadrícula / Lista */}
            <div className="inv-view-toggle" role="group" aria-label="Modo de visualización">
              <button
                type="button"
                className={`inv-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Vista de cuadrícula"
                aria-pressed={viewMode === 'grid'}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="2" />
                  <rect x="14" y="3" width="7" height="7" rx="2" />
                  <rect x="3" y="14" width="7" height="7" rx="2" />
                  <rect x="14" y="14" width="7" height="7" rx="2" />
                </svg>
              </button>
              <button
                type="button"
                className={`inv-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="Vista de lista"
                aria-pressed={viewMode === 'list'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                  <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Estados de carga y error */}
        {loading && <Loading label="Cargando inventario de la tienda..." />}
        {Boolean(error) && <ErrorState error={error} onRetry={reload} title="No se pudo cargar el inventario" />}

        {/* Estado sin resultados */}
        {!loading && !error && itemsFiltrados.length === 0 && (
          <div className="mt-12 rounded-[1.375rem] border border-black/[0.06] bg-white p-8 shadow-sm">
            <EmptyState
              title="No se encontraron prendas en el inventario"
              action={
                <Button
                  variant="secundario"
                  onClick={() => {
                    setFiltroEstado('TODAS')
                    setBusqueda('')
                    setCategoriaFiltro('TODAS')
                    setTallaFiltro('TODAS')
                  }}
                >
                  Limpiar filtros
                </Button>
              }
            >
              Ajusta los filtros o añade nuevas prendas al catálogo de tu tienda.
            </EmptyState>
          </div>
        )}

        {/* ── Cuadrícula / Lista de productos y Panel lateral ── */}
        {!loading && !error && itemsFiltrados.length > 0 && (
          <div className={`inv-main-layout ${itemParaUnidades ? 'has-panel' : ''}`}>
            {viewMode === 'grid' ? (
              <div className="inv-grid">
                {itemsPaginados.map((item) => {
                  const tallasTexto = item.tallasDisponibles?.length
                    ? item.tallasDisponibles.join(' · ')
                    : Object.keys(item.stockPorTalla || {}).join(' · ')

                  return (
                    <article className="inv-card" key={item.id}>
                      <div className="inv-card__media">
                        <img src={item.imagenUrl} alt={item.nombre} loading="lazy" />
                      </div>
                      <h3 className="inv-card__title" title={item.nombre}>
                        {item.nombre}
                      </h3>
                      <p className="inv-card__price">{formatCOP(item.precio)}</p>
                      <p className="inv-card__meta">
                        Tallas: {tallasTexto || 'Única'} | Unidades: {item.stockTotal}
                      </p>

                      <div className="inv-card__foot">
                        {item.estado === 'DISPONIBLE' && (
                          <span className="inv-status inv-status--ok">
                            <i className="inv-status__dot" /> Disponible
                          </span>
                        )}
                        {item.estado === 'BAJO_STOCK' && (
                          <span className="inv-status inv-status--low">
                            <i className="inv-status__dot" /> Pocas unidades
                          </span>
                        )}
                        {item.estado === 'AGOTADO' && (
                          <span className="inv-status inv-status--out">
                            <i className="inv-status__dot" /> Agotado
                          </span>
                        )}
                        {item.estado === 'RETIRADO' && (
                          <span className="inv-status inv-status--ret">
                            <i className="inv-status__dot" /> Retirada
                          </span>
                        )}

                        <div className="inv-card__actions">
                          <button
                            type="button"
                            className="inv-icon-btn"
                            aria-label={`Editar precio de ${item.nombre}`}
                            title="Editar precio"
                            onClick={() => {
                              setItemParaPrecio(item)
                              setPrecioEditado(item.precio)
                            }}
                          >
                            <svg viewBox="0 0 20 20">
                              <path d="m13.8 3.2 3 3M3 17l3.8-.8L16.7 6.3a2.1 2.1 0 0 0-3-3L3.8 13.2 3 17Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="inv-icon-btn"
                            aria-label={`Actualizar unidades de ${item.nombre}`}
                            title="Actualizar unidades"
                            onClick={() => openUnidadesPanel(item)}
                          >
                            <svg viewBox="0 0 20 20">
                              <path d="M2.5 6.5h15v11h-15zM1.5 3h17v3.5h-17zM8 10h4" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="inv-icon-btn"
                            aria-label={`Agregar ${item.nombre} a una colección`}
                            title="Agregar a una colección"
                            onClick={() => setItemParaColeccion(item)}
                          >
                            <svg viewBox="0 0 20 20">
                              <path d="M3 5h14M3 10h14M3 15h14" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="inv-icon-btn inv-icon-btn--danger"
                            aria-label={`Eliminar prenda ${item.nombre}`}
                            title="Eliminar prenda"
                            onClick={() => setItemParaEliminar(item)}
                          >
                            <svg viewBox="0 0 20 20">
                              <path d="M4 6h12M7 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h10ZM8 9v6M12 9v6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="inv-list">
                {itemsPaginados.map((item) => {
                  const tallasTexto = item.tallasDisponibles?.length
                    ? item.tallasDisponibles.join(' · ')
                    : Object.keys(item.stockPorTalla || {}).join(' · ')

                  return (
                    <article className="inv-list-item" key={item.id}>
                      <img src={item.imagenUrl} alt={item.nombre} className="inv-list-item__img" loading="lazy" />
                      <div>
                        <h3 className="font-bold text-sm text-grafito">{item.nombre}</h3>
                        <p className="text-xs text-[#64748b]">{item.categoria} · {item.estilo}</p>
                      </div>
                      <span className="font-bold text-sm text-grafito">{formatCOP(item.precio)}</span>
                      <span className="text-xs text-[#64748b]">Tallas: {tallasTexto} | {item.stockTotal} uds</span>
                      <div>
                        {item.estado === 'DISPONIBLE' && (
                          <span className="inv-status inv-status--ok"><i className="inv-status__dot" /> Disponible</span>
                        )}
                        {item.estado === 'BAJO_STOCK' && (
                          <span className="inv-status inv-status--low"><i className="inv-status__dot" /> Pocas unidades</span>
                        )}
                        {item.estado === 'AGOTADO' && (
                          <span className="inv-status inv-status--out"><i className="inv-status__dot" /> Agotado</span>
                        )}
                        {item.estado === 'RETIRADO' && (
                          <span className="inv-status inv-status--ret"><i className="inv-status__dot" /> Retirada</span>
                        )}
                      </div>
                      <div className="inv-card__actions">
                        <button
                          type="button"
                          className="inv-icon-btn"
                          aria-label={`Editar precio de ${item.nombre}`}
                          title="Editar precio"
                          onClick={() => {
                            setItemParaPrecio(item)
                            setPrecioEditado(item.precio)
                          }}
                        >
                          <svg viewBox="0 0 20 20">
                            <path d="m13.8 3.2 3 3M3 17l3.8-.8L16.7 6.3a2.1 2.1 0 0 0-3-3L3.8 13.2 3 17Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="inv-icon-btn"
                          aria-label={`Actualizar unidades de ${item.nombre}`}
                          title="Actualizar unidades"
                          onClick={() => openUnidadesPanel(item)}
                        >
                          <svg viewBox="0 0 20 20">
                            <path d="M2.5 6.5h15v11h-15zM1.5 3h17v3.5h-17zM8 10h4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="inv-icon-btn"
                          aria-label={`Agregar ${item.nombre} a una colección`}
                          title="Agregar a una colección"
                          onClick={() => setItemParaColeccion(item)}
                        >
                          <svg viewBox="0 0 20 20">
                            <path d="M3 5h14M3 10h14M3 15h14" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="inv-icon-btn inv-icon-btn--danger"
                          aria-label={`Eliminar prenda ${item.nombre}`}
                          title="Eliminar prenda"
                          onClick={() => setItemParaEliminar(item)}
                        >
                          <svg viewBox="0 0 20 20">
                            <path d="M4 6h12M7 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h10ZM8 9v6M12 9v6" />
                          </svg>
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {/* ── Panel lateral "Actualizar unidades" ── */}
            {itemParaUnidades && (
              <aside
                className="inv-unit-panel"
                role="region"
                aria-label="Actualizar unidades de la prenda"
              >
                <div className="inv-unit-panel__head">
                  <h2>Actualizar unidades</h2>
                  <button
                    type="button"
                    className="inv-unit-panel__close"
                    onClick={() => setItemParaUnidades(null)}
                    aria-label="Cerrar panel de unidades"
                  >
                    ×
                  </button>
                </div>

                <div className="inv-unit-panel__preview">
                  <img src={itemParaUnidades.imagenUrl} alt="" />
                  <div className="inv-unit-panel__preview-info">
                    <h3>{itemParaUnidades.nombre}</h3>
                    <strong>{formatCOP(itemParaUnidades.precio)}</strong>
                  </div>
                </div>

                <div className="inv-unit-panel__form">
                  <div className="inv-unit-panel__field">
                    <label htmlFor="tallaSelect">Talla</label>
                    <select
                      id="tallaSelect"
                      value={tallaUnidades}
                      onChange={(e) => handleCambiarTallaUnidades(e.target.value)}
                    >
                      {(itemParaUnidades.tallasDisponibles?.length
                        ? itemParaUnidades.tallasDisponibles
                        : Object.keys(itemParaUnidades.stockPorTalla || {})
                      ).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="inv-unit-panel__field">
                    <label>Unidades</label>
                    <div className="inv-stepper">
                      <button
                        type="button"
                        className="inv-stepper__btn"
                        aria-label="Disminuir unidades"
                        disabled={cantidadUnidades <= 0}
                        onClick={() => setCantidadUnidades((prev) => Math.max(0, prev - 1))}
                      >
                        −
                      </button>
                      <span className="inv-stepper__val">{cantidadUnidades}</span>
                      <button
                        type="button"
                        className="inv-stepper__btn"
                        aria-label="Aumentar unidades"
                        onClick={() => setCantidadUnidades((prev) => prev + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="inv-unit-panel__actions">
                    <button
                      type="button"
                      className="inv-btn inv-btn--outline-cancel"
                      onClick={() => setItemParaUnidades(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="inv-btn inv-btn--primary"
                      disabled={guardandoUnidades}
                      onClick={handleGuardarUnidades}
                    >
                      {guardandoUnidades ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}

        {/* ── Paginación inferior ── */}
        {!loading && !error && itemsFiltrados.length > 0 && (
          <nav className="inv-pagination" aria-label="Paginación de inventario">
            <button
              type="button"
              className="inv-page-btn"
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              ‹
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => {
              // Si hay muchas páginas, mostramos un rango compacto con puntos suspensivos
              if (
                totalPaginas > 6 &&
                num > 3 &&
                num < totalPaginas &&
                Math.abs(num - paginaActual) > 1
              ) {
                if (num === 4) return <span key={num} className="inv-page-dots">…</span>
                return null
              }

              return (
                <button
                  key={num}
                  type="button"
                  className={`inv-page-btn ${paginaActual === num ? 'is-active' : ''}`}
                  onClick={() => setPaginaActual(num)}
                  aria-label={`Ir a la página ${num}`}
                  aria-current={paginaActual === num ? 'page' : undefined}
                >
                  {num}
                </button>
              )
            })}

            <button
              type="button"
              className="inv-page-btn"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              aria-label="Página siguiente"
            >
              ›
            </button>
          </nav>
        )}
      </div>

      {/* ── Modal para agregar prenda nueva (Conserva todos los campos y validaciones) ── */}
      <ConfirmDialog
        open={mostrarAgregar}
        title="Agregar prenda al inventario"
        confirmLabel={guardando ? 'Guardando...' : 'Guardar prenda'}
        busy={guardando}
        onConfirm={() => { void handleCrearPrenda() }}
        onCancel={handleCerrarAgregar}
      >
        <form onSubmit={handleCrearPrenda} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80">
              Foto de la prenda
            </label>
            <div className="mt-1 flex items-center gap-3">
              {nuevaImagen ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-black/40">
                  <img src={nuevaImagen} alt="Previsualización" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setNuevaImagen('')}
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-[0.625rem] text-white hover:bg-rose-600"
                    title="Quitar foto"
                    aria-label="Quitar foto"
                  >
                    ✕
                  </button>
                </div>
              ) : null}

              <label
                htmlFor="fotoPrenda"
                className="flex h-16 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/30 bg-black/30 px-3 text-center transition hover:border-violeta-claro hover:bg-black/50"
              >
                <span className="text-xs font-medium text-white/90">
                  {nuevaImagen ? 'Cambiar foto seleccionada' : '📷 Subir foto de la prenda'}
                </span>
                <span className="text-[0.625rem] text-white/50">PNG, JPG o WEBP (instantáneo)</span>
              </label>

              <input
                id="fotoPrenda"
                type="file"
                accept="image/*"
                onChange={handleSubirFoto}
                className="sr-only"
              />
            </div>
          </div>

          <div>
            <label htmlFor="nombrePrenda" className="block text-xs font-semibold text-white/80">
              Nombre de la prenda *
            </label>
            <input
              id="nombrePrenda"
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Ej. Sobrecamisa Pana Marfil"
              className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-violeta-claro"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="estiloPrenda" className="block text-xs font-semibold text-white/80">
                Estilo
              </label>
              <select
                id="estiloPrenda"
                value={nuevoEstilo}
                onChange={(e) => setNuevoEstilo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
              >
                <option value="Streetwear">Streetwear</option>
                <option value="Minimalista">Minimalista</option>
                <option value="Sastre">Sastre</option>
                <option value="Boho">Boho</option>
                <option value="Vintage">Vintage</option>
              </select>
            </div>
            <div>
              <label htmlFor="catPrenda" className="block text-xs font-semibold text-white/80">
                Categoría
              </label>
              <select
                id="catPrenda"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
              >
                <option value="Chaquetas">Chaquetas</option>
                <option value="Pantalones">Pantalones</option>
                <option value="Camisas">Camisas</option>
                <option value="Vestidos">Vestidos</option>
                <option value="Buzos">Buzos</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="precioPrenda" className="block text-xs font-semibold text-white/80">
              Precio al público (COP) *
            </label>
            <input
              id="precioPrenda"
              type="number"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(Number(e.target.value))}
              min={1000}
              step={1000}
              className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-violeta-claro"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-white/80">Stock inicial por tallas</span>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="tallaS" className="text-[0.6875rem] text-white/60">Talla S</label>
                <input
                  id="tallaS"
                  type="number"
                  min={0}
                  value={stockS}
                  onChange={(e) => setStockS(Number(e.target.value))}
                  className="mt-0.5 w-full rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-center text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="tallaM" className="text-[0.6875rem] text-white/60">Talla M</label>
                <input
                  id="tallaM"
                  type="number"
                  min={0}
                  value={stockM}
                  onChange={(e) => setStockM(Number(e.target.value))}
                  className="mt-0.5 w-full rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-center text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="tallaL" className="text-[0.6875rem] text-white/60">Talla L</label>
                <input
                  id="tallaL"
                  type="number"
                  min={0}
                  value={stockL}
                  onChange={(e) => setStockL(Number(e.target.value))}
                  className="mt-0.5 w-full rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-center text-sm text-white"
                />
              </div>
            </div>
          </div>

          {errorCrear && <p className="text-xs text-rose-400">{errorCrear}</p>}
        </form>
      </ConfirmDialog>

      {/* ── Modal para editar precio ── */}
      <ConfirmDialog
        open={Boolean(itemParaPrecio)}
        title="Modificar precio de la prenda"
        confirmLabel="Actualizar precio"
        onConfirm={handleConfirmarPrecio}
        onCancel={() => setItemParaPrecio(null)}
      >
        {itemParaPrecio && (
          <div className="space-y-4">
            <p className="text-xs text-white/70">
              Modificando precio para: <strong>{itemParaPrecio.nombre}</strong>
            </p>
            <div>
              <label htmlFor="nuevoPrecioInput" className="block text-xs font-semibold text-white/80">
                Nuevo precio en COP
              </label>
              <input
                id="nuevoPrecioInput"
                type="number"
                min={1000}
                step={1000}
                value={precioEditado}
                onChange={(e) => setPrecioEditado(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-violeta-claro"
              />
            </div>
          </div>
        )}
      </ConfirmDialog>

      {/* ── Modal para confirmar retiro o reactivación en vitrina ── */}
      <ConfirmDialog
        open={Boolean(itemParaToggle)}
        title={itemParaToggle?.estado === 'RETIRADO' ? 'Reactivar prenda en vitrina' : 'Retirar prenda de vitrina'}
        confirmLabel={itemParaToggle?.estado === 'RETIRADO' ? 'Reactivar' : 'Retirar'}
        onConfirm={handleConfirmarToggle}
        onCancel={() => setItemParaToggle(null)}
      >
        {itemParaToggle && (
          <p className="text-xs text-white/70">
            {itemParaToggle.estado === 'RETIRADO'
              ? `¿Deseas volver a mostrar "${itemParaToggle.nombre}" en las búsquedas y el mapa del catálogo?`
              : `¿Deseas ocultar "${itemParaToggle.nombre}" del catálogo público temporalmente? El registro y existencias permanecerán guardados.`}
          </p>
        )}
      </ConfirmDialog>

      {/* ── Modal para confirmar eliminación permanente de la prenda ── */}
      <ConfirmDialog
        open={Boolean(itemParaEliminar)}
        title="Eliminar prenda del inventario"
        confirmLabel={eliminando ? 'Eliminando...' : 'Eliminar prenda'}
        danger
        busy={eliminando}
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setItemParaEliminar(null)}
      >
        {itemParaEliminar && (
          <div className="space-y-2">
            <p className="text-xs text-white/80">
              ¿Estás seguro de que deseas eliminar permanentemente <strong>«{itemParaEliminar.nombre}»</strong>?
            </p>
            <p className="text-[0.6875rem] text-white/50">
              Esta prenda se retirará de tu inventario y de la vitrina pública. Esta acción no se puede deshacer.
            </p>
          </div>
        )}
      </ConfirmDialog>

      {/* ── Modal para agregar prenda a una colección ── */}
      <ConfirmDialog
        open={Boolean(itemParaColeccion)}
        title="Agregar a una colección"
        confirmLabel="Guardar en colección"
        onConfirm={handleGuardarColeccion}
        onCancel={() => setItemParaColeccion(null)}
      >
        {itemParaColeccion && (
          <div className="space-y-4">
            <p className="text-xs text-white/70">
              Prenda seleccionada: <strong>{itemParaColeccion.nombre}</strong>
            </p>
            <div>
              <label htmlFor="coleccionSelect" className="block text-xs font-semibold text-white/80">
                Selecciona la colección
              </label>
              <select
                id="coleccionSelect"
                value={coleccionElegida}
                onChange={(e) => setColeccionElegida(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
              >
                <option value="Running de ciudad">Running de ciudad</option>
                <option value="Minimal Bogotá">Minimal Bogotá</option>
                <option value="Urbana Streetwear">Urbana Streetwear</option>
                <option value="Nueva Colección">Nueva Colección</option>
              </select>
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
