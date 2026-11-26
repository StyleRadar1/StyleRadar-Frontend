import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { playlistService } from '@/modules/catalogo/services/playlistService'
import type { PlaylistDto } from '@/modules/catalogo/types/playlist.dto'
import { alertService } from '@/modules/soporte/services/alertService'
import { getUserMeasurements, loadLookFromStorage } from '@/modules/experiencia/utils/lookEngine'
import { ProbadorIntro } from '../components/ProbadorIntro'
import { MapaCercano } from '../components/MapaCercano'
import { RecomendadosTrail } from '../components/RecomendadosTrail'
import './HomePage.css'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [playlists, setPlaylists] = useState<PlaylistDto[]>([])
  const [alertStats, setAlertStats] = useState<{ alertas: number; busquedas: number } | null>(null)

  const nombreUsuario = user?.name?.trim() || 'de nuevo'
  const medidas = getUserMeasurements()
  const lookGuardado = loadLookFromStorage()
  const prendasEnLook = Object.values(lookGuardado).filter(Boolean).length

  useEffect(() => {
    let activo = true
    if (user?.id) {
      playlistService
        .getMine(String(user.id))
        .then(async (mine) => {
          if (mine.length > 0) return mine
          const saved = await playlistService.getSaved(String(user.id)).catch(() => [])
          if (saved.length > 0) return saved
          return playlistService.getAll().catch(() => [])
        })
        .then((list) => {
          if (activo) setPlaylists(list.slice(0, 3))
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
    }
    return () => {
      activo = false
    }
  }, [user?.id])

  const handleBuscar = (e: FormEvent) => {
    e.preventDefault()
    const q = busqueda.trim()
    navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo')
  }

  return (
    <div className="sr-inicio">
      <div className="sr-inicio-fondo" aria-hidden="true" />
      {/* 1. Home personal: saludo con nombre de usuario + tus playlists, look, tallas y alertas */}
      <section className="sr-inicio-bento" aria-labelledby="inicioSaludo">
        <div className="sr-inicio-bento__header">
          <div className="sr-inicio-bento__headline">
            <p className="sr-inicio-kicker">Tu lugar en StyleRadar</p>
            <h1 id="inicioSaludo" className="sr-inicio-bento__title">
              Hola, <span className="sr-inicio-acento">{nombreUsuario}</span>
            </h1>
          </div>

          <div className="sr-inicio-bento__aside">
            <p className="sr-inicio-bento__lead">
              Aquí tienes tus playlists recientes, tu look en el probador, tus tallas y tus alertas.
            </p>
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
          </div>
        </div>

        <div className="sr-inicio-personal-grid">
          {/* Columna izquierda: Últimas playlists */}
          <div className="sr-personal-card sr-personal-card--playlists">
            <div className="sr-personal-card__head">
              <div>
                <span className="sr-bento-mini__tag">Tus colecciones</span>
                <h2 className="sr-personal-card__title">Últimas playlists</h2>
              </div>
              <Link to="/playlists" className="sr-inicio-enlace">
                Ver todas →
              </Link>
            </div>

            {playlists.length > 0 ? (
              <ul className="sr-personal-playlists">
                {playlists.map((pl) => {
                  const thumb = pl.portadaUrl || pl.prendas?.[0]?.imagen || '/img/productos/blazer-oversize.jpg'
                  return (
                    <li key={pl.id}>
                      <Link to={`/playlists/${pl.id}`} className="sr-personal-playlist-item">
                        <img src={thumb} alt="" className="sr-personal-playlist-img" />
                        <div className="sr-personal-playlist-meta">
                          <strong>{pl.nombre}</strong>
                          <span>{pl.prendas?.length ?? 0} prendas · {pl.visibilidad === 'PUBLICA' ? 'Pública' : 'Privada'}</span>
                        </div>
                        <span aria-hidden="true" className="sr-personal-playlist-go">↗</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="sr-personal-empty">
                <p>Todavía no tienes playlists guardadas.</p>
                <Link to="/playlists" className="sr-bento-cta sr-bento-cta--outline">
                  Crear mi primera playlist →
                </Link>
              </div>
            )}
          </div>

          {/* Columna central: Look guardado + Perfil y tallas */}
          <div className="sr-personal-col">
            <div className="sr-personal-card">
              <div className="sr-personal-card__head">
                <div>
                  <span className="sr-bento-mini__tag">Probador</span>
                  <h2 className="sr-personal-card__title">Tu look actual</h2>
                </div>
                <span className="sr-personal-badge">
                  {prendasEnLook > 0 ? `${prendasEnLook} puesta${prendasEnLook === 1 ? '' : 's'}` : 'Disponible'}
                </span>
              </div>
              <p className="sr-personal-card__desc">
                {prendasEnLook > 0
                  ? 'Tienes prendas cargadas en tu maniquí listas para seguir combinando.'
                  : 'Arma un outfit en el maniquí o pruébate prendas con tu foto.'}
              </p>
              <Link to="/probador" className="sr-bento-cta sr-bento-cta--primary">
                <span>{prendasEnLook > 0 ? 'Seguir probando' : 'Abrir probador'}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <Link to="/perfil" className="sr-bento-mini">
              <span className="sr-bento-mini__tag">Tu perfil y tallas</span>
              <strong>Superior {medidas.superior} · Pantalón {medidas.inferior} · Calzado {medidas.calzado} ↗</strong>
              <span>Ajusta tus medidas corporales y preferencias de estilo</span>
            </Link>
          </div>

          {/* Columna derecha: Alertas + Accesos de cuenta */}
          <div className="sr-personal-col">
            <Link to="/alertas" className="sr-bento-mini sr-bento-mini--accent">
              <span className="sr-bento-mini__tag">Seguimiento</span>
              <strong>
                {alertStats
                  ? `${alertStats.alertas} alerta${alertStats.alertas === 1 ? '' : 's'} activa${alertStats.alertas === 1 ? '' : 's'} · ${alertStats.busquedas} búsqueda${alertStats.busquedas === 1 ? '' : 's'} ↗`
                  : 'Mis alertas y búsquedas ↗'}
              </strong>
              <span>Te avisamos cuando vuelva tu talla o baje un precio</span>
            </Link>

            <div className="sr-personal-card sr-personal-card--quick">
              <span className="sr-bento-mini__tag">Tus accesos</span>
              <div className="sr-personal-quick-grid">
                <Link to="/perfil/pagos" className="sr-personal-quick-btn">Mis pagos ↗</Link>
                <Link to="/mensajes" className="sr-personal-quick-btn">Mensajes ↗</Link>
                <Link to="/segunda-mano/publicar" className="sr-personal-quick-btn">Vender ropa ↗</Link>
                <Link to="/donar" className="sr-personal-quick-btn">Donar ropa ↗</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {user && <RecomendadosTrail key={`trail-${user.id}`} userId={String(user.id)} />}

      {/* 3. Probador y Mapa: dos cuadros a la par */}
      <div className="sr-inicio-duo">
        <ProbadorIntro />
        <MapaCercano />
      </div>

      {/* 4. Marco legal y soporte */}
      <section className="sr-inicio-bloque sr-inicio-legal" aria-label="Marco legal y soporte">
        <div className="sr-inicio-legal__info">
          <p className="sr-inicio-kicker">Transparencia y respaldo</p>
          <h2 className="sr-inicio-legal__title">Marco legal y derechos del usuario</h2>
        </div>
        <nav className="sr-inicio-legal__links" aria-label="Documentos legales">
          <Link to="/legal" className="sr-inicio-legal__pill">Marco legal</Link>
          <Link to="/legal/terminos" className="sr-inicio-legal__pill">Términos y condiciones</Link>
          <Link to="/legal/datos-personales" className="sr-inicio-legal__pill">Habeas Data</Link>
          <Link to="/legal/pqrs" className="sr-inicio-legal__pill">PQRS</Link>
          <Link to="/legal/centro-ayuda" className="sr-inicio-legal__pill">Centro de ayuda</Link>
        </nav>
      </section>
    </div>
  )
}
