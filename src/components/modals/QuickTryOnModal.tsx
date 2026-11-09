import { useState, useRef, useEffect } from 'react'
import './QuickTryOnModal.css'

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

const ORDER = [
  'zapatos',
  'tenis',
  'camisa',
  'pantalon',
  'cinturon',
  'corbata',
  'saco',
  'cuero',
  'abrigo',
  'bufanda',
  'guantes',
]

const CATEGORIES_DATA: TryOnCategory[] = [
  {
    tab: 'Camisas',
    slot: 'camisa',
    items: [
      { id: 'cam-bl', name: 'Camisa Oxford blanca', store: 'The Local Lab', price: 165000, slot: 'camisa', color: 'blanco', layer: 'camisa', image: '/prototipo/assets/img/productos/camiseta-blanca-de-algodon.jpg' },
      { id: 'cam-ce', name: 'Camisa celeste de algodón', store: 'Nómada Studio', price: 149000, slot: 'camisa', color: 'celeste', layer: 'camisa', image: '/prototipo/assets/img/probador-miniaturas/camisa.png' },
      { id: 'cam-ne', name: 'Camisa negra de popelina', store: 'Luna Store', price: 139000, slot: 'camisa', color: 'negro', layer: 'camisa', image: '/prototipo/assets/img/productos/camisa-negra-de-popelina.jpg' },
      { id: 'cam-hu', name: 'Camisa hueso de lino', store: 'Segunda mano', price: 48000, slot: 'camisa', color: 'hueso', layer: 'camisa', image: '/prototipo/assets/img/probador-miniaturas/camisa.png' },
    ],
  },
  {
    tab: 'Pantalones',
    slot: 'pantalon',
    items: [
      { id: 'pan-gr', name: 'Pantalón de lana gris', store: 'Nómada Studio', price: 210000, slot: 'pantalon', color: 'carbon', layer: 'pantalon', image: '/prototipo/assets/img/productos/pantalon-gris-de-lana.jpg' },
      { id: 'pan-ne', name: 'Pantalón sastre negro', store: 'The Local Lab', price: 189000, slot: 'pantalon', color: 'negro', layer: 'pantalon', image: '/prototipo/assets/img/productos/pantalon-negro-recto.jpg' },
      { id: 'pan-ca', name: 'Chino camel', store: 'The Local Lab', price: 159000, slot: 'pantalon', color: 'camel', layer: 'pantalon', image: '/prototipo/assets/img/probador-miniaturas/pantalon.png' },
      { id: 'pan-ma', name: 'Pantalón azul marino', store: 'Segunda mano', price: 62000, slot: 'pantalon', color: 'marino', layer: 'pantalon', image: '/prototipo/assets/img/productos/pantalon-de-pinzas.jpg' },
    ],
  },
  {
    tab: 'Chaquetas',
    slot: 'chaqueta',
    items: [
      { id: 'sac-ca', name: 'Saco de lana carbón', store: 'Nómada Studio', price: 395000, slot: 'chaqueta', color: 'carbon', layer: 'saco', image: '/prototipo/assets/img/productos/saco-de-lana-negro.jpg' },
      { id: 'sac-ma', name: 'Saco azul marino', store: 'The Local Lab', price: 360000, slot: 'chaqueta', color: 'marino', layer: 'saco', image: '/prototipo/assets/img/productos/blazer-oversize.jpg' },
      { id: 'sac-ol', name: 'Saco verde oliva', store: 'Segunda mano', price: 95000, slot: 'chaqueta', color: 'oliva', layer: 'saco', image: '/prototipo/assets/img/probador-miniaturas/saco.png' },
      { id: 'cue-ne', name: 'Chaqueta de cuero negra', store: 'Nómada Studio', price: 450000, slot: 'chaqueta', color: 'cuero_negro', layer: 'cuero', image: '/prototipo/assets/img/productos/chaqueta-con-arnes.jpg' },
      { id: 'cue-ca', name: 'Chaqueta de cuero café', store: 'Nómada Studio', price: 430000, slot: 'chaqueta', color: 'cuero_cafe', layer: 'cuero', image: '/prototipo/assets/img/probador-miniaturas/cuero.png' },
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
      { id: 'buf-gr', name: 'Bufanda de espiga gris', store: 'Segunda mano', price: 38000, slot: 'bufanda', color: 'gris', layer: 'bufanda', image: '/prototipo/assets/img/probador-miniaturas/bufanda.png' },
      { id: 'cint', name: 'Cinturón de cuero', store: 'Nómada Studio', price: 95000, slot: 'cinturon', color: 'cuero_cafe', layer: 'cinturon', image: '/prototipo/assets/img/productos/cinturon-de-cuero.jpg' },
    ],
  },
]

