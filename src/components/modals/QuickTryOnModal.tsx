import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import './QuickTryOnModal.css'
import { readDimensions } from '@/modules/experiencia/utils/photoRules'
import { TEXTO_FOTO, TRYON_ACCEPT, validarArchivoPrueba, validarDimensionesPrueba } from '@/modules/experiencia/utils/tryOnRules'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { ITEMS } from '@/modules/catalogo/mocks/items'
import { MOCK_PLAYLISTS } from '@/modules/catalogo/mocks/playlists'
import type { ItemResponseDto } from '@/modules/catalogo/types/item.dto'
import type { PlaylistDto } from '@/modules/catalogo/types/playlist.dto'
import {
  LOOK_SLOTS,
  SLOT_LABELS,
  type FailedOutfitItem,
  type LookSlot,
  type LookState,
  type UserMeasurements,
  type WornItem,
} from '@/modules/experiencia/types/look.dto'
import {
  clearLookFromStorage,
  evaluateGarmentFit,
  evaluatePlaylistOutfit,
  getLayerForGarment,
  getRecommendedSize,
  getSlotForGarment,
  getUserMeasurements,
  isGarmentFittable,
  loadLookFromStorage,
  saveLookToStorage,
} from '@/modules/experiencia/utils/lookEngine'
import {
  computeBodyDeformation,
  getBodyMeasurements,
} from '@/modules/experiencia/utils/bodyMeasurementsEngine'
import { AuthModal } from './AuthModal'

/* ---------- Filtros de color para capas del maniquí ---------- */
const COLOR_FILTERS: Record<string, string> = {
  blanco: 'none',
  celeste: 'sepia(1) hue-rotate(160deg) saturate(2.4) brightness(.9)',
  negro: 'brightness(.25) contrast(1.3)',
  hueso: 'sepia(.5) brightness(1.05)',
  carbon: 'brightness(.38)',
  camel: 'sepia(.9) hue-rotate(20deg) saturate(2) brightness(.85)',
  marino: 'sepia(1) hue-rotate(185deg) saturate(3) brightness(.55)',
  oliva: 'sepia(1) hue-rotate(60deg) saturate(1.8) brightness(.65)',
  cuero_negro: 'brightness(.3) contrast(1.4)',
  cuero_cafe: 'sepia(1) hue-rotate(10deg) saturate(2.2) brightness(.55)',
  gris: 'grayscale(1) brightness(.7)',
  vino: 'sepia(1) hue-rotate(300deg) saturate(2.6) brightness(.55)',
  default: 'none',
}

/* ---------- Rutas de capas del maniquí ---------- */
const LAYER_PATHS: Record<string, string> = {
  camisa: '/prototipo/assets/img/probador-capas/camisa.png',
  pantalon: '/prototipo/assets/img/probador-capas/pantalon.png',
  saco: '/prototipo/assets/img/probador-capas/saco.png',
  cuero: '/prototipo/assets/img/probador-capas/cuero.png',
  abrigo: '/prototipo/assets/img/probador-capas/abrigo.png',
  zapatos: '/prototipo/assets/img/probador-capas/zapatos.png',
  tenis: '/prototipo/assets/img/probador-capas/tenis.png',
  cinturon: '/prototipo/assets/img/probador-capas/cinturon.png',
  corbata: '/prototipo/assets/img/probador-capas/corbata.png',
  bufanda: '/prototipo/assets/img/probador-capas/bufanda.png',
  guantes: '/prototipo/assets/img/probador-capas/guantes.png',
}

/* Orden de renderizado Z (de atrás hacia adelante: capa interior a capa exterior) */
const LAYER_ORDER = [
  'zapatos',
  'tenis',
  'camisa',
  'pantalon',
  'cinturon',
  'corbata',
  'saco',
  'cuero',
  'abrigo',
  'bufanda',
  'guantes',
]

function money(n: number): string {
  return '$' + n.toLocaleString('es-CO')
}

interface QuickTryOnModalProps {
  isOpen: boolean
  onClose: () => void
  initialGarmentId?: string
}

