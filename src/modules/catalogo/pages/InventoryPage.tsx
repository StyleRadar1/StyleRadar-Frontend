import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { env } from '@/configs/env'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { Button } from '@/modules/core/design-system'
import { Loading, EmptyState, ErrorState } from '@/modules/core/components/Status'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { ErrorBanner, ErrorToast, FieldError } from '@/modules/core/components/ErrorFeedback'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind, errorMessage, errorMessageAjeno, fieldErrors } from '@/modules/core/api/errors'
import { formatCOP } from '@/modules/core/utils/format'
import { StoreSuspendedBanner } from '@/modules/transacciones/components/StoreSuspendedBanner'
import { useInventory } from '../hooks/useInventory'
import { inventoryService, MAX_GARMENT_PHOTOS, MAX_GARMENT_PRICE, MAX_PHOTO_URL_LEN, resolveStoreContext, validatePrendaFields } from '../services/inventoryService'
import { PhotoUploadGuide } from '@/modules/experiencia/components/PhotoUploadGuide'
import { GarmentMeasurementsEditor } from '../components/GarmentMeasurementsEditor'
import type { GarmentSizeMeasurementDto } from '../types/garmentMeasurements.dto'
import { ordenarTallas } from '../utils/tallas'
import type { InventoryItemDto, InventoryItemStatus, TipoPrendaInventario } from '../types/inventory.dto'
import {
  COLORES_UNIFICADOS,
  ESTILOS_UNIFICADOS,
  TALLAS_POR_TIPO,
  TIPOS_PRENDA_UNIFICADOS,
} from '../types/item.dto'
import './InventoryPage.css'
import '@/styles/tienda-glass.css'

const HERO_PHOTO = '/img/sesion/rol-tienda.jpg'
const ITEMS_PER_PAGE = 8