const PROC_STAGES = [
  'Detectando silueta corporal',
  'Analizando proporciones y hombros',
  'Ajustando caída de prendas',
  'Renderizando iluminación sobre la foto',
]

interface QuickTryOnModalProps {
  isOpen: boolean
  onClose: () => void
  initialGarmentId?: string
}

export function QuickTryOnModal({ isOpen, onClose, initialGarmentId }: QuickTryOnModalProps) {
  const [sex, setSex] = useState<'mujer' | 'hombre'>('hombre')
  const [sourceMode, setSourceMode] = useState<'mannequin' | 'photo'>('mannequin')
  const [activeTab, setActiveTab] = useState('Camisas')
  const [wearing, setWearing] = useState<Record<string, TryOnItem>>({})
  const [showCoach, setShowCoach] = useState(true)

  // Foto y simulación
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processStage, setProcessStage] = useState(0)
  const [photoFitted, setPhotoFitted] = useState(false)
  const [showAdj, setShowAdj] = useState(false)
  const [boxAdj, setBoxAdj] = useState({ cx: 50, top: 22, h: 90, sx: 1.0 })
  const [statusNote, setStatusNote] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadedObjectUrlRef = useRef<string | null>(null)
  const processingTimerRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0, cx: 50, top: 22 })

  const stopPhotoProcessing = () => {
    if (processingTimerRef.current !== null) {
      window.clearInterval(processingTimerRef.current)
      processingTimerRef.current = null
    }
  }

  const releaseUploadedPhoto = () => {
    if (uploadedObjectUrlRef.current) {
      URL.revokeObjectURL(uploadedObjectUrlRef.current)
      uploadedObjectUrlRef.current = null
    }
  }

  const processPhoto = (src: string) => {
    stopPhotoProcessing()
    setSourceMode('photo')
    setUploadedPhoto(src)
    setIsProcessing(true)
    setPhotoFitted(false)
    setProcessStage(0)
    let stage = 0
    processingTimerRef.current = window.setInterval(() => {
      stage += 1
      if (stage < PROC_STAGES.length) {
        setProcessStage(stage)
        return
      }
      stopPhotoProcessing()
      setIsProcessing(false)
      setPhotoFitted(true)
    }, 750)
  }

  useEffect(() => () => {
    stopPhotoProcessing()
    releaseUploadedPhoto()
  }, [])

  // Inicializar prenda inicial
  useEffect(() => {
    if (initialGarmentId) {
      for (const cat of CATEGORIES_DATA) {
        const match = cat.items.find((i) => i.id === initialGarmentId)
        if (match) {
          setWearing((prev) => ({ ...prev, [match.slot]: match }))
          setActiveTab(cat.tab)
          break
        }
      }
    }
  }, [initialGarmentId])

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleToggleGarment = (item: TryOnItem) => {
    setWearing((prev) => {
      const copy = { ...prev }
      if (copy[item.slot]?.id === item.id) {
        delete copy[item.slot]
      } else {
        copy[item.slot] = item
      }
      return copy
    })
  }

  const handleUndressAll = () => {
    setWearing({})
  }

  const handleUseSample = () => {
    releaseUploadedPhoto()
    processPhoto('/prototipo/assets/img/general/ref.jpg')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatusNote('Elige una imagen JPG, PNG o WebP.')
      e.target.value = ''
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      setStatusNote('La foto supera el límite de 12 MB. Elige una imagen más liviana.')
      e.target.value = ''
      return
    }
    releaseUploadedPhoto()
    const url = URL.createObjectURL(file)
    uploadedObjectUrlRef.current = url
    processPhoto(url)
    e.target.value = ''
  }

  const totalLook = Object.values(wearing).reduce((acc, cur) => acc + cur.price, 0)
  const itemsWorn = Object.values(wearing)
  const activeCategory = CATEGORIES_DATA.find((c) => c.tab === activeTab) || CATEGORIES_DATA[0]

  const mannequinSrc =
    sex === 'mujer'
      ? '/prototipo/assets/img/general/maniqui-f.png'
      : '/prototipo/assets/img/general/maniqui.png'

  return (
    <div
      className="cz-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="czMainTitle"
      onClick={onClose}
    >
      <div className="cz-modal-container" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="cz-modal-close"
          onClick={onClose}
          aria-label="Cerrar probador virtual"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="cz">
          {/* Escenario Izquierdo: Maniquí / Foto interactiva */}
          <div className="cz-stage-wrap" id="czWrap">
            <span className="cz-tl" id="czMode">
              {sourceMode === 'photo'
                ? 'Mi foto · visualización aproximada'
                : `Maniquí de ${sex} · talla M`}
            </span>

            <div className="cz-tr">
              <div className="seg-mini" role="tablist" aria-label="Sobre qué probar">
                <button
                  type="button"
                  role="tab"
                  aria-selected={sourceMode === 'mannequin'}
                  onClick={() => setSourceMode('mannequin')}
                >
                  Maniquí
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={sourceMode === 'photo'}
                  onClick={() => {
                    setSourceMode('photo')
                    if (!uploadedPhoto) handleUseSample()
                  }}
                >
                  Mi foto
                </button>
              </div>

              {sourceMode === 'mannequin' && (
                <div className="seg-mini" role="radiogroup" aria-label="Sexo del maniquí">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={sex === 'mujer'}
                    onClick={() => setSex('mujer')}
                  >
                    Mujer
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={sex === 'hombre'}
                    onClick={() => setSex('hombre')}
                  >
                    Hombre
                  </button>
                </div>
              )}

              <button type="button" className="chip" onClick={handleUndressAll}>
                Quitar todo
              </button>
            </div>

            {sourceMode === 'mannequin' ? (
              <div className="cz-stage" id="czStage">
                <img
                  className="mann"
                  src={mannequinSrc}
                  alt={`Maniquí blanco de ${sex}`}
                />
                {ORDER.map((layerKey) => {
                  const item = Object.values(wearing).find((w) => w.layer === layerKey)
                  const isLayerOn = !!item
                  const filterVal = item ? COLOR_FILTERS[item.color] || 'none' : 'none'

                  return (
                    <img
                      key={layerKey}
                      className={`lay ${isLayerOn ? 'on' : ''}`}
                      data-layer={layerKey}
                      src={LAYER_PATHS[layerKey]}
                      alt=""
                      aria-hidden="true"
                      style={{ filter: filterVal }}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="cz-photo">
                {isProcessing && (
                  <div className="cz-proc">
                    <img src={uploadedPhoto || '/prototipo/assets/img/general/ref.jpg'} alt="Tu foto" />
                    <div className="proc-ov">
                      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#e8dccb] animate-spin" />
                      <b>{PROC_STAGES[processStage]}…</b>
                      <ol className="proc-steps">
                        {PROC_STAGES.map((t, k) => (
                          <li key={k} className={k === processStage ? 'on' : ''}>
                            {t}
                          </li>
                        ))}
                      </ol>
                      <div className="pbar">
                        <i />
                      </div>
                    </div>
                  </div>
                )}

                {!isProcessing && photoFitted && (
                  <div className="cz-pv">
                    <img
                      className="pv-base"
                      src={uploadedPhoto || '/prototipo/assets/img/general/ref.jpg'}
                      alt="Tu foto"
                    />

                    {/* Prenda colocada sobre la foto con arrastre y escala */}
                    <div
                      className="pv-fit"
                      style={{
                        left: `${boxAdj.cx}%`,
                        top: `${boxAdj.top}%`,
                        height: `${boxAdj.h}%`,
                        transform: `translateX(-50%) scaleX(${boxAdj.sx})`,
                      }}
                      onPointerDown={(e) => {
                        isDraggingRef.current = true
                        dragStartRef.current = {
                          x: e.clientX,
                          y: e.clientY,
                          cx: boxAdj.cx,
                          top: boxAdj.top,
                        }
                      }}
                      onPointerMove={(e) => {
                        if (!isDraggingRef.current) return
                        const dx = ((e.clientX - dragStartRef.current.x) / 360) * 100
                        const dy = ((e.clientY - dragStartRef.current.y) / 480) * 100
                        setBoxAdj((prev) => ({
                          ...prev,
                          cx: dragStartRef.current.cx + dx,
                          top: dragStartRef.current.top + dy,
                        }))
                      }}
                      onPointerUp={() => {
                        isDraggingRef.current = false
                      }}
                    >
                      {ORDER.map((layerKey) => {
                        const item = Object.values(wearing).find((w) => w.layer === layerKey)
                        if (!item) return null
                        return (
                          <img
                            key={layerKey}
                            src={LAYER_PATHS[layerKey]}
                            alt=""
                            style={{ filter: COLOR_FILTERS[item.color] || 'none' }}
                          />
                        )
                      })}
                    </div>

                    <span className="pv-tag">
                      Visualización aproximada · {itemsWorn.length} prenda
                      {itemsWorn.length === 1 ? '' : 's'}
                    </span>

                    {showAdj && (
                      <div className="pv-adj">
                        <b>Ajusta la prenda a tu cuerpo</b>
                        <label>
                          Tamaño
                          <input
                            type="range"
                            min="60"
                            max="125"
                            value={boxAdj.h}
                            onChange={(e) =>
                              setBoxAdj((prev) => ({ ...prev, h: Number(e.target.value) }))
                            }
                          />
                        </label>
                        <label>
                          Ancho
                          <input
                            type="range"
                            min="0.8"
                            max="1.7"
                            step="0.05"
                            value={boxAdj.sx}
                            onChange={(e) =>
                              setBoxAdj((prev) => ({ ...prev, sx: Number(e.target.value) }))
                            }
                          />
                        </label>
                        <label>
                          Altura
                          <input
                            type="range"
                            min="-20"
                            max="40"
                            value={boxAdj.top}
                            onChange={(e) =>
                              setBoxAdj((prev) => ({ ...prev, top: Number(e.target.value) }))
                            }
                          />
                        </label>
                      </div>
                    )}

                    <div className="pv-acts">
                      <button type="button" onClick={() => setShowAdj(!showAdj)}>
                        {showAdj ? 'Cerrar ajustes' : 'Ajustar prenda'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedPhoto(null)
                          setPhotoFitted(false)
                        }}
                      >
                        Eliminar foto
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="cz-floor" />

            {/* Sumatoria flotante */}
            <div className="cz-bl">
              <div className="cz-sum">
                <b id="czTotal">${totalLook.toLocaleString('es-CO')}</b>
                <span id="czCount">
                  {itemsWorn.length === 0
                    ? 'Sin prendas todavía'
                    : `${itemsWorn.length} prenda${itemsWorn.length === 1 ? '' : 's'} elegida${
                        itemsWorn.length === 1 ? '' : 's'
                      }`}
                </span>
              </div>
              <span className="cz-hint">
                Toca una prenda
                <br />
                para ponérsela
              </span>
            </div>
          </div>

          {/* Panel Derecho: Selección Editorial y Carga */}
          <div className="cz-panel">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#a98be0]">
              Probador virtual
            </span>
            <h1 id="czMainTitle">Arma tu look</h1>
            <p>
              Elige prendas de las boutiques y tiendas independientes de Bogotá y míralas puestas al instante.
            </p>

            {showCoach && (
              <div className="coach">
                <b>¿Primera vez aquí?</b>
                <ol>
                  <li>Elige una pestaña: camisas, pantalones, chaquetas, zapatos…</li>
                  <li>Toca una prenda para ponérsela; tócala otra vez para quitarla.</li>
                  <li>Guarda el look o añádelo todo a tu wishlist.</li>
                </ol>
                <button
                  type="button"
                  className="linkish"
                  onClick={() => setShowCoach(false)}
                >
                  Entendido
                </button>
              </div>
            )}

            {/* Selector de subida de fotos */}
            <div className="upload-row">
              <button
                type="button"
                className="upload"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <div>
                  <b>Cargar foto</b>
                  <span>Cuerpo entero, de frente. JPG o PNG.</span>
                </div>
              </button>

              <button type="button" className="upload" onClick={handleUseSample}>
                <img src="/prototipo/assets/img/general/ref.jpg" alt="" />
                <div>
                  <b>Usar foto ejemplo</b>
                  <span>Mira la prueba en foto de referencia.</span>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleFileChange}
              />
            </div>

            {/* Pestañas de categorías */}
            <div className="cz-tabs" role="tablist">
              {CATEGORIES_DATA.map((cat) => {
                const countInSlot = cat.items.filter((i) =>
                  Object.values(wearing).some((w) => w.id === i.id),
                ).length

                return (
                  <button
                    key={cat.tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === cat.tab}
                    onClick={() => setActiveTab(cat.tab)}
                  >
                    {cat.tab}
                    {countInSlot > 0 && <sup>({countInSlot})</sup>}
                  </button>
                )
              })}
            </div>

            {/* Catálogo de prendas de la categoría activa */}
            <div className="cz-list" role="tabpanel">
              {activeCategory.items.map((item) => {
                const isSelected = wearing[item.slot]?.id === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    className="cz-item"
                    aria-pressed={isSelected}
                    onClick={() => handleToggleGarment(item)}
                  >
                    <span className="cz-sw">
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ filter: COLOR_FILTERS[item.color] || 'none' }}
                      />
                    </span>
                    <b>{item.name}</b>
                    <span>{item.store}</span>
                    <span className="pp">
                      <span>${item.price.toLocaleString('es-CO')}</span>
                      {item.store === 'Segunda mano' && <i>Usada</i>}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Resumen del Look */}
            <div className="cz-look">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#a98be0]">
                Tu combinación ({itemsWorn.length})
              </span>
              {itemsWorn.length === 0 ? (
                <p className="text-xs text-[#b9b9ca] italic py-1">
                  Aún no has agregado prendas a este look.
                </p>
              ) : (
                <ul>
                  {itemsWorn.map((w) => (
                    <li key={w.id}>
                      <span>{w.name}</span>
                      <span>${w.price.toLocaleString('es-CO')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {statusNote && (
              <div className="p-3 rounded-xl bg-[#48119a]/40 border border-[#e8dccb]/30 text-xs text-[#e8dccb]">
                {statusNote}
              </div>
            )}

            {/* Acciones principales */}
            <div className="cz-acts">
              <button
                type="button"
                className="btn-line"
                onClick={() => {
                  setStatusNote('¡Todas las prendas fueron agregadas a tu Wishlist!')
                  setTimeout(() => setStatusNote(null), 3500)
                }}
              >
                Todo a la wishlist
              </button>
              <button
                type="button"
                className="btn-acc"
                onClick={() => {
                  setStatusNote('¡Look guardado exitosamente en tu perfil!')
                  setTimeout(() => setStatusNote(null), 3500)
                }}
              >
                Guardar look
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

