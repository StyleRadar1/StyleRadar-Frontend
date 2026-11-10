import { useState, useRef, useCallback, useEffect } from 'react'
import './QuickTryOnModal.css'

/* ================================================================
   QuickTryOnModal — Probador Virtual Editorial Premium
   Experiencia inmersiva full-screen: maniquí central con capas de
   ropa superpuestas + panel lateral "Arma tu look" con catálogo.
   ================================================================ */

/* ---------- Tipos ---------- */
export interface TryOnItem {
  id: string
  name: string
  store: string
  price: number
  slot: string
  color: string
  layer: string
  image: string
}

export interface TryOnCategory {
  tab: string
  slot: string | null
  items: TryOnItem[]
}

/* ---------- Filtros de color para capas ---------- */
const COLOR_FILTERS: Record<string, string> = {
  blanco: 'none',
  celeste: 'sepia(1) hue-rotate(160deg) saturate(2.4) brightness(.9)',
  negro: 'brightness(.25) contrast(1.3)',
  hueso: 'sepia(.5) brightness(1.05)',
  carbon: 'brightness(.38)',
  camel: 'sepia(.9) hue-rotate(20deg) saturate(2) brightness(.85)',
  marino: 'sepia(1) hue-rotate(185deg) saturate(3) brightness(.55)',
  oliva: 'sepia(1) hue-rotate(60deg) saturate(1.8) brightness(.65)',
  cuero_negro: 'brightness(.3) contrast(1.4)',
  cuero_cafe: 'sepia(1) hue-rotate(10deg) saturate(2.2) brightness(.55)',
  gris: 'grayscale(1) brightness(.7)',
  vino: 'sepia(1) hue-rotate(300deg) saturate(2.6) brightness(.55)',
  none: 'none',
}

/* ---------- Rutas de capas del maniquí ---------- */
const LAYER_PATHS: Record<string, string> = {
  camisa: '/prototipo/assets/img/probador-capas/camisa.png',
  pantalon: '/prototipo/assets/img/probador-capas/pantalon.png',
  saco: '/prototipo/assets/img/probador-capas/saco.png',
  cuero: '/prototipo/assets/img/probador-capas/cuero.png',
  abrigo: '/prototipo/assets/img/probador-capas/abrigo.png',
  zapatos: '/prototipo/assets/img/probador-capas/zapatos.png',
  tenis: '/prototipo/assets/img/probador-capas/tenis.png',
  cinturon: '/prototipo/assets/img/probador-capas/cinturon.png',
  corbata: '/prototipo/assets/img/probador-capas/corbata.png',
  bufanda: '/prototipo/assets/img/probador-capas/bufanda.png',
  guantes: '/prototipo/assets/img/probador-capas/guantes.png',
}

/* Orden de renderizado Z de las capas (de atrás hacia adelante) */
const LAYER_ORDER = [
  'zapatos', 'tenis', 'camisa', 'pantalon', 'cinturon',
  'corbata', 'saco', 'cuero', 'abrigo', 'bufanda', 'guantes',
]

