import { useState, useRef, useCallback, useEffect } from 'react'
import './PlaylistsPage.css'

/* ================================================================
   PlaylistsPage — Carrusel interactivo de playlists de estilo
   Fiel al prototipo: .plx-sec, .plx-track, .plx-cover (grid 2×2),
   .plx-veil, .plx-meta, .plx-nav con prev/next y contador.
   ================================================================ */

/* ---------- Tipos ---------- */
interface PlaylistOwner {
  name: string
  initials: string
}

interface PlaylistData {
  id: string
  name: string
  owner: PlaylistOwner
  items: number
  total: number
  likes: number
  featured: boolean
  /** 4 imágenes para el grid 2×2 de la cover */
  images: string[]
  /** Hue de 0-360 para el gradiente de fondo */
  hue: number
}

/* ---------- Mock data fiel al prototipo ---------- */
const IMG = '/prototipo/assets/img/productos'

const PLAYLISTS: PlaylistData[] = [
  {
    id: 'p1',
    name: 'Bogotá After Dark',
    owner: { name: 'Valentina Ríos', initials: 'VR' },
    items: 8,
    total: 1_420_000,
    likes: 2_341,
    featured: false,
    images: [
      `${IMG}/blazer-oversize.jpg`,
      `${IMG}/vestido-largo-negro.jpg`,
      `${IMG}/botas-chelsea-de-plataforma.jpg`,
      `${IMG}/collar-de-cadena-fina.jpg`,
    ],
    hue: 270,
  },
  {
    id: 'p2',
    name: 'Ejecutivo Moderno',
    owner: { name: 'Santiago Duarte', initials: 'SD' },
    items: 6,
    total: 2_180_000,
    likes: 1_876,
    featured: false,
    images: [
      `${IMG}/traje-sastre-negro.jpg`,
      `${IMG}/corbata-de-seda.jpg`,
      `${IMG}/zapatos-oxford-negros.jpg`,
      `${IMG}/reloj-de-acero.jpg`,
    ],
    hue: 220,
  },
  {
    id: 'p3',
    name: 'Street Minimal',
    owner: { name: 'Camila Ospina', initials: 'CO' },
    items: 10,
    total: 890_000,
    likes: 3_102,
    featured: true,
    images: [
      `${IMG}/hoodie-negro.jpg`,
      `${IMG}/jean-ancho-azul.jpg`,
      `${IMG}/casual-retro-blancos.jpg`,
      `${IMG}/gafas-rectangulares.jpg`,
    ],
    hue: 180,
  },
  {
    id: 'p4',
    name: 'Cuero & Actitud',
    owner: { name: 'Andrés Mejía', initials: 'AM' },
    items: 7,
    total: 1_750_000,
    likes: 1_450,
    featured: false,
    images: [
      `${IMG}/gabardina-de-cuero.jpg`,
      `${IMG}/cinturon-de-cuero.jpg`,
      `${IMG}/r2c3-botas.jpg`,
      `${IMG}/r2c3-gafas-negras.jpg`,
    ],
    hue: 30,
  },
  {
    id: 'p5',
    name: 'Athleisure Bogotá',
    owner: { name: 'Laura Pineda', initials: 'LP' },
    items: 9,
    total: 670_000,
    likes: 2_890,
    featured: false,
    images: [
      `${IMG}/conjunto-tecnico-negro.jpg`,
      `${IMG}/r1c3-chaqueta-track.jpg`,
      `${IMG}/r1c3-tenis-running.jpg`,
      `${IMG}/gorra-deportiva-negra.jpg`,
    ],
    hue: 150,
  },
  {
    id: 'p6',
    name: 'Clásico Informal',
    owner: { name: 'Martín Lozano', initials: 'ML' },
    items: 5,
    total: 1_340_000,
    likes: 987,
    featured: false,
    images: [
      `${IMG}/saco-de-lana-negro.jpg`,
      `${IMG}/cardigan-gris-de-punto.jpg`,
      `${IMG}/r1c4-pantalon-negro.jpg`,
      `${IMG}/r1c4-oxford.jpg`,
    ],
    hue: 320,
  },
  {
    id: 'p7',
    name: 'Golden Hour',
    owner: { name: 'Isabella Torres', initials: 'IT' },
    items: 8,
    total: 1_560_000,
    likes: 1_234,
    featured: false,
    images: [
      `${IMG}/sueter-de-canale-crudo.jpg`,
      `${IMG}/cuello-tortuga-de-punto.jpg`,
      `${IMG}/reloj-rectangular-dorado.jpg`,
      `${IMG}/collar-medalla-dorado.jpg`,
    ],
    hue: 45,
  },
  {
    id: 'p8',
    name: 'Rebel Noir',
    owner: { name: 'Diego Vargas', initials: 'DV' },
    items: 7,
    total: 1_980_000,
    likes: 2_015,
    featured: false,
    images: [
      `${IMG}/chaqueta-con-arnes.jpg`,
      `${IMG}/r2c3-chaqueta-cuero.jpg`,
      `${IMG}/botas-de-plataforma.jpg`,
      `${IMG}/r2c3-reloj-negro.jpg`,
    ],
    hue: 0,
  },
]

