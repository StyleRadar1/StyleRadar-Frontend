import { useState, useMemo, useContext, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/modules/core/design-system'
import { ErrorState } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { mockSessionUser } from '@/modules/core/api/mock'
import { usePlaylists } from '../hooks/usePlaylists'
import { ITEMS } from '../mocks/items'
import { MAX_PLAYLIST_ITEMS, type PlaylistDto, type PlaylistVisibility } from '../types/playlist.dto'

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

  // Navegación por teclado en el carrusel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedPlaylist) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedPlaylist, handlePrev, handleNext])

  // Otras playlists para sección "Más playlists de estilo"
  const otrasPlaylists = useMemo(() => {
    return playlists
      .filter((p) => p.id !== selectedPlaylist?.id)
      .slice(0, 4)
  }, [playlists, selectedPlaylist?.id])

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
        className="min-h-screen bg-[#110e17] text-white px-4 py-8 sm:px-8 selection:bg-violeta selection:text-white"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 90% 40% at 50% 0%, rgba(80, 19, 184, 0.28), transparent 75%)',
        }}
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
          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wider text-white/50">
            <button
              type="button"
              onClick={handleVolver}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              ← Volver
            </button>
            <span>·</span>
            <Link to="/" className="hover:text-white">Inicio</Link>
            <span>/</span>
            <button type="button" onClick={handleVolver} className="hover:text-white">
              Playlists
            </button>
            <span>/</span>
            <span className="text-white/90 truncate max-w-xs">{selectedPlaylist.nombre}</span>
          </div>

          {/* Feedback Toast */}
          {mensajeExito && (
            <div role="status" className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200 backdrop-blur-md">
              {mensajeExito}
            </div>
          )}

          {/* BANNER PRINCIPAL HERO TIPO SPOTIFY CON VINILO PROTAGONISTA */}
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10 backdrop-blur-2xl shadow-2xl overflow-hidden">
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
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violeta/20 border border-violeta/40 px-2.5 py-0.5 text-[10px] font-bold text-violeta-claro">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En tornamesa
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
                    {prendas.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`group transition hover:bg-white/[0.04] ${
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
                              <p className="font-semibold text-white truncate text-xs">{p.nombre}</p>
                              <p className="text-[11px] text-white/50 truncate">
                                {p.noDisponible ? (
                                  <span className="text-amber-400 font-semibold italic">
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
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/90">
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
                  <p className="text-[11px] text-white/40">
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

  // Active playlist for carousel
  const activeCarouselPlaylist = carouselPlaylists[carouselIndex] ?? carouselPlaylists[0]

  // ==========================================
  // VISTA LISTA DE PLAYLISTS CON CARRUSEL 3D Y VINILO PROTAGONISTA
  // ==========================================
  return (
    <div
      className="min-h-screen bg-[#110e17] text-white px-4 py-8 sm:px-8 selection:bg-violeta selection:text-white overflow-x-hidden"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 90% 45% at 50% 0%, rgba(80, 19, 184, 0.25), transparent 75%)',
      }}
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

      <section className="mx-auto max-w-6xl">
        {/* Migas de pan */}
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
          <Link to="/" className="hover:text-white">Inicio</Link>
          <span>/</span>
          <span className="text-white/80">Playlists</span>
        </div>

        {/* Encabezado de la sección */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/10 pb-6">
          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-violeta-claro block mb-1">
              Colecciones en vinilo
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              Mis playlists
            </h2>
            <p className="mt-2 text-xs text-white/60">
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

        {/* ========================================== */}
        {/* CARRUSEL 3D COVER-FLOW CON DISCO DE VINILO */}
        {/* ========================================== */}
        <div className="relative mb-14 rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-8 pt-6 sm:pt-8 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Luz ambiental púrpura de fondo centrada en el vinilo */}
          <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-96 sm:h-96 bg-[#5013b8]/25 rounded-full blur-3xl pointer-events-none" />

          {/* Selector de pestañas para el carrusel */}
          <div className="relative z-30 mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setCarouselTab('todas')
                  setCarouselIndex(0)
                }}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                  carouselTab === 'todas'
                    ? 'bg-violeta text-white shadow-md shadow-purple-900/40'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Todas ({playlists.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setCarouselTab('creadas')
                  setCarouselIndex(0)
                }}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                  carouselTab === 'creadas'
                    ? 'bg-violeta text-white shadow-md shadow-purple-900/40'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Creadas por ti ({creadasPorTi.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setCarouselTab('guardadas')
                  setCarouselIndex(0)
                }}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                  carouselTab === 'guardadas'
                    ? 'bg-violeta text-white shadow-md shadow-purple-900/40'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Guardadas ({guardadas.length})
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-white/40">
              <span>Usa</span>
              <kbd className="rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-white/70">
                ←
              </kbd>
              <kbd className="rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-white/70">
                →
              </kbd>
              <span>para navegar</span>
            </div>
          </div>

          {/* Escenario 3D Cover Flow */}
          <div
            className="relative z-20 w-full pt-16 sm:pt-20 pb-4 select-none"
            style={{ perspective: '1100px' }}
          >
            {/* Botones de navegación laterales flotantes */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Playlist anterior"
              className="absolute left-1 sm:left-4 top-[58%] -translate-y-1/2 z-40 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition hover:scale-110 hover:border-violeta hover:bg-violeta/30 active:scale-95 shadow-2xl"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Playlist siguiente"
              className="absolute right-1 sm:right-4 top-[58%] -translate-y-1/2 z-40 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition hover:scale-110 hover:border-violeta hover:bg-violeta/30 active:scale-95 shadow-2xl"
            >
              ›
            </button>

            {/* Contenedor relativo de tarjetas 3D */}
            <div className="relative flex items-center justify-center h-[320px] sm:h-[380px]">
              {carouselPlaylists.map((pl, idx) => {
                let diff = idx - carouselIndex
                const total = carouselPlaylists.length
                if (total > 3) {
                  if (diff > total / 2) diff -= total
                  if (diff < -total / 2) diff += total
                }

                const isActive = diff === 0
                const isVisible = Math.abs(diff) <= 2

                // Transformaciones visuales 3D
                let transform = 'scale(0.5) translateZ(-300px)'
                let zIndex = 0
                let opacity = 0
                let pointerEvents: 'auto' | 'none' = 'none'

                if (diff === 0) {
                  transform = 'translateX(0%) translateZ(60px) rotateY(0deg) scale(1)'
                  zIndex = 30
                  opacity = 1
                  pointerEvents = 'auto'
                } else if (diff === -1) {
                  transform = 'translateX(-55%) translateZ(-70px) rotateY(26deg) scale(0.85)'
                  zIndex = 20
                  opacity = 0.75
                  pointerEvents = 'auto'
                } else if (diff === 1) {
                  transform = 'translateX(55%) translateZ(-70px) rotateY(-26deg) scale(0.85)'
                  zIndex = 20
                  opacity = 0.75
                  pointerEvents = 'auto'
                } else if (diff === -2) {
                  transform = 'translateX(-105%) translateZ(-160px) rotateY(38deg) scale(0.7)'
                  zIndex = 10
                  opacity = 0.35
                  pointerEvents = 'auto'
                } else if (diff === 2) {
                  transform = 'translateX(105%) translateZ(-160px) rotateY(-38deg) scale(0.7)'
                  zIndex = 10
                  opacity = 0.35
                  pointerEvents = 'auto'
                }

                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => handleSeleccionarPlaylist(pl)}
                    className={`absolute text-left transition-all duration-500 ease-out cursor-pointer group focus:outline-none ${
                      !isVisible ? 'pointer-events-none' : ''
                    }`}
                    style={{
                      transform,
                      zIndex,
                      opacity,
                      pointerEvents,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Contenedor del estuche + vinilo */}
                    <div className="relative w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72">
                      {/* Disco de vinilo saliendo por ARRIBA del estuche activo */}
                      {isActive && (
                        <div
                          className="absolute left-1/2 -translate-x-1/2 -top-[44%] sm:-top-[48%] w-[88%] h-[88%] sm:w-[92%] sm:h-[92%] z-0 pointer-events-none transition-transform duration-500 group-hover:-translate-y-3 drop-shadow-[0_-12px_35px_rgba(80,19,184,0.75)] animate-spin-vinyl"
                        >
                          <img
                            src="/img/vinyl-record.png"
                            alt="Disco de vinilo StyleRadar"
                            className="h-full w-full object-contain select-none"
                          />
                        </div>
                      )}

                      {/* Carátula del álbum */}
                      <div
                        className={`relative z-10 w-full h-full rounded-2xl overflow-hidden bg-[#e8dccb] border transition-all duration-300 ${
                          isActive
                            ? 'border-violeta/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(80,19,184,0.45)] ring-2 ring-violeta/40'
                            : 'border-white/10 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.7)] group-hover:border-white/30'
                        }`}
                      >
                        {pl.portadaUrl ? (
                          <img
                            src={pl.portadaUrl}
                            alt={pl.nombre}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <span className="text-5xl font-bold text-black/30">SR</span>
                          </div>
                        )}

                        {/* Brillo reflectivo de vinilo */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />

                        {/* Indicador en tornamesa */}
                        {isActive && (
                          <div className="absolute top-3 left-3 z-20">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-white/90 border border-white/15 shadow-lg">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              En tornamesa
                            </span>
                          </div>
                        )}

                        {/* Pie de portada con título y prendas */}
                        <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/55 to-transparent z-20">
                          <p className="text-white font-extrabold text-xs sm:text-base truncate drop-shadow">
                            {pl.nombre}
                          </p>
                          <p className="text-white/70 text-[10px] sm:text-[11px] truncate flex items-center gap-1.5 mt-0.5">
                            <span>{pl.creador.nombre}</span>
                            <span>·</span>
                            <span>{pl.prendas.length}/15 prendas · Hasta 15 prendas</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Indicadores de puntos (Dots) */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {carouselPlaylists.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir a playlist ${i + 1}`}
                onClick={() => setCarouselIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === carouselIndex
                    ? 'w-6 bg-violeta shadow-sm shadow-purple-500/50'
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Barra reproductor flotante inspirada en Spotify */}
          {activeCarouselPlaylist && (
            <div className="mt-6 mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Info de reproducción */}
              <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                <div className="h-11 w-11 shrink-0 rounded-xl overflow-hidden bg-[#e8dccb] border border-white/10 shadow">
                  <img
                    src={activeCarouselPlaylist.portadaUrl || '/img/productos/sueter-de-canale-crudo.jpg'}
                    alt="Portada activa"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Colección de estilo LP</span>
                  </p>
                  <p className="text-[11px] text-white/50 truncate">
                    {activeCarouselPlaylist.creador.nombre} · {activeCarouselPlaylist.visibilidad === 'PRIVADA' ? '🔒 Privada' : '👁️ Pública'}
                  </p>
                </div>
              </div>

              {/* Botones de control */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Anterior"
                  className="text-white/60 hover:text-white transition active:scale-90 p-1.5 text-sm"
                >
                  ⏮
                </button>
                <button
                  type="button"
                  onClick={() => handleSeleccionarPlaylist(activeCarouselPlaylist)}
                  className="flex items-center gap-2 rounded-full bg-violeta hover:bg-violeta-hover text-white text-xs font-bold px-4 py-2 shadow-lg shadow-purple-900/40 transition active:scale-95"
                >
                  <span>▶</span>
                  <span>Explorar prendas</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Siguiente"
                  className="text-white/60 hover:text-white transition active:scale-90 p-1.5 text-sm"
                >
                  ⏭
                </button>
              </div>

              {/* Métricas */}
              <div className="hidden md:flex items-center gap-2 text-xs text-white/40 font-mono">
                <span>{activeCarouselPlaylist.prendas.length}/15 prendas</span>
                <span>·</span>
                <span>{activeCarouselPlaylist.likes} likes</span>
              </div>
            </div>
          )}
        </div>
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
                  maxLength={40}
                  placeholder="Ej. Domingo en Usaquén"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-violeta"
                />
                <span className="mt-1 block text-[11px] text-white/40">Máximo 40 caracteres</span>
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

              <p className="text-[11px] text-white/50">
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
