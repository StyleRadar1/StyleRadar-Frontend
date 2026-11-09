import { useState } from 'react'
import { Link } from 'react-router-dom'
import './MapPreview.css'

export interface MapPlace {
  id: string
  name: string
  type: 'tienda' | 'fundacion'
  neighborhood: string
  address: string
  hours: string
  description: string
  x: number // porcentaje horizontal
  y: number // porcentaje vertical
  products: {
    name: string
    price: number
    image: string
  }[]
}

const PLACES_DATA: MapPlace[] = [
  {
    id: 'luna',
    name: 'Luna Store',
    type: 'tienda',
    neighborhood: 'Chapinero Alto',
    address: 'Cl. 65 # 4A-21',
    hours: 'Lun a Sáb 10:00 - 19:30',
    description: 'Moda urbana contemporánea, piezas oversize y calzado retro.',
    x: 67,
    y: 38,
    products: [
      { name: 'Camisa negra de popelina', price: 139000, image: '/prototipo/assets/img/productos/camisa-negra-de-popelina.jpg' },
      { name: 'Tenis blancos retro', price: 260000, image: '/prototipo/assets/img/productos/casual-retro-blancos.jpg' },
      { name: 'Gorra deportiva azul', price: 85000, image: '/prototipo/assets/img/productos/luna-gorra-azul.jpg' },
      { name: 'Jean ancho azul', price: 195000, image: '/prototipo/assets/img/productos/jean-ancho-azul.jpg' },
    ],
  },
  {
    id: 'nomada',
    name: 'Nómada Studio',
    type: 'tienda',
    neighborhood: 'Usaquén Colonial',
    address: 'Cra. 6 # 119-14',
    hours: 'Mar a Dom 11:00 - 20:00',
    description: 'Sastrería contemporánea, abrigos de lana virgen y marroquinería fina.',
    x: 76,
    y: 24,
    products: [
      { name: 'Abrigo largo camel', price: 420000, image: '/prototipo/assets/img/probador-miniaturas/abrigo.png' },
      { name: 'Saco de lana carbón', price: 395000, image: '/prototipo/assets/img/productos/saco-de-lana-negro.jpg' },
      { name: 'Pantalón de lana gris', price: 210000, image: '/prototipo/assets/img/productos/pantalon-gris-de-lana.jpg' },
      { name: 'Chaqueta de cuero café', price: 430000, image: '/prototipo/assets/img/probador-miniaturas/cuero.png' },
    ],
  },
  {
    id: 'lab',
    name: 'The Local Lab',
    type: 'tienda',
    neighborhood: 'Zona G',
    address: 'Cra. 5 # 69-26',
    hours: 'Lun a Sáb 11:00 - 19:00',
    description: 'Concept store de vanguardia: camisas premium, calzado artesanal y siluetas limpias.',
    x: 69,
    y: 35,
    products: [
      { name: 'Camisa Oxford blanca', price: 165000, image: '/prototipo/assets/img/productos/camiseta-blanca-de-algodon.jpg' },
      { name: 'Pantalón sastre negro', price: 189000, image: '/prototipo/assets/img/productos/pantalon-negro-recto.jpg' },
      { name: 'Blazer oversize carbón', price: 360000, image: '/prototipo/assets/img/productos/blazer-oversize.jpg' },
      { name: 'Corbata de seda', price: 55000, image: '/prototipo/assets/img/productos/corbata-de-seda.jpg' },
    ],
  },
  {
    id: 'kicks',
    name: 'Kicks Local',
    type: 'tienda',
    neighborhood: 'Chicó Norte',
    address: 'Cl. 93 # 12-45',
    hours: 'Todos los días 10:00 - 20:00',
    description: 'Calzado nacional de alta gama, sneakers de autor y zapatos formales.',
    x: 71,
    y: 29,
    products: [
      { name: 'Zapatos Oxford negros', price: 290000, image: '/prototipo/assets/img/productos/zapatos-oxford-negros.jpg' },
      { name: 'Botas Chelsea plataforma', price: 340000, image: '/prototipo/assets/img/productos/botas-chelsea-de-plataforma.jpg' },
      { name: 'Mocasines de charol', price: 280000, image: '/prototipo/assets/img/productos/mocasines-de-charol.jpg' },
      { name: 'Sneakers trail running', price: 270000, image: '/prototipo/assets/img/productos/urbana-trail.jpg' },
    ],
  },
  {
    id: 'abrigo',
    name: 'Fundación Abrigo',
    type: 'fundacion',
    neighborhood: 'Teusaquillo',
    address: 'Cra. 19 # 34-12',
    hours: 'Lun a Vie 09:00 - 17:00',
    description: 'Punto de recolección y donación de prendas para comunidades vulnerables.',
    x: 61,
    y: 41,
    products: [
      { name: 'Punto oficial de entrega', price: 0, image: '/prototipo/assets/img/general/f-abrigo.jpg' },
      { name: 'Taller de reparación textil', price: 0, image: '/prototipo/assets/img/general/second.jpg' },
      { name: 'Ropero comunitario', price: 0, image: '/prototipo/assets/img/general/about.jpg' },
      { name: 'Campañas de abrigo 2026', price: 0, image: '/prototipo/assets/img/general/f-dignidad.jpg' },
    ],
  },
  {
    id: 'suba',
    name: 'Fundación Manos Limpias',
    type: 'fundacion',
    neighborhood: 'Suba Centro',
    address: 'Cra. 91 # 145-20',
    hours: 'Mar a Sáb 10:00 - 16:30',
    description: 'Economía circular y reciclaje textil de segunda vida en el noroccidente de Bogotá.',
    x: 61,
    y: 11,
    products: [
      { name: 'Centro de acopio Suba', price: 0, image: '/prototipo/assets/img/general/f-suba.jpg' },
      { name: 'Reutilización creativa', price: 0, image: '/prototipo/assets/img/general/f-manos.jpg' },
      { name: 'Certificado de donación', price: 0, image: '/prototipo/assets/img/general/f-kennedy.jpg' },
      { name: 'Voluntariado semanal', price: 0, image: '/prototipo/assets/img/general/second.jpg' },
    ],
  },
]

