import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, Button, Badge } from '@/modules/core/design-system'
import { Loading, EmptyState, ErrorState } from '@/modules/core/components/Status'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { ErrorBanner, ErrorToast, FieldError } from '@/modules/core/components/ErrorFeedback'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind, errorMessage, errorMessageAjeno, fieldErrors } from '@/modules/core/api/errors'
import { formatCOP } from '@/modules/core/utils/format'
import { useInventory } from '../hooks/useInventory'
import type { InventoryItemDto, InventoryItemStatus } from '../types/inventory.dto'

export default function InventoryPage() {
  const {
    items,
    summary,
    loading,
    error,
    reload,
    updateStock,
    removeSize,
    updatePrice,
    toggleActive,
    addItem,
  } = useInventory()

  const [filtroEstado, setFiltroEstado] = useState<InventoryItemStatus | 'TODAS'>('TODAS')
  const [busqueda, setBusqueda] = useState('')
  const [toast, setToast] = useState<{ tone: 'ok' | 'warn' | 'bad'; text: string; sub?: string } | null>(null)
  const [suspendedByAction, setSuspendedByAction] = useState(false)
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({})

  // Diálogo para agregar prenda
  const [mostrarAgregar, setMostrarAgregar] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEstilo, setNuevoEstilo] = useState('Streetwear')
  const [nuevaCategoria, setNuevaCategoria] = useState('Chaquetas')
  const [nuevoPrecio, setNuevoPrecio] = useState(120000)
  const [stockS, setStockS] = useState(2)
  const [stockM, setStockM] = useState(4)
  const [stockL, setStockL] = useState(2)
  const [guardando, setGuardando] = useState(false)
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})

  // Diálogo para editar precio
  const [itemParaPrecio, setItemParaPrecio] = useState<InventoryItemDto | null>(null)
  const [precioEditado, setPrecioEditado] = useState<number>(0)
  const [priceError, setPriceError] = useState('')

  // Diálogo para retirar / reactivar
  const [itemParaToggle, setItemParaToggle] = useState<InventoryItemDto | null>(null)

  const isLoadPermError = Boolean(error) && errorKind(error) === 'permiso'
  const isSuspended = isLoadPermError || suspendedByAction

  const [searchParams] = useSearchParams()
  const mockParam = searchParams.get('mock')
  const prevMock = useRef(mockParam)
  useEffect(() => {
    if (prevMock.current !== mockParam) {
      prevMock.current = mockParam
      setSuspendedByAction(false)
      void reload()
    }
  }, [mockParam, reload])

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
    return list
  }, [items, filtroEstado, busqueda])

  const showToast = (text: string, tone: 'ok' | 'warn' | 'bad' = 'ok', sub?: string) => {
    setToast({ tone, text, sub })
  }

  const handleActionFailure = (err: unknown): boolean => {
    const kind = errorKind(err)
    if (kind === 'permiso') {
      if (err instanceof ApiError && !err.message.toLowerCase().includes('no existe')) {
        setSuspendedByAction(true)
      } else {
        showToast(errorMessageAjeno(err), 'warn')
      }
      return true
    }
    if ((err instanceof ApiError && err.status === 422 && !Object.keys(err.fields).length) || kind === 'conflicto') {
      showToast('Esta acción no está disponible por ahora', 'warn', 'Actualizamos el inventario.')
      void reload()
      return true
    }
    return false
  }

  const handleCrearPrenda = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const errs: Record<string, string> = {}
    if (!nuevoNombre.trim()) errs.nombre = 'Indica el nombre de la prenda.'
    if (!Number.isFinite(nuevoPrecio) || nuevoPrecio <= 0) errs.precio = 'El precio debe ser mayor a 0.'
    if (
      !Number.isInteger(stockS) || stockS < 0 ||
      !Number.isInteger(stockM) || stockM < 0 ||
      !Number.isInteger(stockL) || stockL < 0
    ) {
      errs.tallas = 'Las cantidades por talla deben ser enteros mayores o iguales a 0.'
    }
    if (Object.keys(errs).length) {
      setCreateErrors(errs)
      const firstId = errs.nombre ? 'nombrePrenda' : errs.precio ? 'precioPrenda' : 'tallaS'
      window.setTimeout(() => document.getElementById(firstId)?.focus(), 0)
      return
    }

    setGuardando(true)
    setCreateErrors({})
    try {
      await addItem({
        nombre: nuevoNombre.trim(),
        estilo: nuevoEstilo,
        categoria: nuevaCategoria,
        precio: nuevoPrecio,
        stockPorTalla: {
          S: Number(stockS),
          M: Number(stockM),
          L: Number(stockL),
        },
      })
      setMostrarAgregar(false)
      setNuevoNombre('')
      showToast('¡Prenda incorporada al inventario del almacén!')
    } catch (err) {
      const fields = fieldErrors(err)
      if (Object.keys(fields).length) {
        setCreateErrors(fields)
        const firstId = fields.nombre ? 'nombrePrenda' : fields.precio ? 'precioPrenda' : 'tallaS'
        window.setTimeout(() => document.getElementById(firstId)?.focus(), 0)
      } else if (!handleActionFailure(err)) {
        setCreateErrors({ _global: errorMessage(err, 'Error al registrar prenda.') })
      }
    } finally {
      setGuardando(false)
    }
  }

  const handleUpdateStock = async (item: InventoryItemDto, talla: string, nuevoStock: number) => {
    setStockErrors((prev) => ({ ...prev, [item.id]: '' }))
    if (!(talla in item.stockPorTalla)) {
      setStockErrors((prev) => ({ ...prev, [item.id]: 'La talla indicada no existe en esta prenda.' }))
      return
    }
    if (!Number.isInteger(nuevoStock) || nuevoStock < 0) {
      setStockErrors((prev) => ({ ...prev, [item.id]: 'La cantidad debe ser 0 o mayor.' }))
      return
    }
    try {
      await updateStock(item.id, talla, nuevoStock)
    } catch (err) {
      const fields = fieldErrors(err)
      const fieldMsg = fields.nuevoStock || fields.talla
      if (fieldMsg) {
        setStockErrors((prev) => ({ ...prev, [item.id]: fieldMsg }))
      } else if (!handleActionFailure(err)) {
        setStockErrors((prev) => ({ ...prev, [item.id]: errorMessage(err) }))
      }
    }
  }

  const handleRemoveSize = async (item: InventoryItemDto, talla: string) => {
    setStockErrors((prev) => ({ ...prev, [item.id]: '' }))
    try {
      await removeSize(item.id, talla)
      showToast(`Talla ${talla} quitada de «${item.nombre}».`)
    } catch (err) {
      const fields = fieldErrors(err)
      if (fields.talla) {
        setStockErrors((prev) => ({ ...prev, [item.id]: fields.talla }))
      } else if (err instanceof ApiError && err.status === 422 && (item.stockPorTalla[talla] ?? 0) > 0) {
        setStockErrors((prev) => ({
          ...prev,
          [item.id]: `La talla ${talla} aún tiene ${item.stockPorTalla[talla]} unidades. Déjala en 0 para quitarla.`,
        }))
      } else if (!handleActionFailure(err)) {
        setStockErrors((prev) => ({ ...prev, [item.id]: errorMessage(err) }))
      }
    }
  }

  const handleConfirmarPrecio = async () => {
    if (!itemParaPrecio) return
    if (!Number.isFinite(precioEditado) || precioEditado <= 0) {
      setPriceError('El precio debe ser mayor a 0.')
      window.setTimeout(() => document.getElementById('nuevoPrecioInput')?.focus(), 0)
      return
    }
    setPriceError('')
    try {
      await updatePrice(itemParaPrecio.id, precioEditado)
      setItemParaPrecio(null)
      showToast('Precio actualizado correctamente.')
    } catch (err) {
      const fields = fieldErrors(err)
      if (fields.precio) {
        setPriceError(fields.precio)
        window.setTimeout(() => document.getElementById('nuevoPrecioInput')?.focus(), 0)
      } else if (handleActionFailure(err)) {
        setItemParaPrecio(null)
      } else {
        setPriceError(errorMessage(err, 'Error al actualizar el precio.'))
      }
    }
  }

  const handleConfirmarToggle = async () => {
    if (!itemParaToggle) return
    try {
      await toggleActive(itemParaToggle.id)
      const eraRetirado = itemParaToggle.estado === 'RETIRADO'
      setItemParaToggle(null)
      showToast(eraRetirado ? 'Prenda devuelta a vitrina activa.' : 'Prenda retirada de vitrina pública.')
    } catch (err) {
      setItemParaToggle(null)
      if (!handleActionFailure(err)) {
        showToast(errorMessage(err, 'Error al modificar estado de la prenda.'), 'bad')
      }
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-arena">
              ms-inventario · Puerto 8200
            </span>
            <span className="text-white/40">·</span>
            <Badge tone="violeta">RF-50 a RF-60</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Inventario de la tienda
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Control de existencias por talla, disponibilidad en vitrina física y actualización inmediata de precios.
          </p>
        </div>
        <Button
          variant="primario"
          disabled={isSuspended}
          onClick={() => {
            setCreateErrors({})
            setMostrarAgregar(true)
          }}
          className="self-start md:self-auto"
        >
          + Nueva prenda en inventario
        </Button>
      </div>

      {/* Aviso de inventario suspendido (403) */}
      {isSuspended && (
        <ErrorBanner
          className="mt-6"
          tone="warn"
          icon="lock"
          title="Tu inventario está suspendido"
          actions={
            <Link
              to="/tienda/suscripcion"
              className="inline-flex items-center rounded-xl bg-violeta px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110"
            >
              Revisar suscripción
            </Link>
          }
        >
          No puedes crear, editar ni cambiar existencias mientras tu tienda esté suspendida.
        </ErrorBanner>
      )}

      {/* Alerta toast */}
      <ErrorToast
        open={Boolean(toast)}
        tone={toast?.tone ?? 'ok'}
        icon={toast?.tone === 'warn' ? 'refresh' : toast?.tone === 'bad' ? 'warn' : 'ok'}
        title={toast?.text ?? ''}
        subtitle={toast?.sub}
        onClose={() => setToast(null)}
      />

      {/* Resumen métricas (RF-50) */}
      {summary && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Total referencias</span>
            <p className="mt-1 text-2xl font-extrabold text-white">{summary.totalPrendas}</p>
            <p className="mt-0.5 text-xs text-white/60">{summary.activas} visibles en radar</p>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Unidades en stock</span>
            <p className="mt-1 text-2xl font-extrabold text-arena">{summary.totalUnidades}</p>
            <p className="mt-0.5 text-xs text-white/60">Disponibles hoy en tienda</p>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Bajo stock</span>
            <p className="mt-1 text-2xl font-extrabold text-amber-300">{summary.bajoStock}</p>
            <p className="mt-0.5 text-xs text-white/60">≤ 3 unidades restantes</p>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Agotadas</span>
            <p className="mt-1 text-2xl font-extrabold text-rose-300">{summary.agotados}</p>
            <p className="mt-0.5 text-xs text-white/60">Requiere reposición</p>
          </Card>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="mt-8 flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="tablist">
          {(['TODAS', 'DISPONIBLE', 'BAJO_STOCK', 'AGOTADO', 'RETIRADO'] as const).map((estado) => {
            const labels: Record<typeof estado, string> = {
              TODAS: 'Todas',
              DISPONIBLE: 'Disponibles',
              BAJO_STOCK: 'Bajo stock',
              AGOTADO: 'Agotadas',
              RETIRADO: 'Retiradas',
            }
            const active = filtroEstado === estado
            return (
              <button
                key={estado}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFiltroEstado(estado)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  active ? 'bg-arena text-grafito shadow-sm' : 'border border-white/20 text-white/80 hover:bg-white/5'
                }`}
              >
                {labels[estado]}
              </button>
            )
          })}
        </div>
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por prenda, estilo o categoría..."
            className="w-full rounded-xl border border-white/20 bg-black/20 px-3.5 py-2 text-xs text-white outline-none focus:border-violeta-claro"
          />
        </div>
      </div>

      {/* Estados de carga y error */}
      {loading && !items.length && <Loading label="Cargando inventario de la tienda..." />}
      {Boolean(error) && !isLoadPermError && <ErrorState error={error} onRetry={reload} title="No se pudo cargar el inventario" />}

      {/* Lista vacía */}
      {(!loading || items.length > 0) && !error && itemsFiltrados.length === 0 && (
        <div className="mt-12">
          <EmptyState
            title="No se encontraron prendas en el inventario"
            action={
              <Button variant="secundario" onClick={() => { setFiltroEstado('TODAS'); setBusqueda('') }}>
                Limpiar filtros
              </Button>
            }
          >
            Ajusta los filtros o añade nuevas prendas al catálogo de tu tienda.
          </EmptyState>
        </div>
      )}

      {/* Grilla de prendas */}
      {(!loading || items.length > 0) && !error && itemsFiltrados.length > 0 && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {itemsFiltrados.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between p-5">
              <div>
                <div className="flex gap-4">
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    <img
                      src={item.imagenUrl}
                      alt={item.nombre}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-arena">
                          {item.estilo} · {item.categoria}
                        </span>
                        <h3 className="mt-0.5 text-lg font-bold text-white">{item.nombre}</h3>
                      </div>
                      <Badge
                        tone={
                          item.estado === 'DISPONIBLE'
                            ? 'arena'
                            : item.estado === 'BAJO_STOCK'
                            ? 'lavanda'
                            : 'violeta'
                        }
                      >
                        {item.estado === 'DISPONIBLE'
                          ? 'En stock'
                          : item.estado === 'BAJO_STOCK'
                          ? 'Bajo stock'
                          : item.estado === 'AGOTADO'
                          ? 'Agotado'
                          : 'Retirada'}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-lg font-extrabold text-violeta-claro">{formatCOP(item.precio)}</p>
                      <button
                        type="button"
                        disabled={isSuspended}
                        onClick={() => {
                          setPriceError('')
                          setItemParaPrecio(item)
                          setPrecioEditado(item.precio)
                        }}
                        className="text-xs text-white/60 hover:text-white hover:underline disabled:opacity-40"
                      >
                        Editar precio
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desglose de existencias por talla (RF-50, RF-52) */}
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                    <span>Stock por talla en tienda</span>
                    <span className="font-mono text-white">Total: {item.stockTotal} u.</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(item.stockPorTalla).map(([talla, cantidad]) => (
                      <div
                        key={talla}
                        className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5"
                      >
                        <span className="text-xs font-bold text-arena">{talla}:</span>
                        <input
                          type="number"
                          aria-label={`Cantidad talla ${talla} de ${item.nombre}`}
                          value={cantidad}
                          disabled={isSuspended}
                          onChange={(e) => {
                            const raw = e.target.value
                            const n = Number(raw)
                            if (raw === '' || !Number.isInteger(n) || n < 0) {
                              setStockErrors((prev) => ({
                                ...prev,
                                [item.id]: 'La cantidad debe ser un entero mayor o igual a 0.',
                              }))
                              return
                            }
                            void handleUpdateStock(item, talla, n)
                          }}
                          className="w-11 rounded bg-black/30 px-1 py-0.5 text-center font-mono text-xs font-semibold text-white outline-none focus:border focus:border-violeta-claro disabled:opacity-40"
                        />
                        <div className="ml-0.5 flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Reducir stock talla ${talla}`}
                            disabled={isSuspended || cantidad <= 0}
                            onClick={() => { void handleUpdateStock(item, talla, cantidad - 1) }}
                            className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-30"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            aria-label={`Aumentar stock talla ${talla}`}
                            disabled={isSuspended}
                            onClick={() => { void handleUpdateStock(item, talla, cantidad + 1) }}
                            className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-30"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            aria-label={`Quitar talla ${talla} de ${item.nombre}`}
                            title={`Quitar talla ${talla}`}
                            disabled={isSuspended}
                            onClick={() => { void handleRemoveSize(item, talla) }}
                            className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-xs font-bold text-white/70 transition hover:bg-white/20 hover:text-white disabled:opacity-30"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <FieldError id={`stock-err-${item.id}`} message={stockErrors[item.id]} />
                </div>
              </div>

              {/* Botón de estado */}
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-[11px] text-white/40">
                  Actualizado: {new Date(item.actualizadoEn).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  type="button"
                  disabled={isSuspended}
                  onClick={() => setItemParaToggle(item)}
                  className={`text-xs font-semibold transition disabled:opacity-40 ${
                    item.estado === 'RETIRADO'
                      ? 'text-emerald-400 hover:text-emerald-300'
                      : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  {item.estado === 'RETIRADO' ? '✓ Reactivar en vitrina' : '× Retirar de vitrina'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para agregar prenda nueva */}
      <ConfirmDialog
        open={mostrarAgregar}
        title="Agregar prenda al inventario"
        confirmLabel={guardando ? 'Guardando...' : 'Guardar prenda'}
        busy={guardando}
        onConfirm={() => { void handleCrearPrenda() }}
        onCancel={() => setMostrarAgregar(false)}
      >
        <form onSubmit={handleCrearPrenda} className="space-y-4">
          <div>
            <label htmlFor="nombrePrenda" className="block text-xs font-semibold text-white/80">
              Nombre de la prenda *
            </label>
            <input
              id="nombrePrenda"
              type="text"
              value={nuevoNombre}
              onChange={(e) => {
                setNuevoNombre(e.target.value)
                setCreateErrors((prev) => ({ ...prev, nombre: '' }))
              }}
              aria-invalid={Boolean(createErrors.nombre)}
              aria-describedby={createErrors.nombre ? 'nombrePrenda-err' : undefined}
              placeholder="Ej. Sobrecamisa Pana Marfil"
              className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-violeta-claro"
            />
            <FieldError id="nombrePrenda-err" message={createErrors.nombre} />
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
              onChange={(e) => {
                setNuevoPrecio(Number(e.target.value))
                setCreateErrors((prev) => ({ ...prev, precio: '' }))
              }}
              aria-invalid={Boolean(createErrors.precio)}
              aria-describedby={createErrors.precio ? 'precioPrenda-err' : undefined}
              min={1000}
              step={1000}
              className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-violeta-claro"
            />
            <FieldError id="precioPrenda-err" message={createErrors.precio} />
          </div>

          <div>
            <span className="block text-xs font-semibold text-white/80">Stock inicial por tallas</span>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="tallaS" className="text-[11px] text-white/60">Talla S</label>
                <input
                  id="tallaS"
                  type="number"
                  min={0}
                  value={stockS}
                  onChange={(e) => {
                    setStockS(Number(e.target.value))
                    setCreateErrors((prev) => ({ ...prev, tallas: '' }))
                  }}
                  className="mt-0.5 w-full rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-center text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="tallaM" className="text-[11px] text-white/60">Talla M</label>
                <input
                  id="tallaM"
                  type="number"
                  min={0}
                  value={stockM}
                  onChange={(e) => {
                    setStockM(Number(e.target.value))
                    setCreateErrors((prev) => ({ ...prev, tallas: '' }))
                  }}
                  className="mt-0.5 w-full rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-center text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="tallaL" className="text-[11px] text-white/60">Talla L</label>
                <input
                  id="tallaL"
                  type="number"
                  min={0}
                  value={stockL}
                  onChange={(e) => {
                    setStockL(Number(e.target.value))
                    setCreateErrors((prev) => ({ ...prev, tallas: '' }))
                  }}
                  className="mt-0.5 w-full rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-center text-sm text-white"
                />
              </div>
            </div>
            <FieldError id="tallasPrenda-err" message={createErrors.tallas} />
          </div>

          <FieldError id="crearPrenda-err" message={createErrors._global} />
        </form>
      </ConfirmDialog>

      {/* Modal para editar precio */}
      <ConfirmDialog
        open={Boolean(itemParaPrecio)}
        title="Modificar precio de la prenda"
        confirmLabel="Actualizar precio"
        onConfirm={() => { void handleConfirmarPrecio() }}
        onCancel={() => {
          setPriceError('')
          setItemParaPrecio(null)
        }}
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
                onChange={(e) => {
                  setPrecioEditado(Number(e.target.value))
                  setPriceError('')
                }}
                aria-invalid={Boolean(priceError)}
                aria-describedby={priceError ? 'nuevoPrecioInput-err' : undefined}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-violeta-claro"
              />
              <FieldError id="nuevoPrecioInput-err" message={priceError} />
            </div>
          </div>
        )}
      </ConfirmDialog>

      {/* Modal para confirmar retiro o reactivación */}
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
    </section>
  )
}
