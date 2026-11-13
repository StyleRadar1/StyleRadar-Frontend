import { useState, useMemo, useContext, useEffect, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/modules/core/design-system'
import { ErrorState } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { mockSessionUser } from '@/modules/core/api/mock'
import { usePlaylists } from '../hooks/usePlaylists'
import { ITEMS } from '../mocks/items'
import { MAX_PLAYLIST_ITEMS, type PlaylistDto, type PlaylistVisibility } from '../types/playlist.dto'
import './PlaylistsPage.css'

export default function PlaylistsPage() {
  const { id: urlId } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  const user = auth?.user ?? mockSessionUser()

  const {
    playlists,
    error,
    reload,
    createPlaylist,
    addItem,
    removeItem,
    like,
  } = usePlaylists()

  // Estado de selección local o por URL
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null)
  const activeId = urlId || selectedLocalId

  // Toasts y mensajes
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  // Modales
  const [mostrarCrear, setMostrarCrear] = useState(false)
  const [mostrarEditar, setMostrarEditar] = useState(false)
  const [mostrarAgregarPrenda, setMostrarAgregarPrenda] = useState(false)
  const [mostrarEliminar, setMostrarEliminar] = useState(false)

  // Campos formulario
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [visibilidad, setVisibilidad] = useState<PlaylistVisibility>('PRIVADA')
  const [errorCrear, setErrorCrear] = useState<string | null>(null)
  const [prendaParaAgregar, setPrendaParaAgregar] = useState<string>('')

  // Like y guardado local para playlist activa
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({})
  const [userSaved, setUserSaved] = useState<Record<string, boolean>>({
    '3': true,
    'pl-2': true,
  })

  // Estado del carrusel 3D
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [carouselTab, setCarouselTab] = useState<'todas' | 'creadas' | 'guardadas'>('todas')

  const usuarioActual = user ?? { id: 'u-1', name: 'Valentina R.', email: 'usuario@styleradar.co' }
  const usuarioEmail = (user && 'email' in user ? (user as { email?: string }).email : undefined) ?? 'usuario@styleradar.co'

  const showToast = (msg: string) => {
    setMensajeExito(msg)
    setTimeout(() => setMensajeExito(null), 3500)
  }

  // Playlist seleccionada actualmente
  const selectedPlaylist = useMemo(() => {
    if (!activeId) return null
    const norm = activeId.replace(/^p/, '')
    return (
      playlists.find(
        (p) =>
          p.id === activeId ||
          p.id.replace(/^p/, '') === norm ||
          (activeId === 'u-weekend' && p.nombre.toLowerCase().includes('usaquén')) ||
          (activeId === '3' && p.nombre.toLowerCase().includes('oficina'))
      ) ?? null
    )
  }, [playlists, activeId])

  // Playlists creadas por la usuaria
  const creadasPorTi = useMemo(() => {
    return playlists.filter(
      (p) =>
        !p.esGuardada &&
        (p.creador?.email === usuarioEmail ||
          p.creador?.id === usuarioActual.id ||
          p.creador?.nombre.toLowerCase().includes('valentina'))
    )
  }, [playlists, usuarioEmail, usuarioActual.id])

  // Playlists guardadas
  const guardadas = useMemo(() => {
    return playlists.filter(
      (p) =>
        p.esGuardada ||
        userSaved[p.id] ||
        (p.creador?.email !== usuarioEmail &&
          !p.creador?.nombre.toLowerCase().includes('valentina'))
    )
  }, [playlists, userSaved, usuarioEmail])

  // Lista activa para el carrusel 3D según la pestaña seleccionada
  const carouselPlaylists = useMemo(() => {
    if (carouselTab === 'creadas') return creadasPorTi
    if (carouselTab === 'guardadas') return guardadas
    return playlists
  }, [carouselTab, creadasPorTi, guardadas, playlists])

  // Clamp carouselIndex si cambia el tamaño de la lista
  useEffect(() => {
    if (carouselIndex >= carouselPlaylists.length) {
      setCarouselIndex(Math.max(0, carouselPlaylists.length - 1))
    }
  }, [carouselPlaylists.length, carouselIndex])

  const handlePrev = useCallback(() => {
    if (carouselPlaylists.length === 0) return
    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : carouselPlaylists.length - 1))
  }, [carouselPlaylists.length])

  const handleNext = useCallback(() => {
    if (carouselPlaylists.length === 0) return
    setCarouselIndex((prev) => (prev < carouselPlaylists.length - 1 ? prev + 1 : 0))
  }, [carouselPlaylists.length])

  // Navegación por teclado y en el vinilo interactivo
  const STEP_DEGREES = 45
  const [vinylStepIndex, setVinylStepIndex] = useState(0)
  const [stepDirection, setStepDirection] = useState<1 | -1>(1)
  const [vinylRotation, setVinylRotation] = useState(0)
  const [isDraggingVinyl, setIsDraggingVinyl] = useState(false)
  const [isSnappingVinyl, setIsSnappingVinyl] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const discRef = useRef<HTMLDivElement | null>(null)
  const didDragVinylRef = useRef(false)
  const lastWheelTimeRef = useRef(0)
  const dragSessionRef = useRef({
    active: false,
    lastAngle: 0,
    startRotation: 0,
    currentRotation: 0,
    baseStepIndex: 0,
    lastStepDelta: 0,
    velocity: 0,
    lastTime: 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  const stepVinylPlaylist = useCallback(
    (dir: 1 | -1) => {
      if (carouselPlaylists.length === 0) return
      setStepDirection(dir)
      setIsSnappingVinyl(true)
      setVinylRotation((prev) => prev + dir * STEP_DEGREES)
      setVinylStepIndex((prev) => {
        const total = carouselPlaylists.length
        return ((prev + dir) % total + total) % total
      })
      window.setTimeout(() => setIsSnappingVinyl(false), 500)
    },
    [carouselPlaylists.length]
  )

  const jumpToVinylPlaylist = useCallback(
    (targetIdx: number) => {
      if (carouselPlaylists.length === 0) return
      const total = carouselPlaylists.length
      const currentNorm = ((vinylStepIndex % total) + total) % total
      const diff = targetIdx - currentNorm
      if (diff === 0) return
      setStepDirection(diff > 0 ? 1 : -1)
      setIsSnappingVinyl(true)
      setVinylRotation((prev) => prev + diff * STEP_DEGREES)
      setVinylStepIndex(((targetIdx % total) + total) % total)
      window.setTimeout(() => setIsSnappingVinyl(false), 500)
    },
    [carouselPlaylists.length, vinylStepIndex]
  )

  const getAngleFromDiscCenter = (clientX: number, clientY: number) => {
    const rect = discRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI)
  }

  const handleVinylPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const startAngle = getAngleFromDiscCenter(e.clientX, e.clientY)
    didDragVinylRef.current = false
    setIsSnappingVinyl(false)
    setIsDraggingVinyl(true)
    dragSessionRef.current = {
      active: true,
      lastAngle: startAngle,
      startRotation: vinylRotation,
      currentRotation: vinylRotation,
      baseStepIndex: vinylStepIndex,
      lastStepDelta: 0,
      velocity: 0,
      lastTime: performance.now(),
    }
  }

  const handleVinylPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragSessionRef.current.active) return
    const angle = getAngleFromDiscCenter(e.clientX, e.clientY)
    let delta = angle - dragSessionRef.current.lastAngle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360

    const now = performance.now()
    const dt = Math.max(8, now - dragSessionRef.current.lastTime)
    dragSessionRef.current.velocity = delta / dt
    dragSessionRef.current.lastAngle = angle
    dragSessionRef.current.lastTime = now

    const nextRotation = dragSessionRef.current.currentRotation + delta
    dragSessionRef.current.currentRotation = nextRotation

    if (Math.abs(nextRotation - dragSessionRef.current.startRotation) > 2.5) {
      didDragVinylRef.current = true
    }

    setVinylRotation(nextRotation)

    const stepDelta = Math.round(
      (nextRotation - dragSessionRef.current.startRotation) / STEP_DEGREES
    )
    if (
      stepDelta !== dragSessionRef.current.lastStepDelta &&
      carouselPlaylists.length > 0
    ) {
      const diff = stepDelta - dragSessionRef.current.lastStepDelta
      setStepDirection(diff >= 0 ? 1 : -1)
      dragSessionRef.current.lastStepDelta = stepDelta
      const total = carouselPlaylists.length
      const nextIndex =
        (((dragSessionRef.current.baseStepIndex + stepDelta) % total) + total) %
        total
      setVinylStepIndex(nextIndex)
    }
  }

  const handleVinylPointerUp = () => {
    if (!dragSessionRef.current.active) return
    dragSessionRef.current.active = false
    setIsDraggingVinyl(false)

    const inertia = prefersReducedMotion
      ? 0
      : Math.max(-90, Math.min(90, dragSessionRef.current.velocity * 135))
    const projected = dragSessionRef.current.currentRotation + inertia
    const snappedStepDelta = Math.round(
      (projected - dragSessionRef.current.startRotation) / STEP_DEGREES
    )
    const snappedRotation =
      dragSessionRef.current.startRotation + snappedStepDelta * STEP_DEGREES

    setIsSnappingVinyl(true)
    setVinylRotation(snappedRotation)

    if (
      snappedStepDelta !== dragSessionRef.current.lastStepDelta &&
      carouselPlaylists.length > 0
    ) {
      const diff = snappedStepDelta - dragSessionRef.current.lastStepDelta
      setStepDirection(diff >= 0 ? 1 : -1)
      const total = carouselPlaylists.length
      const nextIndex =
        (((dragSessionRef.current.baseStepIndex + snappedStepDelta) % total) +
          total) %
        total
      setVinylStepIndex(nextIndex)
    }

    window.setTimeout(() => {
      didDragVinylRef.current = false
      setIsSnappingVinyl(false)
    }, 520)
  }

  const handleVinylWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const now = performance.now()
    if (now - lastWheelTimeRef.current < 240) return
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
    if (Math.abs(delta) < 6) return
    lastWheelTimeRef.current = now
    stepVinylPlaylist(delta > 0 ? 1 : -1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedPlaylist) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowLeft') {
        handlePrev()
        stepVinylPlaylist(-1)
      } else if (e.key === 'ArrowRight') {
        handleNext()
        stepVinylPlaylist(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedPlaylist, handlePrev, handleNext, stepVinylPlaylist])

  // Otras playlists para sección "Más playlists de estilo"
  const otrasPlaylists = useMemo(() => {
    return playlists
      .filter((p) => p.id !== selectedPlaylist?.id)
      .slice(0, 4)
  }, [playlists, selectedPlaylist?.id])

  // Grupo de 3 polaroids visibles que rota en loop por la lista filtrada (Todas / Creadas por ti / Guardadas)
  const polaroidSlots = useMemo(() => {
    const total = carouselPlaylists.length
    if (total === 0) return []
    const count = Math.min(3, total)
    const items: { playlist: PlaylistDto; slot: 0 | 1 | 2; baseRotate: number }[] = []
    const rotations = [-13, 14, -10] as const
    for (let i = 0; i < count; i++) {
      const idx = (((vinylStepIndex + i) % total) + total) % total
      items.push({
        playlist: carouselPlaylists[idx],
        slot: i as 0 | 1 | 2,
        baseRotate: rotations[i],
      })
    }
    return items
  }, [carouselPlaylists, vinylStepIndex])

  const polaroidSlotClasses = [
    'sr-polaroid-card sr-polaroid-card--slot-0',
    'sr-polaroid-card sr-polaroid-card--slot-1',
    'sr-polaroid-card sr-polaroid-card--slot-2',
  ] as const

  const esMia = useMemo(() => {
    if (!selectedPlaylist) return false
    return (
      selectedPlaylist.creador?.email === usuarioEmail ||
      selectedPlaylist.creador?.id === usuarioActual.id ||
      selectedPlaylist.creador?.nombre.toLowerCase().includes('valentina')
    )
  }, [selectedPlaylist, usuarioEmail, usuarioActual.id])

  const handleSeleccionarPlaylist = (p: PlaylistDto) => {
    setSelectedLocalId(p.id)
    navigate(`/playlists/${p.id}`)
  }

  const handleVolver = () => {
    setSelectedLocalId(null)
    navigate('/playlists')
  }

  const handleCrear = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!nombre.trim()) {
      setErrorCrear('Escribe el nombre de la playlist.')
      return
    }
    setErrorCrear(null)
    try {
      const nueva = await createPlaylist({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        visibilidad,
        portadaUrl: '/img/productos/sueter-de-canale-crudo.jpg',
        prendaIds: [],
      })
      setMostrarCrear(false)
      setNombre('')
      setDescripcion('')
      setVisibilidad('PRIVADA')
      showToast('Playlist creada con éxito. Ahora puedes agregar hasta 15 prendas.')
      handleSeleccionarPlaylist(nueva)
    } catch (er: unknown) {
      setErrorCrear(er instanceof Error ? er.message : 'No se pudo crear la playlist.')
    }
  }

  const handleAbrirEditar = () => {
    if (!selectedPlaylist) return
    setNombre(selectedPlaylist.nombre)
    setDescripcion(selectedPlaylist.descripcion)
    setVisibilidad(selectedPlaylist.visibilidad)
    setMostrarEditar(true)
  }

  const handleGuardarEditar = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!selectedPlaylist || !nombre.trim()) return
    selectedPlaylist.nombre = nombre.trim()
    selectedPlaylist.descripcion = descripcion.trim()
    selectedPlaylist.visibilidad = visibilidad
    setMostrarEditar(false)
    showToast('Playlist actualizada con éxito.')
  }

  const handleEliminarPlaylist = () => {
    setMostrarEliminar(true)
  }

  const handleConfirmarEliminar = () => {
    if (!selectedPlaylist) return
    const id = selectedPlaylist.id
    const index = playlists.findIndex((p) => p.id === id)
    if (index !== -1) {
      playlists.splice(index, 1)
    }
    setMostrarEliminar(false)
    showToast(`Playlist «${selectedPlaylist.nombre}» eliminada.`)
    handleVolver()
  }

  const handleAgregarPrenda = async () => {
    if (!selectedPlaylist || !prendaParaAgregar) return
    try {
      await addItem(selectedPlaylist.id, prendaParaAgregar)
      setPrendaParaAgregar('')
      setMostrarAgregarPrenda(false)
      showToast('Prenda agregada a la playlist.')
    } catch (er: unknown) {
      setErrorAccion(er instanceof Error ? er.message : 'Error al agregar la prenda.')
    }
  }

  const handleQuitarPrenda = async (itemId: string) => {
    if (!selectedPlaylist) return
    try {
      await removeItem(selectedPlaylist.id, itemId)
      showToast('Prenda quitada de la playlist.')
    } catch (er: unknown) {
      setErrorAccion(er instanceof Error ? er.message : 'Error al quitar la prenda.')
    }
  }

  const handleLike = () => {
    if (!selectedPlaylist) return
    const cur = userLikes[selectedPlaylist.id]
    setUserLikes((prev) => ({ ...prev, [selectedPlaylist.id]: !cur }))
    if (!cur) {
      selectedPlaylist.likes += 1
      like(selectedPlaylist.id)
      showToast('Te gusta esta playlist.')
    } else {
      selectedPlaylist.likes = Math.max(0, selectedPlaylist.likes - 1)
      showToast('Ya no te gusta esta playlist.')
    }
  }

  const handleGuardar = () => {
    if (!selectedPlaylist) return
    const isSaved = userSaved[selectedPlaylist.id]
    setUserSaved((prev) => ({ ...prev, [selectedPlaylist.id]: !isSaved }))
    selectedPlaylist.esGuardada = !isSaved
    selectedPlaylist.guardados += !isSaved ? 1 : -1
    showToast(!isSaved ? 'Guardada en Mis playlists.' : 'Quitada de tu perfil.')
  }

  const handleMezclar = () => {
    if (!selectedPlaylist) return
    selectedPlaylist.prendas = [...selectedPlaylist.prendas].sort(() => Math.random() - 0.5)
    showToast('Playlist mezclada.')
  }

  const handleCompartir = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {})
    }
    showToast('Enlace copiado para compartir.')
  }

  if (error) return <ErrorState error={error} onRetry={reload} />

  // ==========================================
  // VISTA DETALLE TIPO SPOTIFY CON DISCO DE VINILO PROTAGONISTA
  // ==========================================
  if (selectedPlaylist) {
    const prendas = selectedPlaylist.prendas || []
    const disponibles = prendas.filter((p) => !p.noDisponible)
    const noDisponibles = prendas.filter((p) => p.noDisponible)
    const totalDisponible = disponibles.reduce((acc, p) => acc + p.precio, 0)
    const tiendasUnicas = Array.from(new Set(prendas.map((p) => p.tienda)))
    const isLiked = userLikes[selectedPlaylist.id]
    const isSaved = userSaved[selectedPlaylist.id] || selectedPlaylist.esGuardada

    return (
      <section
        role="dialog"
        aria-modal="false"
        aria-label={`Detalle de ${selectedPlaylist.nombre}`}
        className="min-h-screen bg-transparent text-[var(--sr-hero-text)] px-4 py-8 sm:px-8 selection:bg-violeta selection:text-white"
      >
        <style>{`
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-vinyl {
            animation: spinSlow 18s linear infinite;
          }
        `}</style>

        <div className="mx-auto max-w-6xl">
          {/* Barra de migas de pan y botón Volver */}
          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[var(--sr-hero-text-muted)]">
            <button
              type="button"
              onClick={handleVolver}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)]/40 px-3 py-1.5 text-[var(--sr-hero-text)] transition hover:bg-[var(--sr-surface)]"
            >
              ← Volver
            </button>
            <span>·</span>
            <Link to="/" className="hover:text-[var(--sr-hero-text)]">Inicio</Link>
            <span>/</span>
            <button type="button" onClick={handleVolver} className="hover:text-[var(--sr-hero-text)]">
              Playlists
            </button>
            <span>/</span>
            <span className="text-[var(--sr-hero-text)] truncate max-w-xs">{selectedPlaylist.nombre}</span>
          </div>

          {/* Feedback Toast */}
          {mensajeExito && (
            <div role="status" className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200 backdrop-blur-md">
              {mensajeExito}
            </div>
          )}

          {/* BANNER PRINCIPAL HERO TIPO SPOTIFY CON VINILO PROTAGONISTA */}
          <div className="relative rounded-3xl border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)]/40 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -right-24 -top-24 w-96 h-96 bg-[#5013b8]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col gap-8 lg:flex-row lg:items-end">
              {/* Estuche de vinilo: Carátula + Disco saliendo con animación */}
              <div className="relative flex items-center shrink-0 pr-12 sm:pr-24 self-center lg:self-end">
                {/* Disco de vinilo con centro morado */}
                <div
                  className="absolute left-[38%] sm:left-[45%] w-44 h-44 sm:w-56 sm:h-56 z-0 drop-shadow-[0_15px_35px_rgba(80,19,184,0.65)] pointer-events-none animate-spin-vinyl"
                >
                  <img
                    src="/img/vinyl-record.png"
                    alt="Disco de vinilo StyleRadar"
                    className="h-full w-full object-contain select-none"
                  />
                </div>

                {/* Carátula del álbum */}
                <div className="relative z-10 h-48 w-48 sm:h-56 sm:w-56 shrink-0 overflow-hidden rounded-2xl bg-[#e8dccb] shadow-[0_25px_50px_rgba(0,0,0,0.85)] border border-white/20 flex items-center justify-center">
                  {selectedPlaylist.portadaUrl ? (
                    <img
                      src={selectedPlaylist.portadaUrl}
                      alt={`Portada de ${selectedPlaylist.nombre}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-black/30 font-bold">SR</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/10 pointer-events-none" />
                </div>
              </div>

              {/* Información y acciones */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-bold tracking-widest uppercase text-white/50">
                    PLAYLIST DE ESTILO · {selectedPlaylist.visibilidad === 'PRIVADA' ? '🔒 PRIVADA' : '👁️ PÚBLICA'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violeta/20 border border-violeta/40 px-2.5 py-0.5 text-[0.625rem] font-bold text-violeta-claro">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En tornamesa
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-3">
                  {selectedPlaylist.nombre}
                </h1>

                {/* Creador / Curador */}
                <div className="flex items-center gap-2.5 text-sm font-semibold text-white/80 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violeta text-[0.6875rem] font-bold text-white shadow-sm">
                    {selectedPlaylist.creador.nombre
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2) || 'VR'}
                  </span>
                  <span>
                    {selectedPlaylist.creador.nombre}
                    {esMia && <span className="text-white/40 font-normal"> · tú</span>}
                  </span>
                </div>

                {/* Métricas e información RNF-12 */}
                <div className="text-xs sm:text-sm text-white/50 space-x-1.5 mb-3">
                  <span className="font-semibold text-white/80">
                    {prendas.length}/15 prendas
                  </span>
                  <span className="text-white/30 font-mono">(RNF-12)</span>
                  <span>·</span>
                  <span>{formatCOP(totalDisponible)} disponibles</span>
                  <span>·</span>
                  <span>
                    {tiendasUnicas.length} {tiendasUnicas.length === 1 ? 'tienda' : 'tiendas'}
                  </span>
                  <span>·</span>
                  <span>{selectedPlaylist.likes.toLocaleString('es-CO')} me gusta</span>
                  <span>·</span>
                  <span>actualizada {selectedPlaylist.actualizada || 'hace 1 semana'}</span>
                </div>

                {/* Descripción */}
                {selectedPlaylist.descripcion && (
                  <p className="text-sm text-white/70 max-w-2xl mb-6 leading-relaxed">
                    {selectedPlaylist.descripcion}
                  </p>
                )}

                {/* FILA DE ACCIONES DIFERENCIADA SI ES MÍA O NO */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {esMia ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setMostrarAgregarPrenda(true)}
                        className="flex items-center gap-2 rounded-full bg-[#5013b8] hover:bg-[#6318e3] text-white text-xs font-bold px-6 py-2.5 shadow-lg shadow-purple-900/40 transition active:scale-95"
                      >
                        + Agregar prendas
                      </button>
                      <button
                        type="button"
                        onClick={handleAbrirEditar}
                        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-5 py-2.5 transition active:scale-95"
                      >
                        ✎ Editar
                      </button>
                      <button
                        type="button"
                        onClick={handleEliminarPlaylist}
                        aria-label="Eliminar playlist"
                        title="Eliminar playlist"
                        className="h-10 w-10 rounded-full border border-white/20 bg-white/5 hover:bg-rose-500/20 hover:border-rose-400/50 hover:text-rose-400 text-white/70 flex items-center justify-center text-sm transition active:scale-95"
                      >
                        🗑
                      </button>
                      <button
                        type="button"
                        onClick={handleCompartir}
                        aria-label="Compartir playlist"
                        title="Compartir"
                        className="h-10 w-10 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white/70 flex items-center justify-center text-sm transition active:scale-95"
                      >
                        ···
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/probador"
                        className="flex items-center gap-2 rounded-full bg-[#5013b8] hover:bg-[#6318e3] text-white text-xs font-bold px-6 py-2.5 shadow-lg shadow-purple-900/40 transition active:scale-95"
                      >
                        ▶ Probar el look
                      </Link>
                      <button
                        type="button"
                        onClick={handleMezclar}
                        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-5 py-2.5 transition active:scale-95"
                      >
                        🔀 Mezclar
                      </button>
                      <button
                        type="button"
                        onClick={handleLike}
                        aria-label="Me gusta"
                        title="Me gusta"
                        className={`h-10 w-10 rounded-full border flex items-center justify-center text-sm transition active:scale-95 ${
                          isLiked
                            ? 'bg-violeta border-violeta text-white'
                            : 'border-white/20 bg-white/5 hover:bg-white/10 text-white/70'
                        }`}
                      >
                        {isLiked ? '❤️' : '🤍'}
                      </button>
                      <button
                        type="button"
                        onClick={handleGuardar}
                        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-5 py-2.5 transition active:scale-95"
                      >
                        {isSaved ? '✓ Guardada' : '+ Guardar en mi perfil'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCompartir}
                        aria-label="Compartir playlist"
                        title="Compartir"
                        className="h-10 w-10 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white/70 flex items-center justify-center text-sm transition active:scale-95"
                      >
                        ···
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TABLA DE PRENDAS TIPO SPOTIFY */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-xl">
            {prendas.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-4xl block mb-2">📑</span>
                <p className="text-base font-bold text-white">Tu playlist está vacía</p>
                <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
                  Agrega prendas desde el catálogo. Puedes incluir hasta 15 prendas en esta colección.
                </p>
                {esMia && (
                  <button
                    type="button"
                    onClick={() => setMostrarAgregarPrenda(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violeta px-4 py-2 text-xs font-bold text-white"
                  >
                    + Agregar prendas
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[0.6875rem] font-bold uppercase tracking-wider text-white/40">
                      <th className="py-3.5 pl-6 pr-2 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Prenda</th>
                      <th className="py-3.5 px-4">Tienda</th>
                      <th className="py-3.5 px-4">Agregada por</th>
                      <th className="py-3.5 px-4 text-right">Precio</th>
                      <th className="py-3.5 pr-6 pl-2 w-12 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {prendas.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`group transition hover:bg-white/[0.04] ${
                          p.noDisponible ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Índice o Play */}
                        <td className="py-3 pl-6 pr-2 text-center text-white/40 font-mono text-[0.6875rem]">
                          <span className="group-hover:hidden">{idx + 1}</span>
                          <span className="hidden group-hover:inline text-white font-bold">▶</span>
                        </td>

                        {/* Prenda y foto */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.imagen}
                              alt={p.nombre}
                              className="h-11 w-11 shrink-0 rounded-lg object-cover bg-black/40 border border-white/10"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--color-text,#fff)] truncate text-xs">{p.nombre}</p>
                              <p className="text-[0.6875rem] text-[var(--color-text-muted,#b9b9ca)] truncate">
                                {p.noDisponible ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-warning-bg,rgba(245,158,11,0.15))] border border-[var(--color-warning-border,rgba(245,158,11,0.3))] px-2 py-0.5 text-[0.625rem] font-bold text-[var(--color-warning-text,#f59e0b)]">
                                    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    Agotado · no disponible
                                  </span>
                                ) : (
                                  `${p.tienda} · ${p.tallas?.join(' · ') || 'Única'}`
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Tienda */}
                        <td className="py-3 px-4 text-white/70">{p.tienda}</td>

                        {/* Agregada por */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-white/70">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[0.625rem] font-bold text-white/90">
                              {(p.agregadaPor || selectedPlaylist.creador.nombre)
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </span>
                            <span className="truncate">
                              {p.agregadaPor || selectedPlaylist.creador.nombre}
                            </span>
                          </div>
                        </td>

                        {/* Precio */}
                        <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                          {p.noDisponible ? (
                            <s className="text-white/40">{formatCOP(p.precio)}</s>
                          ) : (
                            formatCOP(p.precio)
                          )}
                        </td>

                        {/* Acción fila */}
                        <td className="py-3 pr-6 pl-2 text-right">
                          {esMia ? (
                            <button
                              type="button"
                              onClick={() => handleQuitarPrenda(p.id)}
                              aria-label={`Quitar ${p.nombre}`}
                              title="Quitar de la playlist"
                              className="text-white/40 hover:text-rose-400 p-1 font-bold text-sm transition"
                            >
                              ✕
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => showToast('Guardada en favoritos.')}
                              aria-label={`Me gusta ${p.nombre}`}
                              className="text-white/30 hover:text-rose-400 p-1 text-sm transition"
                            >
                              🤍
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Resumen al pie de la tabla */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 px-6 text-xs text-white/50 border-t border-white/5 bg-white/[0.01]">
                  <span>
                    {prendas.length} prendas ·{' '}
                    {noDisponibles.length > 0 && `${noDisponibles.length} no disponibles · `}
                    {formatCOP(totalDisponible)} disponibles
                  </span>
                  <span>Tiendas: {tiendasUnicas.join(' · ')}</span>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN MÁS PLAYLISTS DE ESTILO (CUANDO NO ES MÍA) */}
          {!esMia && otrasPlaylists.length > 0 && (
            <div className="mt-14">
              <h3 className="text-2xl font-bold tracking-tight text-white mb-6">
                Más playlists de estilo
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                {otrasPlaylists.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => handleSeleccionarPlaylist(pl)}
                    className="group flex flex-col text-left rounded-2xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-violeta/50 hover:bg-white/5 hover:-translate-y-1"
                  >
                    <div className="aspect-square w-full rounded-xl overflow-hidden bg-[#e8dccb] mb-3 border border-white/10 flex items-center justify-center">
                      {pl.portadaUrl ? (
                        <img
                          src={pl.portadaUrl}
                          alt={pl.nombre}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-3xl text-black/30">SR</span>
                      )}
                    </div>
                    <span className="font-bold text-white text-xs truncate w-full group-hover:text-violeta-claro">
                      {pl.nombre}
                    </span>
                    <span className="text-[0.6875rem] text-white/50 truncate w-full mt-0.5">
                      {pl.creador.nombre} · {pl.likes.toLocaleString('es-CO')} me gusta
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL AGREGAR PRENDAS */}
        {mostrarAgregarPrenda && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Agregar prendas a la playlist"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#181520] p-6 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-white/50 block">
                    {selectedPlaylist.nombre}
                  </span>
                  <h3 className="text-lg font-bold text-white">Agregar prendas</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarAgregarPrenda(false)}
                  className="text-white/60 hover:text-white text-lg p-1"
                >
                  ✕
                </button>
              </div>

              {selectedPlaylist.prendas.length >= MAX_PLAYLIST_ITEMS ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
                  Capacidad máxima alcanzada: 15 de 15 prendas permitidas (RNF-12).
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-2">
                      Selecciona una prenda disponible en el catálogo:
                    </label>
                    <select
                      value={prendaParaAgregar}
                      onChange={(e) => setPrendaParaAgregar(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/60 px-3 py-2.5 text-xs text-white outline-none focus:border-violeta"
                    >
                      <option value="">Seleccionar del catálogo...</option>
                      {ITEMS.filter(
                        (it) => !selectedPlaylist.prendas.some((p) => p.id === it.id)
                      ).map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.nombre} · {it.tienda} ({formatCOP(it.precio)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[0.6875rem] text-white/40">
                    Límite del sistema: hasta 15 prendas por playlist (RNF-12).
                  </p>
                </div>
              )}

              {errorAccion && (
                <p className="mt-2 text-xs text-rose-400">{errorAccion}</p>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarAgregarPrenda(false)}
                  className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/5"
                >
                  Cerrar
                </button>
                {selectedPlaylist.prendas.length < MAX_PLAYLIST_ITEMS && (
                  <button
                    type="button"
                    disabled={!prendaParaAgregar}
                    onClick={handleAgregarPrenda}
                    className="rounded-xl bg-violeta px-5 py-2 text-xs font-bold text-white hover:bg-violeta-hover disabled:opacity-50"
                  >
                    Agregar prenda
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR PLAYLIST */}
        {mostrarEditar && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar playlist"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#181520] p-6 text-white shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Editar playlist</h3>
              <form onSubmit={handleGuardarEditar} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-violeta"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    maxLength={160}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-violeta"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Visibilidad
                  </label>
                  <div className="flex rounded-xl border border-white/20 bg-black/40 p-1">
                    <button
                      type="button"
                      onClick={() => setVisibilidad('PUBLICA')}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                        visibilidad === 'PUBLICA' ? 'bg-violeta text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      👁️ Pública
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibilidad('PRIVADA')}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                        visibilidad === 'PRIVADA' ? 'bg-violeta text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      🔒 Privada
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => setMostrarEditar(false)}
                    className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-violeta px-5 py-2 text-xs font-bold text-white hover:bg-violeta-hover"
                  >
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMAR ELIMINAR */}
        {mostrarEliminar && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar eliminación"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <div className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-[#1c141a] p-6 text-white shadow-2xl">
              <h3 className="text-base font-bold text-white mb-2">¿Eliminar esta playlist?</h3>
              <p className="text-xs text-white/70 mb-6 leading-relaxed">
                Se borrará «{selectedPlaylist.nombre}» con sus {prendas.length} prendas. Las prendas seguirán disponibles en el catálogo.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarEliminar(false)}
                  className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarEliminar}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500"
                >
                  Eliminar playlist
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    )
  }

  // ==========================================
  // VISTA LISTA DE PLAYLISTS CON VINILO PROTAGONISTA
  // ==========================================
  return (
    <div className="min-h-screen bg-transparent text-[var(--sr-hero-text)] px-4 py-8 sm:px-8 selection:bg-violeta selection:text-white overflow-x-hidden">
      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-vinyl {
          animation: spinSlow 18s linear infinite;
        }
      `}</style>

      <section className="mx-auto max-w-6xl">
        {/* Migas de pan */}
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--sr-hero-text-muted)]">
          <Link to="/" className="hover:text-[var(--sr-hero-text)]">Inicio</Link>
          <span>/</span>
          <span className="text-[var(--sr-hero-text)]">Playlists</span>
        </div>

        {/* Encabezado de la sección */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--sr-border-subtle)] pb-6">
          <div>
            <span className="text-[0.6875rem] font-bold tracking-widest uppercase text-violeta-claro block mb-1">
              Colecciones en vinilo
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--sr-hero-text)] md:text-5xl">
              Mis playlists
            </h2>
            <p className="mt-2 text-xs text-[var(--sr-hero-text-muted)]">
              Las que creaste y las que guardaste de otras personas. Hasta 15 prendas (RNF-12).
            </p>
          </div>
          <Button
            variant="primario"
            onClick={() => setMostrarCrear(true)}
            className="w-full sm:w-auto"
          >
            + Nueva playlist
          </Button>
        </div>

        {/* Feedback toast */}
        {mensajeExito && (
          <div role="status" className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200 backdrop-blur-md">
            {mensajeExito}
          </div>
        )}

        {/* ========================================================== */}
        {/* SECCIÓN FULL-SCREEN: VINILO GIRATORIO + 3 POLAROIDS SOBRE DISCO */}
        {/* ========================================================== */}
        {polaroidSlots.length > 0 && (
          <section
            aria-label="Selección editorial en vinilo y polaroids"
            className="sr-vinyl-showcase"
          >
            <div className="sr-vinyl-showcase__stage">
              {/* Sello editorial + Pestañas (Todas / Creadas por ti / Guardadas) arriba a la derecha */}
              <div className="sr-vinyl-showcase__kicker">
                <div>
                  <span>EDICIÓN VINILO · BOGOTÁ</span>
                  <p>
                    {carouselPlaylists.length}{' '}
                    {carouselPlaylists.length === 1
                      ? 'colección destacada para explorar'
                      : 'colecciones destacadas para explorar'}
                  </p>
                </div>

                {/* Selector de pestañas integrado en el vinilo nuevo */}
                <div
                  className="sr-vinyl-tabs"
                  role="tablist"
                  aria-label="Filtrar colecciones en el vinilo"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={carouselTab === 'todas'}
                    onClick={() => {
                      setCarouselTab('todas')
                      setVinylStepIndex(0)
                    }}
                    className={`sr-vinyl-tabs__btn ${
                      carouselTab === 'todas' ? 'is-active' : ''
                    }`}
                  >
                    Todas ({playlists.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={carouselTab === 'creadas'}
                    onClick={() => {
                      setCarouselTab('creadas')
                      setVinylStepIndex(0)
                    }}
                    className={`sr-vinyl-tabs__btn ${
                      carouselTab === 'creadas' ? 'is-active' : ''
                    }`}
                  >
                    Creadas por ti ({creadasPorTi.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={carouselTab === 'guardadas'}
                    onClick={() => {
                      setCarouselTab('guardadas')
                      setVinylStepIndex(0)
                    }}
                    className={`sr-vinyl-tabs__btn ${
                      carouselTab === 'guardadas' ? 'is-active' : ''
                    }`}
                  >
                    Guardadas ({guardadas.length})
                  </button>
                </div>
              </div>

              {/* Disco de vinilo grande a la izquierda, recortado por el borde e interactivo */}
              <div className="sr-vinyl-disc-wrap">
                <div
                  className={`sr-vinyl-disc-idle ${
                    isDraggingVinyl ? 'is-paused' : ''
                  }`}
                >
                  <div
                    ref={discRef}
                    role="slider"
                    tabIndex={0}
                    aria-label="Disco de vinilo interactivo: arrastra o gira para explorar las playlists"
                    aria-valuemin={1}
                    aria-valuemax={carouselPlaylists.length}
                    aria-valuenow={
                      (((vinylStepIndex % carouselPlaylists.length) +
                        carouselPlaylists.length) %
                        carouselPlaylists.length) +
                      1
                    }
                    onPointerDown={handleVinylPointerDown}
                    onPointerMove={handleVinylPointerMove}
                    onPointerUp={handleVinylPointerUp}
                    onPointerCancel={handleVinylPointerUp}
                    onWheel={handleVinylWheel}
                    style={{
                      transform: `rotate(${vinylRotation}deg)`,
                      transition:
                        isSnappingVinyl && !prefersReducedMotion
                          ? 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)'
                          : 'none',
                    }}
                    className={`sr-vinyl-disc-interactive ${
                      isDraggingVinyl ? 'is-dragging' : ''
                    }`}
                  >
                    <div className="sr-vinyl-label">
                      <div className="sr-vinyl-label__ring" />
                      <div className="sr-vinyl-label__lines" />
                      <div className="sr-vinyl-label__bottom-rule" />
                      <div className="sr-vinyl-label__stereo-box">
                        <span className="sr-vinyl-label__stereo-text">
                          STYLERADAR
                        </span>
                      </div>
                      <div className="sr-vinyl-spindle" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tres polaroids sobre la superficie y el borde derecho del disco */}
              <div className="sr-polaroids-stack">
                <AnimatePresence mode="popLayout" initial={false}>
                  {polaroidSlots.map(({ playlist: pl, slot, baseRotate }) => {
                    const count = pl.prendas.length
                    const prendasLabel = `${count} ${
                      count === 1 ? 'prenda' : 'prendas'
                    }`

                    return (
                      <motion.div
                        layout={!prefersReducedMotion}
                        key={pl.id}
                        initial={
                          prefersReducedMotion
                            ? { opacity: 0, rotate: baseRotate }
                            : {
                                opacity: 0,
                                x: stepDirection > 0 ? 34 : -34,
                                y: stepDirection > 0 ? 26 : -26,
                                rotate: baseRotate + (stepDirection > 0 ? 7 : -7),
                              }
                        }
                        animate={{
                          opacity: 1,
                          x: 0,
                          y: 0,
                          rotate: baseRotate,
                        }}
                        exit={
                          prefersReducedMotion
                            ? { opacity: 0, rotate: baseRotate }
                            : {
                                opacity: 0,
                                x: stepDirection > 0 ? -34 : 34,
                                y: stepDirection > 0 ? -26 : 26,
                                rotate: baseRotate + (stepDirection > 0 ? -7 : 7),
                              }
                        }
                        whileHover={
                          prefersReducedMotion
                            ? undefined
                            : {
                                y: -8,
                                rotate: baseRotate * 0.35,
                                scale: 1.03,
                              }
                        }
                        transition={{
                          duration: prefersReducedMotion ? 0.18 : 0.48,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={polaroidSlotClasses[slot]}
                      >
                        <Link
                          to={`/playlists/${pl.id}`}
                          onClick={(e) => {
                            if (didDragVinylRef.current) {
                              e.preventDefault()
                              e.stopPropagation()
                              return
                            }
                            setSelectedLocalId(pl.id)
                          }}
                          className="block h-full w-full text-inherit no-underline focus:outline-none"
                          aria-label={`Ver playlist ${pl.nombre} (${prendasLabel})`}
                        >
                          <div className="sr-polaroid-card__photo">
                            <img
                              src={
                                pl.portadaUrl ||
                                '/img/productos/sueter-de-canale-crudo.jpg'
                              }
                              alt={pl.nombre}
                              loading="lazy"
                              draggable={false}
                            />
                          </div>
                          <div className="sr-polaroid-card__caption">
                            <span className="sr-polaroid-card__title">
                              {pl.nombre}
                            </span>
                            <span className="sr-polaroid-card__tag">
                              {prendasLabel}
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* Controles discretos e indicador de posición en violeta #48119A */}
              <div className="sr-vinyl-controls">
                <span className="sr-vinyl-controls__hint">
                  Arrastra el vinilo para girar
                </span>
                <div className="sr-vinyl-controls__bar">
                  <button
                    type="button"
                    onClick={() => stepVinylPlaylist(-1)}
                    aria-label="Colección anterior en el vinilo"
                    className="sr-vinyl-controls__btn"
                  >
                    ‹
                  </button>
                  <span
                    className="sr-vinyl-controls__counter"
                    aria-live="polite"
                  >
                    {(((vinylStepIndex % carouselPlaylists.length) +
                      carouselPlaylists.length) %
                      carouselPlaylists.length) +
                      1}{' '}
                    / {carouselPlaylists.length}
                  </span>
                  <div className="sr-vinyl-controls__dots" role="tablist" aria-label="Posición de la colección">
                    {carouselPlaylists.map((pl, idx) => {
                      const activePos =
                        ((vinylStepIndex % carouselPlaylists.length) +
                          carouselPlaylists.length) %
                        carouselPlaylists.length
                      return (
                        <button
                          key={pl.id}
                          type="button"
                          role="tab"
                          aria-selected={activePos === idx}
                          aria-label={`Mostrar desde ${pl.nombre}`}
                          onClick={() => jumpToVinylPlaylist(idx)}
                          className={`sr-vinyl-controls__dot ${
                            activePos === idx ? 'is-active' : ''
                          }`}
                        />
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => stepVinylPlaylist(1)}
                    aria-label="Siguiente colección en el vinilo"
                    className="sr-vinyl-controls__btn"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </section>

      {/* MODAL CREAR PLAYLIST */}
      {mostrarCrear && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-crear-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#181520] p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-white/40 block">
                  Playlist de estilo
                </span>
                <h3 id="modal-crear-title" className="text-xl font-extrabold text-white">
                  Crear nueva playlist de estilo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarCrear(false)}
                className="text-white/60 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label
                  htmlFor="pl-nombre"
                  className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1"
                >
                  Nombre de la playlist
                </label>
                <input
                  id="pl-nombre"
                  type="text"
                  maxLength={40}
                  placeholder="Ej. Domingo en Usaquén"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-violeta"
                />
                <span className="mt-1 block text-[0.6875rem] text-white/40">Máximo 40 caracteres</span>
              </div>

              <div>
                <label
                  htmlFor="pl-desc"
                  className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1"
                >
                  Descripción <span className="font-normal text-white/40">(opcional)</span>
                </label>
                <textarea
                  id="pl-desc"
                  rows={3}
                  maxLength={160}
                  placeholder="¿Para qué ocasión es? ¿Qué la hace especial?"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-violeta"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                  Visibilidad
                </label>
                <div className="flex rounded-xl border border-white/20 bg-black/40 p-1">
                  <button
                    type="button"
                    onClick={() => setVisibilidad('PUBLICA')}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                      visibilidad === 'PUBLICA' ? 'bg-violeta text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    👁️ Pública
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibilidad('PRIVADA')}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                      visibilidad === 'PRIVADA' ? 'bg-violeta text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    🔒 Privada
                  </button>
                </div>
              </div>

              <p className="text-[0.6875rem] text-white/50">
                Puedes agregar hasta {MAX_PLAYLIST_ITEMS} prendas (RNF-12).
              </p>

              {errorCrear && (
                <p className="text-xs text-rose-400 font-medium">{errorCrear}</p>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarCrear(false)}
                  className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violeta px-5 py-2 text-xs font-bold text-white hover:bg-violeta-hover shadow-lg shadow-purple-900/30"
                >
                  Crear playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
