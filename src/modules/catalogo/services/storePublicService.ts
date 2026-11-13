import { TIENDAS } from '@/modules/mapa/mocks/mapData'
import { seedStores, seedPlaylists } from '@/modules/administracion/mocks/admin'
import { ITEMS } from '../mocks/items'
import { getStoreInventoryItemsSync } from './inventoryService'
import type { ItemResponseDto } from '../types/item.dto'
import type { MapPinDto } from '@/modules/mapa/types/map.dto'

export interface StoreCategoryItem {
  nombre: string
  tipo: string
  imagen: string
  cantidad: number
}

export interface StoreGalleryItem {
  id: string
  url: string
  tag: string
}

export interface StoreCollectionItem {
  id: string
  title: string
  description: string
  visibility: string
  items: number
  image: string
}

export interface StorePublicDto {
  id: string
  nombre: string
  categoria: string
  barrio: string
  direccion: string
  distanciaKm: string
  horario: string
  lngLat: [number, number]
  telefono: string
  correo: string
  nit: string
  representante: string
  aliadaDesde: string
  verificacion: string
  rating: string
  reviews: number
  descripcion: string
  foto: string
  fotoEditorial: string
  fotosGaleria: StoreGalleryItem[]
  colecciones: StoreCollectionItem[]
  bannerNotice: string
  prendas: ItemResponseDto[]
  categorias: StoreCategoryItem[]
  coleccionDestacada: {
    titulo: string
    subtitulo: string
    descripcion: string
    imagen?: string
  }
  distintivos: {
    titulo: string
    descripcion: string
    icono: string
  }[]
  cifras: {
    prendasActivas: number
    categoriasCount: number
    playlists: number
    aliadaDesde: string
  }
}

export function getStoreIdByName(storeName: string): string {
  const norm = (storeName || '').toLowerCase()
  if (norm.includes('luna')) return 'luna'
  if (norm.includes('nómada') || norm.includes('nomada')) return 'nomada'
  if (norm.includes('kick')) return 'kicks'
  if (norm.includes('lab') || norm.includes('local lab')) return 'lab'
  return norm.replace(/\s+/g, '-')
}

