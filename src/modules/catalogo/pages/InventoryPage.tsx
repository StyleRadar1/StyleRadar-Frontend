import { useState, useMemo } from 'react'
import { Card, Button, Badge } from '@/modules/core/design-system'
import { Loading, EmptyState, ErrorState } from '@/modules/core/components/Status'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
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
    updatePrice,
    toggleActive,
    addItem,
  } = useInventory()

  const [filtroEstado, setFiltroEstado] = useState<InventoryItemStatus | 'TODAS'>('TODAS')
  const [busqueda, setBusqueda] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

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
  const [errorCrear, setErrorCrear] = useState<string | null>(null)

  // Diálogo para editar precio
  const [itemParaPrecio, setItemParaPrecio] = useState<InventoryItemDto | null>(null)
  const [precioEditado, setPrecioEditado] = useState<number>(0)

  // Diálogo para retirar / reactivar
  const [itemParaToggle, setItemParaToggle] = useState<InventoryItemDto | null>(null)

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

  const showToast = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3500)
  }

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
        stockPorTalla: {
          S: Number(stockS) || 0,
          M: Number(stockM) || 0,
          L: Number(stockL) || 0,
        },
      })
      setMostrarAgregar(false)
      setNuevoNombre('')
      showToast('¡Prenda incorporada al inventario del almacén!')
    } catch (err) {
      setErrorCrear(err instanceof Error ? err.message : 'Error al registrar prenda.')
    } finally {
      setGuardando(false)
    }
  }

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

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 text-[var(--color-text)]">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-sand)]">
              ms-inventario · Puerto 8200
            </span>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Badge tone="violeta">RF-50 a RF-60</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)] md:text-4xl">
            Inventario de la tienda
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Control de existencias por talla, disponibilidad en vitrina física y actualización inmediata de precios.
          </p>
        </div>
        <Button
          variant="primario"
          onClick={() => {
            setErrorCrear(null)
            setMostrarAgregar(true)
          }}
          className="self-start md:self-auto"
        >
          + Nueva prenda en inventario
        </Button>
      </div>

      {/* Alerta toast */}
      {feedback && (
        <div role="status" className="mt-6 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success-bg)] p-4 text-sm text-[var(--color-success)]">
          {feedback}
        </div>
      )}

      {/* Resumen métricas (RF-50) */}
      {summary && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Total referencias</span>
            <p className="mt-1 text-2xl font-extrabold text-[var(--color-text)]">{summary.totalPrendas}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{summary.activas} visibles en radar</p>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Unidades en stock</span>
            <p className="mt-1 text-2xl font-extrabold text-[var(--color-sand)]">{summary.totalUnidades}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Disponibles hoy en tienda</p>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-warning)]">Bajo stock</span>
            <p className="mt-1 text-2xl font-extrabold text-[var(--color-warning)]">{summary.bajoStock}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">≤ 3 unidades restantes</p>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-danger)]">Agotadas</span>
            <p className="mt-1 text-2xl font-extrabold text-[var(--color-danger)]">{summary.agotados}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Requiere reposición</p>
          </Card>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="mt-8 flex flex-col gap-4 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
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
                  active ? 'bg-arena text-grafito shadow-sm' : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'
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
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs text-[var(--color-text)] outline-none focus:border-violeta-claro"
          />
        </div>
      </div>

      {/* Estados de carga y error */}
      {loading && <Loading label="Cargando inventario de la tienda..." />}
      {Boolean(error) && <ErrorState error={error} onRetry={reload} title="No se pudo cargar el inventario" />}

      {/* Lista vacía */}
      {!loading && !error && itemsFiltrados.length === 0 && (
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
      {!loading && !error && itemsFiltrados.length > 0 && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {itemsFiltrados.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between p-5">
              <div>
                <div className="flex gap-4">
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
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
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-sand)]">
                          {item.estilo} · {item.categoria}
                        </span>
                        <h3 className="mt-0.5 text-lg font-bold text-[var(--color-text)]">{item.nombre}</h3>
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
                      <p className="text-lg font-extrabold text-[var(--color-accent)]">{formatCOP(item.precio)}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setItemParaPrecio(item)
                          setPrecioEditado(item.precio)
                        }}
                        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline"
                      >
                        Editar precio
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desglose de existencias por talla (RF-50, RF-52) */}
                <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)]">
                    <span>Stock por talla en tienda</span>
                    <span className="font-mono text-[var(--color-text)]">Total: {item.stockTotal} u.</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(item.stockPorTalla).map(([talla, cantidad]) => (
                      <div
                        key={talla}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5"
                      >
                        <span className="text-xs font-bold text-[var(--color-sand)]">{talla}:</span>
                        <span className="font-mono text-xs font-semibold text-[var(--color-text)]">{cantidad}</span>
                        <div className="ml-1 flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Reducir stock talla ${talla}`}
                            disabled={cantidad <= 0}
                            onClick={() => updateStock(item.id, talla, cantidad - 1)}
                            className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-border)] text-xs font-bold text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] disabled:opacity-30"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            aria-label={`Aumentar stock talla ${talla}`}
                            onClick={() => updateStock(item.id, talla, cantidad + 1)}
                            className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-border)] text-xs font-bold text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botón de estado */}
              <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Actualizado: {new Date(item.actualizadoEn).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  type="button"
                  onClick={() => setItemParaToggle(item)}
                  className={`text-xs font-semibold transition ${
                    item.estado === 'RETIRADO'
                      ? 'text-[var(--color-success)] hover:underline'
                      : 'text-[var(--color-danger)] hover:underline'
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
        <form onSubmit={handleCrearPrenda} className="space-y-4 text-[var(--color-text)]">
          <div>
            <label htmlFor="nombrePrenda" className="block text-xs font-semibold text-[var(--color-text)]">
              Nombre de la prenda *
            </label>
            <input
              id="nombrePrenda"
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Ej. Sobrecamisa Pana Marfil"
              className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-violeta-claro"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="estiloPrenda" className="block text-xs font-semibold text-[var(--color-text)]">
                Estilo
              </label>
              <select
                id="estiloPrenda"
                value={nuevoEstilo}
                onChange={(e) => setNuevoEstilo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-violeta-claro"
              >
                <option value="Streetwear">Streetwear</option>
                <option value="Minimalista">Minimalista</option>
                <option value="Sastre">Sastre</option>
                <option value="Boho">Boho</option>
                <option value="Vintage">Vintage</option>
              </select>
            </div>
            <div>
              <label htmlFor="catPrenda" className="block text-xs font-semibold text-[var(--color-text)]">
                Categoría
              </label>
              <select
                id="catPrenda"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-violeta-claro"
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
            <label htmlFor="precioPrenda" className="block text-xs font-semibold text-[var(--color-text)]">
              Precio al público (COP) *
            </label>
            <input
              id="precioPrenda"
              type="number"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(Number(e.target.value))}
              min={1000}
              step={1000}
              className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-violeta-claro"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-[var(--color-text)]">Stock inicial por tallas</span>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="tallaS" className="text-[11px] text-[var(--color-text-muted)]">Talla S</label>
                <input
                  id="tallaS"
                  type="number"
                  min={0}
                  value={stockS}
                  onChange={(e) => setStockS(Number(e.target.value))}
                  className="mt-0.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-center text-sm text-[var(--color-text)]"
                />
              </div>
              <div>
                <label htmlFor="tallaM" className="text-[11px] text-[var(--color-text-muted)]">Talla M</label>
                <input
                  id="tallaM"
                  type="number"
                  min={0}
                  value={stockM}
                  onChange={(e) => setStockM(Number(e.target.value))}
                  className="mt-0.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-center text-sm text-[var(--color-text)]"
                />
              </div>
              <div>
                <label htmlFor="tallaL" className="text-[11px] text-[var(--color-text-muted)]">Talla L</label>
                <input
                  id="tallaL"
                  type="number"
                  min={0}
                  value={stockL}
                  onChange={(e) => setStockL(Number(e.target.value))}
                  className="mt-0.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-center text-sm text-[var(--color-text)]"
                />
              </div>
            </div>
          </div>

          {errorCrear && <p className="text-xs text-rose-400">{errorCrear}</p>}
        </form>
      </ConfirmDialog>

      {/* Modal para editar precio */}
      <ConfirmDialog
        open={Boolean(itemParaPrecio)}
        title="Modificar precio de la prenda"
        confirmLabel="Actualizar precio"
        onConfirm={handleConfirmarPrecio}
        onCancel={() => setItemParaPrecio(null)}
      >
        {itemParaPrecio && (
          <div className="space-y-4 text-[var(--color-text)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              Modificando precio para: <strong>{itemParaPrecio.nombre}</strong>
            </p>
            <div>
              <label htmlFor="nuevoPrecioInput" className="block text-xs font-semibold text-[var(--color-text)]">
                Nuevo precio en COP
              </label>
              <input
                id="nuevoPrecioInput"
                type="number"
                min={1000}
                step={1000}
                value={precioEditado}
                onChange={(e) => setPrecioEditado(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-violeta-claro"
              />
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
          <p className="text-xs text-[var(--color-text-muted)]">
            {itemParaToggle.estado === 'RETIRADO'
              ? `¿Deseas volver a mostrar "${itemParaToggle.nombre}" en las búsquedas y el mapa del catálogo?`
              : `¿Deseas ocultar "${itemParaToggle.nombre}" del catálogo público temporalmente? El registro y existencias permanecerán guardados.`}
          </p>
        )}
      </ConfirmDialog>
    </section>
  )
}
