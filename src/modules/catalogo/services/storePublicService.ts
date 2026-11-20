import { apiClient } from '@/modules/core/api/apiClient'
import { env } from '@/configs/env'
import { TIENDAS } from '@/modules/mapa/mocks/mapData'
import { seedStores, seedPlaylists } from '@/modules/administracion/mocks/admin'
import { ITEMS } from '../mocks/items'
import { getStoreInventoryItemsSync } from './inventoryService'
import { extractAvailableTallasFromInventory, normalizeBackendItem } from './itemService'
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
  novedades?: ItemResponseDto[]
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
  if (norm.includes('segunda mano')) return 'segunda-mano'
  if (norm.includes('ropero')) return 'ropero'
  if (norm.includes('norte')) return 'norte'
  if (norm.includes('tweed')) return 'tweed'
  if (norm.includes('antonia')) return 'antonia'
  if (norm.includes('85')) return 'calle-85'
  if (norm.includes('nora')) return 'nora'
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
    const novedades = prendas.slice(0, 3)

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
      novedades,
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

  /** SR-RF-20: Novedades semanales de un almacén (máximo 3 prendas de los últimos 7 días). */
  async getNovedades(id: string): Promise<ItemResponseDto[]> {
    const cleanId = (id || '').trim().toLowerCase()
    if (env.useMocks) {
      return this.getById(cleanId)?.novedades ?? []
    }
    const r = await apiClient.get<Record<string, unknown>[]>(`/api/v1/almacenes/${encodeURIComponent(cleanId)}/novedades`)
    return (Array.isArray(r.data) ? r.data : []).map(normalizeBackendItem).slice(0, 3)
  },

  /** SR-RF-22: Catálogo del almacén (GET /almacenes/{id}/catalogo) y tallas en GET /inventario/prenda/{prendaId}. */
  async getCatalogo(id: string): Promise<ItemResponseDto[]> {
    const cleanId = (id || '').trim().toLowerCase()
    if (env.useMocks) {
      return this.getById(cleanId)?.prendas ?? []
    }
    const r = await apiClient.get<Record<string, unknown>[]>(`/api/v1/almacenes/${encodeURIComponent(cleanId)}/catalogo`)
    const items = (Array.isArray(r.data) ? r.data : []).map(normalizeBackendItem)
    const withSizes = await Promise.all(
      items.map(async (item) => {
        if (item.tallas.length > 0) return item
        try {
          const inv = await apiClient.get<any>(`/api/v1/inventario/prenda/${encodeURIComponent(item.id)}`).then((res) => res.data)
          return { ...item, tallas: extractAvailableTallasFromInventory(inv) }
        } catch {
          return item
        }
      })
    )
    return withSizes
  },

  async getByIdAsync(id: string): Promise<StorePublicDto | null> {
    const syncData = this.getById(id)
    if (env.useMocks) {
      return syncData
    }
    const cleanId = (id || '').trim().toLowerCase()
    try {
      const [r, catalogoItems, novedadesItems] = await Promise.all([
        apiClient.get<any>(`/api/v1/almacenes/${encodeURIComponent(cleanId)}`),
        this.getCatalogo(cleanId).catch(() => syncData?.prendas ?? []),
        this.getNovedades(cleanId).catch(() => []),
      ])
      const d = r.data
      if (!d && catalogoItems.length === 0) return syncData

      const prendas = catalogoItems.length > 0 ? catalogoItems : (syncData?.prendas || [])
      const novedades = novedadesItems.length > 0 ? novedadesItems.slice(0, 3) : prendas.slice(0, 3)

      return {
        id: cleanId,
        nombre: d?.nombre || syncData?.nombre || 'Tienda aliada',
        categoria: d?.categoria || syncData?.categoria || 'Moda local',
        barrio: d?.barrio || syncData?.barrio || 'Bogotá',
        direccion: d?.direccion || syncData?.direccion || 'Bogotá, Colombia',
        distanciaKm: typeof d?.distanciaKm === 'number'
          ? `${d.distanciaKm.toFixed(2).replace('.', ',')} km`
          : (d?.distanciaKm || syncData?.distanciaKm || '1,50 km'),
        horario: d?.horario || syncData?.horario || 'Lun a sáb · 10:00 a 20:00',
        lngLat: [d?.lng || d?.longitud || syncData?.lngLat[0] || -74.0628, d?.lat || d?.latitud || syncData?.lngLat[1] || 4.6433],
        telefono: d?.telefono || syncData?.telefono || '+57 601 555 0123',
        correo: d?.correo || d?.email || syncData?.correo || `${cleanId}@styleradar.co`,
        nit: d?.nit || syncData?.nit || '901.482.337-1',
        representante: d?.representante || syncData?.representante || 'Administrador de tienda',
        aliadaDesde: d?.aliadaDesde || syncData?.aliadaDesde || 'feb 2026',
        verificacion: d?.verificacion || d?.estadoVerificacion || syncData?.verificacion || 'Verificada',
        rating: d?.rating ? String(d.rating) : (syncData?.rating || '4,8'),
        reviews: d?.reviews || syncData?.reviews || 150,
        descripcion: d?.descripcion || syncData?.descripcion || 'Tienda local de Bogotá aliada a StyleRadar.',
        foto: d?.foto || d?.imagen || syncData?.foto || '/img/mapa/luna.jpg',
        fotoEditorial: d?.fotoEditorial || syncData?.fotoEditorial || (syncData?.foto || '/img/mapa/luna.jpg'),
        fotosGaleria: (d?.galeria && Array.isArray(d.galeria) && d.galeria.length > 0) ? d.galeria : (syncData?.fotosGaleria || []),
        colecciones: syncData?.colecciones || [],
        bannerNotice: d?.bannerNotice || syncData?.bannerNotice || '',
        prendas,
        novedades,
        categorias: syncData?.categorias || [],
        coleccionDestacada: syncData?.coleccionDestacada || {
          titulo: 'Colección destacada',
          subtitulo: 'Selección de la temporada',
          descripcion: 'Prendas exclusivas disponibles en tienda.',
        },
        distintivos: syncData?.distintivos || [],
        cifras: {
          prendasActivas: prendas.length,
          categoriasCount: syncData?.cifras?.categoriasCount ?? (syncData?.categorias.length || 0),
          playlists: syncData?.cifras?.playlists ?? 0,
          aliadaDesde: d?.aliadaDesde || syncData?.aliadaDesde || 'feb 2026',
        },
      }
    } catch {
      return syncData
    }
  },

  async getAllAsync(): Promise<StorePublicDto[]> {
    if (env.useMocks) {
      return TIENDAS.map((t) => this.getById(t.id)).filter(Boolean) as StorePublicDto[]
    }
    try {
      const r = await apiClient.get<any[]>('/api/v1/almacenes')
      if (Array.isArray(r.data) && r.data.length > 0) {
        return r.data.map((d) => ({
          id: d.id || d.nit || 'tienda',
          nombre: d.nombre || 'Tienda aliada',
          categoria: d.categoria || 'Moda local',
          barrio: d.barrio || 'Bogotá',
          direccion: d.direccion || 'Bogotá, Colombia',
          distanciaKm: d.distanciaKm ? `${d.distanciaKm} km` : '1,5 km',
          horario: d.horario || 'Lun a sáb · 10:00 a 20:00',
          lngLat: [d.lng || d.longitud || -74.0628, d.lat || d.latitud || 4.6433],
          telefono: d.telefono || '+57 601 555 0123',
          correo: d.correo || d.email || '',
          nit: d.nit || '',
          representante: d.representante || '',
          aliadaDesde: d.aliadaDesde || 'feb 2026',
          verificacion: d.verificacion || 'Verificada',
          rating: d.rating ? String(d.rating) : '4,8',
          reviews: d.reviews || 0,
          descripcion: d.descripcion || '',
          foto: d.foto || d.imagen || '/img/mapa/luna.jpg',
          fotoEditorial: d.foto || '/img/mapa/luna.jpg',
          fotosGaleria: [],
          colecciones: [],
          bannerNotice: '',
          prendas: [],
          categorias: [],
          coleccionDestacada: {
            titulo: 'Colección destacada',
            subtitulo: 'Selección de la temporada',
            descripcion: '',
          },
          distintivos: [],
          cifras: {
            prendasActivas: 0,
            categoriasCount: 0,
            playlists: 0,
            aliadaDesde: 'feb 2026',
          },
        }))
      }
      return TIENDAS.map((t) => this.getById(t.id)).filter(Boolean) as StorePublicDto[]
    } catch {
      return TIENDAS.map((t) => this.getById(t.id)).filter(Boolean) as StorePublicDto[]
    }
  },
}
