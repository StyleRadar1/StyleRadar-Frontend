import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuroraBackground } from '@/modules/core/design-system'
import './MiTiendaPage.css'

type CatalogTab = 'Todas' | 'Publicadas' | 'En revisión' | 'Agotadas' | 'Retiradas'

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
  status: Exclude<CatalogTab, 'Todas'>
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

type StoreProfile = {
  name: string
  category: string
  description: string
  address: string
  neighborhood: string
  hours: string
  phone: string
  payments: string
  photo: string
}

const INITIAL_STORE_PROFILE: StoreProfile = {
  name: 'Luna Store',
  category: 'Sport',
  description: 'Ropa deportiva y urbana para moverse por Bogotá: running, track y básicos técnicos.',
  address: 'Cra. 13 #57-22, Chapinero',
  neighborhood: 'Chapinero',
  hours: 'Lun a sáb · 10:00 a 20:00',
  phone: '+57 601 555 0123',
  payments: 'Tarjeta, Nequi y efectivo',
  photo: '/img/mapa/luna.jpg',
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

const FILTERS: CatalogTab[] = ['Todas', 'Publicadas', 'En revisión', 'Agotadas', 'Retiradas']

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function MiTiendaPage() {
  const [activeTab, setActiveTab] = useState<CatalogTab>('Todas')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [items, setItems] = useState(ITEMS)
  const [action, setAction] = useState<'edit' | 'stock' | 'collection' | null>(null)
  const [actionItem, setActionItem] = useState<StoreItem | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftPrice, setDraftPrice] = useState('')
  const [draftStockBySize, setDraftStockBySize] = useState<Record<string, number>>({})
  const [draftCollection, setDraftCollection] = useState('Running de ciudad')
  const [draftCategory, setDraftCategory] = useState('')
  const [draftColor, setDraftColor] = useState('')
  const [draftBrand, setDraftBrand] = useState('')
  const [draftStyle, setDraftStyle] = useState('')
  const [draftFlag, setDraftFlag] = useState<'Nueva llegada' | 'Últimas unidades' | 'Ninguna'>('Ninguna')
  const [storePhotos, setStorePhotos] = useState<string[]>([])
  const [photoError, setPhotoError] = useState('')
  const [collections, setCollections] = useState<StoreCollection[]>([
    { id: 'running-city', title: 'Running de ciudad', description: 'Lo esencial para correr Bogotá.', visibility: 'Pública', items: 4, likes: 188, image: '/prototipo/assets/img/productos/r1c3-tenis-running.jpg' },
  ])
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false)
  const [collectionTitle, setCollectionTitle] = useState('')
  const [collectionDescription, setCollectionDescription] = useState('')
  const [collectionVisibility, setCollectionVisibility] = useState<'Pública' | 'Borrador'>('Pública')
  const [collectionError, setCollectionError] = useState('')
  const [storeInfo, setStoreInfo] = useState<StoreProfile>(INITIAL_STORE_PROFILE)
  const [storeInfoDraft, setStoreInfoDraft] = useState<StoreProfile>(INITIAL_STORE_PROFILE)
  const [storeInfoDialogOpen, setStoreInfoDialogOpen] = useState(false)
  const [storeInfoError, setStoreInfoError] = useState('')
  const [badgesDialogOpen, setBadgesDialogOpen] = useState(false)
  const [lastUnitsLimit, setLastUnitsLimit] = useState(3)
  const [newArrivalDays, setNewArrivalDays] = useState(14)
  const [lastUnitsDraft, setLastUnitsDraft] = useState('3')
  const [newArrivalDaysDraft, setNewArrivalDaysDraft] = useState('14')

  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesTab = activeTab === 'Todas' ? item.status !== 'Retiradas' : item.status === activeTab
    return matchesTab && item.name.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es'))
  }), [activeTab, items, query])

  const announce = (message: string) => setNotice(message)
  const openItemAction = (item: StoreItem, nextAction: 'edit' | 'stock' | 'collection') => {
    setActionItem(item)
    setAction(nextAction)
    setDraftName(item.name)
    setDraftPrice(String(item.price))
    setDraftStockBySize(item.stockBySize)
    setDraftCollection(item.collection ?? 'Running de ciudad')
    setDraftCategory(item.category)
    setDraftColor(item.color)
    setDraftBrand(item.brand)
    setDraftStyle(item.style)
    setDraftFlag(item.flag ?? 'Ninguna')
  }
  const saveItemAction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!actionItem || !action) return
    const totalStock = Object.values(draftStockBySize).reduce((total, quantity) => total + Math.max(0, quantity || 0), 0)
    setItems((current) => current.map((item) => item.id !== actionItem.id ? item : {
      ...item,
      ...(action === 'edit' ? {
        name: draftName.trim(),
        price: Number(draftPrice) || item.price,
        category: draftCategory,
        color: draftColor,
        brand: draftBrand.trim(),
        style: draftStyle,
        flag: draftFlag === 'Ninguna' ? undefined : draftFlag,
      } : {}),
      ...(action === 'stock' ? {
        stockBySize: draftStockBySize,
        stock: totalStock,
        status: totalStock === 0 ? 'Agotadas' as const : item.status === 'Agotadas' ? 'Publicadas' as const : item.status,
        flag: totalStock <= 2 ? 'Últimas unidades' as const : item.flag,
      } : {}),
      ...(action === 'collection' ? { collection: draftCollection } : {}),
    }))
    setAction(null)
    setActionItem(null)
  }
  const removeItem = (item: StoreItem) => {
    if (!window.confirm(`¿Retirar «${item.name}» del catálogo?`)) return
    setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, status: 'Retiradas' } : candidate))
    announce(`${item.name} se retiró del catálogo. Puedes verla con el filtro Retiradas.`)
  }
  const uploadPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    setPhotoError('')
    if (!selected.length) return
    const remaining = Math.max(0, 6 - storePhotos.length)
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
    setStorePhotos((current) => [...current, ...dataUrls].slice(0, 6))
  }
  const createCollection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = collectionTitle.trim()
    if (!title) {
      setCollectionError('Escribe un título para la colección.')
      return
    }
    setCollections((current) => [{
      id: `collection-${Date.now()}`,
      title,
      description: collectionDescription.trim(),
      visibility: collectionVisibility,
      items: 0,
      likes: 0,
      image: '/prototipo/assets/img/productos/r1c3-tenis-running.jpg',
    }, ...current])
    setCollectionTitle('')
    setCollectionDescription('')
    setCollectionVisibility('Pública')
    setCollectionError('')
    setCollectionDialogOpen(false)
  }
  const openStoreInfo = () => {
    setStoreInfoDraft(storeInfo)
    setStoreInfoError('')
    setStoreInfoDialogOpen(true)
  }
  const saveStoreInfo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!storeInfoDraft.name.trim() || !storeInfoDraft.address.trim() || !storeInfoDraft.hours.trim() || !storeInfoDraft.phone.trim()) {
      setStoreInfoError('Completa el nombre, la dirección, el horario y el teléfono.')
      return
    }
    setStoreInfo({ ...storeInfoDraft, name: storeInfoDraft.name.trim(), description: storeInfoDraft.description.trim() })
    setStoreInfoDialogOpen(false)
    setNotice('La información de la tienda se actualizó.')
  }
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
  const changeStorePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setStoreInfoError('')
    if (!file.type.startsWith('image/')) {
      setStoreInfoError('Selecciona un archivo de imagen válido.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setStoreInfoDraft((current) => ({ ...current, photo: reader.result as string }))
    }
    reader.onerror = () => setStoreInfoError('No se pudo leer la imagen seleccionada.')
    reader.readAsDataURL(file)
  }

  return (
    <AuroraBackground tone="rosa" fullHeight className="my-store-aurora">
      <main className="my-store">
      <div className="my-store__cover" role="img" aria-label="Fachada de Luna Store">
        <img src={storeInfo.photo} alt="" />
        <div className="my-store__cover-shade" />
        <nav className="my-store__breadcrumbs" aria-label="Ruta de navegación">
          <Link to="/catalogo">Inicio</Link><span>/</span><span>Mi tienda</span>
        </nav>
        <span className="my-store__cover-caption">CHAPINERO · BOGOTÁ</span>
      </div>

      <div className="my-store__content">
        <div className="my-store__billing-alert" role="alert">
          <span className="my-store__alert-mark" aria-hidden="true">!</span>
          <div><strong>No pudimos cobrar tu suscripción</strong><p>El pago reciente fue rechazado. Tienes hasta el <b>25 sep 2026</b> para pagar con otro medio y mantener tu tienda visible.</p></div>
          <Link to="/tienda/suscripcion">Pagar ahora <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="my-store__trust-row">
          <span>◉ &nbsp;Así te ven tus clientes · Las herramientas de edición solo las ves tú</span>
          <div><span className="my-store__pill my-store__pill--verified">Verificada</span><span className="my-store__pill">Suscripción activa</span></div>
        </div>

        <section className="my-store__intro" aria-labelledby="store-title">
          <div className="my-store__identity">
            <h1 id="store-title">{storeInfo.name}</h1>
            <div className="my-store__tags"><span>{storeInfo.category.toUpperCase()}</span><span className="my-store__verified">VERIFICADA</span></div>
            <p>{storeInfo.description}</p>
          </div>
          <dl className="my-store__facts">
            <div><dt>Dirección</dt><dd>{storeInfo.address}</dd></div>
            <div><dt>Teléfono</dt><dd>{storeInfo.phone}</dd></div>
            <div><dt>Horario</dt><dd>{storeInfo.hours}</dd></div>
            <div><dt>Pagos</dt><dd>{storeInfo.payments}</dd></div>
          </dl>
          <div className="my-store__actions">
            <Link className="my-store__button my-store__button--primary" to="/tienda/inventario#catalogo">＋ Agregar prenda</Link>
            <button className="my-store__button" type="button" onClick={openStoreInfo}>Editar información</button>
            <button className="my-store__button" type="button" onClick={openBadgesSettings}>Distintivos</button>
            <a className="my-store__button" href="#fotos-tienda">Fotos de la tienda</a>
            <Link className="my-store__button" to="/tienda/estadisticas">Estadísticas</Link>
          </div>
        </section>

        {notice ? <div className="my-store__notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></div> : null}

        <div className="my-store__stats" aria-label="Resumen de la tienda">
          <span><b>12</b> publicadas y disponibles</span><span><b>0</b> en revisión</span><span><b>1</b> agotadas</span><span><b>{collections.length}</b> colecciones</span>
        </div>

        <section className="my-store__catalog" id="catalogo" aria-labelledby="catalog-title">
          <div className="my-store__section-head">
            <div><span className="my-store__eyebrow">TU SELECCIÓN ACTUAL</span><h2 id="catalog-title">Catálogo</h2></div>
            <label className="my-store__search"><span className="sr-only">Buscar en mi catálogo</span><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en mi catálogo" /></label>
          </div>
          <div className="my-store__toolbar">
            <div className="my-store__filters" role="tablist" aria-label="Filtrar prendas">
              {FILTERS.map((filter) => <button key={filter} type="button" role="tab" aria-selected={activeTab === filter} onClick={() => setActiveTab(filter)}>{filter}<sup>{filter === 'Todas' ? items.length : items.filter((item) => item.status === filter).length}</sup></button>)}
            </div>
            <span className="my-store__sort-label">ORDENAR <select aria-label="Ordenar prendas"><option>Recientes</option><option>Precio menor</option><option>Precio mayor</option><option>Menos unidades</option></select></span>
          </div>
          {visibleItems.length ? <div className="my-store__grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {visibleItems.map((item) => <article className="my-store__product" key={item.id}>
              <div className="my-store__product-image"><img src={item.image} alt={item.name} loading="lazy" /><span className={`my-store__status${item.status === 'Agotadas' ? ' my-store__status--sold' : ''}`}>{item.status === 'Publicadas' ? 'PUBLICADA' : item.status === 'Agotadas' ? 'AGOTADA' : item.status.toUpperCase()}</span>{item.flag ? <span className={`my-store__flag${item.flag === 'Nueva llegada' ? ' my-store__flag--new' : ''}`}>{item.flag.toUpperCase()}</span> : null}</div>
              <div className="my-store__product-row"><h3>{item.name}</h3><strong>{COP.format(item.price)}</strong></div>
              <div className="my-store__product-meta"><span>{item.category}</span><span className={item.stock <= 2 ? 'my-store__low-stock' : ''}>{item.stock} u · {item.sizes}</span></div>
              <div className="my-store__card-actions">
                <button type="button" onClick={() => openItemAction(item, 'edit')}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13.8 3.2 3 3M3 17l3.8-.8L16.7 6.3a2.1 2.1 0 0 0-3-3L3.8 13.2 3 17Z" /></svg>Editar</button>
                <button type="button" onClick={() => openItemAction(item, 'stock')}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.5 6.5h15v11h-15zM1.5 3h17v3.5h-17zM8 10h4" /></svg>Unidades</button>
              </div>
              <div className="my-store__card-tools">
                <button type="button" onClick={() => openItemAction(item, 'collection')} aria-label={`Agregar ${item.name} a una colección`} title="Agregar a una colección"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" /></svg></button>
                <button type="button" onClick={() => removeItem(item)} aria-label={`Retirar ${item.name} del catálogo`} title="Retirar del catálogo"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M8 5V3h4v2m-7 0 1 12h8l1-12M8 8v6m4-6v6" /></svg></button>
              </div>
            </article>)}
          </div> : <div className="my-store__empty">No hay prendas en esta categoría. Prueba otro filtro o busca por otro nombre.</div>}
        </section>

        <section className="my-store__photos" id="fotos-tienda" aria-labelledby="store-photos-title">
          <div className="my-store__photos-head"><div><h2 id="store-photos-title">Fotos de la tienda</h2><p>Fachada, vitrina e interior. Salen en tu página para que la gente te reconozca al llegar. Hasta 6 fotos.</p></div>
            <label className="my-store__upload-button"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6h3l1.3-2h5.4L14 6h3v10H3z" /><circle cx="10" cy="11" r="3" /></svg>Subir fotos<input type="file" accept="image/*" multiple onChange={uploadPhotos} /></label>
          </div>
          {photoError ? <p className="my-store__photo-error" role="alert">{photoError}</p> : null}
          <div className="my-store__photo-grid">
          {storePhotos.length ? storePhotos.map((photo, index) => <figure key={photo}><img src={photo} alt={`Foto ${index + 1} de Luna Store`} /><figcaption>FOTO {index + 1} · LUNA STORE</figcaption><button type="button" onClick={() => setStorePhotos((current) => current.filter((entry) => entry !== photo))} aria-label={`Quitar foto ${index + 1}`}>×</button></figure>) : <figure className="my-store__sample-photo"><img src={storeInfo.photo} alt="Fachada de ejemplo de Luna Store" loading="lazy" /><figcaption>FOTO DE EJEMPLO · SUBE LA TUYA PARA REEMPLAZARLA</figcaption></figure>}
          </div>
        </section>

        <section className="my-store__collections" id="colecciones" aria-labelledby="collections-title">
          <div className="my-store__collections-head">
            <div><h2 id="collections-title">Colecciones y playlists</h2><p>Agrupa prendas de tu catálogo. Las públicas aparecen en tu página.</p></div>
            <button className="my-store__collection-new" type="button" onClick={() => { setCollectionError(''); setCollectionDialogOpen(true) }}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" /></svg>Nueva colección</button>
          </div>
          <div className="my-store__collection-grid">
            {collections.map((collection) => <Link className="my-store__collection-card" key={collection.id} to={`/playlists/${collection.id}`} state={{ collection }} aria-label={`Abrir colección ${collection.title}`}>
              <img src={collection.image} alt={collection.title} loading="lazy" />
              <span className="my-store__collection-name">{collection.title}</span>
              <span className="my-store__collection-meta">{collection.items}/15 PRENDAS · {collection.visibility.toUpperCase()} · {collection.likes} ME GUSTA</span>
            </Link>)}
          </div>
        </section>
      </div>

      {action && actionItem ? <div className="my-store__dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setAction(null); setActionItem(null) } }}>
        <form className={`my-store__dialog${action === 'edit' ? ' my-store__dialog--edit' : action === 'stock' ? ' my-store__dialog--stock' : ''}`} role="dialog" aria-modal="true" aria-labelledby="product-action-title" onSubmit={saveItemAction}>
          <button className="my-store__dialog-close" type="button" onClick={() => { setAction(null); setActionItem(null) }} aria-label="Cerrar">×</button>
          <span className="my-store__eyebrow">{action === 'edit' ? actionItem.name.toUpperCase() : 'GESTIÓN DE CATÁLOGO'}</span>
          <h2 id="product-action-title">{action === 'edit' ? 'Editar prenda' : action === 'stock' ? 'Unidades disponibles' : 'Agregar a una colección'}</h2>
          {action === 'edit' ? <div className="my-store__edit-fields">
            <label className="my-store__field-full">NOMBRE<input value={draftName} onChange={(event) => setDraftName(event.target.value)} required /></label>
            <label>PRECIO (COP)<input type="number" min="0" step="1000" value={draftPrice} onChange={(event) => setDraftPrice(event.target.value)} required /></label>
            <label>CATEGORÍA<select value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)}><option>Accesorios</option><option>Chaquetas</option><option>Pantalones</option><option>Calzado</option><option>Camisas</option></select></label>
            <label>COLOR<select value={draftColor} onChange={(event) => setDraftColor(event.target.value)}><option>Negro</option><option>Blanco</option><option>Azul</option><option>Plata</option><option>Gris</option><option>Crudo</option></select></label>
            <label>MARCA<input value={draftBrand} onChange={(event) => setDraftBrand(event.target.value)} required /></label>
            <label>ESTILO<select value={draftStyle} onChange={(event) => setDraftStyle(event.target.value)}><option>Urbana</option><option>Sport</option><option>Casual</option><option>Formal</option><option>Vintage</option></select></label>
            <fieldset className="my-store__flag-field"><legend>ETIQUETA <span title="La etiqueta se muestra sobre la foto de la prenda">ⓘ</span></legend><div>{(['Nueva llegada', 'Últimas unidades', 'Ninguna'] as const).map((flag) => <button className={draftFlag === flag ? 'is-selected' : ''} key={flag} type="button" onClick={() => setDraftFlag(flag)}>{draftFlag === flag ? '✓ ' : ''}{flag.toUpperCase()}</button>)}</div></fieldset>
          </div> : null}
          {action === 'stock' ? <>
            <p className="my-store__stock-help">Actualiza cuántas unidades tienes hoy por talla. Lo que ves aquí es lo que ven tus clientes.</p>
            <div className="my-store__stock-grid">{Object.entries(draftStockBySize).map(([size, quantity]) => <label className="my-store__stock-size" key={size}><span>{size}</span><input type="number" min="0" step="1" value={quantity} onChange={(event) => setDraftStockBySize((current) => ({ ...current, [size]: Math.max(0, Number(event.target.value) || 0) }))} aria-label={`Unidades talla ${size}`} /></label>)}</div>
          </> : null}
          {action === 'collection' ? <label>Colección<select value={draftCollection} onChange={(event) => setDraftCollection(event.target.value)}><option>Running de ciudad</option><option>Temporada de lluvias</option><option>Básicos deportivos</option></select></label> : null}
          <div className={`my-store__dialog-actions${action === 'stock' ? ' my-store__dialog-actions--stock' : ''}`}><button type="button" onClick={() => { setAction(null); setActionItem(null) }}>Cancelar</button><button className="my-store__button--primary" type="submit">{action === 'stock' ? 'Guardar' : 'Guardar cambios'}</button></div>
        </form>
      </div> : null}

      {storeInfoDialogOpen ? <div className="my-store__dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setStoreInfoDialogOpen(false) }}>
        <form className="my-store__dialog my-store__dialog--store-info" role="dialog" aria-modal="true" aria-labelledby="store-info-title" onSubmit={saveStoreInfo}>
          <button className="my-store__dialog-close" type="button" onClick={() => setStoreInfoDialogOpen(false)} aria-label="Cerrar">×</button>
          <span className="my-store__eyebrow">{storeInfo.name.toUpperCase()}</span>
          <h2 id="store-info-title">Editar información</h2>
          <div className="my-store__store-fields">
            <label>NOMBRE DE LA TIENDA<input value={storeInfoDraft.name} onChange={(event) => setStoreInfoDraft((current) => ({ ...current, name: event.target.value }))} required /></label>
            <label>CATEGORÍA<input value={storeInfoDraft.category} onChange={(event) => setStoreInfoDraft((current) => ({ ...current, category: event.target.value }))} required /></label>
            <label className="my-store__store-field-full">DESCRIPCIÓN<textarea value={storeInfoDraft.description} onChange={(event) => setStoreInfoDraft((current) => ({ ...current, description: event.target.value }))} maxLength={200} rows={4} /><small>Máximo 200 caracteres.</small></label>
            <label>DIRECCIÓN<input value={storeInfoDraft.address} onChange={(event) => setStoreInfoDraft((current) => ({ ...current, address: event.target.value }))} required /></label>
            <label>BARRIO<input value={storeInfoDraft.neighborhood} onChange={(event) => setStoreInfoDraft((current) => ({ ...current, neighborhood: event.target.value }))} /></label>
            <label>HORARIO<input value={storeInfoDraft.hours} onChange={(event) => setStoreInfoDraft((current) => ({ ...current, hours: event.target.value }))} required /></label>
            <label>TELÉFONO<input value={storeInfoDraft.phone} onChange={(event) => setStoreInfoDraft((current) => ({ ...current, phone: event.target.value }))} required /></label>
            <label className="my-store__store-field-full">MÉTODOS DE PAGO<input value={storeInfoDraft.payments} onChange={(event) => setStoreInfoDraft((current) => ({ ...current, payments: event.target.value }))} /></label>
            <label className="my-store__store-field-full my-store__facade-upload">FOTO DE LA FACHADA <span title="Se muestra en la cabecera y la ficha de tu tienda">ⓘ</span><span className="my-store__facade-drop"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 13V3m0 0L6 7m4-4 4 4M3 12v5h14v-5" /></svg>CAMBIAR FOTO<input type="file" accept="image/*" onChange={changeStorePhoto} /></span></label>
          </div>
          {storeInfoError ? <p className="my-store__photo-error" role="alert">{storeInfoError}</p> : null}
          <div className="my-store__dialog-actions"><button type="button" onClick={() => setStoreInfoDialogOpen(false)}>Cancelar</button><button className="my-store__button--primary" type="submit">Guardar cambios</button></div>
        </form>
      </div> : null}

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
  </AuroraBackground>
)
}