const BOGOTA_ZONES = [
  { name: 'Usaquén', x: 489, y: 135 },
  { name: 'Suba', x: 391, y: 62 },
  { name: 'Chapinero', x: 428, y: 210 },
  { name: 'Engativá', x: 326, y: 117 },
  { name: 'Teusaquillo', x: 391, y: 230 },
  { name: 'Fontibón', x: 250, y: 164 },
  { name: 'Kennedy', x: 239, y: 233 },
  { name: 'Centro', x: 402, y: 283 },
  { name: 'Bosa', x: 160, y: 249 },
  { name: 'Zona G', x: 439, y: 196 },
  { name: 'Chicó', x: 456, y: 164 },
  { name: 'Cedritos', x: 478, y: 86 },
]

export function MapPreview() {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('luna')
  const [is3D, setIs3D] = useState(false)
  const [filterTienda, setFilterTienda] = useState(true)
  const [filterFundacion, setFilterFundacion] = useState(true)

  const selectedPlace = PLACES_DATA.find((p) => p.id === selectedPlaceId) || PLACES_DATA[0]

  const visiblePlaces = PLACES_DATA.filter((p) => {
    if (p.type === 'tienda' && !filterTienda) return false
    if (p.type === 'fundacion' && !filterFundacion) return false
    return true
  })

  return (
    <section
      className="pe-sec pe-mapa pe-anchor"
      id="pe-mapa"
      data-seccion="mapa"
      aria-labelledby="lmTitle"
    >
      <div className="pe-in">
        <div className="pe-mapa-head">
          <div className="pe-mapa-head-main">
            <p className="pe-kicker">Mapa interactivo</p>
            <h2 className="pe-h2" id="lmTitle">
              El radar en el <span>mapa</span>
            </h2>
          </div>
          <p className="pe-lead">
            Toca una tienda o fundación para ver sus detalles sin salir del mapa. Puedes filtrar por
            tipo o ver la ciudad completa.
          </p>
          <p className="pe-mapa-link">
            <Link className="lbl pill" to="/mapa">
              Abrir el mapa completo →
            </Link>
          </p>
        </div>

        <div className="lm-wrap">
          {/* Caja Interactiva del Mapa de Bogotá */}
          <div className="lm-box" id="lmBox">
            {/* Barra de controles superiores */}
            <div className="sr-map-top-bar">
              <button
                type="button"
                className={`sr-map-ctrl-pill ${is3D ? 'is-active' : ''}`}
                onClick={() => setIs3D(!is3D)}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 fill-none stroke-current stroke-2"
                  style={{ transform: is3D ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }}
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                <span>{is3D ? 'Vista Plana' : 'Vista 3D'}</span>
              </button>

              <button
                type="button"
                className="sr-map-ctrl-pill"
                onClick={() => setSelectedPlaceId('luna')}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="22" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="12" x2="2" y2="12" />
                  <line x1="12" y1="6" x2="12" y2="2" />
                  <line x1="12" y1="22" x2="12" y2="18" />
                </svg>
                <span>Ver toda Bogotá</span>
              </button>
            </div>

            {/* Plano real de Bogotá y pines del mapa original */}
            <div className={`lm-canvas-stage ${is3D ? 'is-3d' : ''}`}>
              <img
                className="lm-map-svg"
                src="/prototipo/assets/img/general/bog-map.jpg"
                alt="Mapa de Bogotá con la red urbana de calles"
                loading="lazy"
              />
              <div className="lm-map-zones" aria-hidden="true">
                {BOGOTA_ZONES.map((zone) => (
                  <span
                    key={zone.name}
                    style={{ left: `${(zone.x / 640) * 100}%`, top: `${(zone.y / 560) * 100}%` }}
                  >
                    {zone.name}
                  </span>
                ))}
              </div>
              <span className="lm-map-attribution">Mapa: © OpenStreetMap</span>

              {/* Pines interactivos sobre el mapa */}
              {visiblePlaces.map((place) => {
                const isSelected = selectedPlaceId === place.id

                return (
                  <button
                    key={place.id}
                    type="button"
                    className={`lm-pin ${isSelected ? 'is-selected' : ''} ${
                      place.type === 'fundacion' ? 'is-fundacion' : ''
                    }`}
                    style={{ left: `${place.x}%`, top: `${place.y}%` }}
                    onClick={() => setSelectedPlaceId(place.id)}
                    aria-label={`Ver ${place.name} en ${place.neighborhood}`}
                    aria-pressed={isSelected}
                  >
                    <i className={`sr-pin-shape ${place.type === 'fundacion' ? 'found' : 'store'}`} aria-hidden="true">
                      {place.type === 'fundacion' ? (
                        <svg className="sr-pin-ico" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      ) : (
                        <svg className="sr-pin-ico" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      )}
                    </i>
                  </button>
                )
              })}
            </div>

            {/* Leyenda y Filtro flotante */}
            <div className="sr-map-legend">
              <span className="lbl">Lugares en el Radar</span>
              <div className="sr-map-legend-items">
                <button
                  type="button"
                  className={`sr-map-legend-btn ${!filterTienda ? 'is-off' : ''}`}
                  onClick={() => setFilterTienda(!filterTienda)}
                >
                  <span className="sr-dot-tienda" />
                  <span>Boutiques y Tiendas</span>
                </button>
                <button
                  type="button"
                  className={`sr-map-legend-btn ${!filterFundacion ? 'is-off' : ''}`}
                  onClick={() => setFilterFundacion(!filterFundacion)}
                >
                  <span className="sr-dot-fundacion" />
                  <span>Fundaciones</span>
                </button>
              </div>
            </div>
          </div>

          {/* Panel lateral de inspección interactivo (.lm-pane) */}
          <aside className="lm-pane" id="lmPane" aria-live="polite">
            <span className="lbl">
              {selectedPlace.type === 'tienda' ? 'Boutique aliada' : 'Impacto social'} · {selectedPlace.neighborhood}
            </span>

            <h3>{selectedPlace.name}</h3>
            <p>{selectedPlace.description}</p>

            <div className="lm-meta-details">
              <div>
                Dirección: <b>{selectedPlace.address}</b>
              </div>
              <div>
                Horario: <b>{selectedPlace.hours}</b>
              </div>
            </div>

            {/* Cuadrícula de 4 prendas destacadas de la tienda */}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a98be0] block mb-2">
                {selectedPlace.type === 'tienda' ? 'Prendas destacadas en el radar' : 'Iniciativas activas'}
              </span>

              <div className="lm-items">
                {selectedPlace.products.map((prod, idx) => (
                  <Link
                    key={idx}
                    to={`/catalogo?tienda=${encodeURIComponent(selectedPlace.name)}`}
                    className="lm-items-item"
                  >
                    <span>
                      <img src={prod.image} alt={prod.name} loading="lazy" />
                    </span>
                    <b>{prod.name}</b>
                    <em>{prod.price > 0 ? `$${prod.price.toLocaleString('es-CO')}` : 'Sin costo'}</em>
                  </Link>
                ))}
              </div>
            </div>

            {/* Botones de acción del panel */}
            <div className="lm-a">
              <Link
                to={`/catalogo?tienda=${encodeURIComponent(selectedPlace.name)}`}
                className="lm-btn-main"
              >
                <span>Ver inventario completo</span>
                <span aria-hidden="true">↗</span>
              </Link>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  selectedPlace.address + ', Bogotá',
                )}`}
                target="_blank"
                rel="noreferrer"
                className="lm-btn-sub"
              >
                <span>Cómo llegar en Bogotá</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
