import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { formatCOP } from '@/modules/core/utils/format'
import { playlistService, resolvePlaylistCreatorName } from '@/modules/catalogo/services/playlistService'
import type { PlaylistDto } from '@/modules/catalogo/types/playlist.dto'
import { alertService } from '@/modules/soporte/services/alertService'
import { chatService } from '@/modules/soporte/services/chatService'
import type { ConversacionDto } from '@/modules/soporte/types/chat.dto'
import { useUserPlan } from '@/modules/transacciones/hooks/useUserPlan'
import { PLAN_LABEL } from '@/modules/transacciones/types/plan.dto'
import { getUserMeasurements } from '@/modules/experiencia/utils/lookEngine'
import { usuarioService } from '@/modules/identidad/services/usuarioService'
import { ProbadorIntro } from '../components/ProbadorIntro'
import { MapaCercano } from '../components/MapaCercano'
import { RecomendadosTrail } from '../components/RecomendadosTrail'
import './HomePage.css'

type PlaylistTab = 'mine' | 'saved' | 'explore'

const ESTILOS_RAPIDOS = [
  { label: 'Urbano', to: '/catalogo?estilo=URBANO' },
  { label: 'Casual', to: '/catalogo?estilo=CASUAL' },
  { label: 'Formal', to: '/catalogo?estilo=FORMAL' },
  { label: 'Vintage', to: '/catalogo?estilo=VINTAGE' },
  { label: 'Segunda mano', to: '/segunda-mano' },
] as const

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const reducir = useReducedMotion()
  const [busqueda, setBusqueda] = useState('')
  const [tab, setTab] = useState<PlaylistTab>('mine')
  const [minePlaylists, setMinePlaylists] = useState<PlaylistDto[]>([])
  const [savedPlaylists, setSavedPlaylists] = useState<PlaylistDto[]>([])
  const [explorePlaylists, setExplorePlaylists] = useState<PlaylistDto[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [busyLikeId, setBusyLikeId] = useState<string | null>(null)
  const [busySaveId, setBusySaveId] = useState<string | null>(null)
  const [alertStats, setAlertStats] = useState<{ alertas: number; busquedas: number } | null>(null)
  const [chats, setChats] = useState<ConversacionDto[]>([])
  const { plan: planActual, details: planDetails } = useUserPlan(Boolean(user))

  const planResuelto = planActual ?? 'RADAR'
  const planNombre = PLAN_LABEL[planResuelto]
  const fechaLimiteStr = planDetails?.periodEndsAt || planDetails?.fechaFin || planDetails?.proximoCobro
  const tiempoRestante = useMemo(() => {
    if (planResuelto !== 'RADAR_PLUS') return 'Plan gratuito · Sin vencimiento'
    if (!fechaLimiteStr) return 'Suscripción activa'
    const endMs = new Date(fechaLimiteStr).getTime()
    if (!Number.isFinite(endMs)) return 'Suscripción activa'
    const diffDias = Math.max(0, Math.ceil((endMs - Date.now()) / 86_400_000))
    const fechaTxt = new Date(endMs).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    if (diffDias === 0) return `Último día de tu periodo (${fechaTxt})`
    return `Te quedan ${diffDias} día${diffDias === 1 ? '' : 's'} (hasta el ${fechaTxt})`
  }, [planResuelto, fechaLimiteStr])

  const nombreUsuario = user?.name?.trim() || 'de nuevo'
  const [medidas, setMedidas] = useState(() => getUserMeasurements())

  useEffect(() => {
    const onSizesUpdated = () => setMedidas(getUserMeasurements())
    window.addEventListener('sr:profile-sizes-updated', onSizesUpdated)
    let activo = true
    if (user?.id && user.role === 'BUYER') {
      usuarioService
        .me()
        .then((perfil) => {
          if (!activo || !perfil?.sizesByGarmentType) return
          const s = perfil.sizesByGarmentType
          const base = getUserMeasurements()
          setMedidas({
            superior: s.TOP?.[0] || base.superior,
            inferior: s.BOTTOM?.[0] || base.inferior,
            calzado: s.FOOTWEAR?.[0] || base.calzado,
          })
        })
        .catch(() => {})
    }
    return () => {
      activo = false
      window.removeEventListener('sr:profile-sizes-updated', onSizesUpdated)
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    let activo = true
    if (user?.id) {
      const uid = String(user.id)
      Promise.all([
        playlistService.getMine(uid).catch(() => []),
        playlistService.getSaved(uid).catch(() => []),
        playlistService.getAll().catch(() => []),
      ])
        .then(([mine, saved, all]) => {
          if (!activo) return
          setMinePlaylists(mine)
          setSavedPlaylists(saved)
          setExplorePlaylists(all)
          if (mine.length === 0 && saved.length > 0) setTab('saved')
          else if (mine.length === 0 && saved.length === 0 && all.length > 0) setTab('explore')
        })
        .catch(() => {})

      alertService
        .summary()
        .then((res) => {
          if (activo) {
            setAlertStats({
              alertas: res.alertas.filter((a) => a.activa).length,
              busquedas: res.busquedas.length,
            })
          }
        })
        .catch(() => {})

      chatService
        .conversations()
        .then((list) => {
          if (activo) setChats(list.slice(0, 3))
        })
        .catch(() => {})
    }
    return () => {
      activo = false
    }
  }, [user?.id])

  const listaActual = tab === 'mine' ? minePlaylists : tab === 'saved' ? savedPlaylists : explorePlaylists
  const safeIndex = listaActual.length > 0 ? activeIndex % listaActual.length : 0
  const playlistActiva = listaActual[safeIndex] ?? null

  const cambiarTab = (next: PlaylistTab) => {
    setTab(next)
    setActiveIndex(0)
  }

  const moverPlaylist = (delta: number) => {
    if (listaActual.length <= 1) return
    setActiveIndex((prev) => (prev + delta + listaActual.length) % listaActual.length)
  }

  const updatePlaylistEnListas = (id: string, patch: Partial<PlaylistDto>) => {
    const mapFn = (list: PlaylistDto[]) => list.map((p) => (p.id === id ? { ...p, ...patch } : p))
    setMinePlaylists(mapFn)
    setSavedPlaylists(mapFn)
    setExplorePlaylists(mapFn)
  }

  const handleToggleLike = async (pl: PlaylistDto) => {
    if (busyLikeId === pl.id) return
    setBusyLikeId(pl.id)
    try {
      const res = await playlistService.toggleLike(pl.id)
      updatePlaylistEnListas(pl.id, {
        likes: res.likes,
        liked: res.liked ?? !pl.liked,
      })
    } catch {
      // Silencioso si no hay sesión o falla red
    } finally {
      setBusyLikeId(null)
    }
  }

  const handleToggleSave = async (pl: PlaylistDto) => {
    if (busySaveId === pl.id) return
    setBusySaveId(pl.id)
    try {
      const res = await playlistService.toggleSave(pl.id)
      const nextSaved = res.saved ?? res.esGuardada ?? !(pl.saved ?? pl.esGuardada)
      updatePlaylistEnListas(pl.id, {
        guardados: res.guardados,
        saved: nextSaved,
        esGuardada: nextSaved,
      })
    } catch {
      // Silencioso
    } finally {
      setBusySaveId(null)
    }
  }

  const handleBuscar = (e: FormEvent) => {
    e.preventDefault()
    const q = busqueda.trim()
    navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo')
  }

  return (
    <div className="sr-inicio">
      <div className="sr-inicio-fondo" aria-hidden="true" />
      {/* 1. Home personal interactivo: saludo, playlists interactivas, look actual, tallas y alertas */}
      <section className="sr-inicio-bento" aria-labelledby="inicioSaludo">
        <div className="sr-inicio-bento__header">
          <div className="sr-inicio-bento__headline">
            <p className="sr-inicio-kicker">Tu lugar en StyleRadar</p>
            <h1 id="inicioSaludo" className="sr-inicio-bento__title">
              Hola, <span className="sr-inicio-acento">{nombreUsuario}</span>
            </h1>
            <div className="sr-personal-stats" aria-label="Resumen de tu cuenta">
              <Link to="/perfil" className="sr-personal-stat-pill">
                Tallas {medidas.superior} · {medidas.inferior} · {medidas.calzado}
              </Link>
              <Link to="/playlists" className="sr-personal-stat-pill">
                {minePlaylists.length} playlists · {savedPlaylists.length} guardadas
              </Link>
              <Link to="/alertas" className="sr-personal-stat-pill">
                {alertStats ? `${alertStats.alertas} alertas activas` : 'Mis alertas'}
              </Link>
            </div>
          </div>

          <div className="sr-inicio-bento__aside">
            <form onSubmit={handleBuscar} className="sr-inicio-search" role="search" aria-label="Buscar en el catálogo">
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar prenda, tienda o estilo…"
                aria-label="Buscar prendas, tiendas o estilos"
                className="sr-inicio-search__input"
              />
              <button type="submit" className="sr-inicio-search__btn">
                Buscar
              </button>
            </form>
            <div className="sr-personal-chips" aria-label="Explorar por estilo">
              {ESTILOS_RAPIDOS.map((item) => (
                <Link key={item.label} to={item.to} className="sr-personal-chip">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="sr-inicio-personal-grid sr-inicio-personal-grid--interactive">
          {/* Columna izquierda: Tus colecciones + tallas y seguimiento */}
          <div className="sr-personal-col-left">
            <div className="sr-personal-card sr-personal-card--playlists">
            <div className="sr-personal-card__head">
              <div>
                <span className="sr-bento-mini__tag">Tus colecciones</span>
                <h2 className="sr-personal-card__title">Playlists y looks</h2>
              </div>
              <div className="sr-personal-tabs" role="tablist" aria-label="Filtrar playlists">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'mine'}
                  onClick={() => cambiarTab('mine')}
                  className={`sr-personal-tab ${tab === 'mine' ? 'is-active' : ''}`}
                >
                  Mías ({minePlaylists.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'saved'}
                  onClick={() => cambiarTab('saved')}
                  className={`sr-personal-tab ${tab === 'saved' ? 'is-active' : ''}`}
                >
                  Guardadas ({savedPlaylists.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'explore'}
                  onClick={() => cambiarTab('explore')}
                  className={`sr-personal-tab ${tab === 'explore' ? 'is-active' : ''}`}
                >
                  Explorar ({explorePlaylists.length})
                </button>
              </div>
            </div>

            {playlistActiva ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${tab}-${playlistActiva.id}`}
                    initial={reducir ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducir ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="sr-pl-spotlight"
                  >
                    <div className="sr-pl-spotlight__top">
                      <Link to={`/playlists/${playlistActiva.id}`} className="sr-pl-spotlight__cover">
                        <img
                          src={
                            playlistActiva.portadaUrl ||
                            playlistActiva.prendas?.[0]?.imagen ||
                            '/img/productos/blazer-oversize.jpg'
                          }
                          alt={playlistActiva.nombre}
                        />
                        {playlistActiva.estilo && (
                          <span className="sr-pl-spotlight__estilo">{playlistActiva.estilo}</span>
                        )}
                      </Link>

                      <div className="sr-pl-spotlight__info">
                        <div className="sr-pl-spotlight__meta-row">
                          <span>{resolvePlaylistCreatorName(playlistActiva, user, tab === 'mine')}</span>
                          <span>·</span>
                          <span>{playlistActiva.visibilidad === 'PUBLICA' ? 'Pública' : 'Privada'}</span>
                          <span>·</span>
                          <span>{playlistActiva.prendas?.length ?? 0} prendas</span>
                        </div>
                        <Link to={`/playlists/${playlistActiva.id}`} className="sr-pl-spotlight__name">
                          {playlistActiva.nombre}
                        </Link>
                        {playlistActiva.descripcion && (
                          <p className="sr-pl-spotlight__desc">{playlistActiva.descripcion}</p>
                        )}

                        <div className="sr-pl-spotlight__actions">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(playlistActiva)}
                            disabled={busyLikeId === playlistActiva.id}
                            aria-pressed={Boolean(playlistActiva.liked)}
                            className={`sr-pl-react-btn ${playlistActiva.liked ? 'is-liked' : ''}`}
                          >
                            <span aria-hidden="true">{playlistActiva.liked ? '♥' : '♡'}</span>
                            <span>{playlistActiva.likes}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSave(playlistActiva)}
                            disabled={busySaveId === playlistActiva.id}
                            aria-pressed={Boolean(playlistActiva.saved ?? playlistActiva.esGuardada)}
                            className={`sr-pl-react-btn ${(playlistActiva.saved ?? playlistActiva.esGuardada) ? 'is-saved' : ''}`}
                          >
                            <span aria-hidden="true">{(playlistActiva.saved ?? playlistActiva.esGuardada) ? '★' : '☆'}</span>
                            <span>{playlistActiva.guardados}</span>
                          </button>
                          <Link to={`/probador?playlist=${playlistActiva.id}`} className="sr-pl-action-pill">
                            Probar look
                          </Link>
                          <Link to={`/playlists/${playlistActiva.id}`} className="sr-pl-action-pill sr-pl-action-pill--primary">
                            Abrir →
                          </Link>
                        </div>
                      </div>
                    </div>

                    {playlistActiva.prendas && playlistActiva.prendas.length > 0 && (
                      <div className="sr-pl-garments" aria-label={`Prendas de ${playlistActiva.nombre}`}>
                        {playlistActiva.prendas.slice(0, 4).map((prenda) => (
                          <Link
                            key={prenda.id}
                            to={`/catalogo/${prenda.id}`}
                            className="sr-pl-garment-card"
                          >
                            <img src={prenda.imagen || '/img/productos/blazer-oversize.jpg'} alt={prenda.nombre} />
                            <div className="sr-pl-garment-card__body">
                              <strong>{prenda.nombre}</strong>
                              <span>{formatCOP(prenda.precio)}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="sr-pl-switcher">
                  <div className="sr-pl-switcher__pills">
                    {listaActual.slice(0, 5).map((pl, idx) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className={`sr-pl-switcher__pill ${idx === safeIndex ? 'is-active' : ''}`}
                      >
                        {pl.nombre}
                      </button>
                    ))}
                  </div>
                  {listaActual.length > 1 && (
                    <div className="sr-pl-switcher__arrows">
                      <button
                        type="button"
                        onClick={() => moverPlaylist(-1)}
                        aria-label="Playlist anterior"
                        className="sr-pl-arrow-btn"
                      >
                        ‹
                      </button>
                      <span className="sr-pl-counter">
                        {safeIndex + 1}/{listaActual.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => moverPlaylist(1)}
                        aria-label="Siguiente playlist"
                        className="sr-pl-arrow-btn"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="sr-personal-empty">
                <p>No hay playlists en esta pestaña todavía.</p>
                <div className="sr-personal-empty__actions">
                  {explorePlaylists.length > 0 && tab !== 'explore' && (
                    <button type="button" onClick={() => cambiarTab('explore')} className="sr-pl-action-pill">
                      Ver playlists de la comunidad
                    </button>
                  )}
                  <Link to="/playlists" className="sr-pl-action-pill sr-pl-action-pill--primary">
                    Crear playlist →
                  </Link>
                </div>
              </div>
            )}

          </div>

          {/* Mis tallas y seguimiento (sección independiente debajo de Tus colecciones) */}
          <div className="sr-personal-duo-mini mt-4">
            <Link to="/perfil" className="sr-bento-mini">
              <span className="sr-bento-mini__tag">Mis tallas</span>
              <strong>{medidas.superior} · {medidas.inferior} · {medidas.calzado} ↗</strong>
              <span>Editar medidas</span>
            </Link>
            <Link to="/alertas" className="sr-bento-mini sr-bento-mini--accent">
              <span className="sr-bento-mini__tag">Seguimiento</span>
              <strong>
                {alertStats ? `${alertStats.alertas} alertas ↗` : 'Mis alertas ↗'}
              </strong>
              <span>{alertStats ? `${alertStats.busquedas} búsquedas` : 'Tallas y precios'}</span>
            </Link>
          </div>
        </div>

          {/* Columna derecha: Últimos chats + Plan */}
          <div className="sr-personal-col">
            <div className="sr-personal-card">
              <div className="sr-personal-card__head">
                <div>
                  <span className="sr-bento-mini__tag">Tus mensajes</span>
                  <h2 className="sr-personal-card__title">Mis últimos chats</h2>
                </div>
                <Link to="/mensajes" className="sr-inicio-enlace">Ir a mensajes →</Link>
              </div>

              {chats.length > 0 ? (
                <ul className="sr-personal-chats">
                  {chats.map((c) => {
                    const iniciales = c.contacto.nombre
                      .trim()
                      .split(/\s+/)
                      .map((w) => w.charAt(0).toUpperCase())
                      .join('')
                      .slice(0, 2) || 'SR'
                    return (
                      <li key={c.id}>
                        <Link to={`/mensajes?c=${encodeURIComponent(c.id)}`} className="sr-personal-chat-item">
                          <span className="sr-personal-chat-avatar" aria-hidden="true">{iniciales}</span>
                          <div className="sr-personal-chat-meta">
                            <strong>{c.contacto.nombre}</strong>
                            <span>{c.ultimoMensaje || c.asunto}</span>
                          </div>
                          {c.noLeidos > 0 ? (
                            <span className="sr-personal-chat-unread" aria-label={`${c.noLeidos} sin leer`}>
                              {c.noLeidos}
                            </span>
                          ) : (
                            <span aria-hidden="true" className="sr-personal-playlist-go">↗</span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="sr-personal-empty">
                  <p>Aún no tienes conversaciones recientes.</p>
                  <Link to="/mensajes" className="sr-pl-action-pill">
                    Abrir mensajes →
                  </Link>
                </div>
              )}
            </div>

            <div className="sr-personal-card sr-personal-card--quick">
              <div className="sr-personal-card__head">
                <div>
                  <span className="sr-bento-mini__tag">Tu suscripción</span>
                  <h2 className="sr-personal-card__title">
                    Mi plan actual: <span className="sr-inicio-acento">{planNombre}</span>
                  </h2>
                </div>
                <span className={`sr-personal-badge ${planResuelto === 'RADAR_PLUS' ? 'sr-plan-badge--plus' : ''}`}>
                  {planNombre}
                </span>
              </div>
              <p className="sr-personal-card__desc">{tiempoRestante}</p>
              <Link to="/planes" className="sr-bento-cta sr-bento-cta--primary">
                <span>{planResuelto === 'RADAR_PLUS' ? 'Administrar o renovar plan' : 'Actualizar plan'}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Probador y Mapa: dos cuadros a la par */}
      <div className="sr-inicio-duo">
        <ProbadorIntro />
        <MapaCercano />
      </div>

      {/* 3. Elegido para tu talla (rastro interactivo de recomendaciones) */}
      {user && <RecomendadosTrail key={`trail-${user.id}`} userId={String(user.id)} />}
    </div>
  )
}
