import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './MiTiendaPage.css'
import './MiTiendaDashboard.css'

type StoreItem = {
  id: string
  name: string
  category: string
  color: string
  brand: string
  style: string
  price: number
  stock: number
  stockBySize: Record<string, number>
  sizes: string
  image: string
  status: 'Publicadas' | 'En revisión' | 'Agotadas' | 'Retiradas'
  flag?: 'Últimas unidades' | 'Nueva llegada'
  collection?: string
}

type StoreCollection = {
  id: string
  title: string
  description: string
  visibility: 'Pública' | 'Borrador'
  items: number
  likes: number
  image: string
}

type LegalStoreInfo = {
  legalName: string
  nit: string
  representative: string
  phone: string
  email: string
  payoutAccount: string
  address: string
  hours: string
}

const INITIAL_LEGAL_INFO: LegalStoreInfo = {
  legalName: 'Luna Store',
  nit: '901.482.337-1',
  representative: 'Daniela Luna',
  phone: '+57 601 555 0123',
  email: 'luna@styleradar.co',
  payoutAccount: 'Bancolombia ••• 4410',
  address: 'Cra. 13 #57-22, Chapinero',
  hours: 'Lun a sáb · 10:00 a 20:00',
}

const STORAGE_LEGAL_KEY = 'styleradar-store-legal-info'
const GALLERY_STORAGE_KEY = 'styleradar-store-gallery'
const COLLECTIONS_STORAGE_KEY = 'styleradar-store-collections'

const DEFAULT_COLLECTIONS: StoreCollection[] = [
  { id: 'running-city', title: 'Running de ciudad', description: 'Lo esencial para correr Bogotá.', visibility: 'Pública', items: 4, likes: 188, image: '/prototipo/assets/img/productos/r1c3-tenis-running.jpg' },
]

function readCollections(): StoreCollection[] {
  try {
    const saved = localStorage.getItem(COLLECTIONS_STORAGE_KEY)
    return saved ? JSON.parse(saved) as StoreCollection[] : DEFAULT_COLLECTIONS
  } catch {
    return DEFAULT_COLLECTIONS
  }
}

function readLegalInfo(): LegalStoreInfo {
  try {
    const saved = localStorage.getItem(STORAGE_LEGAL_KEY)
    return saved ? { ...INITIAL_LEGAL_INFO, ...JSON.parse(saved) as Partial<LegalStoreInfo> } : INITIAL_LEGAL_INFO
  } catch {
    return INITIAL_LEGAL_INFO
  }
}

type StoreGalleryPhoto = {
  id: string
  url: string
  tag: string
}

const DEFAULT_GALLERY: StoreGalleryPhoto[] = [
  { id: 'foto-1', url: '/img/mapa/luna.jpg', tag: 'Fachada' },
  { id: 'foto-2', url: '/img/sesion/rol-tienda.jpg', tag: 'Mostrador' },
  { id: 'foto-3', url: '/prototipo/assets/img/productos/r1c3-tenis-running.jpg', tag: 'Vitrina' },
]

function readGallery(): StoreGalleryPhoto[] {
  try {
    const saved = localStorage.getItem(GALLERY_STORAGE_KEY)
    return saved ? JSON.parse(saved) as StoreGalleryPhoto[] : DEFAULT_GALLERY
  } catch {
    return DEFAULT_GALLERY
  }
}

