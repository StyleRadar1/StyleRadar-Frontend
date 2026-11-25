import { useState, useMemo, useContext, useEffect, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { env } from '@/configs/env'
import { Button } from '@/modules/core/design-system'
import { ErrorState } from '@/modules/core/components/Status'
import { Aviso, ErrorCampo, EscenaError } from '@/modules/core/components/errores'
import { errorDeAgregar, errorDeCrear, MAX_NOMBRE_PLAYLIST, TEXTOS_PLAYLIST } from '../utils/erroresPlaylist'
import { formatCOP } from '@/modules/core/utils/format'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { mockSessionUser } from '@/modules/core/api/mock'
import { usePlaylists } from '../hooks/usePlaylists'
import { PLAYLIST_COVER_FALLBACKS } from '../services/playlistService'
import { itemService } from '../services/itemService'
import { ITEMS } from '../mocks/items'
import type { ItemResponseDto } from '../types/item.dto'
import { ESTILOS_PLAYLIST, MAX_PLAYLIST_ITEMS, type PlaylistDto, type PlaylistEstilo, type PlaylistVisibility } from '../types/playlist.dto'
import './PlaylistsPage.css'

const FAVORITE_GARMENTS_KEY = 'sr_favorite_garments'

function readFavoriteGarments(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(FAVORITE_GARMENTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export default function PlaylistsPage() {
  const { id: urlId } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  const user = auth?.user ?? mockSessionUser()

  const {
    playlists: rawPlaylists,
    myPlaylists: rawMyPlaylists,
    savedPlaylists: rawSavedPlaylists,
    featuredPlaylists: rawFeaturedPlaylists,
    loading,
    error,
    reload,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addItem,
    removeItem,
    like,
    save,
  } = usePlaylists(user?.id)

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
  const [prendaVista, setPrendaVista] = useState<PlaylistDto['prendas'][number] | null>(null)
  const [mostrarEliminar, setMostrarEliminar] = useState(false)

  // Catálogo real cuando los mocks están desactivados
  const [catalogItems, setCatalogItems] = useState<ItemResponseDto[]>(() => (env.useMocks ? ITEMS : []))

  useEffect(() => {
    if (env.useMocks) {
      setCatalogItems(ITEMS)
      return
    }
    let cancelled = false
    itemService
      .search({})
      .then((list) => {
        if (!cancelled) setCatalogItems(list)
      })
      .catch(() => {
        if (!cancelled) setCatalogItems([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Campos formulario
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [visibilidad, setVisibilidad] = useState<PlaylistVisibility>('PRIVADA')
  const [estilo, setEstilo] = useState<PlaylistEstilo>('CASUAL')
  const [prendasIniciales, setPrendasIniciales] = useState<string[]>(() =>
    env.useMocks && ITEMS[0]?.id ? [ITEMS[0].id] : []
  )
  const [buscarPrendaInicial, setBuscarPrendaInicial] = useState('')
  const [errorCrear, setErrorCrear] = useState<string | null>(null)
  const [errorPrendasIniciales, setErrorPrendasIniciales] = useState<string | null>(null)
  /** 422 al agregar: la playlist llegó al límite de 15 prendas. */
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false)
  const [prendaParaAgregar, setPrendaParaAgregar] = useState<string>('')

  // Like, guardado y favoritos locales
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({})
  const [userSaved, setUserSaved] = useState<Record<string, boolean>>((): Record<string, boolean> =>
    env.useMocks ? { '3': true, 'pl-2': true } : {}
  )
  const [favoriteGarments, setFavoriteGarments] = useState<Record<string, boolean>>(readFavoriteGarments)
  const [shuffledOrder, setShuffledOrder] = useState<Record<string, string[]>>({})
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  // Estado del carrusel 3D
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [carouselTab, setCarouselTab] = useState<'todas' | 'destacadas' | 'creadas' | 'guardadas'>('todas')

  const usuarioActual = user ?? { id: 'u-1', name: 'Valentina R.', email: 'usuario@styleradar.co' }
  const usuarioEmail = (user && 'email' in user ? (user as { email?: string }).email : undefined) ?? 'usuario@styleradar.co'

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setMensajeExito(msg)
    toastTimerRef.current = setTimeout(() => setMensajeExito(null), 3500)
  }

  // Índice rápido de prendas reales (GET /api/v1/garments) para enriquecer prendas de playlist sin datos de catálogo
  const { catalogById, catalogByName } = useMemo(() => {
    const byId = new Map<string, ItemResponseDto>()
    const byName = new Map<string, ItemResponseDto>()
    for (const item of catalogItems) {
      byId.set(item.id, item)
      const key = item.nombre.trim().toLowerCase()
      if (key && !byName.has(key)) byName.set(key, item)
    }
    return { catalogById: byId, catalogByName: byName }
  }, [catalogItems])

  const enrichPlaylist = useCallback(
    (pl: PlaylistDto): PlaylistDto => {
      let firstRealImage = ''
      const prendasEnriched = pl.prendas.map((g) => {
        const match = catalogById.get(g.id) ?? catalogByName.get(g.nombre.trim().toLowerCase())
        const hasFallbackImage = PLAYLIST_COVER_FALLBACKS.includes(g.imagen)
        const matchImg = match?.imagen || match?.fotografias?.[0] || ''
        const resolvedImg = (!g.imagen || hasFallbackImage) && matchImg ? matchImg : g.imagen
        if (!firstRealImage && matchImg) firstRealImage = matchImg
        else if (!firstRealImage && resolvedImg && !PLAYLIST_COVER_FALLBACKS.includes(resolvedImg)) {
          firstRealImage = resolvedImg
        }
        if (!match) return g
        return {
          ...g,
          imagen: resolvedImg,
          precio: g.precio > 0 ? g.precio : match.precio,
          tienda: g.tienda || match.tienda,
          tipo: g.tipo || match.tipo,
          color: g.color || match.color,
          tallas: g.tallas?.length && g.tallas[0] !== 'Única' ? g.tallas : match.tallas,
        }
      })
      const portadaEsFallback = !pl.portadaUrl || PLAYLIST_COVER_FALLBACKS.includes(pl.portadaUrl)
      return {
        ...pl,
        portadaUrl: portadaEsFallback && firstRealImage ? firstRealImage : pl.portadaUrl,
        prendas: prendasEnriched,
      }
    },
    [catalogById, catalogByName]
  )

  const playlists = useMemo(() => rawPlaylists.map(enrichPlaylist), [rawPlaylists, enrichPlaylist])
  const myPlaylists = useMemo(() => rawMyPlaylists.map(enrichPlaylist), [rawMyPlaylists, enrichPlaylist])
  const savedPlaylists = useMemo(() => rawSavedPlaylists.map(enrichPlaylist), [rawSavedPlaylists, enrichPlaylist])
  const featuredPlaylists = useMemo(() => rawFeaturedPlaylists.map(enrichPlaylist), [rawFeaturedPlaylists, enrichPlaylist])

  // Unión deduplicada de playlists (incluye privadas de /me, guardadas y destacadas)
  const allUniquePlaylists = useMemo(() => {
    const map = new Map<string, PlaylistDto>()
    for (const list of [playlists, myPlaylists, savedPlaylists, featuredPlaylists]) {
      for (const p of list) {
        if (!map.has(p.id)) map.set(p.id, p)
      }
    }
    return Array.from(map.values())
  }, [playlists, myPlaylists, savedPlaylists, featuredPlaylists])

  // Playlist seleccionada actualmente
  const selectedPlaylist = useMemo(() => {
    if (!activeId) return null
    const norm = activeId.replace(/^p/, '')
    return (
      allUniquePlaylists.find(
        (p) =>
          p.id === activeId ||
          p.id.replace(/^p/, '') === norm ||
          (activeId === 'u-weekend' && p.nombre.toLowerCase().includes('usaquén')) ||
          (activeId === '3' && p.nombre.toLowerCase().includes('oficina'))
      ) ?? null
    )
  }, [allUniquePlaylists, activeId])

  // Playlists creadas por la usuaria (GET /api/v1/playlists/users/{userId})
  const creadasPorTi = myPlaylists

  // Playlists destacadas (GET /api/v1/playlists/featured)
  const destacadas = featuredPlaylists

  // Playlists guardadas (GET /api/v1/playlists/users/{userId}/saved + cambios locales en sesión)
  const guardadas = useMemo(() => {
    const byId = new Map<string, PlaylistDto>()
    for (const p of savedPlaylists) {
      if (userSaved[p.id] === false) continue
      byId.set(p.id, p)
    }
    for (const p of allUniquePlaylists) {
      if (userSaved[p.id] === true && !byId.has(p.id)) {
        byId.set(p.id, p)
      }
    }
    return Array.from(byId.values())
  }, [savedPlaylists, allUniquePlaylists, userSaved])

  // Lista activa para el carrusel 3D según la pestaña seleccionada
  const carouselPlaylists = useMemo(() => {
    if (carouselTab === 'destacadas') return destacadas
    if (carouselTab === 'creadas') return creadasPorTi
    if (carouselTab === 'guardadas') return guardadas
    return playlists
  }, [carouselTab, destacadas, creadasPorTi, guardadas, playlists])

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

  // Navegación en el vinilo interactivo
  const [vinylStepIndex, setVinylStepIndex] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const discRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  const stepVinylPlaylist = useCallback(
    (dir: number) => {
      if (carouselPlaylists.length === 0 || dir === 0) return
      setVinylStepIndex((prev) => {
        const total = carouselPlaylists.length
        return ((prev + dir) % total + total) % total
      })
    },
    [carouselPlaylists.length]
  )

  const jumpToVinylPlaylist = useCallback(
    (targetIdx: number) => {
      if (carouselPlaylists.length === 0) return
      const total = carouselPlaylists.length
      setVinylStepIndex(((targetIdx % total) + total) % total)
    },
    [carouselPlaylists.length]
  )

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

  // Ranuras del carrusel de vinilos tipo Coverflow (central y laterales)
  const vinylCoverflowSlots = useMemo(() => {
    const total = carouselPlaylists.length
    if (total === 0) return []
    const currentNorm = ((vinylStepIndex % total) + total) % total
    const offsets = total >= 5 ? [-2, -1, 0, 1, 2] : total >= 3 ? [-1, 0, 1] : [0]
    return offsets.map((offset) => {
      const idx = (((currentNorm + offset) % total) + total) % total
      return {
        playlist: carouselPlaylists[idx],
        offset,
        isCenter: offset === 0,
      }
    })
  }, [carouselPlaylists, vinylStepIndex])

  // Playlist activa actual sobre el disco de vinilo
  const currentVinylPlaylist = useMemo(() => {
    if (carouselPlaylists.length === 0) return null
    const idx =
      (((vinylStepIndex % carouselPlaylists.length) +
        carouselPlaylists.length) %
        carouselPlaylists.length)
    return carouselPlaylists[idx] ?? null
  }, [carouselPlaylists, vinylStepIndex])



  const esMia = useMemo(() => {
    if (!selectedPlaylist) return false
    const myId = String(usuarioActual.id ?? '')
    return (
      myPlaylists.some((p) => p.id === selectedPlaylist.id) ||
      (Boolean(myId) && String(selectedPlaylist.usuarioId ?? '') === myId) ||
      (Boolean(usuarioEmail) && selectedPlaylist.creador?.email === usuarioEmail) ||
      (Boolean(myId) && String(selectedPlaylist.creador?.id ?? '') === myId) ||
      (env.useMocks && Boolean(selectedPlaylist.creador?.nombre?.toLowerCase().includes('valentina')))
    )
  }, [selectedPlaylist, myPlaylists, usuarioEmail, usuarioActual.id])

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
    // 400 · nombre vacío y 422 · nombre muy largo: se validan antes de enviar.
    if (!nombre.trim() || nombre.trim().length > MAX_NOMBRE_PLAYLIST) {
      setErrorCrear(!nombre.trim() ? TEXTOS_PLAYLIST.nombre : TEXTOS_PLAYLIST.nombreLargo)
      document.getElementById('pl-nombre')?.focus()
      return
    }
    if (prendasIniciales.length < 1) {
      setErrorPrendasIniciales('Selecciona al menos una prenda inicial.')
      return
    }
    setErrorCrear(null)
    setErrorPrendasIniciales(null)
    try {
      const nueva = await createPlaylist({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        visibilidad,
        estilo,
        prendaIds: prendasIniciales,
      })
      if (!nueva.prendas || nueva.prendas.length === 0) {
        const matched = catalogItems
          .filter((it) => prendasIniciales.includes(it.id))
          .map((it) => ({ ...it, agregadaPor: usuarioActual.name }))
        if (matched.length > 0) {
          nueva.prendas = matched
          if (!nueva.portadaUrl) nueva.portadaUrl = matched[0].imagen
        }
      }
      setMostrarCrear(false)
      setNombre('')
      setDescripcion('')
      setVisibilidad('PRIVADA')
      setEstilo('CASUAL')
      setPrendasIniciales(env.useMocks && ITEMS[0]?.id ? [ITEMS[0].id] : [])
      showToast('Playlist creada con éxito. Ahora puedes administrar hasta 15 prendas.')
      handleSeleccionarPlaylist(nueva)
    } catch (er: unknown) {
      const r = errorDeCrear(er)
      setErrorCrear(r.campo ?? r.general ?? null)
      if (r.campo) document.getElementById('pl-nombre')?.focus()
    }
  }

  const handleAbrirEditar = () => {
    if (!selectedPlaylist) return
    setNombre(selectedPlaylist.nombre)
    setDescripcion(selectedPlaylist.descripcion)
    setVisibilidad(selectedPlaylist.visibilidad)
    setErrorAccion(null)
    setMostrarEditar(true)
  }

  const handleGuardarEditar = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!selectedPlaylist || !nombre.trim()) return
    setErrorAccion(null)
    try {
      await updatePlaylist(selectedPlaylist.id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        visibilidad,
        estilo: selectedPlaylist.estilo ?? estilo,
      })
      setMostrarEditar(false)
      showToast('Playlist actualizada con éxito.')
    } catch (er: unknown) {
      setErrorAccion(errorDeCrear(er).general ?? 'No pudimos actualizar la playlist.')
    }
  }

  const handleEliminarPlaylist = () => {
    setErrorAccion(null)
    setMostrarEliminar(true)
  }

  const handleConfirmarEliminar = async () => {
    if (!selectedPlaylist) return
    const deletedName = selectedPlaylist.nombre
    setErrorAccion(null)
    try {
      await deletePlaylist(selectedPlaylist.id)
      setMostrarEliminar(false)
      showToast(`Playlist «${deletedName}» eliminada.`)
      handleVolver()
    } catch (er: unknown) {
      setErrorAccion(errorDeCrear(er).general ?? 'No pudimos eliminar la playlist.')
    }
  }

  const handleAgregarPrenda = async () => {
    if (!selectedPlaylist || !prendaParaAgregar) return
    setErrorAccion(null)
    try {
      const nombrePrenda = catalogItems.find((it) => it.id === prendaParaAgregar)?.nombre
      await addItem(selectedPlaylist.id, prendaParaAgregar, nombrePrenda)
      setPrendaParaAgregar('')
      setMostrarAgregarPrenda(false)
      showToast('Prenda agregada a la playlist.')
    } catch (er: unknown) {
      // 422: el mensaje va junto al botón y el contador x/15 queda a la vista.
      const r = errorDeAgregar(er, selectedPlaylist.prendas.some((p) => p.id === prendaParaAgregar))
      setErrorAccion(r.texto)
      setLimiteAlcanzado(r.limite)
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

  const handleGuardar = async () => {
    if (!selectedPlaylist) return
    const curSaved =
      userSaved[selectedPlaylist.id] !== undefined
        ? userSaved[selectedPlaylist.id]
        : Boolean(selectedPlaylist.esGuardada || savedPlaylists.some((p) => p.id === selectedPlaylist.id))
    const nextSaved = !curSaved
    setUserSaved((prev) => ({ ...prev, [selectedPlaylist.id]: nextSaved }))
    try {
      const res = await save(selectedPlaylist.id)
      setUserSaved((prev) => ({ ...prev, [selectedPlaylist.id]: res.esGuardada }))
      showToast(res.esGuardada ? 'Guardada en Mis playlists.' : 'Quitada de tu perfil.')
    } catch (er: unknown) {
      setUserSaved((prev) => ({ ...prev, [selectedPlaylist.id]: !nextSaved }))
      setErrorAccion(errorDeCrear(er).general ?? 'No pudimos actualizar tu playlist guardada.')
    }
  }

  const handleToggleFavoritoPrenda = (itemId: string) => {
    setFavoriteGarments((prev) => {
      const nextFav = !prev[itemId]
      const updated = { ...prev, [itemId]: nextFav }
      if (!nextFav) delete updated[itemId]
      try {
        localStorage.setItem(FAVORITE_GARMENTS_KEY, JSON.stringify(updated))
      } catch {
        // Ignora errores de almacenamiento local
      }
      showToast(nextFav ? 'Guardada en favoritos.' : 'Quitada de favoritos.')
      return updated
    })
  }

  const handleMezclar = () => {
    if (!selectedPlaylist) return
    const shuffledIds = [...selectedPlaylist.prendas]
      .sort(() => Math.random() - 0.5)
      .map((p) => p.id)
    setShuffledOrder((prev) => ({ ...prev, [selectedPlaylist.id]: shuffledIds }))
    showToast('Playlist mezclada.')
  }

  const handleCompartir = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {})
    }
    showToast('Enlace copiado para compartir.')
  }

  if (error) return <ErrorState error={error} onRetry={reload} />

  // 403 y 404: la playlist de la URL no existe o es privada de otra persona. Mismo texto para los dos.
  if (urlId && !loading && !selectedPlaylist) {
    return (
      <EscenaError
        escena="tornamesa" codigo="404" etiqueta="No disponible" nivel="h1"
        titulo={TEXTOS_PLAYLIST.noDisponible} texto="Puede que la hayan borrado o que sea privada."
        acciones={<button type="button" onClick={handleVolver} className="rounded-xl bg-violeta px-5 py-3 text-sm font-semibold text-blanco">Volver a playlists</button>}
      />
    )
  }

  // ==========================================
  // VISTA DETALLE TIPO SPOTIFY CON DISCO DE VINILO PROTAGONISTA
  // ==========================================
  if (selectedPlaylist) {
    const rawPrendas = selectedPlaylist.prendas || []
    const order = shuffledOrder[selectedPlaylist.id]
    const prendas = order
      ? [...rawPrendas].sort((a, b) => {
          const ia = order.indexOf(a.id)
          const ib = order.indexOf(b.id)
          return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib)
        })
      : rawPrendas
    const disponibles = prendas.filter((p) => !p.noDisponible)
    const noDisponibles = prendas.filter((p) => p.noDisponible)
    const totalDisponible = disponibles.reduce((acc, p) => acc + p.precio, 0)
    const tiendasUnicas = Array.from(new Set(prendas.map((p) => p.tienda).filter(Boolean)))
    const isLiked = userLikes[selectedPlaylist.id]
    const isSaved =
      userSaved[selectedPlaylist.id] !== undefined
        ? userSaved[selectedPlaylist.id]
        : Boolean(selectedPlaylist.esGuardada || savedPlaylists.some((p) => p.id === selectedPlaylist.id))

    return (
      <section
        role="dialog"
        aria-modal="false"
        aria-label={`Detalle de ${selectedPlaylist.nombre}`}
        className="sr-playlist-page min-h-screen bg-transparent text-[var(--sr-hero-text)] px-4 py-8 sm:px-8 selection:bg-violeta selection:text-white"
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
                    PLAYLIST DE ESTILO · {selectedPlaylist.visibilidad === 'PRIVADA' ? 'PRIVADA' : 'PÚBLICA'}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-3">
                  {selectedPlaylist.nombre}
                </h1>

                {/* Creador / Curador */}
                <div className="flex items-center gap-2.5 text-sm font-semibold text-white/80 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violeta text-[11px] font-bold text-white shadow-sm">
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

                {/* Métricas e información de la playlist */}
                <div className="text-xs sm:text-sm text-white/50 space-x-1.5 mb-3">
                  <span className="font-semibold text-white/80">
                    {prendas.length}/15 prendas
                  </span>
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
                  {/* Botón principal Probar outfit completo en el probador virtual (RF-7.3) */}
                  <Link
                    to={`/probador?playlist=${selectedPlaylist.id}`}
                    aria-label="Probar outfit completo en el probador"
                    className="flex items-center gap-2 rounded-full bg-[#5013b8] hover:bg-[#6318e3] text-white text-xs font-bold px-6 py-2.5 shadow-lg shadow-purple-900/40 transition active:scale-95"
                  >
                    ▶ Probar outfit completo
                  </Link>

                  {esMia ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { setMostrarAgregarPrenda(true); setErrorAccion(null); setLimiteAlcanzado(false) }}
                        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-5 py-2.5 transition active:scale-95"
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
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
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
                      <button
                        type="button"
                        onClick={handleMezclar}
                        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-5 py-2.5 transition active:scale-95"
                      >
                        Mezclar
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
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill={isLiked ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
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
                <span className="text-4xl block mb-2"></span>
                <p className="text-base font-bold text-white">Tu playlist está vacía</p>
                <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
                  Agrega prendas desde el catálogo. Puedes incluir hasta 15 prendas en esta colección.
                </p>
                {esMia && (
                  <button
                    type="button"
                    onClick={() => { setMostrarAgregarPrenda(true); setErrorAccion(null); setLimiteAlcanzado(false) }}
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
                    <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-white/40">
                      <th className="py-3.5 pl-6 pr-2 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Prenda</th>
                      <th className="py-3.5 px-4">Tienda</th>
                      <th className="py-3.5 px-4">Agregada por</th>
                      <th className="py-3.5 px-4 text-right">Precio</th>
                      <th className="py-3.5 pr-6 pl-2 w-12 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {prendas.map((p, idx) => {
                      const autorRaw = p.agregadaPor || selectedPlaylist.creador.nombre
                      const autorLabel = /^\d+$/.test(autorRaw.trim())
                        ? (esMia ? usuarioActual.name : `Usuario #${autorRaw.trim()}`)
                        : autorRaw
                      const autorIniciales = autorLabel
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'SR'

                      return (
                      <tr
                        key={p.id}
                        onClick={() => setPrendaVista(p)}
                        className={`group cursor-pointer transition hover:bg-white/[0.04] ${
                          p.noDisponible ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Índice o Play */}
                        <td className="py-3 pl-6 pr-2 text-center text-white/40 font-mono text-[11px]">
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
                              <p className="font-semibold text-[var(--color-text,#fff)] truncate text-xs group-hover:text-violeta-claro transition">{p.nombre}</p>
                              <p className="text-[11px] text-[var(--color-text-muted,#b9b9ca)] truncate">
                                {p.noDisponible ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-warning-bg,rgba(245,158,11,0.15))] border border-[var(--color-warning-border,rgba(245,158,11,0.3))] px-2 py-0.5 text-[10px] font-bold text-[var(--color-warning-text,#f59e0b)]">
                                    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    Agotado · no disponible
                                  </span>
                                ) : (
                                  `${p.tienda ? `${p.tienda} · ` : ''}${p.tallas?.join(' · ') || 'Única'}`
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Tienda */}
                        <td className="py-3 px-4 text-white/70">{p.tienda || '—'}</td>

                        {/* Agregada por */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-white/70">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/90">
                              {autorIniciales}
                            </span>
                            <span className="truncate">{autorLabel}</span>
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
                        <td className="py-3 pr-6 pl-2 text-right" onClick={(e) => e.stopPropagation()}>
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
                            (() => {
                              const isGarmentFav = Boolean(favoriteGarments[p.id])
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleToggleFavoritoPrenda(p.id)}
                                  aria-pressed={isGarmentFav}
                                  aria-label={isGarmentFav ? `Quitar ${p.nombre} de favoritos` : `Guardar ${p.nombre} en favoritos`}
                                  title={isGarmentFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                                  className={
                                    isGarmentFav
                                      ? 'text-rose-500 hover:text-rose-400 p-1 text-sm transition scale-110'
                                      : 'text-white/40 hover:text-rose-400 p-1 text-sm transition'
                                  }
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4"
                                    fill={isGarmentFav ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                  </svg>
                                </button>
                              )
                            })()
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>

                {/* Resumen al pie de la tabla */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 px-6 text-xs text-white/50 border-t border-white/5 bg-white/[0.01]">
                  <span>
                    {prendas.length} prendas ·{' '}
                    {noDisponibles.length > 0 && `${noDisponibles.length} no disponibles · `}
                    {formatCOP(totalDisponible)} disponibles
                  </span>
                  <span>Tiendas: {tiendasUnicas.length > 0 ? tiendasUnicas.join(' · ') : '—'}</span>
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
                    <span className="text-[11px] text-white/50 truncate w-full mt-0.5">
                      {pl.creador.nombre} · {pl.likes.toLocaleString('es-CO')} me gusta
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL AGREGAR PRENDAS */}
        {prendaVista && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de ${prendaVista.nombre}`}
            onClick={() => setPrendaVista(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-[#181520] text-white shadow-2xl"
            >
              <div className="relative aspect-[4/5] w-full bg-black/40">
                <img
                  src={prendaVista.imagen}
                  alt={prendaVista.nombre}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPrendaVista(null)}
                  aria-label="Cerrar detalle de prenda"
                  className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-violeta-claro">
                    {prendaVista.tipo || 'Prenda'}{prendaVista.estilo ? ` · ${prendaVista.estilo}` : ''}
                  </p>
                  <h3 className="mt-0.5 text-lg font-extrabold text-white">{prendaVista.nombre}</h3>
                  {prendaVista.tienda && (
                    <p className="text-xs text-white/60">{prendaVista.tienda}{prendaVista.barrio ? ` · ${prendaVista.barrio}` : ''}</p>
                  )}
                </div>

                {prendaVista.tallas?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {prendaVista.tallas.map((t) => (
                      <span key={t} className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <strong className="text-lg font-extrabold text-white">{formatCOP(prendaVista.precio)}</strong>
                  <div className="flex gap-2">
                    <Link
                      to={`/probador?prenda=${encodeURIComponent(prendaVista.id)}`}
                      className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      Probar
                    </Link>
                    <Link
                      to={`/catalogo/${encodeURIComponent(prendaVista.id)}`}
                      className="rounded-xl bg-violeta px-3.5 py-2 text-xs font-bold text-white hover:bg-violeta-hover"
                    >
                      Ver en catálogo →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block">
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
                <Aviso tono="aviso" titulo={TEXTOS_PLAYLIST.limite} />
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
                      {catalogItems.filter(
                        (it) => !selectedPlaylist.prendas.some((p) => p.id === it.id)
                      ).map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.nombre} · {it.tienda} ({formatCOP(it.precio)})
                        </option>
                      ))}
                    </select>
                    {(() => {
                      const preview = catalogItems.find((it) => it.id === prendaParaAgregar)
                      if (!preview) return null
                      return (
                        <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/15 bg-black/40 p-2.5">
                          <img
                            src={preview.imagen}
                            alt={preview.nombre}
                            className="h-12 w-12 shrink-0 rounded-lg object-cover border border-white/10"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-white">{preview.nombre}</p>
                            <p className="truncate text-[11px] text-white/60">
                              {preview.tienda} · {formatCOP(preview.precio)}
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  <p className="text-[11px] text-white/40">
                    Límite del sistema: hasta 15 prendas por playlist.
                  </p>
                </div>
              )}

              {errorAccion && (
                <div className="mt-3"><Aviso tono={limiteAlcanzado ? 'aviso' : 'error'} titulo={errorAccion} /></div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                {/* Contador x/15 junto a la acción (plan de errores · 422). */}
                <span data-testid="contador-prendas"
                  className={`mr-auto font-mono text-xs font-bold ${limiteAlcanzado || selectedPlaylist.prendas.length >= MAX_PLAYLIST_ITEMS ? 'text-[var(--sr-warn)]' : 'text-white/60'}`}>
                  {limiteAlcanzado ? MAX_PLAYLIST_ITEMS : selectedPlaylist.prendas.length}/{MAX_PLAYLIST_ITEMS}
                </span>
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
                    disabled={!prendaParaAgregar || limiteAlcanzado}
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
                      Pública
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibilidad('PRIVADA')}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                        visibilidad === 'PRIVADA' ? 'bg-violeta text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Privada
                    </button>
                  </div>
                </div>

                {errorAccion && (
                  <div className="mt-3"><Aviso tono="error" titulo={errorAccion} /></div>
                )}

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
              {errorAccion && (
                <div className="mb-4"><Aviso tono="error" titulo={errorAccion} /></div>
              )}
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
    <div className="sr-playlist-page min-h-screen bg-transparent text-[var(--sr-hero-text)] px-4 py-8 sm:px-8 selection:bg-violeta selection:text-white overflow-x-hidden">
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
            <span className="text-[11px] font-bold tracking-widest uppercase text-violeta-claro block mb-1">
              Colecciones en vinilo
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--sr-hero-text)] md:text-5xl">
              Mis playlists
            </h2>
            <p className="mt-2 text-xs text-[var(--sr-hero-text-muted)]">
              Las que creaste y las que guardaste de otras personas. Hasta 15 prendas.
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
        {/* SECCIÓN FULL-SCREEN: CARRUSEL 3D COVERFLOW DE VINILOS */}
        {/* ========================================================== */}
        <section
          aria-label="Selección en vinilo"
          className="sr-vinyl-showcase"
        >
          <div className="sr-vinyl-showcase__stage">
            {/* Barra superior centrada: Pestañas de filtrado */}
            <div className="sr-vinyl-showcase__top">
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
                  aria-selected={carouselTab === 'destacadas'}
                  onClick={() => {
                    setCarouselTab('destacadas')
                    setVinylStepIndex(0)
                  }}
                  className={`sr-vinyl-tabs__btn ${
                    carouselTab === 'destacadas' ? 'is-active' : ''
                  }`}
                >
                  Destacadas ({destacadas.length})
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

            {carouselPlaylists.length > 0 ? (
              <>
                {/* Título de póster gigante y centrado */}
                {currentVinylPlaylist && (
                  <div className="sr-vinyl-center-hero">
                    <div className="sr-vinyl-active-badge">
                      <span>● Colección activa</span>
                    </div>

                    <Link
                      to={`/playlists/${currentVinylPlaylist.id}`}
                      onClick={() => setSelectedLocalId(currentVinylPlaylist.id)}
                      className="sr-vinyl-center-title-link"
                      title={`Ver colección ${currentVinylPlaylist.nombre}`}
                    >
                      <AnimatePresence mode="wait">
                        <motion.h2
                          key={currentVinylPlaylist.id}
                          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16, scale: 0.97 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="sr-vinyl-active-title">{(() => { const w = currentVinylPlaylist.nombre.trim().split(/\s+/); if (w.length <= 1) return currentVinylPlaylist.nombre; const s = Math.ceil(w.length / 2); return <>{w.slice(0, s).join(" ")}{" "}<span className="sr-vinyl-active-title__accent">{w.slice(s).join(" ")}</span></>; })()}</motion.h2>
                      </AnimatePresence>
                    </Link>

                    <div className="sr-vinyl-active-meta">
                      <span>
                        {currentVinylPlaylist.prendas.length}{' '}
                        {currentVinylPlaylist.prendas.length === 1 ? 'prenda' : 'prendas'}
                      </span>
                      <span>·</span>
                      <span>Por {currentVinylPlaylist.creador?.nombre || 'Curador StyleRadar'}</span>
                      <span className="sr-vinyl-active-meta__chip">
                        {currentVinylPlaylist.visibilidad === 'PRIVADA' ? 'Privada' : 'Pública'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Pista 3D con disco central y discos laterales en perspectiva */}
                <div className="sr-vinyl-coverflow-track">{carouselPlaylists.length > 1 && (<><button type="button" onClick={() => stepVinylPlaylist(-1)} aria-label="Colección anterior" className="sr-vinyl-side-arrow sr-vinyl-side-arrow--prev">‹</button><button type="button" onClick={() => stepVinylPlaylist(1)} aria-label="Siguiente colección" className="sr-vinyl-side-arrow sr-vinyl-side-arrow--next">›</button></>)}
                  {vinylCoverflowSlots.map(({ playlist: pl, offset, isCenter }) => {
                    if (isCenter) {
                      return (
                        <div
                          key={pl.id}
                          className="sr-vinyl-slot sr-vinyl-slot--center cursor-pointer"
                          onClick={() => {
                            setSelectedLocalId(pl.id)
                            navigate(`/playlists/${pl.id}`)
                          }}
                          title={`Ver prendas de ${pl.nombre}`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedLocalId(pl.id)
                              navigate(`/playlists/${pl.id}`)
                            }
                          }}
                        >
                          <div className="sr-vinyl-disc-idle">
                            <div
                              ref={discRef}
                              role="slider"
                              tabIndex={0}
                              aria-label={`Disco de vinilo central: ${pl.nombre}. Pulsa para abrir la colección`}
                              aria-valuemin={1}
                              aria-valuemax={carouselPlaylists.length}
                              aria-valuenow={
                                (((vinylStepIndex % carouselPlaylists.length) +
                                  carouselPlaylists.length) %
                                  carouselPlaylists.length) +
                                1
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowLeft') {
                                  e.stopPropagation()
                                  stepVinylPlaylist(-1)
                                }
                                if (e.key === 'ArrowRight') {
                                  e.stopPropagation()
                                  stepVinylPlaylist(1)
                                }
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  setSelectedLocalId(pl.id)
                                  navigate(`/playlists/${pl.id}`)
                                }
                              }}
                              className="sr-vinyl-disc-interactive"
                            >
                              <div className="sr-vinyl-label">
                                <img
                                  src={
                                    pl.portadaUrl ||
                                    '/img/productos/sueter-de-canale-crudo.jpg'
                                  }
                                  alt={pl.nombre}
                                  className="sr-vinyl-label__art"
                                  draggable={false}
                                />
                                <div className="sr-vinyl-label__art-overlay" />
                                <div className="sr-vinyl-label__ring" />
                                <div className="sr-vinyl-spindle" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    // Discos laterales
                    return (
                      <div
                        key={pl.id}
                        className={`sr-vinyl-slot sr-vinyl-slot--lateral sr-vinyl-slot--offset-${offset}`}
                      >
                        <button
                          type="button"
                          onClick={() => stepVinylPlaylist(offset)}
                          className="sr-vinyl-disc-interactive sr-vinyl-disc--lateral"
                          aria-label={`Girar a playlist ${pl.nombre}`}
                          title={`Girar a ${pl.nombre}`}
                        >
                          <div className="sr-vinyl-label">
                            <img
                              src={
                                pl.portadaUrl ||
                                '/img/productos/sueter-de-canale-crudo.jpg'
                              }
                              alt={pl.nombre}
                              className="sr-vinyl-label__art"
                              draggable={false}
                            />
                            <div className="sr-vinyl-label__art-overlay" />
                            <div className="sr-vinyl-label__ring" />
                            <div className="sr-vinyl-spindle" />
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLocalId(pl.id)
                            navigate(`/playlists/${pl.id}`)
                          }}
                          className="sr-vinyl-slot__lateral-caption"
                          title={`Ver colección ${pl.nombre}`}
                        >
                          {pl.nombre}
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Controles discretos e indicador de posición centrados */}
                <div className="sr-vinyl-controls-center">
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
                  <span className="sr-vinyl-controls__hint">
                    Toca el vinilo para ver la colección · Usa las flechas o los discos laterales para navegar
                  </span>
                </div>
              </>
            ) : !loading && (
              <div className="rounded-3xl border border-[var(--color-border,rgba(255,255,255,0.1))] bg-[var(--color-surface,rgba(255,255,255,0.03))] p-10 text-center backdrop-blur-xl max-w-lg mx-auto my-8 text-[var(--sr-hero-text)] shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border,rgba(255,255,255,0.15))] bg-[var(--color-surface-raised,rgba(255,255,255,0.06))] text-[var(--sr-hero-text-muted)]">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[var(--sr-hero-text)]">
                  {carouselTab === 'destacadas'
                    ? 'Aún no hay playlists destacadas'
                    : playlists.length === 0 || carouselTab === 'todas'
                      ? 'Aún no hay playlists disponibles'
                      : carouselTab === 'creadas'
                        ? 'Aún no has creado ninguna playlist'
                        : 'No tienes playlists guardadas'}
                </h3>
                <p className="mt-2 text-xs text-[var(--sr-hero-text-muted)] max-w-md mx-auto leading-relaxed">
                  {carouselTab === 'destacadas'
                    ? 'Todavía no hay colecciones destacadas por StyleRadar. Explora todas las playlists de la comunidad.'
                    : playlists.length === 0 || carouselTab === 'todas'
                      ? 'Todavía no se han publicado colecciones de estilo. Crea la primera playlist con tus prendas favoritas.'
                      : carouselTab === 'creadas'
                        ? 'Arma tu primera colección de hasta 15 prendas de distintas tiendas locales.'
                        : 'Explora las colecciones de la comunidad y guárdalas en tu perfil para tenerlas a mano.'}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {carouselTab === 'destacadas' ? (
                    playlists.length > 0 ? (
                      <Button
                        variant="primario"
                        onClick={() => {
                          setCarouselTab('todas')
                          setVinylStepIndex(0)
                        }}
                      >
                        Explorar playlists
                      </Button>
                    ) : (
                      <Button
                        variant="primario"
                        onClick={() => setMostrarCrear(true)}
                      >
                        + Nueva playlist
                      </Button>
                    )
                  ) : playlists.length === 0 || carouselTab !== 'guardadas' ? (
                    <>
                      <Button
                        variant="primario"
                        onClick={() => setMostrarCrear(true)}
                      >
                        + Nueva playlist
                      </Button>
                      {carouselTab !== 'todas' && playlists.length > 0 && (
                        <Button
                          variant="secundario"
                          onClick={() => {
                            setCarouselTab('todas')
                            setVinylStepIndex(0)
                          }}
                        >
                          Ver todas las playlists
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="primario"
                      onClick={() => {
                        setCarouselTab('todas')
                        setVinylStepIndex(0)
                      }}
                    >
                      Explorar playlists
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block">
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
                  maxLength={MAX_NOMBRE_PLAYLIST}
                  placeholder="Ej. Domingo en Usaquén"
                  value={nombre}
                  onChange={(e) => { setNombre(e.target.value); if (errorCrear && e.target.value.trim()) setErrorCrear(null) }}
                  aria-invalid={!!errorCrear}
                  aria-describedby={errorCrear ? 'pl-nombre-err' : 'pl-nombre-hint'}
                  className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-violeta aria-[invalid=true]:border-[var(--sr-bad)]"
                />
                {errorCrear
                  ? <div className="mt-1.5"><ErrorCampo id="pl-nombre">{errorCrear}</ErrorCampo></div>
                  : <span id="pl-nombre-hint" className="mt-1 block text-[11px] text-white/40">Máximo {MAX_NOMBRE_PLAYLIST} caracteres</span>}
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
                <label
                  htmlFor="pl-estilo"
                  className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1"
                >
                  Estilo
                </label>
                <select
                  id="pl-estilo"
                  value={estilo}
                  onChange={(e) => setEstilo(e.target.value as PlaylistEstilo)}
                  className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-violeta"
                >
                  {ESTILOS_PLAYLIST.map((est) => (
                    <option key={est} value={est}>
                      {est.charAt(0) + est.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
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
                    Pública
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibilidad('PRIVADA')}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                      visibilidad === 'PRIVADA' ? 'bg-violeta text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Privada
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Prendas iniciales ({prendasIniciales.length}/{MAX_PLAYLIST_ITEMS})
                </span>
                <input
                  type="search"
                  value={buscarPrendaInicial}
                  onChange={(e) => setBuscarPrendaInicial(e.target.value)}
                  placeholder="Buscar prenda o tienda en el catálogo…"
                  aria-label="Buscar prenda inicial"
                  className="mb-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-violeta"
                />
                <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-white/15 bg-black/40 p-2.5">
                  {(() => {
                    const q = buscarPrendaInicial.trim().toLowerCase()
                    const visibles = q
                      ? catalogItems.filter(
                          (it) =>
                            it.nombre.toLowerCase().includes(q) ||
                            (it.tienda ?? '').toLowerCase().includes(q),
                        )
                      : catalogItems
                    if (catalogItems.length === 0) {
                      return <p className="text-xs text-white/50">No hay prendas disponibles en el catálogo.</p>
                    }
                    if (visibles.length === 0) {
                      return <p className="text-xs text-white/50">Ninguna prenda coincide con «{buscarPrendaInicial}».</p>
                    }
                    return visibles.map((item) => {
                      const checked = prendasIniciales.includes(item.id)
                      return (
                        <label
                          key={item.id}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-2 py-1.5 text-xs transition ${
                            checked
                              ? 'border-violeta/60 bg-violeta/20 text-white'
                              : 'border-transparent text-white/85 hover:bg-white/5'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setPrendasIniciales((prev) => {
                                if (prev.includes(item.id)) return prev.filter((id) => id !== item.id)
                                if (prev.length >= MAX_PLAYLIST_ITEMS) return prev
                                return [...prev, item.id]
                              })
                              setErrorPrendasIniciales(null)
                            }}
                            className="shrink-0 rounded border-white/30 bg-black/60 text-violeta"
                          />
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            loading="lazy"
                            className="h-9 w-9 shrink-0 rounded-md object-cover border border-white/10 bg-black/40"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{item.nombre}</span>
                            <span className="block truncate text-[11px] text-white/55">
                              {item.tienda ? `${item.tienda} · ` : ''}{formatCOP(item.precio)}
                            </span>
                          </div>
                        </label>
                      )
                    })
                  })()}
                </div>
                {errorPrendasIniciales ? (
                  <p className="mt-1 text-[11px] text-[var(--sr-bad)]">{errorPrendasIniciales}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-white/50">
                    Debes seleccionar entre 1 y {MAX_PLAYLIST_ITEMS} prendas.
                  </p>
                )}
              </div>

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
