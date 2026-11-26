import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { RecommendedHangingRack } from '@/modules/catalogo/components/RecommendedHangingRack'
import { ProbadorIntro } from '../components/ProbadorIntro'
import { MapaCercano } from '../components/MapaCercano'
import './HomePage.css'

const HUB_ACCESOS = [
  {
    to: '/catalogo',
    titulo: 'Catálogo',
    desc: 'Explora prendas y filtra por tu talla',
    tag: 'Explorar',
  },
  {
    to: '/probador',
    titulo: 'Probador',
    desc: 'Arma tu look en maniquí o con IA',
    tag: 'Probar',
  },
  {
    to: '/playlists',
    titulo: 'Playlists',
    desc: 'Tus looks guardados y comunidad',
    tag: 'Looks',
  },
  {
    to: '/mapa',
    titulo: 'Mapa',
    desc: 'Tiendas y fundaciones cerca de ti',
    tag: 'Bogotá',
  },
  {
    to: '/segunda-mano',
    titulo: 'Segunda mano',
    desc: 'Compra, publica o dona ropa',
    tag: 'Circular',
  },
  {
    to: '/alertas',
    titulo: 'Mis alertas',
    desc: 'Avisos cuando vuelva tu talla',
    tag: 'Alertas',
  },
] as const

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
      <section className="sr-inicio-hub" aria-labelledby="inicioSaludo">
        <div className="sr-inicio-hub__top">
          <div>
            <p className="sr-inicio-kicker">Tu espacio en StyleRadar</p>
            <h1 id="inicioSaludo" className="sr-inicio-titulo">
              Hola, <span className="sr-inicio-acento">{primerNombre}</span>
            </h1>
            <p className="sr-inicio-descripcion">
              Desde aquí puedes buscar prendas, abrir el probador, revisar tus playlists o ubicar tiendas cercanas.
            </p>
          </div>
          <Link to="/perfil" className="sr-inicio-perfil-btn">
            Mi perfil y tallas
          </Link>
        </div>

        <form onSubmit={handleBuscar} className="sr-inicio-search" role="search" aria-label="Buscar en el catálogo">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="¿Qué buscas hoy? Ej. blazer, jeans, tenis…"
            aria-label="Buscar prendas, tiendas o estilos"
            className="sr-inicio-search__input"
          />
          <button type="submit" className="sr-inicio-search__btn">
            Buscar
          </button>
        </form>

        <nav className="sr-inicio-hub__grid" aria-label="Accesos rápidos a apartados">
          {HUB_ACCESOS.map((item) => (
            <Link key={item.to} to={item.to} className="sr-inicio-hub__card">
              <div className="sr-inicio-hub__card-head">
                <span className="sr-inicio-hub__tag">{item.tag}</span>
                <span className="sr-inicio-hub__arrow" aria-hidden="true">↗</span>
              </div>
              <strong className="sr-inicio-hub__title">{item.titulo}</strong>
              <span className="sr-inicio-hub__desc">{item.desc}</span>
            </Link>
          ))}
        </nav>
      </section>

      <section className="sr-inicio-bloque sr-inicio-recomendados" aria-label="Recomendaciones según tu estilo">
        {user && <RecommendedHangingRack key={user.id} userId={String(user.id)} />}
        <div className="sr-inicio-recomendados__pie">
          <Link to="/catalogo" className="sr-inicio-enlace">
            Ver todo el catálogo →
          </Link>
        </div>
      </section>

      <ProbadorIntro />

      <MapaCercano />
    </div>
  )
}