export function QuickTryOnModal({ isOpen, onClose, initialGarmentId }: QuickTryOnModalProps) {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  /* Estado del look puesto */
  const [wearing, setWearing] = useState<LookState>(() => loadLookFromStorage())
  const [undoStack, setUndoStack] = useState<LookState[]>([])
  const [redoStack, setRedoStack] = useState<LookState[]>([])

  /* Estado de la cámara y vista del maniquí */
  const [rotationAngle, setRotationAngle] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showFitMap, setShowFitMap] = useState(false)
  const [compareItem, setCompareItem] = useState<{ item: ItemResponseDto; size1: string; size2: string } | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  /* Estado del panel lateral / drawer de selección */
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'catalogo' | 'playlists'>('catalogo')

  /* Filtros del catálogo dentro del drawer */
  const [catalogSearch, setCatalogSearch] = useState('')
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<string>('todos')
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('todas')
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>('todos')
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('todas')
  const [simulateOffline, setSimulateOffline] = useState(false)

  /* Modal de confirmación para reemplazar vs agregar en playlists */
  const [pendingPlaylist, setPendingPlaylist] = useState<PlaylistDto | null>(null)
  const [playlistNotice, setPlaylistNotice] = useState<{
    resumen: string
    fallidas: FailedOutfitItem[]
  } | null>(null)

  /* Modal de selección individual de prenda */
  const [garmentPickerItem, setGarmentPickerItem] = useState<ItemResponseDto | null>(null)
  const [pickerSelectedSize, setPickerSelectedSize] = useState<string>('')
  const [pickerSelectedColor, setPickerSelectedColor] = useState<string>('')

  /* Guardar look como playlist */
  const [showSaveLookModal, setShowSaveLookModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('')

  /* Medidas corporales desde el perfil y autenticación */
  const [showAuthModal, setShowAuthModal] = useState(false)
  const bodyMeasurements = useMemo(() => getBodyMeasurements(user?.id), [user?.id])
  const [pendingDeepLinkGarment, setPendingDeepLinkGarment] = useState<{ id: string; talla?: string; color?: string } | null>(null)

  /* Modo foto personal */
  const [sourceMode, setSourceMode] = useState<'mannequin' | 'photo'>('mannequin')
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [photoScale, setPhotoScale] = useState(1)
  const [photoOffset, setPhotoOffset] = useState({ x: 0, y: 0 })
  const fileRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  /* Dragging de rotación del maniquí */
  const isRotating = useRef(false)
  const rotateStart = useRef(0)

  /* Medidas del usuario */
  const userMeasurements = useMemo<UserMeasurements>(() => getUserMeasurements(), [])

  /* Guarda el look en storage cada vez que cambia */
  useEffect(() => {
    saveLookToStorage(wearing)
  }, [wearing])

  /* Notificación temporal (Toast) */
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev))
    }, 4000)
  }, [])

  /* Push a la historia de deshacer */
  const pushState = useCallback((next: LookState) => {
    setUndoStack((prev) => [...prev, wearing])
    setRedoStack([])
    setWearing(next)
  }, [wearing])

  /* Deshacer */
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    setUndoStack((s) => s.slice(0, -1))
    setRedoStack((s) => [...s, wearing])
    setWearing(prev)
    showToast('Acción deshecha')
  }, [undoStack, wearing, showToast])

  /* Rehacer */
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setRedoStack((s) => s.slice(0, -1))
    setUndoStack((s) => [...s, wearing])
    setWearing(next)
    showToast('Acción rehecha')
  }, [redoStack, wearing, showToast])

  /* Quitar prenda de un espacio */
  const removeGarment = useCallback((slot: LookSlot) => {
    pushState({
      ...wearing,
      [slot]: undefined,
    })
    showToast(`Prenda quitada de ${SLOT_LABELS[slot]}`)
  }, [wearing, pushState, showToast])

  /* Quitar todo */
  const resetAll = useCallback(() => {
    if (Object.values(wearing).filter(Boolean).length === 0) return
    pushState({})
    clearLookFromStorage()
    showToast('Look limpiado por completo')
  }, [wearing, pushState, showToast])

  /* Poner prenda directamente en el maniquí */
  const wearGarment = useCallback((item: ItemResponseDto, talla: string, color: string) => {
    const slot = getSlotForGarment(item)
    const layer = getLayerForGarment(item, slot)
    const fit = evaluateGarmentFit(item, talla)

    const worn: WornItem = {
      item,
      talla,
      color: color || item.color || 'default',
      veredicto: fit.veredicto,
      slot,
      layer,
    }

    const nextState: LookState = {
      ...wearing,
      [slot]: worn,
    }

    pushState(nextState)
    showToast(`${item.nombre} en talla ${talla} puesto en el maniquí`)
  }, [wearing, pushState, showToast])

  /* Carga de outfit desde Playlist */
  const applyPlaylist = useCallback((playlist: PlaylistDto, mode: 'replace' | 'merge') => {
    const rawItems = playlist.prendas.map((p) => ({
      item: p,
      talla: p.tallaSeleccionada,
      color: p.colorSeleccionado,
    }))

    const result = evaluatePlaylistOutfit(rawItems, userMeasurements)

    const baseState: LookState = mode === 'replace' ? {} : { ...wearing }
    for (const w of result.puestas) {
      baseState[w.slot] = w
    }

    pushState(baseState)
    setPendingPlaylist(null)
    setIsDrawerOpen(false)

    setPlaylistNotice({
      resumen: result.resumen,
      fallidas: result.fallidas,
    })
    showToast(result.resumen)
  }, [wearing, userMeasurements, pushState, showToast])

  /* Manejo de enlaces profundos (?prenda=ID&talla=T&color=C o ?playlist=ID) */
  const processedDeepLinkRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const prendaId = searchParams.get('prenda') || initialGarmentId
    const tallaParam = searchParams.get('talla')
    const colorParam = searchParams.get('color')
    const playlistId = searchParams.get('playlist')

    if (!prendaId && !playlistId) return

    const key = `${prendaId || ''}_${tallaParam || ''}_${colorParam || ''}_${playlistId || ''}_${user?.id || 'anon'}`
    if (processedDeepLinkRef.current === key) return

    if (playlistId) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === playlistId)
      if (pl) {
        processedDeepLinkRef.current = key
        applyPlaylist(pl, 'replace')
      }
      return
    }

    if (prendaId) {
      const item = ITEMS.find((it) => it.id === prendaId)
      if (item) {
        // Verificar si el usuario tiene sesión
        if (!user) {
          setPendingDeepLinkGarment({ id: prendaId, talla: tallaParam || undefined, color: colorParam || undefined })
          setShowAuthModal(true)
          return
        }

        processedDeepLinkRef.current = key
        const tallaFinal = tallaParam || getRecommendedSize(item, userMeasurements)
        const colorFinal = colorParam || item.color || 'default'
        wearGarment(item, tallaFinal, colorFinal)
      }
    }
  }, [isOpen, searchParams, initialGarmentId, user, userMeasurements, wearGarment, applyPlaylist])

  /* Escuchar inicio de sesión exitoso para reanudar prenda pendiente */
  useEffect(() => {
    const onLoginSuccess = () => {
      setShowAuthModal(false)
      if (pendingDeepLinkGarment) {
        const item = ITEMS.find((it) => it.id === pendingDeepLinkGarment.id)
        if (item) {
          const t = pendingDeepLinkGarment.talla || getRecommendedSize(item)
          wearGarment(item, t, pendingDeepLinkGarment.color || item.color || 'default')
          setPendingDeepLinkGarment(null)
        }
      }
    }
    window.addEventListener('sr:login-success', onLoginSuccess)
    return () => window.removeEventListener('sr:login-success', onLoginSuccess)
  }, [pendingDeepLinkGarment, wearGarment])

  /* Acciones principales del probador */
  const handlePickGarment = useCallback(() => {
    setDrawerTab('catalogo')
    setIsDrawerOpen(true)
  }, [])

  const handlePickPlaylist = useCallback(() => {
    setDrawerTab('playlists')
    setIsDrawerOpen(true)
  }, [])

  const handleAddSlot = useCallback((slot: LookSlot) => {
    setSelectedSlotFilter(slot)
    setDrawerTab('catalogo')
    setIsDrawerOpen(true)
  }, [])

  /* Tecla Escape para cerrar drawer o modal */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSaveLookModal) setShowSaveLookModal(false)
        else if (compareItem) setCompareItem(null)
        else if (showFitMap) setShowFitMap(false)
        else if (garmentPickerItem) setGarmentPickerItem(null)
        else if (isDrawerOpen) setIsDrawerOpen(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, isDrawerOpen, garmentPickerItem, showFitMap, compareItem, showSaveLookModal, onClose])

  /* Drag rotación con ratón y táctil */
  const handlePointerDownStage = (e: React.PointerEvent) => {
    if (sourceMode === 'photo') return
    isRotating.current = true
    rotateStart.current = e.clientX - rotationAngle
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const handlePointerMoveStage = (e: React.PointerEvent) => {
    if (!isRotating.current || sourceMode === 'photo') return
    const delta = e.clientX - rotateStart.current
    setRotationAngle(Math.max(-180, Math.min(180, delta)))
  }

  const handlePointerUpStage = () => {
    isRotating.current = false
  }

  /* Zoom controls */
  const zoomIn = () => setZoomLevel((z) => Math.min(1.6, z + 0.1))
  const zoomOut = () => setZoomLevel((z) => Math.max(0.7, z - 0.1))
  const resetCamera = () => {
    setZoomLevel(1)
    setRotationAngle(0)
  }

  /* Compartir imagen o enlace del look */
  const handleShareLook = () => {
    const garmentIds = Object.values(wearing)
      .filter(Boolean)
      .map((w) => w!.item.id)
      .join(',')
    const url = `${window.location.origin}/probador/arma-tu-look${garmentIds ? `?look=${encodeURIComponent(garmentIds)}` : ''}`
    navigator.clipboard?.writeText(url).catch(() => {})
    showToast('Enlace de look copiado al portapapeles sin datos personales')
  }

  /* Guardar look como playlist */
  const handleConfirmSaveLook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) return
    setShowSaveLookModal(false)
    setNewPlaylistName('')
    setNewPlaylistDesc('')
    showToast(`Look "${newPlaylistName.trim()}" guardado exitosamente como playlist`)
  }

  /* Foto de usuario */
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const bad = validarArchivoPrueba(file)
    if (bad) { setPhotoError(bad); return }
    const url = URL.createObjectURL(file)
    try {
      const { width, height } = await readDimensions(url)
      if (!validarDimensionesPrueba(width, height)) {
        setPhotoError(`${TEXTO_FOTO.dimensionesTitulo}. ${TEXTO_FOTO.dimensiones}`)
        return
      }
    } catch {
      setPhotoError(TEXTO_FOTO.ilegible); return
    } finally { URL.revokeObjectURL(url) }
    setPhotoError('')
    const reader = new FileReader()
    reader.onload = () => {
      setUserPhoto(reader.result as string)
      setSourceMode('photo')
      setPhotoScale(1)
      setPhotoOffset({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
  }, [])

  /* Prendas activas en el look */
  const wornList = Object.values(wearing).filter((w): w is WornItem => Boolean(w))
  const totalPrice = wornList.reduce((sum, w) => sum + w.item.precio, 0)
  const totalCount = wornList.length

  /* Lista de layers para renderizar ordenadas por Z */
  const activeLayers = wornList
    .map((w) => ({
      layer: w.layer,
      color: (w.color || '').toLowerCase(),
      zIndex: LAYER_ORDER.indexOf(w.layer),
    }))
    .filter((l) => l.zIndex >= 0 && LAYER_PATHS[l.layer])
    .sort((a, b) => a.zIndex - b.zIndex)

  /* Deformación y adaptación anatómica del maniquí */
  const deformation = useMemo(() => computeBodyDeformation(bodyMeasurements), [bodyMeasurements])

  /* Catálogo filtrado dentro del drawer */
  const filteredCatalog = useMemo(() => {
    return ITEMS.filter((item) => {
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase()
        const matchName = item.nombre.toLowerCase().includes(q)
        const matchStore = item.tienda.toLowerCase().includes(q)
        const matchStyle = (item.estilo || '').toLowerCase().includes(q)
        if (!matchName && !matchStore && !matchStyle) return false
      }
      if (selectedSlotFilter !== 'todos') {
        const slot = getSlotForGarment(item)
        if (slot !== selectedSlotFilter) return false
      }
      if (selectedStoreFilter !== 'todas') {
        if (item.tienda !== selectedStoreFilter) return false
      }
      if (selectedStyleFilter !== 'todos') {
        if (item.estilo !== selectedStyleFilter) return false
      }
      if (selectedSizeFilter !== 'todas') {
        if (!item.tallas?.includes(selectedSizeFilter)) return false
      }
      return true
    })
  }, [catalogSearch, selectedSlotFilter, selectedStoreFilter, selectedStyleFilter, selectedSizeFilter])

  /* Tiendas y estilos únicos para los filtros */
  const tiendasDisponibles = useMemo(() => Array.from(new Set(ITEMS.map((i) => i.tienda))), [])
  const estilosDisponibles = useMemo(() => Array.from(new Set(ITEMS.map((i) => i.estilo).filter(Boolean))), [])

  if (!isOpen) return null

  return (
    <div
      className="cz-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-label="Probador Virtual StyleRadar"
    >
      {/* ═══════════════════════════════════════════════════════════════
          1. BARRA SUPERIOR DE NAVEGACIÓN
          ═══════════════════════════════════════════════════════════════ */}
      <header className="cz-topbar" role="banner">
        <div className="cz-topbar-left">
          <button className="cz-nav-back" onClick={onClose} aria-label="Volver">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            VOLVER
          </button>
          <span className="cz-nav-sep" aria-hidden="true">/</span>
          <span className="cz-nav-crumb">INICIO</span>
          <span className="cz-nav-sep" aria-hidden="true">/</span>
          <span className="cz-nav-crumb cz-nav-active">PROBADOR</span>
          <span className="cz-nav-sep" aria-hidden="true">/</span>
          <span className="cz-nav-crumb cz-nav-accent">ARMA TU LOOK</span>
        </div>

        <div className="cz-topbar-right">
          {sourceMode === 'photo' ? (
            <button className="cz-nav-pill" onClick={() => setSourceMode('mannequin')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 119 9"/><path d="M3 21V12h9"/></svg>
              Volver al Maniquí
            </button>
          ) : (
            <>
              <button
                className="cz-nav-pill"
                onClick={() => setShowFitMap((v) => !v)}
                aria-pressed={showFitMap}
                title="Ver mapa de ajuste anatómico"
              >
                🗺️ Mapa de ajuste
              </button>
              <button
                className="cz-nav-pill"
                onClick={handleShareLook}
                title="Compartir look sin datos personales"
              >
                🔗 Compartir look
              </button>
            </>
          )}

          {totalCount > 0 && (
            <button
              className="cz-nav-pill cz-nav-pill-reset"
              onClick={resetAll}
              title="Quitar todas las prendas del look"
            >
              Quitar todo
            </button>
          )}
        </div>
      </header>

      {/* Banner de aviso para playlists */}
      {playlistNotice && (
        <div className="cz-playlist-alert-banner" role="status" aria-live="polite">
          <div className="cz-playlist-alert-content">
            <span className="cz-alert-icon">ℹ️</span>
            <span className="cz-alert-text">{playlistNotice.resumen}</span>
            {playlistNotice.fallidas.length > 0 && playlistNotice.fallidas[0].tallaSugerida && (
              <button
                className="cz-alert-fix-btn"
                onClick={() => {
                  const target = playlistNotice.fallidas[0]
                  wearGarment(target.item, target.tallaSugerida!, target.item.color || 'default')
                  setPlaylistNotice(null)
                }}
              >
                Cambiar a talla {playlistNotice.fallidas[0].tallaSugerida} y probar
              </button>
            )}
            <button
              className="cz-alert-dismiss-btn"
              onClick={() => setPlaylistNotice(null)}
              aria-label="Cerrar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Toast informativo */}
      {toastMessage && (
        <div className="cz-toast" role="alert" aria-live="assertive">
          {toastMessage}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          CUERPO PRINCIPAL: PANEL IZQUIERDO ("MI LOOK") + MANIQUÍ A LA DERECHA
          ═══════════════════════════════════════════════════════════════ */}
      <main className="cz-probador-body">
        {/* =========================================================
            PANEL IZQUIERDO: «MI LOOK»
            ========================================================= */}
        <aside className="cz-left-panel" aria-label="Mi look actual">
          <div className="cz-look-header">
            <div>
              <span className="cz-look-subtitle">Tu combinación actual</span>
              <h1 className="cz-look-title">Mi look</h1>
            </div>
            <div className="cz-history-actions">
              <button
                className="cz-history-btn"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                aria-label="Deshacer"
                title="Deshacer última acción"
              >
                ↶ Deshacer
              </button>
              <button
                className="cz-history-btn"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                aria-label="Rehacer"
                title="Rehacer acción"
              >
                ↷ Rehacer
              </button>
            </div>
          </div>

          {/* Botones de acción principales */}
          <div className="cz-primary-buttons-stack">
            <button
              className="cz-btn-primary-purple"
              onClick={handlePickGarment}
            >
              <span>✨</span>
              <span>Escoger prenda para probar</span>
            </button>

            <button
              className="cz-btn-secondary-glass"
              onClick={handlePickPlaylist}
            >
              <span>📑</span>
              <span>Escoger una playlist</span>
            </button>
          </div>

          {/* Lista de prendas agrupadas por espacio */}
          <div className="cz-slots-container" role="region" aria-label="Prendas por espacio">
            {LOOK_SLOTS.map((slot) => {
              const worn = wearing[slot]
              return (
                <div key={slot} className={`cz-slot-card ${worn ? 'cz-slot-card-occupied' : 'cz-slot-card-empty'}`}>
                  <div className="cz-slot-header">
                    <span className="cz-slot-badge">{SLOT_LABELS[slot]}</span>
                    {worn && (
                      <span className={`cz-fit-chip ${worn.veredicto.includes('perfecto') ? 'cz-fit-chip-perfect' : ''}`}>
                        {worn.veredicto}
                      </span>
                    )}
                  </div>

                  {worn ? (
                    <div className="cz-worn-item-body">
                      <img
                        src={worn.item.imagen}
                        alt={worn.item.nombre}
                        className="cz-worn-item-thumb"
                        loading="lazy"
                      />
                      <div className="cz-worn-item-details">
                        <span className="cz-worn-item-store">{worn.item.tienda}</span>
                        <h2 className="cz-worn-item-name">{worn.item.nombre}</h2>
                        <div className="cz-worn-item-meta">
                          <span className="cz-meta-tag">Talla: <strong>{worn.talla}</strong></span>
                          <span className="cz-meta-tag">Color: {worn.color}</span>
                          <span className="cz-meta-price">{money(worn.item.precio)}</span>
                        </div>

                        <div className="cz-worn-item-actions">
                          {worn.item.tallas && worn.item.tallas.length > 1 && (
                            <button
                              className="cz-action-link"
                              onClick={() => {
                                setGarmentPickerItem(worn.item)
                                setPickerSelectedSize(worn.talla)
                                setPickerSelectedColor(worn.color)
                              }}
                            >
                              Cambiar talla
                            </button>
                          )}
                          <button
                            className="cz-action-link cz-action-remove"
                            onClick={() => removeGarment(slot)}
                          >
                            Quitar
                          </button>
                          <Link
                            to={`/catalogo/${worn.item.id}`}
                            className="cz-action-link cz-action-store"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ver en la tienda →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="cz-empty-slot-placeholder">
                      <span className="cz-empty-slot-text">Sin prenda en espacio {SLOT_LABELS[slot].toLowerCase()}</span>
                      <button
                        className="cz-empty-slot-add-btn"
                        onClick={() => handleAddSlot(slot)}
                      >
                        + Agregar {SLOT_LABELS[slot].toLowerCase()}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Acciones de cierre del look */}
          <div className="cz-look-footer">
            <button
              className="cz-save-look-btn"
              disabled={totalCount === 0}
              onClick={() => setShowSaveLookModal(true)}
            >
              Guardar look como playlist
            </button>
          </div>
        </aside>

        {/* =========================================================
            STAGE DERECHO: MANIQUÍ + CONTROLES DE CÁMARA
            ========================================================= */}
        <section className="cz-stage-area" aria-label="Escenario del maniquí">
          <div className="cz-ambient-glow" aria-hidden="true" />

          {/* Maniquí central interactivo */}
          <div
            className="cz-mannequin-container"
            ref={canvasRef}
            onPointerDown={handlePointerDownStage}
            onPointerMove={handlePointerMoveStage}
            onPointerUp={handlePointerUpStage}
            style={{
              transform: `scale(${zoomLevel})`,
              cursor: isRotating.current ? 'grabbing' : 'grab',
            }}
          >
            {/* Regla métrica de altura vertical */}
            <div className="cz-metric-ruler" aria-hidden="true">
              <div className="cz-ruler-mark" style={{ bottom: '90%' }}>
                <span>2,10 m</span>
                <div className="cz-ruler-line" />
              </div>
              <div className="cz-ruler-mark" style={{ bottom: '78%' }}>
                <span>1,90 m</span>
                <div className="cz-ruler-line" />
              </div>
              <div className="cz-ruler-mark" style={{ bottom: '66%' }}>
                <span>1,70 m</span>
                <div className="cz-ruler-line" />
              </div>
              <div className="cz-ruler-mark" style={{ bottom: '54%' }}>
                <span>1,50 m</span>
                <div className="cz-ruler-line" />
              </div>
              <div className="cz-ruler-mark" style={{ bottom: '46%' }}>
                <span>1,40 m</span>
                <div className="cz-ruler-line" />
              </div>
            </div>

            {sourceMode === 'mannequin' ? (
              <div
                className="cz-mannequin-3d-wrapper"
                data-testid="mannequin-wrapper"
                style={{
                  transform: `rotateY(${rotationAngle}deg) scaleY(${deformation.heightScale}) scaleX(${deformation.chestScale})`,
                  transformOrigin: 'bottom center',
                  transition: isRotating.current ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Maniquí base adaptable */}
                <img
                  src={deformation.silhouetteSrc}
                  alt="Maniquí anatómico base"
                  className="cz-mannequin-base"
                  data-testid="mannequin-base-img"
                  draggable={false}
                />

                {/* Capas activas superpuestas */}
                {activeLayers.map(({ layer, color }) => (
                  <img
                    key={layer}
                    src={LAYER_PATHS[layer]}
                    alt=""
                    className="cz-mannequin-layer"
                    style={{
                      filter: COLOR_FILTERS[color] || 'none',
                      zIndex: LAYER_ORDER.indexOf(layer) + 10,
                    }}
                    draggable={false}
                  />
                ))}
              </div>
            ) : (
              userPhoto && (
                <img
                  src={userPhoto}
                  alt="Tu foto personal"
                  className="cz-user-photo"
                  style={{
                    transform: `translate(${photoOffset.x}px, ${photoOffset.y}px) scale(${photoScale})`,
                  }}
                  draggable={false}
                />
              )
            )}

            <div className="cz-floor-shadow" aria-hidden="true" />
          </div>

          {/* Píldora de precio flotante */}
          <div className="cz-price-pill" aria-live="polite">
            <span className="cz-price-amount">{money(totalPrice)}</span>
            <span className="cz-price-sep">·</span>
            <span className="cz-price-count">
              {totalCount}/5 PRENDAS{totalCount === 0 ? ' EN TU LOOK' : ''}
            </span>
          </div>

          {/* Controles de cámara y rotación */}
          <div className="cz-camera-controls" role="toolbar" aria-label="Controles de cámara del maniquí">
            <button
              className={`cz-camera-angle-btn ${rotationAngle === 0 ? 'active' : ''}`}
              onClick={() => setRotationAngle(0)}
              title="Vista de frente"
            >
              Frente
            </button>
            <button
              className={`cz-camera-angle-btn ${rotationAngle === 90 ? 'active' : ''}`}
              onClick={() => setRotationAngle(90)}
              title="Vista lateral"
            >
              Lado
            </button>
            <button
              className={`cz-camera-angle-btn ${rotationAngle === 180 ? 'active' : ''}`}
              onClick={() => setRotationAngle(180)}
              title="Vista posterior"
            >
              Espalda
            </button>
            <span className="cz-camera-divider" />
            <button className="cz-camera-zoom-btn" onClick={zoomIn} title="Acercar">+</button>
            <button className="cz-camera-zoom-btn" onClick={zoomOut} title="Alejar">−</button>
            <button className="cz-camera-reset-btn" onClick={resetCamera} title="Restablecer vista">
              Restablecer
            </button>
          </div>

          {/* Panel desplegable: Mapa de ajuste anatómico */}
          {showFitMap && (
            <div className="cz-fit-map-overlay" role="dialog" aria-label="Mapa de ajuste por zonas">
              <div className="cz-fit-map-card">
                <div className="cz-fit-map-header">
                  <h3>Mapa de ajuste anatómico</h3>
                  <button onClick={() => setShowFitMap(false)} aria-label="Cerrar mapa">✕</button>
                </div>
                <div className="cz-fit-zones-grid">
                  <div className="cz-fit-zone-row">
                    <span className="cz-zone-name">Tórax / Busto:</span>
                    <span className="cz-zone-val cz-zone-val-good">
                      {wearing.superior ? wearing.superior.veredicto : 'Sin prenda superior'}
                    </span>
                  </div>
                  <div className="cz-fit-zone-row">
                    <span className="cz-zone-name">Cintura:</span>
                    <span className="cz-zone-val cz-zone-val-good">
                      {wearing.inferior ? wearing.inferior.veredicto : 'Sin prenda inferior'}
                    </span>
                  </div>
                  <div className="cz-fit-zone-row">
                    <span className="cz-zone-name">Cadera y tiro:</span>
                    <span className="cz-zone-val">Ajuste anatómico regular</span>
                  </div>
                  <div className="cz-fit-zone-row">
                    <span className="cz-zone-name">Calzado:</span>
                    <span className="cz-zone-val">
                      {wearing.calzado ? `Talla ${wearing.calzado.talla} estándar` : 'Sin calzado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bloque para cargar foto personal */}
          <div className="cz-photo-toggle-bar">
            <input
              ref={fileRef}
              type="file"
              accept={TRYON_ACCEPT}
              className="sr-only"
              onChange={handlePhotoUpload}
              aria-label="Cargar foto personal"
            />
            <button
              className="cz-photo-sub-btn"
              onClick={() => fileRef.current?.click()}
            >
              📷 Probar con mi foto
            </button>
            {photoError && <p className="cz-photo-error">{photoError}</p>}
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          DRAWER LATERAL DE SELECCIÓN (CATÁLOGO Y PLAYLISTS)
          ═══════════════════════════════════════════════════════════════ */}
      {isDrawerOpen && (
        <div className="cz-drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <aside
            className="cz-drawer-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Seleccionar prendas del catálogo o playlists"
          >
            <div className="cz-drawer-header">
              <div className="cz-drawer-tabs" role="tablist">
                <button
                  role="tab"
                  aria-selected={drawerTab === 'catalogo'}
                  className={`cz-drawer-tab ${drawerTab === 'catalogo' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('catalogo')}
                >
                  Catálogo de tiendas
                </button>
                <button
                  role="tab"
                  aria-selected={drawerTab === 'playlists'}
                  className={`cz-drawer-tab ${drawerTab === 'playlists' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('playlists')}
                >
                  Playlists (Outfits)
                </button>
              </div>
              <button
                className="cz-drawer-close-btn"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Cerrar panel de selección"
              >
                ✕
              </button>
            </div>

            {/* PESTAÑA: CATÁLOGO */}
            {drawerTab === 'catalogo' && (
              <div className="cz-drawer-tab-content">
                {/* Barra de búsqueda y filtros */}
                <div className="cz-catalog-filters-bar">
                  <div className="cz-search-field-wrap">
                    <input
                      type="search"
                      placeholder="Buscar por prenda, tienda o estilo…"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="cz-search-input"
                      aria-label="Buscar prenda en catálogo"
                    />
                  </div>

                  <div className="cz-filter-selects-row">
                    <select
                      value={selectedSlotFilter}
                      onChange={(e) => setSelectedSlotFilter(e.target.value)}
                      className="cz-filter-select"
                      aria-label="Filtrar por categoría de prenda"
                    >
                      <option value="todos">Todas las categorías</option>
                      <option value="superior">Superior (Camisas, Buzos)</option>
                      <option value="inferior">Inferior (Pantalones, Jeans)</option>
                      <option value="abrigo">Abrigo (Chaquetas, Sacos)</option>
                      <option value="calzado">Calzado (Zapatos, Tenis)</option>
                      <option value="accesorios">Accesorios</option>
                    </select>

                    <select
                      value={selectedStoreFilter}
                      onChange={(e) => setSelectedStoreFilter(e.target.value)}
                      className="cz-filter-select"
                      aria-label="Filtrar por tienda aliada"
                    >
                      <option value="todas">Todas las tiendas</option>
                      {tiendasDisponibles.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    <select
                      value={selectedStyleFilter}
                      onChange={(e) => setSelectedStyleFilter(e.target.value)}
                      className="cz-filter-select"
                      aria-label="Filtrar por estilo"
                    >
                      <option value="todos">Todos los estilos</option>
                      {estilosDisponibles.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grid de prendas del catálogo */}
                {simulateOffline ? (
                  <div className="cz-empty-state-box" role="alert">
                    <span className="cz-empty-icon">⚠️</span>
                    <h3>Sin conexión</h3>
                    <p>No pudimos cargar el catálogo. Revisa tu conexión a internet.</p>
                    <button className="cz-retry-btn" onClick={() => setSimulateOffline(false)}>
                      Reintentar
                    </button>
                  </div>
                ) : filteredCatalog.length === 0 ? (
                  <div className="cz-empty-state-box">
                    <span className="cz-empty-icon">🔍</span>
                    <h3>No encontramos prendas</h3>
                    <p>Intenta ajustar tus filtros de búsqueda o categoría.</p>
                    <button
                      className="cz-clear-filters-btn"
                      onClick={() => {
                        setCatalogSearch('')
                        setSelectedSlotFilter('todos')
                        setSelectedStoreFilter('todas')
                        setSelectedStyleFilter('todos')
                        setSelectedSizeFilter('todas')
                      }}
                    >
                      Limpiar filtros
                    </button>
                  </div>
                ) : (
                  <div className="cz-catalog-grid" role="grid">
                    {filteredCatalog.map((item) => {
                      const fittable = isGarmentFittable(item)
                      const recSize = fittable ? getRecommendedSize(item, userMeasurements) : ''
                      const slot = getSlotForGarment(item)
                      const isWorn = wearing[slot]?.item.id === item.id

                      return (
                        <div
                          key={item.id}
                          className={`cz-catalog-card ${!fittable ? 'cz-card-unfittable' : ''} ${isWorn ? 'cz-card-worn' : ''}`}
                        >
                          <div className="cz-card-img-wrap">
                            <img src={item.imagen} alt={item.nombre} loading="lazy" />
                            {!fittable && (
                              <span className="cz-unfittable-badge">
                                No disponible en el probador
                              </span>
                            )}
                            {isWorn && (
                              <span className="cz-worn-badge">✓ Puesta</span>
                            )}
                          </div>

                          <div className="cz-card-info">
                            <span className="cz-card-store">{item.tienda}</span>
                            <h4 className="cz-card-name">{item.nombre}</h4>
                            <span className="cz-card-price">{money(item.precio)}</span>

                            {fittable && recSize && (
                              <span className="cz-recommended-tag">
                                Talla sugerida: <strong>{recSize}</strong>
                              </span>
                            )}

                            <div className="cz-card-footer-actions">
                              {fittable ? (
                                <button
                                  className="cz-select-garment-btn"
                                  onClick={() => {
                                    setGarmentPickerItem(item)
                                    setPickerSelectedSize(recSize || item.tallas[0] || 'M')
                                    setPickerSelectedColor(item.color || 'default')
                                  }}
                                >
                                  Probar en el maniquí
                                </button>
                              ) : (
                                <span className="cz-no-fit-label">Sin tabla de medidas</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA: PLAYLISTS */}
            {drawerTab === 'playlists' && (
              <div className="cz-drawer-tab-content">
                <div className="cz-playlists-list">
                  {MOCK_PLAYLISTS.map((pl) => (
                    <div key={pl.id} className="cz-playlist-row-card">
                      <img
                        src={pl.portadaUrl || pl.prendas[0]?.imagen}
                        alt={pl.nombre}
                        className="cz-playlist-row-thumb"
                      />
                      <div className="cz-playlist-row-info">
                        <h4 className="cz-playlist-row-title">{pl.nombre}</h4>
                        <p className="cz-playlist-row-desc">{pl.descripcion}</p>
                        <span className="cz-playlist-row-meta">
                          Por {pl.creador.nombre} · {pl.prendas.length} prendas
                        </span>

                        {/* Muestra prendas de la playlist */}
                        <div className="cz-playlist-items-preview">
                          {pl.prendas.map((pr) => (
                            <span
                              key={pr.id}
                              className={`cz-mini-item-pill ${pr.noDisponible || pr.retirada ? 'cz-mini-item-retired' : ''}`}
                            >
                              {pr.nombre}
                              {pr.noDisponible || pr.retirada ? ' (Ya no está disponible)' : ''}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="cz-playlist-row-actions">
                        <button
                          className="cz-btn-try-outfit"
                          onClick={() => {
                            if (totalCount > 0) {
                              setPendingPlaylist(pl)
                            } else {
                              applyPlaylist(pl, 'replace')
                            }
                          }}
                        >
                          Probar outfit completo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: SELECTOR DE TALLA Y COLOR ANTES DE PROBAR
          ═══════════════════════════════════════════════════════════════ */}
      {garmentPickerItem && (
        <div className="cz-submodal-backdrop" onClick={() => setGarmentPickerItem(null)}>
          <div
            className="cz-submodal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Elegir talla y color para ${garmentPickerItem.nombre}`}
          >
            <div className="cz-submodal-header">
              <h3>{garmentPickerItem.nombre}</h3>
              <button onClick={() => setGarmentPickerItem(null)} aria-label="Cerrar selector">✕</button>
            </div>
            <p className="cz-submodal-store">{garmentPickerItem.tienda} · {money(garmentPickerItem.precio)}</p>

            <div className="cz-submodal-section">
              <label className="cz-submodal-label">Selecciona tu talla:</label>
              <div className="cz-sizes-picker-grid">
                {garmentPickerItem.tallas.map((t) => {
                  const rec = getRecommendedSize(garmentPickerItem, userMeasurements)
                  const isRec = t === rec
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`cz-size-btn ${pickerSelectedSize === t ? 'active' : ''}`}
                      onClick={() => setPickerSelectedSize(t)}
                    >
                      {t} {isRec ? '★' : ''}
                    </button>
                  )
                })}
              </div>
            </div>

            {garmentPickerItem.coloresDisponibles && garmentPickerItem.coloresDisponibles.length > 1 && (
              <div className="cz-submodal-section">
                <label className="cz-submodal-label">Color disponible:</label>
                <div className="cz-colors-picker-row">
                  {garmentPickerItem.coloresDisponibles.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`cz-color-btn ${pickerSelectedColor === c ? 'active' : ''}`}
                      onClick={() => setPickerSelectedColor(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="cz-btn-confirm-wear"
              onClick={() => {
                wearGarment(
                  garmentPickerItem,
                  pickerSelectedSize || garmentPickerItem.tallas[0] || 'M',
                  pickerSelectedColor || garmentPickerItem.color || 'default',
                )
                setGarmentPickerItem(null)
                setIsDrawerOpen(false)
              }}
            >
              Confirmar y probar en el maniquí
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: REEMPLAZAR VS AGREGAR OUTFIT DE PLAYLIST
          ═══════════════════════════════════════════════════════════════ */}
      {pendingPlaylist && (
        <div className="cz-submodal-backdrop" onClick={() => setPendingPlaylist(null)}>
          <div
            className="cz-submodal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Confirmación para probar outfit de playlist"
          >
            <h3>¿Cómo quieres probar esta playlist?</h3>
            <p className="cz-confirm-text">
              Ya tienes {totalCount} prendas en tu look actual. Puedes reemplazar tu combinación o mezclar las prendas compatibles.
            </p>
            <div className="cz-confirm-buttons-col">
              <button
                className="cz-btn-confirm-replace"
                onClick={() => applyPlaylist(pendingPlaylist, 'replace')}
              >
                Reemplazar mi look actual
              </button>
              <button
                className="cz-btn-confirm-merge"
                onClick={() => applyPlaylist(pendingPlaylist, 'merge')}
              >
                Agregar a mi look
              </button>
              <button
                className="cz-btn-confirm-cancel"
                onClick={() => setPendingPlaylist(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: GUARDAR LOOK COMO PLAYLIST
          ═══════════════════════════════════════════════════════════════ */}
      {showSaveLookModal && (
        <div className="cz-submodal-backdrop" onClick={() => setShowSaveLookModal(false)}>
          <div
            className="cz-submodal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Guardar look como playlist"
          >
            <h3>Guardar look como playlist</h3>
            <p className="cz-confirm-text">
              Crea una playlist pública o personal con las {totalCount} prendas de tu combinación.
            </p>
            <form onSubmit={handleConfirmSaveLook} className="cz-save-playlist-form">
              <input
                type="text"
                placeholder="Nombre del outfit (ej. Noche en Chapinero)"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                required
                className="cz-input-text"
              />
              <textarea
                placeholder="Descripción opcional…"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                rows={3}
                className="cz-input-textarea"
              />
              <button type="submit" className="cz-btn-confirm-replace">
                Guardar playlist
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de autenticación */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialTab="login"
        />
      )}
    </div>
  )
}
