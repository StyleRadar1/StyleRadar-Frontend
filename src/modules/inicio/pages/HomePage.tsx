import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { ProbadorIntro } from '../components/ProbadorIntro'
import { MapaCercano } from '../components/MapaCercano'
import { RecomendadosTrail } from '../components/RecomendadosTrail'
import './HomePage.css'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const primerNombre = user?.name?.trim().split(/\s+/)[0] || 'de nuevo'

  const handleBuscar = (e: FormEvent) => {
    e.preventDefault()
    const q = busqueda.trim()
    navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo')
  }

  return (
    <div className="sr-inicio">
      <div className="sr-inicio-fondo" aria-hidden="true" />
      {/* 1. Hero Editorial Bento: bienvenida, buscador y entrada clara a todas las secciones */}
      <section className="sr-inicio-bento" aria-labelledby="inicioSaludo">
        <div className="sr-inicio-bento__header">
          <div className="sr-inicio-bento__headline">
            <p className="sr-inicio-kicker">Hola, {primerNombre} · Tu espacio en StyleRadar</p>
            <h1 id="inicioSaludo" className="sr-inicio-bento__title">
              TU RADAR DE MODA LOCAL EN BOGOTÁ
            </h1>
          </div>

          <div className="sr-inicio-bento__aside">
            <p className="sr-inicio-bento__lead">
              Explora prendas en tu talla, arma playlists, pruébate ropa con IA y ubica tiendas o fundaciones cercanas.
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

        <div className="sr-inicio-bento__grid">
          {/* Columna izquierda: Estrenos y curaduría en tu talla */}
          <Link to="/catalogo" className="sr-bento-card sr-bento-card--tall">
            <img
              src="/img/representantes/C2.png"
              alt="Novedades de moda local en tu talla"
              className="sr-bento-card__img"
            />
            <div className="sr-bento-card__shade" />
            <div className="sr-bento-card__body">
              <span className="sr-bento-pill">Novedades</span>
              <strong className="sr-bento-card__title">Estrenos en tu talla hoy</strong>
              <span className="sr-bento-card__sub">Prendas recién publicadas en Bogotá</span>
            </div>
          </Link>

          {/* Columna central: Acciones de intención + Looks / Perfil / Alertas */}
          <div className="sr-bento-center">
            <div className="sr-bento-ctas">
              <Link to="/catalogo" className="sr-bento-cta sr-bento-cta--primary">
                <span>Ver prendas en mi talla</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link to="/probador" className="sr-bento-cta sr-bento-cta--outline">
                <span>Probarme un look ahora</span>
              </Link>
            </div>

            <div className="sr-bento-subgrid">
              <Link to="/playlists" className="sr-bento-card sr-bento-card--mid">
                <img
                  src="/img/representantes/C1.png"
                  alt="Looks de la comunidad"
                  className="sr-bento-card__img"
                />
                <div className="sr-bento-card__shade" />
                <div className="sr-bento-card__body">
                  <span className="sr-bento-pill">Inspiración</span>
                  <strong className="sr-bento-card__title">Looks de la comunidad</strong>
                  <span className="sr-bento-card__sub">Combinaciones listas para probar</span>
                </div>
              </Link>

              <div className="sr-bento-mini-stack">
                <Link to="/perfil" className="sr-bento-mini">
                  <span className="sr-bento-mini__tag">Tu cuenta</span>
                  <strong>Mi perfil y tallas ↗</strong>
                  <span>Ajusta medidas y preferencias</span>
                </Link>
                <Link to="/alertas" className="sr-bento-mini">
                  <span className="sr-bento-mini__tag">Seguimiento</span>
                  <strong>Mis alertas ↗</strong>
                  <span>Avisos cuando vuelva tu talla</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Columna derecha: Hallazgos circulares + Donar */}
          <div className="sr-bento-right">
            <Link to="/segunda-mano" className="sr-bento-card sr-bento-card--medium">
              <img
                src="/img/representantes/C5.png"
                alt="Hallazgos de segunda mano"
                className="sr-bento-card__img"
              />
              <div className="sr-bento-card__shade" />
              <div className="sr-bento-card__body">
                <span className="sr-bento-pill">Circular</span>
                <strong className="sr-bento-card__title">Hallazgos de segunda mano</strong>
                <span className="sr-bento-card__sub">Piezas únicas a mejor precio</span>
              </div>
            </Link>

            <Link to="/donar" className="sr-bento-mini sr-bento-mini--accent">
              <span className="sr-bento-mini__tag">Impacto social</span>
              <strong>Donar ropa a fundaciones ↗</strong>
              <span>Dale una segunda vida a tus prendas</span>
            </Link>
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