/** Formatea un precio con separador de miles al estilo colombiano */
function money(n: number): string {
  return '$' + n.toLocaleString('es-CO')
}

/* ---------- Componente principal ---------- */
export default function PlaylistsPage() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(1)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  /* Actualizar estado de flechas según scroll */
  const updateArrows = useCallback(() => {
    const tr = trackRef.current
    if (!tr) return
    setCanPrev(tr.scrollLeft > 8)
    setCanNext(tr.scrollLeft + tr.clientWidth < tr.scrollWidth - 8)

    const firstChild = tr.firstElementChild as HTMLElement | null
    const cardWidth = firstChild?.offsetWidth || 300
    const idx = Math.round(tr.scrollLeft / (cardWidth + 18)) + 1
    setCurrentIndex(Math.min(PLAYLISTS.length, idx))
  }, [])

  /* Escuchar scroll */
  useEffect(() => {
    const tr = trackRef.current
    if (!tr) return
    const handler = () => requestAnimationFrame(updateArrows)
    tr.addEventListener('scroll', handler, { passive: true })
    updateArrows()
    return () => tr.removeEventListener('scroll', handler)
  }, [updateArrows])

  /* Navegación prev/next */
  const scroll = useCallback((direction: 1 | -1) => {
    const tr = trackRef.current
    if (!tr) return
    const firstChild = tr.firstElementChild as HTMLElement | null
    const cardWidth = firstChild?.offsetWidth || 300
    tr.scrollBy({ left: direction * (cardWidth + 18), behavior: 'smooth' })
  }, [])

  return (
    <div className="plx-page min-h-screen bg-[#15121b] text-[#e8e4ef]">
      <section className="plx-sec" id="colecciones">
        {/* ---- Cabecera de sección ---- */}
        <div className="sec-head">
          <h2>
            Playlists de <span>estilo</span>
          </h2>
          <div>
            <p>
              Outfits curados por la comunidad. Inspiración real de gente real en
              Bogotá. Encuentra tu próximo look o crea el tuyo.
            </p>
          </div>
        </div>

        {/* ---- Carrusel ---- */}
        <div className="plx-wrap">
          <div
            className="plx-track"
            ref={trackRef}
            role="list"
            tabIndex={0}
            aria-label="Carrusel de playlists de estilo"
          >
            {PLAYLISTS.map((pl, i) => (
              <a
                key={pl.id}
                className={`plx${pl.featured ? ' feat' : ''}`}
                href={`#/playlist/${pl.id}`}
                role="listitem"
                aria-label={`Playlist ${pl.name} de ${pl.owner.name}`}
              >
                {/* ---- Cover 2×2 ---- */}
                <div
                  className="plx-cover"
                  style={{ '--h': (i * 47) % 360 } as React.CSSProperties}
                >
                  {pl.images.map((src, j) => (
                    <span key={j}>
                      <img src={src} alt="" loading="lazy" />
                    </span>
                  ))}

                  {/* Veil gradient */}
                  <div className="plx-veil" />

                  {/* Badge: featured o rank */}
                  {pl.featured ? (
                    <span className="plx-feat-badge">★ Destacada</span>
                  ) : i < 3 ? (
                    <span className="plx-rank">Top {i + 1}</span>
                  ) : null}

                  {/* Título sobre la cover */}
                  <div className="plx-title">
                    <span className="lbl">Playlist de estilo</span>
                    <b>{pl.name}</b>
                  </div>

                  {/* Botón play */}
                  <span className="plx-play" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>

                {/* ---- Meta: avatar + info + likes ---- */}
                <div className="plx-meta">
                  <span className="plx-av">{pl.owner.initials}</span>
                  <div>
                    <b>{pl.owner.name}</b>
                    <span className="plx-info">
                      {pl.items} prendas · {money(pl.total)}
                    </span>
                  </div>
                  <em>♥ {pl.likes.toLocaleString('es-CO')}</em>
                </div>
              </a>
            ))}
          </div>

          {/* ---- Navegación ---- */}
          <div className="plx-nav">
            <span className="lbl">Explora las playlists</span>
            <span className="plx-counter">
              {String(currentIndex).padStart(2, '0')} /{' '}
              {String(PLAYLISTS.length).padStart(2, '0')}
            </span>
            <button
              className="plx-btn"
              disabled={!canPrev}
              onClick={() => scroll(-1)}
              aria-label="Playlist anterior"
            >
              ←
            </button>
            <button
              className="plx-btn"
              disabled={!canNext}
              onClick={() => scroll(1)}
              aria-label="Playlist siguiente"
            >
              →
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