/* ---------- Catálogo de prendas ---------- */
const CATEGORIES_DATA: TryOnCategory[] = [
  {
    tab: 'Camisas',
    slot: 'camisa',
    items: [
      { id: 'cam-bl', name: 'Camisa Oxford blanca', store: 'The Local Lab', price: 165000, slot: 'camisa', color: 'blanco', layer: 'camisa', image: '/prototipo/assets/img/productos/camiseta-blanca-de-algodon.jpg' },
      { id: 'cam-ce', name: 'Camisa celeste algodón', store: 'Nómada Studio', price: 149000, slot: 'camisa', color: 'celeste', layer: 'camisa', image: '/prototipo/assets/img/probador-miniaturas/camisa.png' },
      { id: 'cam-ne', name: 'Camisa negra popelina', store: 'Luna Store', price: 139000, slot: 'camisa', color: 'negro', layer: 'camisa', image: '/prototipo/assets/img/productos/camisa-negra-de-popelina.jpg' },
      { id: 'cam-hu', name: 'Camisa hueso de lino', store: 'Segunda mano', price: 48000, slot: 'camisa', color: 'hueso', layer: 'camisa', image: '/prototipo/assets/img/probador-miniaturas/camisa.png' },
    ],
  },
  {
    tab: 'Pantalones',
    slot: 'pantalon',
    items: [
      { id: 'pan-gr', name: 'Pantalón de lana gris', store: 'Nómada Studio', price: 210000, slot: 'pantalon', color: 'carbon', layer: 'pantalon', image: '/prototipo/assets/img/probador-miniaturas/pantalon.png' },
      { id: 'pan-ne', name: 'Pantalón sastre negro', store: 'The Local Lab', price: 189000, slot: 'pantalon', color: 'negro', layer: 'pantalon', image: '/prototipo/assets/img/productos/r1c4-pantalon-negro.jpg' },
      { id: 'pan-ca', name: 'Chino camel', store: 'The Local Lab', price: 159000, slot: 'pantalon', color: 'camel', layer: 'pantalon', image: '/prototipo/assets/img/probador-miniaturas/pantalon.png' },
      { id: 'pan-ma', name: 'Pantalón azul marino', store: 'Segunda mano', price: 62000, slot: 'pantalon', color: 'marino', layer: 'pantalon', image: '/prototipo/assets/img/probador-miniaturas/pantalon.png' },
    ],
  },
  {
    tab: 'Chaquetas',
    slot: 'chaqueta',
    items: [
      { id: 'sac-ca', name: 'Saco de lana carbón', store: 'Nómada Studio', price: 395000, slot: 'chaqueta', color: 'carbon', layer: 'saco', image: '/prototipo/assets/img/productos/saco-de-lana-negro.jpg' },
      { id: 'sac-ma', name: 'Saco azul marino', store: 'The Local Lab', price: 360000, slot: 'chaqueta', color: 'marino', layer: 'saco', image: '/prototipo/assets/img/productos/blazer-oversize.jpg' },
      { id: 'sac-ol', name: 'Saco verde oliva', store: 'Segunda mano', price: 95000, slot: 'chaqueta', color: 'oliva', layer: 'saco', image: '/prototipo/assets/img/probador-miniaturas/saco.png' },
      { id: 'cue-ne', name: 'Chaqueta cuero negra', store: 'Nómada Studio', price: 450000, slot: 'chaqueta', color: 'cuero_negro', layer: 'cuero', image: '/prototipo/assets/img/productos/chaqueta-con-arnes.jpg' },
      { id: 'cue-ca', name: 'Chaqueta cuero café', store: 'Nómada Studio', price: 430000, slot: 'chaqueta', color: 'cuero_cafe', layer: 'cuero', image: '/prototipo/assets/img/probador-miniaturas/cuero.png' },
    ],
  },
  {
    tab: 'Abrigos',
    slot: 'abrigo',
    items: [
      { id: 'abr-ca', name: 'Abrigo largo camel', store: 'Nómada Studio', price: 420000, slot: 'abrigo', color: 'camel', layer: 'abrigo', image: '/prototipo/assets/img/probador-miniaturas/abrigo.png' },
      { id: 'abr-gr', name: 'Abrigo gris de lana', store: 'Segunda mano', price: 120000, slot: 'abrigo', color: 'gris', layer: 'abrigo', image: '/prototipo/assets/img/probador-miniaturas/abrigo.png' },
      { id: 'abr-ne', name: 'Abrigo negro', store: 'The Local Lab', price: 390000, slot: 'abrigo', color: 'negro', layer: 'abrigo', image: '/prototipo/assets/img/productos/gabardina-de-cuero.jpg' },
      { id: 'abr-vi', name: 'Abrigo vino', store: 'Nómada Studio', price: 410000, slot: 'abrigo', color: 'vino', layer: 'abrigo', image: '/prototipo/assets/img/probador-miniaturas/abrigo.png' },
    ],
  },
  {
    tab: 'Zapatos',
    slot: 'zapatos',
    items: [
      { id: 'zap-ne', name: 'Oxford negros', store: 'Kicks Local', price: 290000, slot: 'zapatos', color: 'cuero_negro', layer: 'zapatos', image: '/prototipo/assets/img/productos/zapatos-oxford-negros.jpg' },
      { id: 'zap-ca', name: 'Oxford café', store: 'Kicks Local', price: 290000, slot: 'zapatos', color: 'cuero_cafe', layer: 'zapatos', image: '/prototipo/assets/img/probador-miniaturas/zapatos.png' },
      { id: 'ten-bl', name: 'Tenis blancos', store: 'Luna Store', price: 260000, slot: 'zapatos', color: 'blanco', layer: 'tenis', image: '/prototipo/assets/img/productos/casual-retro-blancos.jpg' },
      { id: 'ten-gr', name: 'Tenis grises', store: 'Luna Store', price: 240000, slot: 'zapatos', color: 'gris', layer: 'tenis', image: '/prototipo/assets/img/probador-miniaturas/tenis.png' },
    ],
  },
  {
    tab: 'Accesorios',
    slot: 'accesorios',
    items: [
      { id: 'cor-ne', name: 'Corbata negra de seda', store: 'The Local Lab', price: 55000, slot: 'corbata', color: 'negro', layer: 'corbata', image: '/prototipo/assets/img/productos/corbata-de-seda.jpg' },
      { id: 'buf-gr', name: 'Bufanda espiga gris', store: 'Segunda mano', price: 38000, slot: 'bufanda', color: 'gris', layer: 'bufanda', image: '/prototipo/assets/img/probador-miniaturas/bufanda.png' },
      { id: 'cint', name: 'Cinturón de cuero', store: 'Nómada Studio', price: 95000, slot: 'cinturon', color: 'cuero_cafe', layer: 'cinturon', image: '/prototipo/assets/img/productos/cinturon-de-cuero.jpg' },
      { id: 'gua-ne', name: 'Guantes negros', store: 'Nómada Studio', price: 72000, slot: 'guantes', color: 'negro', layer: 'guantes', image: '/prototipo/assets/img/probador-miniaturas/guantes.png' },
    ],
  },
]

