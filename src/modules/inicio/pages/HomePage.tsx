import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { RecommendedHangingRack } from '@/modules/catalogo/components/RecommendedHangingRack'
import { ProbadorIntro } from '../components/ProbadorIntro'
import { MapaCercano } from '../components/MapaCercano'
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
          {/* Columna izquierda: Catálogo */}
          <Link to="/catalogo" className="sr-bento-card sr-bento-card--tall">
            <img
              src="/img/representantes/C2.png"
              alt="Explorar catálogo de moda local"
              className="sr-bento-card__img"
            />
            <div className="sr-bento-card__shade" />
            <div className="sr-bento-card__body">
              <span className="sr-bento-pill">01 · Catálogo</span>
              <strong className="sr-bento-card__title">Prendas locales en tu talla</strong>
              <span className="sr-bento-card__sub">Filtra por estilo, color, precio y tienda</span>
            </div>
          </Link>

          {/* Columna central: CTAs principales + Playlists / Alertas */}
          <div className="sr-bento-center">
            <div className="sr-bento-ctas">
              <Link to="/catalogo" className="sr-bento-cta sr-bento-cta--primary">
                <span>Explorar catálogo</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link to="/probador" className="sr-bento-cta sr-bento-cta--outline">
                <span>Probarme en maniquí o IA</span>
              </Link>
            </div>

            <div className="sr-bento-subgrid">
              <Link to="/playlists" className="sr-bento-card sr-bento-card--mid">
                <img
                  src="/img/representantes/C1.png"
                  alt="Playlists de outfits"
                  className="sr-bento-card__img"
                />
                <div className="sr-bento-card__shade" />
                <div className="sr-bento-card__body">
                  <span className="sr-bento-pill">02 · Playlists</span>
                  <strong className="sr-bento-card__title">Arma y guarda tus looks</strong>
                  <span className="sr-bento-card__sub">Outfits de varias tiendas</span>
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

          {/* Columna derecha: Segunda mano + Mapa */}
          <div className="sr-bento-right">
            <Link to="/segunda-mano" className="sr-bento-card sr-bento-card--medium">
              <img
                src="/img/representantes/C5.png"
                alt="Moda circular y segunda mano"
                className="sr-bento-card__img"
              />
              <div className="sr-bento-card__shade" />
              <div className="sr-bento-card__body">
                <span className="sr-bento-pill">03 · Circular</span>
                <strong className="sr-bento-card__title">Segunda mano y donar</strong>
                <span className="sr-bento-card__sub">Compra, vende o dona a fundaciones</span>
              </div>
            </Link>

            <Link to="/mapa" className="sr-bento-mini sr-bento-mini--accent">
              <span className="sr-bento-mini__tag">04 · Mapa Bogotá</span>
              <strong>Tiendas y fundaciones cerca ↗</strong>
              <span>Explora puntos aliados por barrio</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Perchero recomendado compacto */}
      <section className="sr-inicio-bloque sr-inicio-rack-panel" aria-label="Recomendaciones según tu estilo">
        <div className="sr-inicio-section-head">
          <div>
            <p className="sr-inicio-kicker">Selección destacada</p>
            <h2 className="sr-inicio-section-title">Elegido para tu talla y estilo</h2>
          </div>
          <Link to="/catalogo" className="sr-inicio-enlace">
            Ver todo el catálogo →
          </Link>
        </div>

        <div className="sr-inicio-rack-compact">
          {user && <RecommendedHangingRack key={user.id} userId={String(user.id)} />}
        </div>
      </section>

      {/* 3. Probador Virtual */}
      <ProbadorIntro />

      {/* 4. Mapa cercano */}
      <MapaCercano />
    </div>
  )
}