function defaultStockForTipoPrenda(tipo: TipoPrendaInventario): Record<string, number> {
  const tallas = TALLAS_POR_TIPO[tipo]
  const out: Record<string, number> = {}
  tallas.forEach((t) => {
    if (tipo === 'ROPA') {
      out[t] = t === 'S' ? 2 : t === 'M' ? 4 : t === 'L' ? 2 : 0
    } else if (tipo === 'PANTALON') {
      out[t] = t === '30' || t === '32' ? 2 : 0
    } else if (tipo === 'CALZADO') {
      out[t] = t === '38' || t === '40' ? 2 : 0
    } else {
      out[t] = 3
    }
  })
  return out
}

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
    updateItem,
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
  const [toast, setToast] = useState<{ tone: 'ok' | 'warn' | 'bad'; text: string; sub?: string } | null>(null)
  const [suspendedByAction, setSuspendedByAction] = useState(false)
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({})

  // Diálogo para asignar a colección
  const [itemParaColeccion, setItemParaColeccion] = useState<InventoryItemDto | null>(null)
  const [coleccionElegida, setColeccionElegida] = useState('Running de ciudad')

  // Panel lateral "Actualizar unidades"
  const [itemParaUnidades, setItemParaUnidades] = useState<InventoryItemDto | null>(null)
  const [tallaUnidades, setTallaUnidades] = useState<string>('M')
  const [cantidadUnidades, setCantidadUnidades] = useState<number>(0)
  const [guardandoUnidades, setGuardandoUnidades] = useState(false)

  // Diálogo para agregar prenda nueva (SR-RF-50 a SR-RF-54)
  const [mostrarAgregar, setMostrarAgregar] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaImagenUrlInput, setNuevaImagenUrlInput] = useState('')
  const [nuevasImagenes, setNuevasImagenes] = useState<string[]>([])
  const [nuevoTipo, setNuevoTipo] = useState<string>(TIPOS_PRENDA_UNIFICADOS[1])
  const [nuevoColor, setNuevoColor] = useState<string>(COLORES_UNIFICADOS[0])
  const [nuevoEstilo, setNuevoEstilo] = useState<string>(ESTILOS_UNIFICADOS[3])
  const [nuevoTipoPrenda, setNuevoTipoPrenda] = useState<TipoPrendaInventario>('ROPA')
  const [createMeasurements, setCreateMeasurements] = useState<GarmentSizeMeasurementDto[]>([])
  const [editMeasurements, setEditMeasurements] = useState<GarmentSizeMeasurementDto[]>([])
  const [loadingEditMeasurements, setLoadingEditMeasurements] = useState(false)
  const [nuevoPrecio, setNuevoPrecio] = useState(120000)
  const [stockPorTallaForm, setStockPorTallaForm] = useState<Record<string, number>>(() => defaultStockForTipoPrenda('ROPA'))
  const [guardando, setGuardando] = useState(false)
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [createAttempted, setCreateAttempted] = useState(false)

  // Diálogo para editar prenda (PUT /api/v1/prendas/{id}, SR-RF-55)
  const [itemParaEditar, setItemParaEditar] = useState<InventoryItemDto | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editTipo, setEditTipo] = useState<string>(TIPOS_PRENDA_UNIFICADOS[1])
  const [editColor, setEditColor] = useState<string>(COLORES_UNIFICADOS[0])
  const [editEstilo, setEditEstilo] = useState<string>(ESTILOS_UNIFICADOS[0])
  const [editPrecio, setEditPrecio] = useState(0)
  const [editFotos, setEditFotos] = useState<string[]>([])
  const [editFotoUrlInput, setEditFotoUrlInput] = useState('')
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)

  // Diálogo para eliminar prenda
  const [itemParaEliminar, setItemParaEliminar] = useState<InventoryItemDto | null>(null)
  const [eliminando, setEliminando] = useState(false)

  // Diálogo para editar precio
  const [itemParaPrecio, setItemParaPrecio] = useState<InventoryItemDto | null>(null)
  const [precioEditado, setPrecioEditado] = useState<number>(0)
  const [priceError, setPriceError] = useState('')

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
    return ordenarTallas(Array.from(set))
  }, [items])

  const isLoadPermError = Boolean(error) && errorKind(error) === 'permiso'
  const isSuspended = isLoadPermError || suspendedByAction
  const isStoreNotFound = error instanceof ApiError && error.status === 404

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

  const showToast = (text: string, tone: 'ok' | 'warn' | 'bad' = 'ok', sub?: string) => {
    setToast({ tone, text, sub })
  }

  const revealCreateError = () => {
    window.setTimeout(() => {
      document.getElementById('crearPrenda-resumen')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 0)
  }

  const handleActionFailure = (err: unknown): boolean => {
    const kind = errorKind(err)
    if (err instanceof ApiError && (err.code === 'INVENTARIO_SUSPENDIDO' || err.code === 'ALMACEN_SUSPENDIDO')) {
      setSuspendedByAction(true)
      return true
    }
    if (err instanceof ApiError && err.code === 'ACCESO_DENEGADO') {
      showToast(errorMessage(err), 'warn')
      return true
    }
    if (err instanceof ApiError && (err.code === 'PRENDA_RETIRADA' || err.code === 'PRENDA_YA_RETIRADA')) {
      showToast(errorMessage(err), 'warn', 'Actualizamos el inventario.')
      void reload()
      return true
    }
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
    } catch (err) {
      if (!handleActionFailure(err)) {
        showToast(errorMessage(err, 'Error al actualizar las unidades.'), 'bad')
      }
    } finally {
      setGuardandoUnidades(false)
    }
  }

  const handleCerrarAgregar = useCallback(() => {
    setMostrarAgregar(false)
    setNuevaImagenUrlInput('')
    setNuevasImagenes([])
    setCreateErrors({})
    setCreateAttempted(false)
  }, [])

  // Subir fotos para la nueva prenda (1 a 5 fotos, SR-RF-51)
  const handleSubirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    // El contrato de ms-item-catalogo acepta únicamente URLs de hasta 300 caracteres.
    // Un archivo local se convierte en data: URL (miles de caracteres) y el POST responde 400.
    if (!env.useMocks) {
      setCreateErrors((prev) => ({
        ...prev,
        fotografias: 'En QA debes pegar una URL pública de imagen (máximo 300 caracteres). La subida de archivos locales no está soportada por el backend actual.',
      }))
      e.target.value = ''
      return
    }

    const validFiles: File[] = []
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (file.type.startsWith('image/')) {
        validFiles.push(file)
      }
    }

    if (validFiles.length === 0) {
      setCreateErrors((prev) => ({ ...prev, fotografias: 'Por favor selecciona archivos de imagen válidos (PNG, JPG o WEBP).' }))
      return
    }

    const remainingSlots = MAX_GARMENT_PHOTOS - nuevasImagenes.length
    if (remainingSlots <= 0) {
      setCreateErrors((prev) => ({ ...prev, fotografias: `Ya alcanzaste el máximo de ${MAX_GARMENT_PHOTOS} fotos por prenda.` }))
      return
    }

    const filesToRead = validFiles.slice(0, remainingSlots)
    filesToRead.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const res = reader.result
          setNuevasImagenes((prev) => (prev.length >= MAX_GARMENT_PHOTOS ? prev : [...prev, res]))
          setCreateErrors((prev) => ({ ...prev, fotografias: '' }))
        }
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleAgregarFotoUrl = () => {
    const url = nuevaImagenUrlInput.trim()
    if (!url) return
    if (url.length > MAX_PHOTO_URL_LEN) {
      setCreateErrors((prev) => ({ ...prev, fotografias: `Cada URL de foto puede tener máximo ${MAX_PHOTO_URL_LEN} caracteres.` }))
      return
    }
    if (nuevasImagenes.length >= MAX_GARMENT_PHOTOS) {
      setCreateErrors((prev) => ({ ...prev, fotografias: `Máximo ${MAX_GARMENT_PHOTOS} fotografías por prenda.` }))
      return
    }
    setNuevasImagenes((prev) => [...prev, url])
    setNuevaImagenUrlInput('')
    setCreateErrors((prev) => ({ ...prev, fotografias: '' }))
  }

  const handleQuitarFoto = (index: number) => {
    setNuevasImagenes((prev) => prev.filter((_, i) => i !== index))
    setCreateErrors((prev) => ({ ...prev, fotografias: '' }))
  }

  const handleCambiarTipoPrenda = (tipoPrenda: TipoPrendaInventario) => {
    setNuevoTipoPrenda(tipoPrenda)
    setStockPorTallaForm(defaultStockForTipoPrenda(tipoPrenda))
    setCreateErrors((prev) => ({ ...prev, tallas: '' }))
  }

  // Crear prenda nueva (POST /api/v1/prendas + POST /api/v1/inventario/lote)
  const handleCrearPrenda = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const errs = validatePrendaFields({
      nombre: nuevoNombre,
      tipo: nuevoTipo,
      color: nuevoColor,
      estilo: nuevoEstilo,
      precio: nuevoPrecio,
      fotografias: nuevasImagenes,
      requirePhoto: import.meta.env.VITE_USE_MOCKS === 'false',
    })
    if (Object.values(stockPorTallaForm).some((v) => !Number.isInteger(v) || v < 0)) {
      errs.tallas = 'Las cantidades por talla deben ser enteros mayores o iguales a 0.'
    }
    if (Object.keys(errs).length) {
      setCreateErrors(errs)
      setCreateAttempted(true)
      const firstId = errs.nombre
        ? 'nombrePrenda'
        : errs.tipo
          ? 'tipoPrenda'
          : errs.color
            ? 'colorPrenda'
            : errs.estilo
              ? 'estiloPrenda'
              : errs.precio
                ? 'precioPrenda'
                : 'fotoPrenda'
      window.setTimeout(() => document.getElementById(firstId)?.focus(), 0)
      revealCreateError()
      return
    }

    setGuardando(true)
    setCreateErrors({})
    try {
      const created = await addItem({
        nombre: nuevoNombre.trim(),
        tipo: nuevoTipo,
        color: nuevoColor,
        estilo: nuevoEstilo,
        categoria: nuevoTipo,
        tipoPrenda: nuevoTipoPrenda,
        precio: nuevoPrecio,
        imagenUrl: nuevasImagenes[0] || undefined,
        imagenes: nuevasImagenes.length > 0 ? nuevasImagenes : undefined,
        fotografias: nuevasImagenes.length > 0 ? nuevasImagenes : undefined,
        stockPorTalla: stockPorTallaForm,
      })
      if (created?.id && createMeasurements.length > 0) {
        await inventoryService.saveGarmentMeasurements(created.id, createMeasurements).catch(() => undefined)
      }
      setMostrarAgregar(false)
      setCreateAttempted(false)
      setNuevoNombre('')
      setNuevaImagenUrlInput('')
      setNuevasImagenes([])
      setCreateMeasurements([])
      setStockPorTallaForm(defaultStockForTipoPrenda(nuevoTipoPrenda))
      showToast('¡Prenda incorporada al inventario del almacén!')
    } catch (err) {
      const fields = fieldErrors(err)
      if (err instanceof ApiError && err.code === 'FOTOGRAFIAS_EXCEDIDAS' && !fields.fotografias) {
        fields.fotografias = errorMessage(err)
      }
      if (Object.keys(fields).length) {
        setCreateErrors(fields)
        setCreateAttempted(true)
        const firstId = fields.nombre ? 'nombrePrenda' : fields.precio ? 'precioPrenda' : fields.fotografias ? 'fotoPrenda' : 'tipoPrenda'
        window.setTimeout(() => document.getElementById(firstId)?.focus(), 0)
        revealCreateError()
      } else if (!handleActionFailure(err)) {
        setCreateErrors({ _global: errorMessage(err, 'Error al registrar prenda.') })
        setCreateAttempted(true)
        revealCreateError()
      }
    } finally {
      setGuardando(false)
    }
  }

  // Abrir edición de prenda (SR-RF-55: PUT /api/v1/prendas/{id})
  const openEditarPrenda = (item: InventoryItemDto) => {
    setItemParaEditar(item)
    setEditNombre(item.nombre)
    setEditTipo(
      TIPOS_PRENDA_UNIFICADOS.includes(item.tipo as (typeof TIPOS_PRENDA_UNIFICADOS)[number])
        ? (item.tipo as string)
        : TIPOS_PRENDA_UNIFICADOS.includes(item.categoria as (typeof TIPOS_PRENDA_UNIFICADOS)[number])
          ? item.categoria
          : TIPOS_PRENDA_UNIFICADOS[1]
    )
    setEditColor(
      COLORES_UNIFICADOS.includes(item.color as (typeof COLORES_UNIFICADOS)[number])
        ? (item.color as string)
        : COLORES_UNIFICADOS[0]
    )
    setEditEstilo(
      ESTILOS_UNIFICADOS.includes(item.estilo as (typeof ESTILOS_UNIFICADOS)[number])
        ? item.estilo
        : ESTILOS_UNIFICADOS[0]
    )
    setEditPrecio(item.precio)
    setEditFotos(
      item.fotografias?.length
        ? item.fotografias
        : item.imagenes?.length
          ? item.imagenes
          : item.imagenUrl
            ? [item.imagenUrl]
            : []
    )
    setEditFotoUrlInput('')
    setEditErrors({})
    setEditMeasurements([])
    setLoadingEditMeasurements(true)
    void inventoryService
      .getGarmentMeasurements(item.id)
      .then((m) => setEditMeasurements(m))
      .finally(() => setLoadingEditMeasurements(false))
  }

  const handleGuardarEdicion = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!itemParaEditar) return
    const errs = validatePrendaFields({
      nombre: editNombre,
      tipo: editTipo,
      color: editColor,
      estilo: editEstilo,
      precio: editPrecio,
      fotografias: editFotos,
      requirePhoto: true,
    })
    if (Object.keys(errs).length) {
      setEditErrors(errs)
      const firstId = errs.nombre ? 'editNombrePrenda' : errs.precio ? 'editPrecioPrenda' : 'editTipoPrenda'
      window.setTimeout(() => document.getElementById(firstId)?.focus(), 0)
      return
    }
    setGuardandoEdicion(true)
    setEditErrors({})
    try {
      const estabaRechazada = itemParaEditar.estadoPublicacion === 'RECHAZADA'
      await updateItem({
        prendaId: itemParaEditar.id,
        nombre: editNombre.trim(),
        tipo: editTipo,
        color: editColor,
        estilo: editEstilo,
        precio: editPrecio,
        fotografias: editFotos,
      })
      if (editMeasurements.length > 0) {
        await inventoryService.saveGarmentMeasurements(itemParaEditar.id, editMeasurements).catch(() => undefined)
      }
      setItemParaEditar(null)
      showToast(
        estabaRechazada
          ? 'Prenda actualizada y enviada de nuevo a revisión.'
          : 'Prenda actualizada correctamente.'
      )
    } catch (err) {
      const fields = fieldErrors(err)
      if (err instanceof ApiError && err.code === 'FOTOGRAFIAS_EXCEDIDAS' && !fields.fotografias) {
        fields.fotografias = errorMessage(err)
      }
      if (Object.keys(fields).length) {
        setEditErrors(fields)
      } else if (handleActionFailure(err)) {
        setItemParaEditar(null)
      } else {
        setEditErrors({ _global: errorMessage(err, 'No pudimos actualizar la prenda.') })
      }
    } finally {
      setGuardandoEdicion(false)
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
    } catch (err) {
      if (!handleActionFailure(err)) {
        showToast(errorMessage(err, 'Error al eliminar la prenda del inventario.'), 'bad')
      }
    } finally {
      setEliminando(false)
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

  // Modificar precio
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

  // Retirar o reactivar en vitrina
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

  // Asignar prenda a colección
  const handleGuardarColeccion = () => {
    if (!itemParaColeccion) return
    const nombrePrenda = itemParaColeccion.nombre
    const coleccion = coleccionElegida
    setItemParaColeccion(null)
    showToast(`Prenda «${nombrePrenda}» añadida a la colección «${coleccion}».`)
  }

  const user = useContext(AuthContext)?.user ?? null
  const [resolvedStoreName, setResolvedStoreName] = useState('')
  useEffect(() => {
    if (env.useMocks) return
    let active = true
    resolveStoreContext()
      .then((ctx) => {
        if (active && ctx.storeName) setResolvedStoreName(ctx.storeName)
      })
      .catch(() => {})
    return () => { active = false }
  }, [user?.id])

  const storeName = resolvedStoreName || items[0]?.tiendaNombre || user?.name || (env.useMocks ? 'Luna Store' : 'Tu tienda')

  // Métricas calculadas sobre los datos del inventario
  const totalPrendas = summary?.totalPrendas ?? items.length
  const disponibles = items.filter((x) => x.estado === 'DISPONIBLE' || x.estado === 'NUEVA_PRENDA').length
  const bajoStock = summary?.bajoStock ?? items.filter((x) => x.estado === 'ULTIMAS_UNIDADES').length
  const agotados = summary?.agotados ?? items.filter((x) => x.estado === 'AGOTADA').length

  const nombreTienda = storeName.toUpperCase()

  const handleExportCsv = () => {
    const header = ['ID', 'Nombre', 'Tipo', 'Color', 'Estilo', 'Precio (COP)', 'Stock total', 'Tallas', 'Estado', 'Publicación']
    const rows = itemsFiltrados.map((it) => [
      it.id,
      it.nombre,
      it.tipo || it.categoria,
      it.color || '',
      it.estilo,
      String(it.precio),
      String(it.stockTotal),
      Object.entries(it.stockPorTalla || {}).map(([t, q]) => `${t}:${q}`).join(' '),
      it.estado,
      it.estadoPublicacion || '',
    ])
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\r\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `styleradar-inventario-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    showToast('Inventario exportado en formato CSV.')
  }

  return (
    <div className="inv-page sr-tienda-glass">
      <StoreSuspendedBanner />
      {/* ── Cabecera compacta a todo el ancho bajo el navbar ── */}
      <header className="inv-hero" aria-labelledby="inv-heading">
        <div className="inv-hero__media" aria-hidden="true">
          <img src={HERO_PHOTO} alt="" />
        </div>
        <div className="inv-hero__shade" aria-hidden="true" />
        <div className="inv-hero__inner">
          <span className="inv-hero__eyebrow">INVENTARIO · {nombreTienda}</span>
          <h1 id="inv-heading" className="inv-hero__title" aria-label="Mi inventario · Inventario de la tienda">
            Mi inventario <span className="sr-only">de la tienda</span>
          </h1>
          <p className="inv-hero__subtitle">
            Gestiona tus prendas, tallas y unidades disponibles.
          </p>
          <div className="inv-hero__actions">
            <button
              type="button"
              className="inv-btn inv-btn--primary"
              aria-label="+ Nueva prenda en inventario"
              disabled={isSuspended}
              onClick={() => {
                if (isStoreNotFound) {
                  showToast(
                    'Tu cuenta no tiene un almacén registrado.',
                    'warn',
                    'Completa el registro de tienda para poder crear prendas.',
                  )
                  return
                }
                setCreateErrors({})
                setCreateAttempted(false)
                setNuevaImagenUrlInput('')
                setNuevasImagenes([])
                setStockPorTallaForm(defaultStockForTipoPrenda(nuevoTipoPrenda))
                setMostrarAgregar(true)
              }}
            >
              + Nueva prenda
            </button>
            <button
              type="button"
              disabled={itemsFiltrados.length === 0}
              onClick={handleExportCsv}
              className="inv-btn inv-btn--ghost"
              aria-label="Exportar inventario a CSV"
              title="Exportar inventario a CSV"
            >
              Exportar
            </button>
          </div>
        </div>
      </header>

      <div className="inv-container">
        {/* Aviso de inventario suspendido (403) */}
        {isSuspended && (
          <ErrorBanner
            className="mt-4"
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

        {/* Alerta toast: fija y visible aunque la página esté desplazada o el modal se cierre. */}
        <div className="pointer-events-none fixed right-4 top-24 z-[350] w-[min(380px,calc(100vw-2rem))]">
          <div className="pointer-events-auto">
            <ErrorToast
              open={Boolean(toast)}
              tone={toast?.tone ?? 'ok'}
              icon={toast?.tone === 'warn' ? 'refresh' : toast?.tone === 'bad' ? 'warn' : 'ok'}
              title={toast?.text ?? ''}
              subtitle={toast?.sub}
              onClose={() => setToast(null)}
            />
          </div>
        </div>

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
                aria-label="Últimas unidades (Bajo stock)"
                aria-selected={filtroEstado === 'ULTIMAS_UNIDADES'}
                className={`inv-pill ${filtroEstado === 'ULTIMAS_UNIDADES' ? 'is-active' : ''}`}
                onClick={() => setFiltroEstado('ULTIMAS_UNIDADES')}
              >
                Últimas unidades <span className="sr-only">Bajo stock</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filtroEstado === 'AGOTADA'}
                className={`inv-pill ${filtroEstado === 'AGOTADA' ? 'is-active' : ''}`}
                onClick={() => setFiltroEstado('AGOTADA')}
              >
                Agotada
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
                onChange={(e) => setOrdenPor(e.target.value as 'recientes' | 'precio_menor' | 'precio_mayor' | 'menos_unidades')}
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
        {loading && !items.length && <Loading label="Cargando inventario de la tienda..." />}
        {Boolean(error) && !isLoadPermError && (
          <div className="space-y-3">
            <ErrorState error={error} onRetry={reload} title="No se pudo cargar el inventario" />
            {isStoreNotFound && (
              <Link
                to="/tienda/registro"
                className="inline-flex items-center rounded-xl bg-violeta px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Registrar mi tienda
              </Link>
            )}
          </div>
        )}

        {/* Estado sin resultados */}
        {(!loading || items.length > 0) && !error && itemsFiltrados.length === 0 && (
          <div className="mt-12 rounded-[22px] border border-[var(--inv-card-border)] bg-[var(--inv-card-bg)] p-8 shadow-sm text-[var(--inv-text)]">
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
        {(!loading || items.length > 0) && !error && itemsFiltrados.length > 0 && (
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
                        {item.tipo || item.categoria} · {item.color || 'Color'} · {item.estilo}
                      </p>
                      <p className="inv-card__meta">
                        Tallas: {tallasTexto || 'Única'} | Unidades: {item.stockTotal}
                      </p>
                      {item.estadoPublicacion === 'RECHAZADA' && (
                        <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-200" role="alert">
                          <strong>Publicación rechazada:</strong> {item.motivoRechazo || 'Revisa los datos y vuelve a enviarla.'}
                        </div>
                      )}

                      {/* Desglose y edición rápida de existencias por talla */}
                      <div className="mt-2.5 mb-3 flex flex-wrap gap-1.5">
                        {Object.entries(item.stockPorTalla).map(([talla, cantidad]) => (
                          <div
                            key={talla}
                            className="flex items-center gap-1 rounded-lg border border-[var(--inv-card-border)] px-2 py-1 text-xs"
                          >
                            <span className="font-bold text-[var(--inv-text)]">{talla}:</span>
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
                              className="w-10 rounded border border-[var(--inv-card-border)] bg-transparent px-1 py-0.5 text-center font-mono text-xs font-semibold text-[var(--inv-text)] outline-none disabled:opacity-40"
                            />
                            <button
                              type="button"
                              aria-label={`Reducir stock talla ${talla}`}
                              disabled={isSuspended || cantidad <= 0}
                              onClick={() => { void handleUpdateStock(item, talla, cantidad - 1) }}
                              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--inv-card-border)] text-xs font-bold text-[var(--inv-text)] transition hover:opacity-80 disabled:opacity-30"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              aria-label={`Aumentar stock talla ${talla}`}
                              disabled={isSuspended}
                              onClick={() => { void handleUpdateStock(item, talla, cantidad + 1) }}
                              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--inv-card-border)] text-xs font-bold text-[var(--inv-text)] transition hover:opacity-80 disabled:opacity-30"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              aria-label={`Quitar talla ${talla} de ${item.nombre}`}
                              title={`Quitar talla ${talla}`}
                              disabled={isSuspended}
                              onClick={() => { void handleRemoveSize(item, talla) }}
                              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--inv-card-border)] text-xs font-bold text-[var(--inv-text-muted)] transition hover:text-[var(--inv-text)] disabled:opacity-30"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <FieldError id={`stock-err-${item.id}`} message={stockErrors[item.id]} />

                      <div className="inv-card__foot">
                        <div className="inv-card__foot-top">
                          {(item.estado === 'DISPONIBLE' || item.estado === 'NUEVA_PRENDA') && (
                            <span className="inv-status inv-status--ok">
                              <i className="inv-status__dot" /> {item.estado === 'NUEVA_PRENDA' ? 'Nueva prenda' : 'Disponible'}
                            </span>
                          )}
                          {item.estado === 'ULTIMAS_UNIDADES' && (
                            <span className="inv-status inv-status--low">
                              <i className="inv-status__dot" /> Últimas unidades
                            </span>
                          )}
                          {item.estado === 'AGOTADA' && (
                            <span className="inv-status inv-status--out">
                              <i className="inv-status__dot" /> Agotada
                            </span>
                          )}
                          {item.estado === 'SUSPENDIDO' && (
                            <span className="inv-status inv-status--out">
                              <i className="inv-status__dot" /> Suspendida
                            </span>
                          )}
                          {item.estado === 'RETIRADO' && (
                            <span className="inv-status inv-status--ret">
                              <i className="inv-status__dot" /> Retirada
                            </span>
                          )}

                          <div className="inv-card__foot-links flex items-center gap-2">
                            <button
                              type="button"
                              className="min-h-8 rounded-md px-2 py-1 text-xs font-semibold text-violeta-claro hover:underline disabled:opacity-40"
                              aria-label={`Editar prenda ${item.nombre}`}
                              title="Editar prenda"
                              disabled={isSuspended || item.estado === 'RETIRADO'}
                              onClick={() => openEditarPrenda(item)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              disabled={isSuspended}
                              onClick={() => setItemParaToggle(item)}
                              className={`min-h-8 rounded-md px-2 py-1 text-xs font-semibold transition disabled:opacity-40 ${
                                item.estado === 'RETIRADO'
                                  ? 'text-emerald-500 hover:underline'
                                  : 'text-amber-500 hover:underline'
                              }`}
                            >
                              {item.estado === 'RETIRADO' ? 'Reactivar' : 'Retirar'}
                            </button>
                          </div>
                        </div>

                        <div className="inv-card__actions">
                          <button
                            type="button"
                            className="inv-icon-btn"
                            aria-label={`Editar precio de ${item.nombre}`}
                            title="Editar precio"
                            disabled={isSuspended}
                            onClick={() => {
                              setPriceError('')
                              setItemParaPrecio(item)
                              setPrecioEditado(item.precio)
                            }}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="inv-icon-btn"
                            aria-label={`Actualizar unidades de ${item.nombre}`}
                            title="Actualizar unidades"
                            disabled={isSuspended}
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
                            disabled={isSuspended}
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
                        <p className="text-xs text-[var(--inv-text-muted)]">
                          {item.tipo || item.categoria} · {item.color || 'Color'} · {item.estilo}
                        </p>
                        {item.estadoPublicacion === 'RECHAZADA' && (
                          <p className="mt-1 text-xs font-semibold text-rose-500">
                            Rechazada: {item.motivoRechazo || 'Revisa los datos y edítala.'}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-sm text-grafito">{formatCOP(item.precio)}</span>
                      <span className="text-xs text-[var(--inv-text-muted)]">Tallas: {tallasTexto} | {item.stockTotal} uds</span>
                      <div>
                        {(item.estado === 'DISPONIBLE' || item.estado === 'NUEVA_PRENDA') && (
                          <span className="inv-status inv-status--ok">
                            <i className="inv-status__dot" /> {item.estado === 'NUEVA_PRENDA' ? 'Nueva prenda' : 'Disponible'}
                          </span>
                        )}
                        {item.estado === 'ULTIMAS_UNIDADES' && (
                          <span className="inv-status inv-status--low"><i className="inv-status__dot" /> Últimas unidades</span>
                        )}
                        {item.estado === 'AGOTADA' && (
                          <span className="inv-status inv-status--out"><i className="inv-status__dot" /> Agotada</span>
                        )}
                        {item.estado === 'SUSPENDIDO' && (
                          <span className="inv-status inv-status--out"><i className="inv-status__dot" /> Suspendida</span>
                        )}
                        {item.estado === 'RETIRADO' && (
                          <span className="inv-status inv-status--ret"><i className="inv-status__dot" /> Retirada</span>
                        )}
                      </div>
                      <div className="inv-card__actions">
                        <button
                          type="button"
                          className="text-xs font-semibold text-violeta-claro hover:underline disabled:opacity-40"
                          aria-label={`Editar prenda ${item.nombre}`}
                          title="Editar prenda"
                          disabled={isSuspended || item.estado === 'RETIRADO'}
                          onClick={() => openEditarPrenda(item)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="inv-icon-btn"
                          aria-label={`Editar precio de ${item.nombre}`}
                          title="Editar precio"
                          disabled={isSuspended}
                          onClick={() => {
                            setPriceError('')
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
                          disabled={isSuspended}
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
                          disabled={isSuspended}
                          onClick={() => setItemParaToggle(item)}
                          className={`text-xs font-semibold transition disabled:opacity-40 ${
                            item.estado === 'RETIRADO'
                              ? 'text-emerald-500 hover:underline'
                              : 'text-amber-500 hover:underline'
                          }`}
                        >
                          {item.estado === 'RETIRADO' ? 'Reactivar' : 'Retirar'}
                        </button>
                        <button
                          type="button"
                          className="inv-icon-btn inv-icon-btn--danger"
                          aria-label={`Eliminar prenda ${item.nombre}`}
                          title="Eliminar prenda"
                          disabled={isSuspended}
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

            {/* ── Modal centrado "Actualizar unidades" ── */}
            {itemParaUnidades && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                role="presentation"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setItemParaUnidades(null)
                }}
              >
                <div
                  className="inv-unit-panel w-full max-w-md"
                  role="dialog"
                  aria-modal="true"
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
                </div>
              </div>
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

      {/* ── Modal para agregar prenda nueva (SR-RF-50 a SR-RF-54) ── */}
      <ConfirmDialog
        open={mostrarAgregar}
        title="Agregar prenda al inventario"
        confirmLabel={guardando ? 'Guardando...' : 'Guardar prenda'}
        busy={guardando}
        wide
        panelClassName="inv-create-dialog"
        onConfirm={() => { void handleCrearPrenda() }}
        onCancel={handleCerrarAgregar}
      >
        <form
          id="formAgregarPrenda"
          onSubmit={handleCrearPrenda}
          className="inv-create-form"
          onChange={() => {
            setCreateErrors((prev) => (Object.keys(prev).length ? {} : prev))
            setCreateAttempted(false)
          }}
        >
          {createAttempted && Object.keys(createErrors).length > 0 && (
            <div
              id="crearPrenda-resumen"
              role="alert"
              aria-live="polite"
              className="inv-create-error"
            >
              <strong>No se pudo guardar la prenda.</strong>
              <span>{createErrors._global || Object.values(createErrors).filter(Boolean).join(' · ') || 'Revisa los campos marcados en el formulario.'}</span>
            </div>
          )}

          <p className="inv-create-form__full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/70">
            Marca asignada automáticamente según tu tienda: <strong className="text-white">{storeName}</strong>
          </p>

          <div className="inv-create-form__left">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="fotoPrenda" className="block text-xs font-semibold text-white/80">
                Fotos de la prenda (1 a {MAX_GARMENT_PHOTOS} fotos)
              </label>
              <span className="text-[11px] font-bold text-violeta-claro">
                {nuevasImagenes.length}/{MAX_GARMENT_PHOTOS} fotos
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-white/50">
              La primera foto será la portada en el catálogo. Máximo {MAX_GARMENT_PHOTOS} fotos (URL de hasta {MAX_PHOTO_URL_LEN} caracteres).
            </p>
            <PhotoUploadGuide variant="garment" darkSurface className="mt-2" />

            {/* Cuadrícula de hasta 5 fotos */}
            <div className="inv-create-photo-slots mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['1. Portada', '2. Detalle', '3. Espalda', '4. Look', '5. Extra'].map((slotLabel, index) => {
                const fotoUrl = nuevasImagenes[index] ?? null
                return (
                  <div
                    key={slotLabel}
                    className="relative flex flex-col items-center justify-center rounded-xl border border-white/15 bg-black/40 p-1.5 aspect-[3/4] overflow-hidden"
                  >
                    {fotoUrl ? (
                      <>
                        <img src={fotoUrl} alt={slotLabel} className="h-full w-full object-cover rounded-lg" />
                        <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-white/90 backdrop-blur-sm">
                          {slotLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuitarFoto(index)}
                          className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-[10px] text-white hover:bg-rose-600 transition"
                          title={`Quitar foto ${slotLabel}`}
                          aria-label={`Quitar foto ${slotLabel}`}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-center p-1.5 text-white/40">
                        <span className="text-base opacity-40"></span>
                        <span className="mt-1 text-[9px] font-medium">{slotLabel}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {nuevasImagenes.length < MAX_GARMENT_PHOTOS && (
              <div className="mt-3 space-y-2">
                {env.useMocks ? (
                  <>
                    <label
                      htmlFor="fotoPrenda"
                      className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/30 bg-black/30 px-3 text-center transition hover:border-violeta-claro hover:bg-black/50"
                    >
                      <span className="text-xs font-medium text-white/90">
                        {nuevasImagenes.length === 0 ? 'Subir fotos de la prenda' : `+ Agregar otra foto (${nuevasImagenes.length}/${MAX_GARMENT_PHOTOS})`}
                      </span>
                    </label>
                    <input
                      id="fotoPrenda"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleSubirFoto}
                      className="sr-only"
                    />
                  </>
                ) : null}
                <div className="flex gap-2">
                  <input
                    type="url"
                    maxLength={MAX_PHOTO_URL_LEN}
                    value={nuevaImagenUrlInput}
                    onChange={(e) => setNuevaImagenUrlInput(e.target.value)}
                    placeholder="O pega URL de imagen (máx. 300 caracteres)"
                    aria-label="URL de foto de prenda"
                    className="flex-1 rounded-xl border border-white/20 bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-violeta-claro"
                  />
                  <button
                    type="button"
                    onClick={handleAgregarFotoUrl}
                    className="rounded-xl border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
                  >
                    Agregar URL
                  </button>
                </div>
              </div>
            )}
            <FieldError id="fotosPrenda-err" message={createErrors.fotografias} />
          </div>

          </div>

          <div className="inv-create-form__right">
          <GarmentMeasurementsEditor
            sizes={Object.keys(stockPorTallaForm)}
            value={createMeasurements}
            onChange={setCreateMeasurements}
          />

          <div>
            <label htmlFor="nombrePrenda" className="block text-xs font-semibold text-white/80">
              Nombre de la prenda * <span className="font-normal text-white/40">(3 a 60 caracteres)</span>
            </label>
            <input
              id="nombrePrenda"
              type="text"
              maxLength={60}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="tipoPrenda" className="block text-xs font-semibold text-white/80">
                Tipo *
              </label>
              <select
                id="tipoPrenda"
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
              >
                {TIPOS_PRENDA_UNIFICADOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <FieldError id="tipoPrenda-err" message={createErrors.tipo} />
            </div>
            <div>
              <label htmlFor="colorPrenda" className="block text-xs font-semibold text-white/80">
                Color *
              </label>
              <select
                id="colorPrenda"
                value={nuevoColor}
                onChange={(e) => setNuevoColor(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
              >
                {COLORES_UNIFICADOS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <FieldError id="colorPrenda-err" message={createErrors.color} />
            </div>
            <div>
              <label htmlFor="estiloPrenda" className="block text-xs font-semibold text-white/80">
                Estilo *
              </label>
              <select
                id="estiloPrenda"
                value={nuevoEstilo}
                onChange={(e) => setNuevoEstilo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
              >
                {ESTILOS_UNIFICADOS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <FieldError id="estiloPrenda-err" message={createErrors.estilo} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                min={1}
                max={MAX_GARMENT_PRICE}
                step={1000}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-violeta-claro"
              />
              <FieldError id="precioPrenda-err" message={createErrors.precio} />
            </div>
            <div>
              <label htmlFor="tipoTallaPrenda" className="block text-xs font-semibold text-white/80">
                Tipo de talla *
              </label>
              <select
                id="tipoTallaPrenda"
                value={nuevoTipoPrenda}
                onChange={(e) => handleCambiarTipoPrenda(e.target.value as TipoPrendaInventario)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
              >
                <option value="ROPA">Ropa (XS a XXL)</option>
                <option value="PANTALON">Pantalón (26 a 36)</option>
                <option value="CALZADO">Calzado (34 a 45)</option>
                <option value="UNICA">Talla única (Única)</option>
              </select>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-white/80">Stock inicial por tallas ({nuevoTipoPrenda})</span>
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {TALLAS_POR_TIPO[nuevoTipoPrenda].map((talla) => (
                <div key={talla}>
                  <label htmlFor={`talla-${talla}`} className="text-[11px] text-white/60">Talla {talla}</label>
                  <input
                    id={`talla-${talla}`}
                    type="number"
                    min={0}
                    value={stockPorTallaForm[talla] ?? 0}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setStockPorTallaForm((prev) => ({ ...prev, [talla]: val }))
                      setCreateErrors((prev) => ({ ...prev, tallas: '' }))
                    }}
                    className="mt-0.5 w-full rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-center text-sm text-white"
                  />
                </div>
              ))}
            </div>
            <FieldError id="tallasPrenda-err" message={createErrors.tallas} />
          </div>

          <FieldError id="crearPrenda-err" message={createErrors._global} />
          </div>
        </form>
      </ConfirmDialog>

      {/* ── Modal para editar prenda (PUT /api/v1/prendas/{id}, SR-RF-55) ── */}
      <ConfirmDialog
        open={Boolean(itemParaEditar)}
        title="Editar prenda del catálogo"
        confirmLabel={guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
        busy={guardandoEdicion}
        onConfirm={() => { void handleGuardarEdicion() }}
        onCancel={() => {
          setItemParaEditar(null)
          setEditErrors({})
        }}
      >
        {itemParaEditar && (
          <form onSubmit={handleGuardarEdicion} className="space-y-4">
            <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/70">
              Marca asignada: <strong className="text-white">{storeName}</strong>
            </p>
            <div>
              <label htmlFor="editNombrePrenda" className="block text-xs font-semibold text-white/80">
                Nombre de la prenda *
              </label>
              <input
                id="editNombrePrenda"
                type="text"
                maxLength={60}
                value={editNombre}
                onChange={(e) => {
                  setEditNombre(e.target.value)
                  setEditErrors((prev) => ({ ...prev, nombre: '' }))
                }}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-violeta-claro"
              />
              <FieldError id="editNombrePrenda-err" message={editErrors.nombre} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="editTipoPrenda" className="block text-xs font-semibold text-white/80">Tipo *</label>
                <select
                  id="editTipoPrenda"
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
                >
                  {TIPOS_PRENDA_UNIFICADOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="editColorPrenda" className="block text-xs font-semibold text-white/80">Color *</label>
                <select
                  id="editColorPrenda"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
                >
                  {COLORES_UNIFICADOS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="editEstiloPrenda" className="block text-xs font-semibold text-white/80">Estilo *</label>
                <select
                  id="editEstiloPrenda"
                  value={editEstilo}
                  onChange={(e) => setEditEstilo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
                >
                  {ESTILOS_UNIFICADOS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="editPrecioPrenda" className="block text-xs font-semibold text-white/80">Precio (COP) *</label>
              <input
                id="editPrecioPrenda"
                type="number"
                min={1}
                max={MAX_GARMENT_PRICE}
                step={1000}
                value={editPrecio}
                onChange={(e) => {
                  setEditPrecio(Number(e.target.value))
                  setEditErrors((prev) => ({ ...prev, precio: '' }))
                }}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-violeta-claro"
              />
              <FieldError id="editPrecioPrenda-err" message={editErrors.precio} />
            </div>

            <div>
              <span className="block text-xs font-semibold text-white/80">
                Fotografías ({editFotos.length}/{MAX_GARMENT_PHOTOS})
              </span>
              <ul className="mt-1.5 space-y-1">
                {editFotos.map((url, idx) => (
                  <li key={`${url}-${idx}`} className="flex items-center justify-between gap-2 rounded-lg bg-black/30 px-2.5 py-1 text-[11px] text-white/80">
                    <span className="truncate">{idx === 0 ? 'Portada: ' : `Foto ${idx + 1}: `}{url}</span>
                    {editFotos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEditFotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:underline"
                      >
                        Quitar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {editFotos.length < MAX_GARMENT_PHOTOS && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="url"
                    maxLength={MAX_PHOTO_URL_LEN}
                    value={editFotoUrlInput}
                    onChange={(e) => setEditFotoUrlInput(e.target.value)}
                    placeholder="Nueva URL de foto (máx. 300 chars)"
                    className="flex-1 rounded-xl border border-white/20 bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-violeta-claro"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const u = editFotoUrlInput.trim()
                      if (!u) return
                      if (u.length > MAX_PHOTO_URL_LEN) {
                        setEditErrors((prev) => ({ ...prev, fotografias: `Máximo ${MAX_PHOTO_URL_LEN} caracteres.` }))
                        return
                      }
                      setEditFotos((prev) => [...prev, u])
                      setEditFotoUrlInput('')
                      setEditErrors((prev) => ({ ...prev, fotografias: '' }))
                    }}
                    className="rounded-xl border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
                  >
                    Agregar
                  </button>
                </div>
              )}
              <FieldError id="editFotos-err" message={editErrors.fotografias} />
            </div>

            <GarmentMeasurementsEditor
              sizes={itemParaEditar.tallasDisponibles ?? []}
              value={editMeasurements}
              onChange={setEditMeasurements}
              loading={loadingEditMeasurements}
            />
            <FieldError id="editPrenda-err" message={editErrors._global} />
          </form>
        )}
      </ConfirmDialog>

      {/* ── Modal para editar precio ── */}
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
            <p className="text-[11px] text-white/50">
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
                <option value="Estilo Casual">Estilo Casual</option>
                <option value="Moda Urbana">Moda Urbana</option>
                <option value="Nueva Colección">Nueva Colección</option>
              </select>
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