/* ---------- Formatear precio COP ---------- */
function money(n: number): string {
  return '$' + n.toLocaleString('es-CO')
}

/* ---------- Componente Principal ---------- */
interface QuickTryOnModalProps {
  isOpen: boolean
  onClose: () => void
  initialGarmentId?: string
}

export function QuickTryOnModal({ isOpen, onClose }: QuickTryOnModalProps) {
  /* Estado del probador */
  const [activeTab, setActiveTab] = useState('Camisas')
  const [wearing, setWearing] = useState<Record<string, TryOnItem>>({})
  const [sourceMode, setSourceMode] = useState<'mannequin' | 'photo'>('mannequin')
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(true)
  const [photoScale, setPhotoScale] = useState(1)
  const [photoOffset, setPhotoOffset] = useState({ x: 0, y: 0 })
  const fileRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  /* Computa el total y la cantidad de prendas activas */
  const wornItems = Object.values(wearing)
  const totalPrice = wornItems.reduce((sum, item) => sum + item.price, 0)
  const totalCount = wornItems.length
  const MAX_SLOTS = 4

  /* Mapa de layers activas para renderizar en el maniquí */
  const activeLayers: { layer: string; color: string; zIndex: number }[] = []
  for (const item of wornItems) {
    const zIndex = LAYER_ORDER.indexOf(item.layer)
    if (zIndex >= 0 && LAYER_PATHS[item.layer]) {
      activeLayers.push({ layer: item.layer, color: item.color, zIndex })
    }
  }
  activeLayers.sort((a, b) => a.zIndex - b.zIndex)

  /* Vestir / desvestir prenda */
  const toggleGarment = useCallback((item: TryOnItem) => {
    setWearing(prev => {
      const key = item.layer
      // Si ya la lleva puesta, la quita
      if (prev[key]?.id === item.id) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      // Si es del mismo slot pero otra prenda, la reemplaza
      return { ...prev, [key]: item }
    })
  }, [])

  /* Resetear look */
  const resetLook = useCallback(() => {
    setWearing({})
  }, [])

  /* Carga de foto */
  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      setUserPhoto(reader.result as string)
      setSourceMode('photo')
      setPhotoScale(1)
      setPhotoOffset({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
  }, [])

  /* Usar foto de ejemplo */
  const useExample = useCallback(() => {
    setUserPhoto('/prototipo/assets/img/general/ref.jpg')
    setSourceMode('photo')
    setPhotoScale(1)
    setPhotoOffset({ x: 0, y: 0 })
  }, [])

  /* Volver al maniquí */
  const backToMannequin = useCallback(() => {
    setSourceMode('mannequin')
    setUserPhoto(null)
  }, [])

  /* Drag to move photo */
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (sourceMode !== 'photo') return
    isDragging.current = true
    dragStart.current = { x: e.clientX - photoOffset.x, y: e.clientY - photoOffset.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [sourceMode, photoOffset])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    setPhotoOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }, [])

  const onPointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  /* Zoom con rueda del mouse */
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (sourceMode !== 'photo') return
    e.preventDefault()
    setPhotoScale(prev => Math.max(0.3, Math.min(3, prev + (e.deltaY > 0 ? -0.05 : 0.05))))
  }, [sourceMode])

  /* Escape para cerrar */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  /* Categoría activa */
  const currentCategory = CATEGORIES_DATA.find(c => c.tab === activeTab)

  if (!isOpen) return null

  return (
    <div className="cz-fullscreen" role="dialog" aria-modal="true" aria-label="Probador Virtual StyleRadar">
      {/* ═══════════════════════════════════════════════════════════════
          1. BARRA DE NAVEGACIÓN SUPERIOR
          ═══════════════════════════════════════════════════════════════ */}
      <nav className="cz-topbar">
        <div className="cz-topbar-left">
          <button className="cz-nav-back" onClick={onClose} aria-label="Volver">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            VOLVER
          </button>
          <span className="cz-nav-sep" aria-hidden="true">/</span>
          <span className="cz-nav-crumb">INICIO</span>
          <span className="cz-nav-sep" aria-hidden="true">/</span>
          <span className="cz-nav-crumb cz-nav-active">PROBADOR</span>
          <span className="cz-nav-sep" aria-hidden="true">/</span>
          <span className="cz-nav-crumb cz-nav-accent">ARMA TU LOOK</span>
        </div>

        <div className="cz-topbar-right">
          {sourceMode === 'photo' && (
            <button className="cz-nav-pill" onClick={backToMannequin}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 119 9"/><path d="M3 21V12h9"/></svg>
              Maniquí
            </button>
          )}
          {totalCount > 0 && (
            <button className="cz-nav-pill cz-nav-pill-reset" onClick={resetLook}>
              Limpiar todo
            </button>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════
          2. CANVAS CENTRAL DEL MANIQUÍ
          ═══════════════════════════════════════════════════════════════ */}
      <div className="cz-canvas-area">
        {/* Glow ambiental difuso detrás del maniquí */}
        <div className="cz-ambient-glow" aria-hidden="true" />

        <div
          className="cz-mannequin-stage"
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
        >
          {sourceMode === 'mannequin' ? (
            <>
              {/* Base del maniquí */}
              <img
                src="/prototipo/assets/img/general/maniqui.png"
                alt="Maniquí base de cuerpo entero"
                className="cz-mannequin-base"
                draggable={false}
              />

              {/* Capas de ropa superpuestas */}
              {activeLayers.map(({ layer, color }) => (
                <img
                  key={layer}
                  src={LAYER_PATHS[layer]}
                  alt=""
                  className="cz-mannequin-layer"
                  style={{
                    filter: COLOR_FILTERS[color] || 'none',
                    zIndex: LAYER_ORDER.indexOf(layer) + 10,
                  }}
                  draggable={false}
                />
              ))}
            </>
          ) : (
            /* Foto del usuario cargada */
            userPhoto && (
              <img
                src={userPhoto}
                alt="Tu foto"
                className="cz-user-photo"
                style={{
                  transform: `translate(${photoOffset.x}px, ${photoOffset.y}px) scale(${photoScale})`,
                  cursor: 'grab',
                }}
                draggable={false}
              />
            )
          )}

          {/* Sombra del piso */}
          <div className="cz-floor-shadow" aria-hidden="true" />
        </div>

        {/* Píldora flotante de precio */}
        <div className="cz-price-pill" aria-live="polite">
          <span className="cz-price-amount">{money(totalPrice)}</span>
          <span className="cz-price-sep">·</span>
          <span className="cz-price-count">
            {totalCount}/{MAX_SLOTS} PRENDAS{totalCount === 0 ? ' TODAVÍA' : ''}
          </span>
        </div>

        {/* Indicador zoom/drag si hay foto */}
        {sourceMode === 'photo' && (
          <div className="cz-photo-hint" aria-hidden="true">
            Arrastra para mover · Scroll para zoom
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          3. PANEL LATERAL DERECHO — "ARMA TU LOOK"
          ═══════════════════════════════════════════════════════════════ */}
      <aside className="cz-panel" aria-label="Panel de catálogo de prendas">
        {/* ---- Encabezado ---- */}
        <div className="cz-panel-header">
          <h2 className="cz-panel-title">
            Arma tu <span>look</span>
          </h2>
          <p className="cz-panel-desc">
            Elige hasta {MAX_SLOTS} prendas del catálogo y mira cómo se ven juntas.
            Todo es inventario real de tiendas de Bogotá.
          </p>

          {/* Acordeón de guía */}
          <button
            className="cz-guide-toggle"
            onClick={() => setShowGuide(prev => !prev)}
            aria-expanded={showGuide}
          >
            <span className="cz-guide-q">{showGuide ? '▾' : '▸'} ¿Primera vez aquí?</span>
          </button>
          {showGuide && (
            <div className="cz-guide-body">
              <ol className="cz-guide-steps">
                <li>Elige las prendas que te gusten del catálogo</li>
                <li>El maniquí se viste en tiempo real</li>
                <li>Carga tu foto para verte con el look</li>
                <li>Guarda o comparte tu combinación</li>
              </ol>
              <button className="cz-guide-ok" onClick={() => setShowGuide(false)}>
                ENTENDIDO
              </button>
            </div>
          )}
        </div>

        {/* ---- Bloque de carga de foto ---- */}
        <div className="cz-upload-block">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handlePhotoUpload}
            aria-label="Cargar foto personal"
          />
          <button
            className="cz-upload-btn"
            onClick={() => fileRef.current?.click()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            CARGAR FOTO
          </button>
          <button className="cz-example-btn" onClick={useExample}>
            <img
              src="/prototipo/assets/img/general/ref.jpg"
              alt="Ejemplo"
              className="cz-example-thumb"
            />
            USAR FOTO DE EJEMPLO
          </button>
        </div>

        {/* ---- Filtros de categorías (pills) ---- */}
        <div className="cz-filter-row" role="tablist" aria-label="Categorías de prendas">
          {CATEGORIES_DATA.map(cat => (
            <button
              key={cat.tab}
              role="tab"
              aria-selected={activeTab === cat.tab}
              className={`cz-filter-pill${activeTab === cat.tab ? ' active' : ''}`}
              onClick={() => setActiveTab(cat.tab)}
            >
              {cat.tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ---- Grid de prendas ---- */}
        <div className="cz-garment-grid" role="tabpanel" aria-label={`Prendas de ${activeTab}`}>
          {currentCategory?.items.map(item => {
            const isWorn = wearing[item.layer]?.id === item.id
            return (
              <button
                key={item.id}
                className={`cz-garment-card${isWorn ? ' active' : ''}`}
                onClick={() => toggleGarment(item)}
                aria-pressed={isWorn}
                aria-label={`${item.name} de ${item.store} por ${money(item.price)}`}
              >
                <div className="cz-garment-img-wrap">
                  <img src={item.image} alt={item.name} loading="lazy" />
                  {isWorn && (
                    <span className="cz-garment-check" aria-hidden="true">✓</span>
                  )}
                </div>
                <div className="cz-garment-info">
                  <span className="cz-garment-store">{item.store}</span>
                  <span className="cz-garment-name">{item.name}</span>
                  <span className="cz-garment-price">{money(item.price)}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* ---- Botón masivo de guardar ---- */}
        <button
          className="cz-save-look"
          disabled={totalCount === 0}
          aria-label={totalCount > 0 ? `Guardar look de ${totalCount} prendas por ${money(totalPrice)}` : 'Selecciona prendas primero'}
        >
          {totalCount > 0 ? (
            <>
              Guardar look · {money(totalPrice)}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          ) : (
            'Selecciona al menos una prenda'
          )}
        </button>
      </aside>
    </div>
  )
}