const ITEMS: StoreItem[] = [
  { id: 'gorra-ny', name: 'Gorra NY lavada', category: 'Accesorios', color: 'Azul', brand: 'Luna Store', style: 'Urbana', price: 79000, stock: 6, stockBySize: { ÚNICA: 6 }, sizes: 'ÚNICA', image: '/prototipo/assets/img/productos/r1c2-gorra-ny.jpg', status: 'Publicadas' },
  { id: 'chaqueta-track', name: 'Chaqueta track negra', category: 'Chaquetas', color: 'Negro', brand: 'Luna Store', style: 'Urbana', price: 229000, stock: 3, stockBySize: { S: 1, M: 1, L: 1, XL: 0 }, sizes: 'S M L XL', image: '/prototipo/assets/img/productos/r1c3-chaqueta-track.jpg', status: 'Publicadas', flag: 'Últimas unidades' },
  { id: 'pantalon-track', name: 'Pantalón track tres rayas', category: 'Pantalones', color: 'Negro', brand: 'Luna Store', style: 'Urbana', price: 189000, stock: 6, stockBySize: { S: 2, M: 2, L: 1, XL: 1 }, sizes: 'S M L XL', image: '/prototipo/assets/img/productos/r1c3-pantalon-track.jpg', status: 'Publicadas' },
  { id: 'tenis-running', name: 'Tenis running plata', category: 'Calzado', color: 'Plata', brand: 'Luna Store', style: 'Sport', price: 349000, stock: 6, stockBySize: { '37': 1, '38': 1, '39': 1, '40': 1, '41': 1, '42': 1 }, sizes: '37 38 39 40 41 42', image: '/prototipo/assets/img/productos/r1c3-tenis-running.jpg', status: 'Publicadas', flag: 'Nueva llegada' },
  { id: 'gorra-sport', name: 'Gorra deportiva negra', category: 'Accesorios', color: 'Negro', brand: 'Luna Store', style: 'Sport', price: 69000, stock: 6, stockBySize: { ÚNICA: 6 }, sizes: 'ÚNICA', image: '/prototipo/assets/img/productos/r1c3-gorra-negra.jpg', status: 'Publicadas' },
  { id: 'rinonera-sport', name: 'Riñonera deportiva', category: 'Accesorios', color: 'Negro', brand: 'Luna Store', style: 'Sport', price: 99000, stock: 6, stockBySize: { ÚNICA: 6 }, sizes: 'ÚNICA', image: '/prototipo/assets/img/productos/r1c3-rinonera.jpg', status: 'Publicadas' },
  { id: 'audifonos-over-ear', name: 'Audífonos over-ear', category: 'Accesorios', color: 'Negro', brand: 'Luna Store', style: 'Sport', price: 380000, stock: 2, stockBySize: { ÚNICA: 2 }, sizes: 'ÚNICA', image: '/prototipo/assets/img/productos/r1c3-audifonos.jpg', status: 'Publicadas', flag: 'Últimas unidades' },
  { id: 'botella-termica', name: 'Botella térmica 1 L', category: 'Accesorios', color: 'Negro', brand: 'Luna Store', style: 'Sport', price: 89000, stock: 0, stockBySize: { ÚNICA: 0 }, sizes: 'ÚNICA', image: '/prototipo/assets/img/productos/r1c3-botella.jpg', status: 'Agotadas' },
  { id: 'hoodie-gris', name: 'Hoodie gris jaspeado', category: 'Chaquetas', color: 'Gris', brand: 'Luna Store', style: 'Urbana', price: 139000, stock: 6, stockBySize: { S: 1, M: 2, L: 2, XL: 1 }, sizes: 'S M L XL', image: '/prototipo/assets/img/productos/hoodie-gris-jaspeado.jpg', status: 'Publicadas' },
  { id: 'conjunto-tecnico', name: 'Conjunto técnico negro', category: 'Chaquetas', color: 'Negro', brand: 'Luna Store', style: 'Sport', price: 389000, stock: 6, stockBySize: { S: 1, M: 2, L: 2, XL: 1 }, sizes: 'S M L XL', image: '/prototipo/assets/img/productos/conjunto-tecnico-negro.jpg', status: 'Publicadas', flag: 'Nueva llegada' },
  { id: 'tenis-trail', name: 'Tenis de trail', category: 'Calzado', color: 'Blanco', brand: 'Luna Store', style: 'Sport', price: 319000, stock: 6, stockBySize: { '37': 1, '38': 1, '39': 1, '40': 1, '41': 1, '42': 1 }, sizes: '37 38 39 40 41 42', image: '/prototipo/assets/img/productos/urbana-trail.jpg', status: 'Publicadas' },
  { id: 'gorra-ny-azul', name: 'Gorra NY azul', category: 'Accesorios', color: 'Azul', brand: 'Luna Store', style: 'Urbana', price: 79000, stock: 6, stockBySize: { ÚNICA: 6 }, sizes: 'ÚNICA', image: '/prototipo/assets/img/productos/luna-gorra-azul.jpg', status: 'Publicadas' },
  { id: 'hoodie-azul', name: 'Hoodie azul noche', category: 'Chaquetas', color: 'Azul', brand: 'Luna Store', style: 'Urbana', price: 169000, stock: 6, stockBySize: { S: 1, M: 2, L: 2, XL: 1 }, sizes: 'S M L XL', image: '/prototipo/assets/img/productos/hoodie-azul-noche.jpg', status: 'Publicadas' },
]