export const storePublicService = {
  getById(id: string): StorePublicDto | null {
    const cleanId = (id || '').trim().toLowerCase()
    let mapPin: MapPinDto | undefined = TIENDAS.find((t: MapPinDto) => t.id === cleanId)
    const adminStore = seedStores().find((s) => s.id === cleanId)

    if (!mapPin && !adminStore) {
      // Intentar buscar por coincidencia en nombre
      mapPin = TIENDAS.find((t: MapPinDto) => getStoreIdByName(t.name) === cleanId)
      if (!mapPin) return null
    }

    const nombre = mapPin?.name || adminStore?.nombre || 'Tienda aliada'

    // Datos legales y foto actualizados desde el panel de gestión de tienda (StoreInfoPage / LocalStorage)
    let customLegalInfo: { legalName?: string; representative?: string; phone?: string; email?: string; nit?: string } | null = null
    let customPhoto: string | null = null
    try {
      const savedInfo = localStorage.getItem('styleradar-store-legal-info')
      if (savedInfo) customLegalInfo = JSON.parse(savedInfo)
      customPhoto = localStorage.getItem('styleradar-store-photo')
    } catch {}

    const isCurrentActiveStore =
      cleanId === 'luna' ||
      (customLegalInfo?.legalName && getStoreIdByName(customLegalInfo.legalName) === cleanId)

    const telefono =
      isCurrentActiveStore && customLegalInfo?.phone ? customLegalInfo.phone : (adminStore?.telefono || '+57 601 555 0123')
    const correo =
      isCurrentActiveStore && customLegalInfo?.email ? customLegalInfo.email : (adminStore?.correo || `${cleanId}@styleradar.co`)
    const representante =
      isCurrentActiveStore && customLegalInfo?.representative
        ? customLegalInfo.representative
        : (adminStore?.representante || 'Administrador de tienda')
    const nit =
      isCurrentActiveStore && customLegalInfo?.nit ? customLegalInfo.nit : (adminStore?.nit || '901.482.337-1')

    // Fotos de la tienda (fachada, vitrina, interior) guardadas en el panel de gestión
    let customGallery: StoreGalleryItem[] = []
    try {
      const savedGallery = localStorage.getItem('styleradar-store-gallery')
      if (savedGallery) customGallery = JSON.parse(savedGallery)
    } catch {}
    if (!customGallery || customGallery.length === 0) {
      customGallery = [
        { id: 'foto-1', url: '/img/mapa/luna.jpg', tag: 'Fachada' },
        { id: 'foto-2', url: '/img/sesion/rol-tienda.jpg', tag: 'Mostrador' },
        { id: 'foto-3', url: '/prototipo/assets/img/productos/r1c3-tenis-running.jpg', tag: 'Vitrina' },
      ]
    }

    // Colecciones creadas por la tienda en su panel
    let customCollections: StoreCollectionItem[] = []
    try {
      const savedCols = localStorage.getItem('styleradar-store-collections')
      if (savedCols) customCollections = JSON.parse(savedCols)
    } catch {}
    if (!customCollections || customCollections.length === 0) {
      customCollections = [
        {
          id: 'running-city',
          title: 'Running de ciudad',
          description: 'Lo esencial para correr Bogotá: zapatillas, prendas técnicas y accesorios de calle.',
          visibility: 'Pública',
          items: 4,
          image: '/prototipo/assets/img/productos/r1c3-tenis-running.jpg',
        },
      ]
    }

    const featuredCollection = customCollections.find((c) => c.visibility === 'Pública') || customCollections[0]

    // Foto principal (Fachada) y Foto editorial (Mostrador / Interior)
    const foto =
      isCurrentActiveStore && customGallery[0]?.url
        ? customGallery[0].url
        : (customPhoto && customPhoto !== '/img/sesion/rol-tienda.jpg'
          ? customPhoto
          : (mapPin?.photo || '/img/mapa/luna.jpg'))

    const fotoEditorial =
      isCurrentActiveStore && customGallery[1]?.url
        ? customGallery[1].url
        : (customGallery[0]?.url || foto)

    // Prendas del catálogo base + prendas activas añadidas en el inventario de la tienda
    const basePrendas = ITEMS.filter((item) => item.tienda.toLowerCase() === nombre.toLowerCase())
    const inventoryPrendas = getStoreInventoryItemsSync(nombre)
    const existingNames = new Set(basePrendas.map((p) => p.nombre.toLowerCase()))
    const newFromInventory = inventoryPrendas.filter((p) => !existingNames.has(p.nombre.toLowerCase()))
    const prendas = [...basePrendas, ...newFromInventory]

    // Generar categorías de prendas reales de la tienda
    const catMap = new Map<string, { tipo: string; imagen: string; cantidad: number }>()
    prendas.forEach((p) => {
      const existing = catMap.get(p.tipo)
      if (existing) {
        existing.cantidad += 1
      } else {
        catMap.set(p.tipo, {
          tipo: p.tipo,
          imagen: p.imagen,
          cantidad: 1,
        })
      }
    })

    // Colecciones de la tienda añadidas a la fila de arcos
    const coleccionesComoCategorias: StoreCategoryItem[] = customCollections
      .filter((c) => c.visibility === 'Pública')
      .map((c) => ({
        nombre: c.title,
        tipo: `col:${c.title}`,
        imagen: c.image || '/prototipo/assets/img/productos/r1c3-tenis-running.jpg',
        cantidad: c.items || 4,
      }))

    const categorias: StoreCategoryItem[] = [
      ...coleccionesComoCategorias,
      ...Array.from(catMap.entries()).map(([tipo, val]) => ({
        nombre: tipo === 'Buzo' ? 'Buzos & Hoodies' : tipo === 'Saco' ? 'Sacos & Blazers' : tipo === 'Pantalón' ? 'Pantalones' : tipo === 'Chaqueta' ? 'Chaquetas' : tipo === 'Vestido' ? 'Vestidos' : tipo,
        tipo,
        imagen: val.imagen,
        cantidad: val.cantidad,
      })),
    ]

    // Playlists donde aparece o ha creado la tienda
    const playlistsCount = seedPlaylists().filter(
      (pl) => pl.creador.toLowerCase() === nombre.toLowerCase() || pl.destacada
    ).length

    const aliada = adminStore?.aliadaDesde || 'feb 2026'

    return {
      id: cleanId,
      nombre,
      categoria: mapPin?.cat || adminStore?.categoria || 'Moda local',
      barrio: mapPin?.barrio || adminStore?.barrio || 'Bogotá',
      direccion: mapPin?.dir || adminStore?.direccion || 'Bogotá, Colombia',
      distanciaKm: mapPin?.d || '1,5 km',
      horario: mapPin?.hours || 'Lun a sáb · 10:00 a 20:00',
      lngLat: mapPin?.lngLat || [-74.0628, 4.6433],
      telefono,
      correo,
      nit,
      representante,
      aliadaDesde: aliada,
      verificacion: adminStore?.verificacion || 'Verificada',
      rating: mapPin?.rating || '4,8',
      reviews: mapPin?.reviews || 150,
      descripcion:
        mapPin?.desc ||
        'Tienda local de Bogotá comprometida con la moda contemporánea, diseño independiente y producción ética.',
      foto,
      fotoEditorial,
      fotosGaleria: customGallery,
      colecciones: customCollections,
      bannerNotice: mapPin?.hours
        ? `Abierto hoy · Horario ${mapPin.hours} · ${mapPin.dir}`
        : `Tienda local verificada en ${mapPin?.barrio || 'Bogotá'}`,
      prendas,
      categorias,
      coleccionDestacada: {
        titulo: featuredCollection ? featuredCollection.title : `Colección ${mapPin?.cat || 'Urbana'} 2026`,
        subtitulo: featuredCollection ? `${featuredCollection.items || 4} prendas · Colección pública` : `${prendas.length} prendas seleccionadas`,
        descripcion: featuredCollection?.description || 'Prendas con disponibilidad inmediata en tienda física para probador virtual y entrega en Bogotá.',
        imagen: featuredCollection?.image || '/prototipo/assets/img/productos/r1c3-tenis-running.jpg',
      },
      distintivos: [
        {
          titulo: 'Tienda verificada',
          descripcion: 'Documentos e identidad comprobada por StyleRadar.',
          icono: 'shield',
        },
        {
          titulo: 'Moda local Bogotá',
          descripcion: `Punto físico activo en ${mapPin?.barrio || 'la ciudad'}.`,
          icono: 'pin',
        },
        {
          titulo: 'Stock en tiempo real',
          descripcion: 'Inventario sincronizado para probarte o reservar.',
          icono: 'zap',
        },
      ],
      cifras: {
        prendasActivas: prendas.length,
        categoriasCount: categorias.length,
        playlists: Math.max(playlistsCount, 1),
        aliadaDesde: aliada,
      },
    }
  },
}