const HERO_PHOTO = '/img/sesion/rol-tienda.jpg'

const WEEK_VISITS = [
  { label: '4 nov', visits: 38 }, { label: '5 nov', visits: 45 }, { label: '6 nov', visits: 62 },
  { label: '7 nov', visits: 75 }, { label: '8 nov', visits: 59 }, { label: '9 nov', visits: 64 },
  { label: '10 nov', visits: 51 },
]
const WEEKLY_VISITS = 445
const WEEKLY_GOAL = 500

export default function MiTiendaPage() {
  const [notice, setNotice] = useState('')
  const [items, setItems] = useState(ITEMS)

  /* Información de la tienda */
  const [legalInfo, setLegalInfo] = useState<LegalStoreInfo>(readLegalInfo)
  const [editingInfo, setEditingInfo] = useState(false)
  const [legalDraft, setLegalDraft] = useState<LegalStoreInfo>(readLegalInfo)

  /* Fotos de la tienda */
  const [storeGallery, setStoreGallery] = useState<StoreGalleryPhoto[]>(readGallery)
  const [photoError, setPhotoError] = useState('')

  /* Colecciones */
  const [collections, setCollections] = useState<StoreCollection[]>(readCollections)
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false)
  const [collectionTitle, setCollectionTitle] = useState('')
  const [collectionDescription, setCollectionDescription] = useState('')
  const [collectionVisibility, setCollectionVisibility] = useState<'Pública' | 'Borrador'>('Pública')
  const [collectionError, setCollectionError] = useState('')

  /* Distintivos */
  const [badgesDialogOpen, setBadgesDialogOpen] = useState(false)
  const [lastUnitsLimit, setLastUnitsLimit] = useState(3)
  const [newArrivalDays, setNewArrivalDays] = useState(14)
  const [lastUnitsDraft, setLastUnitsDraft] = useState('3')
  const [newArrivalDaysDraft, setNewArrivalDaysDraft] = useState('14')

  /* Resumen del panel */
  const activeCount = items.filter((item) => item.status === 'Publicadas' && item.stock > 0).length
  const lowStockCount = items.filter((item) => item.status !== 'Retiradas' && item.stock > 0 && item.stock <= lastUnitsLimit).length
  const visitorsToday = WEEK_VISITS[WEEK_VISITS.length - 1].visits
  const weeklyProgress = Math.min(100, Math.round((WEEKLY_VISITS / WEEKLY_GOAL) * 100))

  /* Guardar / descartar información de tienda */
  const saveLegalInfo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: LegalStoreInfo = {
      legalName: legalDraft.legalName.trim() || legalInfo.legalName,
      nit: legalDraft.nit.trim() || legalInfo.nit,
      representative: legalDraft.representative.trim() || legalInfo.representative,
      phone: legalDraft.phone.trim() || legalInfo.phone,
      email: legalDraft.email.trim() || legalInfo.email,
      payoutAccount: legalDraft.payoutAccount.trim() || legalInfo.payoutAccount,
      address: legalDraft.address.trim() || legalInfo.address,
      hours: legalDraft.hours.trim() || legalInfo.hours,
    }
    setLegalInfo(next)
    setLegalDraft(next)
    try {
      localStorage.setItem(STORAGE_LEGAL_KEY, JSON.stringify(next))
    } catch {}
    setEditingInfo(false)
    setNotice('La información de la tienda se guardó con éxito.')
  }

  const discardLegalInfo = () => {
    setLegalDraft(legalInfo)
    setEditingInfo(false)
  }

  /* Subir y quitar fotos de la tienda */
  const handleUploadPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    setPhotoError('')
    if (!selected.length) return
    const remaining = Math.max(0, 6 - storeGallery.length)
    if (!remaining) {
      setPhotoError('Ya tienes el máximo de 6 fotos de la tienda.')
      return
    }
    const valid = selected.filter((file) => file.type.startsWith('image/')).slice(0, remaining)
    if (valid.length !== selected.length) setPhotoError('Solo puedes subir imágenes y el máximo es de 6 fotos.')
    const dataUrls = await Promise.all(valid.map((file) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('No se pudo leer la imagen.'))
      reader.onerror = () => reject(new Error('No se pudo leer una de las imágenes.'))
      reader.readAsDataURL(file)
    })))

    const newEntries: StoreGalleryPhoto[] = dataUrls.map((url, i) => ({
      id: `photo-${Date.now()}-${i}`,
      url,
      tag: `Foto ${storeGallery.length + i + 1}`,
    }))

    const next = [...storeGallery, ...newEntries].slice(0, 6)
    setStoreGallery(next)
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(next))
    } catch {}
    setNotice('Fotos de la tienda actualizadas con éxito.')
  }

  const handleRemovePhoto = (id: string) => {
    const next = storeGallery.filter((p) => p.id !== id)
    setStoreGallery(next)
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(next))
    } catch {}
    setNotice('Foto eliminada.')
  }

  /* Colecciones */
  const createCollection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = collectionTitle.trim()
    if (!title) {
      setCollectionError('Escribe un título para la colección.')
      return
    }
    const nextCol: StoreCollection = {
      id: `collection-${Date.now()}`,
      title,
      description: collectionDescription.trim(),
      visibility: collectionVisibility,
      items: 0,
      likes: 0,
      image: '/prototipo/assets/img/productos/r1c3-tenis-running.jpg',
    }
    const next = [nextCol, ...collections]
    setCollections(next)
    try {
      localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(next))
    } catch {}
    setCollectionTitle('')
    setCollectionDescription('')
    setCollectionVisibility('Pública')
    setCollectionError('')
    setCollectionDialogOpen(false)
    setNotice(`Colección «${title}» creada con éxito.`)
  }

  /* Distintivos */
  const openBadgesSettings = () => {
    setLastUnitsDraft(String(lastUnitsLimit))
    setNewArrivalDaysDraft(String(newArrivalDays))
    setBadgesDialogOpen(true)
  }
  const saveBadgesSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const threshold = Math.max(0, Number(lastUnitsDraft) || 0)
    const days = Math.max(1, Number(newArrivalDaysDraft) || 14)
    setLastUnitsLimit(threshold)
    setNewArrivalDays(days)
    setItems((current) => current.map((item) => {
      if (item.status !== 'Publicadas' || item.stock === 0) return item
      if (item.stock <= threshold) return { ...item, flag: 'Últimas unidades' }
      return item.flag === 'Últimas unidades' ? { ...item, flag: undefined } : item
    }))
    setBadgesDialogOpen(false)
    setNotice('Se guardaron las reglas de distintivos automáticos.')
  }

  return (
    <main className="my-store msd">
      {/* ── Hero a todo el ancho ── */}
      <section className="msd-hero" aria-labelledby="store-title">
        <div className="msd-hero__media" aria-hidden="true"><img src={HERO_PHOTO} alt="" /></div>
        <div className="msd-hero__shade" aria-hidden="true" />
        <div className="msd-hero__inner">
          <nav className="msd-hero__crumbs" aria-label="Ruta de navegación">
            <Link to="/mi-tienda">Inicio</Link><span aria-hidden="true">/</span><span>Mi tienda</span>
          </nav>
          <span className="msd-hero__eyebrow">PANEL DE TIENDA · BOGOTÁ</span>
          <h1 id="store-title" className="msd-hero__title">{legalInfo.legalName}</h1>
          <p className="msd-hero__lead">Administra tu inventario, tus colecciones y tu información en un solo lugar.</p>
          <div className="msd-hero__pills">
            <span className="msd-pill msd-pill--glass">◉ Así te ven tus clientes · Las herramientas de edición solo las ves tú</span>
            <span className="msd-pill msd-pill--glass">SPORT & URBANA</span>
            <span className="msd-pill msd-pill--verified">Verificada</span>
            <span className="msd-pill msd-pill--glass">Suscripción activa</span>
          </div>
          <div className="msd-hero__actions">
            <Link className="msd-btn msd-btn--primary" to="/tienda/inventario">＋ Nueva prenda</Link>
            <Link className="msd-btn msd-btn--ghost" to="/tiendas/luna" target="_blank" rel="noopener noreferrer">Ver tienda pública (como comprador) ↗</Link>
            <Link className="msd-btn msd-btn--ghost" to="/tienda/estadisticas">Ver estadísticas</Link>
          </div>

          <ul className="msd-kpis" aria-label="Resumen de la tienda">
            <li className="msd-kpi">
              <span className="msd-kpi__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 6a2 2 0 1 1 2 2c-1 0-2 .7-2 1.6V10l9 6.2c.8.6.4 1.8-.6 1.8H3.6c-1 0-1.4-1.2-.6-1.8L12 10" /></svg></span>
              <div><b>{activeCount}</b><span>Prendas activas</span></div>
            </li>
            <li className="msd-kpi">
              <span className="msd-kpi__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 2 20h20L12 3Zm0 6v5m0 3v.5" /></svg></span>
              <div><b>{lowStockCount}</b><span>Stock bajo</span></div>
            </li>
            <li className="msd-kpi">
              <span className="msd-kpi__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg></span>
              <div><b>{visitorsToday}</b><span>Visitantes hoy</span></div>
            </li>
            <li className="msd-kpi msd-kpi--goal">
              <span className="msd-kpi__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 17 6-6 4 4 8-8m0 0h-5m5 0v5" /></svg></span>
              <div className="msd-kpi__goal">
                <span>Meta semanal</span>
                <b>{weeklyProgress}%</b>
                <span className="msd-progress" role="progressbar" aria-label="Meta semanal de visitas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={weeklyProgress}><i style={{ width: `${weeklyProgress}%` }} /></span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <div className="msd-content">
        <div className="msd-alert" role="alert">
          <span className="msd-alert__mark" aria-hidden="true">!</span>
          <div><strong>No pudimos cobrar tu suscripción</strong><p>El pago reciente fue rechazado. Tienes hasta el <b>25 sep 2026</b> para pagar con otro medio y mantener tu tienda visible.</p></div>
          <Link to="/tienda/suscripcion">Pagar ahora <span aria-hidden="true">↗</span></Link>
        </div>

        {notice ? <div className="msd-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></div> : null}

        {/* ── Fila 1: Información de la tienda (en el lugar del inventario) ── */}
        <div className="msd-row msd-row--main">
          <section className="msd-card" id="informacion" aria-labelledby="store-info-title">
            <header className="msd-card__head">
              <div>
                <h2 id="store-info-title">Información de la tienda</h2>
                <p className="text-xs text-[var(--msd-text-muted,#727282)] mt-1">Datos legales, de contacto y comerciales de tu tienda en Bogotá.</p>
              </div>
              {!editingInfo ? (
                <button type="button" className="msd-link font-semibold" onClick={() => setEditingInfo(true)}>
                  Editar información
                </button>
              ) : null}
            </header>

            {!editingInfo ? (
              <div className="msd-info-grid">
                <article className="msd-info-tile">
                  <span>Razón social</span>
                  <strong>{legalInfo.legalName}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>NIT</span>
                  <strong>{legalInfo.nit}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>Representante legal</span>
                  <strong>{legalInfo.representative}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>Teléfono</span>
                  <strong>{legalInfo.phone}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>Correo de la cuenta</span>
                  <strong>{legalInfo.email}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>Cuenta para pagos</span>
                  <strong>{legalInfo.payoutAccount}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>Dirección comercial</span>
                  <strong>{legalInfo.address}</strong>
                </article>
                <article className="msd-info-tile">
                  <span>Horario de atención</span>
                  <strong>{legalInfo.hours}</strong>
                </article>
              </div>
            ) : (
              <form className="msd-info-form" onSubmit={saveLegalInfo}>
                <label className="msd-info-field">
                  <span>Razón social</span>
                  <input
                    value={legalDraft.legalName}
                    onChange={(e) => setLegalDraft({ ...legalDraft, legalName: e.target.value })}
                    required
                  />
                </label>
                <label className="msd-info-field">
                  <span>NIT</span>
                  <input
                    value={legalDraft.nit}
                    onChange={(e) => setLegalDraft({ ...legalDraft, nit: e.target.value })}
                    required
                  />
                </label>
                <label className="msd-info-field">
                  <span>Representante legal</span>
                  <input
                    value={legalDraft.representative}
                    onChange={(e) => setLegalDraft({ ...legalDraft, representative: e.target.value })}
                    required
                  />
                </label>
                <label className="msd-info-field">
                  <span>Teléfono</span>
                  <input
                    value={legalDraft.phone}
                    onChange={(e) => setLegalDraft({ ...legalDraft, phone: e.target.value })}
                    required
                  />
                </label>
                <label className="msd-info-field">
                  <span>Correo de la cuenta</span>
                  <input
                    value={legalDraft.email}
                    readOnly
                    className="opacity-75 cursor-not-allowed"
                  />
                </label>
                <label className="msd-info-field">
                  <span>Cuenta para pagos</span>
                  <input
                    value={legalDraft.payoutAccount}
                    onChange={(e) => setLegalDraft({ ...legalDraft, payoutAccount: e.target.value })}
                    required
                  />
                </label>
                <label className="msd-info-field">
                  <span>Dirección comercial</span>
                  <input
                    value={legalDraft.address}
                    onChange={(e) => setLegalDraft({ ...legalDraft, address: e.target.value })}
                    required
                  />
                </label>
                <label className="msd-info-field">
                  <span>Horario de atención</span>
                  <input
                    value={legalDraft.hours}
                    onChange={(e) => setLegalDraft({ ...legalDraft, hours: e.target.value })}
                    required
                  />
                </label>
                <div className="msd-info-actions">
                  <button type="button" className="msd-btn msd-btn--ghost" onClick={discardLegalInfo}>
                    Descartar
                  </button>
                  <button type="submit" className="msd-btn msd-btn--primary">
                    Guardar cambios
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* ── Fila 2: Colecciones y Fotos de la tienda (más arriba, estilo idéntico) ── */}
        <div className="msd-row msd-row--gallery">
          <section className="msd-card" id="colecciones" aria-labelledby="collections-title">
            <header className="msd-card__head">
              <div>
                <h2 id="collections-title">Colecciones</h2>
                <p className="text-xs text-[var(--msd-text-muted,#727282)] mt-0.5">Agrupa tus prendas por temporada o estilo.</p>
              </div>
            </header>
            <div className="msd-collections">
              {collections.map((collection) => (
                <Link
                  className="msd-collection"
                  key={collection.id}
                  to={`/playlists/${collection.id}`}
                  state={{ collection }}
                  aria-label={`Abrir colección ${collection.title}`}
                >
                  <img src={collection.image} alt="" loading="lazy" />
                  <span className="msd-collection__shade" aria-hidden="true" />
                  <span className="msd-collection__name">{collection.title}</span>
                  <span className="msd-collection__meta">{collection.items} prendas · {collection.visibility}</span>
                </Link>
              ))}
              <button
                className="msd-collection msd-collection--new"
                type="button"
                onClick={() => { setCollectionError(''); setCollectionDialogOpen(true) }}
              >
                ＋ Nueva colección
              </button>
            </div>
          </section>

          <section className="msd-card" id="fotos-tienda" aria-labelledby="store-photos-title">
            <header className="msd-card__head">
              <div>
                <h2 id="store-photos-title">Fotos de la tienda</h2>
                <p className="text-xs text-[var(--msd-text-muted,#727282)] mt-0.5">Fachada, vitrina e interior (hasta 6 fotos).</p>
              </div>
            </header>
            {photoError ? <p className="text-xs text-rose-500 mb-2 font-medium" role="alert">{photoError}</p> : null}
            <div className="msd-collections">
              {storeGallery.map((photo, index) => (
                <div key={photo.id} className="msd-collection">
                  <img src={photo.url} alt={`Foto ${index + 1} de ${legalInfo.legalName}`} loading="lazy" />
                  <span className="msd-collection__shade" aria-hidden="true" />
                  <span className="msd-collection__name">{photo.tag || `Foto ${index + 1}`}</span>
                  <span className="msd-collection__meta">Luna Store</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="msd-photo-del"
                    aria-label={`Quitar foto ${index + 1}`}
                    title="Quitar foto"
                  >
                    ×
                  </button>
                </div>
              ))}
              {storeGallery.length < 6 && (
                <label className="msd-collection msd-collection--new cursor-pointer">
                  <span>＋ Subir foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleUploadPhotos}
                  />
                </label>
              )}
            </div>
          </section>
        </div>

        {/* ── Fila 3: Distintivos de la tienda ── */}
        <div className="msd-row msd-row--main">
          <section className="msd-card" aria-labelledby="msd-badges-title">
            <header className="msd-card__head">
              <div>
                <h2 id="msd-badges-title">Distintivos de la tienda</h2>
                <p className="text-xs text-[var(--msd-text-muted,#727282)] mt-0.5">Insignias automáticas que se muestran en el radar y en tus prendas.</p>
              </div>
              <button type="button" className="msd-link font-semibold" onClick={openBadgesSettings}>Configurar</button>
            </header>
            <ul className="msd-badges">
              <li><span className="msd-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" /></svg></span>Tienda verificada</li>
              <li><span className="msd-badge msd-badge--soft" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v10m0 4v1" /></svg></span>Últimas unidades<small>≤ {lastUnitsLimit} uds</small></li>
              <li><span className="msd-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3Z" /></svg></span>Nueva llegada<small>{newArrivalDays} días</small></li>
            </ul>
          </section>
        </div>
      </div>

      {badgesDialogOpen ? <div className="my-store__dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBadgesDialogOpen(false) }}>
        <form className="my-store__dialog my-store__dialog--badges" role="dialog" aria-modal="true" aria-labelledby="badges-title" onSubmit={saveBadgesSettings}>
          <button className="my-store__dialog-close" type="button" onClick={() => setBadgesDialogOpen(false)} aria-label="Cerrar">×</button>
          <span className="my-store__eyebrow">MI TIENDA</span>
          <h2 id="badges-title">Distintivos automáticos</h2>
          <p>StyleRadar pone estas etiquetas solas sobre tus prendas, según tu inventario y la fecha de publicación.</p>
          <label className="my-store__badge-rule">«ÚLTIMAS UNIDADES» CUANDO QUEDEN
            <span className="my-store__badge-threshold"><input type="number" min="0" max="99" value={lastUnitsDraft} onChange={(event) => setLastUnitsDraft(event.target.value)} aria-label="Umbral de últimas unidades" /><b>UNIDADES O MENOS</b></span>
          </label>
          <label className="my-store__badge-rule">«NUEVA LLEGADA» DURANTE
            <select value={newArrivalDaysDraft} onChange={(event) => setNewArrivalDaysDraft(event.target.value)} aria-label="Duración de nueva llegada">
              <option value="7">7 días desde que se publica</option>
              <option value="14">14 días desde que se publica</option>
              <option value="30">30 días desde que se publica</option>
            </select>
          </label>
          <div className="my-store__dialog-actions"><button type="button" onClick={() => setBadgesDialogOpen(false)}>Cancelar</button><button className="my-store__button--primary" type="submit">Guardar</button></div>
        </form>
      </div> : null}

      {collectionDialogOpen ? <div className="my-store__dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCollectionDialogOpen(false) }}>
        <form className="my-store__dialog my-store__dialog--collection" role="dialog" aria-modal="true" aria-labelledby="new-collection-title" onSubmit={createCollection}>
          <button className="my-store__dialog-close" type="button" onClick={() => setCollectionDialogOpen(false)} aria-label="Cerrar">×</button>
          <span className="my-store__eyebrow">LUNA STORE</span>
          <h2 id="new-collection-title">Nueva colección</h2>
          <label className="my-store__collection-label">TÍTULO<input autoFocus value={collectionTitle} onChange={(event) => setCollectionTitle(event.target.value)} placeholder="Ej. Temporada de lluvias" maxLength={60} required /></label>
          <label className="my-store__collection-label">DESCRIPCIÓN <span>opcional</span><textarea value={collectionDescription} onChange={(event) => setCollectionDescription(event.target.value)} rows={4} maxLength={240} /></label>
          <fieldset className="my-store__visibility-field"><legend>VISIBILIDAD</legend><div>
            <button className={collectionVisibility === 'Pública' ? 'is-selected' : ''} type="button" onClick={() => setCollectionVisibility('Pública')}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10 3 3 7-7" /></svg><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" /><circle cx="10" cy="10" r="2" /></svg>PÚBLICA</button>
            <button className={collectionVisibility === 'Borrador' ? 'is-selected' : ''} type="button" onClick={() => setCollectionVisibility('Borrador')}><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="9" width="12" height="9" rx="1" /><path d="M7 9V6a3 3 0 0 1 6 0v3" /></svg>BORRADOR</button>
          </div></fieldset>
          {collectionError ? <p className="my-store__photo-error" role="alert">{collectionError}</p> : null}
          <div className="my-store__dialog-actions"><button type="button" onClick={() => setCollectionDialogOpen(false)}>Cancelar</button><button className="my-store__button--primary" type="submit">Crear colección</button></div>
        </form>
      </div> : null}
    </main>
  )
}
