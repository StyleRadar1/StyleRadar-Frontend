import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { env } from '@/configs/env'
import { TIENDAS } from '@/modules/mapa/mocks/mapData'
import { seedStores, seedPlaylists } from '@/modules/administracion/mocks/admin'
import { ITEMS } from '../mocks/items'
import { getStoreInventoryItemsSync } from './inventoryService'
import { extractAvailableTallasFromInventory, normalizeBackendItem } from './itemService'
import { storePhotoService } from './storePhotoService'
import type { ItemResponseDto } from '../types/item.dto'
import { VERIFICATION_LABEL, type StorePageDto, type StoreResponseDto } from '../types/store.dto'
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

function buildCategoriasFromItems(items: ItemResponseDto[]): StoreCategoryItem[] {
  const catMap = new Map<string, { tipo: string; imagen: string; cantidad: number }>()
  items.forEach((p) => {
    const existing = catMap.get(p.tipo)
    if (existing) {
      existing.cantidad += 1
    } else {
      catMap.set(p.tipo, { tipo: p.tipo, imagen: p.imagen, cantidad: 1 })
    }
  })
  return Array.from(catMap.entries()).map(([tipo, val]) => ({
    nombre:
      tipo === 'Buzo'
        ? 'Buzos & Hoodies'
        : tipo === 'Saco'
          ? 'Sacos & Blazers'
          : tipo === 'Pantalón'
            ? 'Pantalones'
            : tipo === 'Chaqueta'
              ? 'Chaquetas'
              : tipo === 'Vestido'
                ? 'Vestidos'
                : tipo,
    tipo,
    imagen: val.imagen,
    cantidad: val.cantidad,
  }))
}

/** «4.8» → «4,8» como se muestra en la pantalla. Sin calificación → undefined. */
const calificacion = (r?: number | null) => (typeof r === 'number' ? r.toFixed(1).replace('.', ',') : undefined)

/**
 * F-22: datos del almacén que manda ms-tiendas (nombres en inglés) sobre la ficha de la pantalla.
 * Lo que el contrato no trae (barrio, dirección, horario, fotos, colecciones) sigue saliendo de `base`.
 */
export function aTiendaPublica(d: StoreResponseDto, base: StorePublicDto | null): Partial<StorePublicDto> {
  const lng = typeof d.longitude === 'number' ? d.longitude : base?.lngLat[0] ?? -74.0628
  const lat = typeof d.latitude === 'number' ? d.latitude : base?.lngLat[1] ?? 4.6433
  return {
    id: String(d.nit),
    nit: String(d.nit),
    nombre: d.tradeName || base?.nombre || 'Tienda aliada',
    categoria: d.categories?.[0] || base?.categoria || 'Moda local',
    descripcion: d.description || base?.descripcion || 'Tienda local de Bogotá aliada a StyleRadar.',
    telefono: d.phone || base?.telefono || '',
    correo: d.contactEmail || base?.correo || '',
    rating: calificacion(d.rating) ?? base?.rating ?? '',
    verificacion: d.verificationStatus ? VERIFICATION_LABEL[d.verificationStatus] : (base?.verificacion || 'Verificada'),
    lngLat: [lng, lat],
  }
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
      ...buildCategoriasFromItems(prendas),
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
    const r = await apiClient.get<Record<string, unknown>[]>(`/api/v1/stores/${encodeURIComponent(cleanId)}/new-arrivals`)
    return (Array.isArray(r.data) ? r.data : []).map(normalizeBackendItem).slice(0, 3)
  },

  /** SR-RF-22: Catálogo del almacén (GET /stores/{id}/catalog) y tallas en GET /inventory/garments/{prendaId}. */
  async getCatalogo(id: string): Promise<ItemResponseDto[]> {
    const cleanId = (id || '').trim().toLowerCase()
    if (env.useMocks) {
      return this.getById(cleanId)?.prendas ?? []
    }
    const r = await apiClient.get<Record<string, unknown>[]>(`/api/v1/stores/${encodeURIComponent(cleanId)}/catalog`)
    const items = (Array.isArray(r.data) ? r.data : []).map(normalizeBackendItem)
    const withSizes = await Promise.all(
      items.map(async (item) => {
        if (item.tallas.length > 0) return item
        try {
          const inv = await apiClient.get<any>(`/api/v1/inventory/garments/${encodeURIComponent(item.id)}`).then((res) => res.data)
          return { ...item, tallas: extractAvailableTallasFromInventory(inv) }
        } catch {
          return item
        }
      })
    )
    return withSizes
  },

  /** F-22: perfil público del almacén por su NIT (GET /api/v1/stores/{nit}). */
  async getByIdAsync(id: string): Promise<StorePublicDto | null> {
    if (env.useMocks) {
      return this.getById(id)
    }
    const nit = (id || '').trim()
    if (!nit) return null
    const cleanId = nit.toLowerCase()

    let storeNotFound = false
    let storeError: unknown = null

    const [storeDto, catalogoItems, novedadesItems] = await Promise.all([
      apiClient
        .get<StoreResponseDto>(`/api/v1/stores/${encodeURIComponent(nit)}`)
        .then((r) => r.data ?? null)
        .catch((err) => {
          if (err instanceof ApiError && err.status === 404) {
            storeNotFound = true
            return null
          }
          storeError = err
          return null
        }),
      this.getCatalogo(cleanId).catch(() => [] as ItemResponseDto[]),
      this.getNovedades(cleanId).catch(() => [] as ItemResponseDto[]),
    ])

    let resolvedStoreDto = storeDto
    let almacenMatch: Record<string, any> | null = null
    if (!resolvedStoreDto && storeNotFound) {
      const nitFromItems = catalogoItems.find((p) => p.storeNit)?.storeNit
      if (nitFromItems && nitFromItems.toLowerCase() !== cleanId) {
        resolvedStoreDto = await apiClient
          .get<StoreResponseDto>(`/api/v1/stores/${encodeURIComponent(nitFromItems)}`)
          .then((r) => r.data ?? null)
          .catch(() => null)
      }
    }
    if (!resolvedStoreDto && storeNotFound) {
      const listaAlmacenes = await apiClient
        .get<Record<string, any>[] | { content?: Record<string, any>[] }>('/api/v1/stores')
        .then((r) => (Array.isArray(r.data) ? r.data : Array.isArray(r.data?.content) ? r.data.content : []))
        .catch(() => [] as Record<string, any>[])
      almacenMatch =
        listaAlmacenes.find(
          (a) =>
            String(a?.id ?? a?.almacenId ?? '').trim().toLowerCase() === cleanId ||
            String(a?.nit ?? '').trim().toLowerCase() === cleanId
        ) ?? null
    }

    if (!resolvedStoreDto && !almacenMatch && catalogoItems.length === 0) {
      if (!storeNotFound && storeError) throw storeError
      return null
    }

    const matchedStoreDto: StoreResponseDto | null =
      resolvedStoreDto ??
      (almacenMatch?.nit ? (almacenMatch as StoreResponseDto) : null)
    const resolvedNitForPhotos = String(matchedStoreDto?.nit ?? nit).trim()
    const fotosServidor = resolvedNitForPhotos
      ? await storePhotoService.list(resolvedNitForPhotos).catch(() => [])
      : []
    const fotosGaleria: StoreGalleryItem[] = fotosServidor.map((p, idx) => ({
      id: String(p.id),
      url: p.url,
      tag: p.cover ? 'Portada' : `Foto ${p.position || idx + 1}`,
    }))
    const coverPhotoUrl = fotosServidor.find((p) => p.cover)?.url || fotosServidor[0]?.url || ''
    const editorialPhotoUrl = fotosServidor.find((p) => !p.cover)?.url || fotosServidor[1]?.url || coverPhotoUrl
    const prendas = catalogoItems
    const novedades = novedadesItems.length > 0 ? novedadesItems.slice(0, 3) : prendas.slice(0, 3)
    const categorias = buildCategoriasFromItems(prendas)
    const api = matchedStoreDto ? aTiendaPublica(matchedStoreDto, null) : {}
    const matchLng =
      typeof almacenMatch?.longitud === 'number'
        ? almacenMatch.longitud
        : typeof almacenMatch?.lng === 'number'
          ? almacenMatch.lng
          : -74.0628
    const matchLat =
      typeof almacenMatch?.latitud === 'number'
        ? almacenMatch.latitud
        : typeof almacenMatch?.lat === 'number'
          ? almacenMatch.lat
          : 4.6433
    const matchFoto =
      coverPhotoUrl ||
      (typeof almacenMatch?.foto === 'string' && almacenMatch.foto) ||
      (typeof almacenMatch?.photo === 'string' && almacenMatch.photo) ||
      ''

    return {
      id: cleanId,
      nombre:
        (typeof almacenMatch?.nombre === 'string' && almacenMatch.nombre) ||
        (typeof almacenMatch?.name === 'string' && almacenMatch.name) ||
        prendas[0]?.tienda ||
        'Tienda aliada',
      categoria: (typeof almacenMatch?.categoria === 'string' && almacenMatch.categoria) || 'Moda local',
      barrio: (typeof almacenMatch?.barrio === 'string' && almacenMatch.barrio) || prendas[0]?.barrio || 'Bogotá',
      direccion:
        (typeof almacenMatch?.direccion === 'string' && almacenMatch.direccion) ||
        (typeof almacenMatch?.dir === 'string' && almacenMatch.dir) ||
        'Bogotá, Colombia',
      distanciaKm: '',
      horario: (typeof almacenMatch?.horario === 'string' && almacenMatch.horario) || '',
      lngLat: [matchLng, matchLat],
      telefono: '',
      correo: '',
      nit,
      representante: '',
      aliadaDesde: '',
      verificacion: 'Verificada',
      rating: '',
      reviews: 0,
      descripcion: (typeof almacenMatch?.descripcion === 'string' && almacenMatch.descripcion) || '',
      foto: matchFoto || prendas[0]?.imagen || '',
      fotoEditorial: editorialPhotoUrl || matchFoto || prendas[0]?.imagen || '',
      fotosGaleria,
      colecciones: [],
      bannerNotice: '',
      prendas,
      novedades,
      categorias,
      coleccionDestacada: {
        titulo: 'Colección destacada',
        subtitulo: 'Selección de la temporada',
        descripcion: 'Prendas disponibles en tienda.',
      },
      distintivos: [],
      cifras: {
        prendasActivas: prendas.length,
        categoriasCount: categorias.length,
        playlists: 0,
        aliadaDesde: '',
      },
      ...api,
    }
  },

  /** F-22: almacenes aprobados (GET /api/v1/stores, paginado: se lee content[]). */
  async getAllAsync(): Promise<StorePublicDto[]> {
    if (env.useMocks) {
      return TIENDAS.map((t) => this.getById(t.id)).filter(Boolean) as StorePublicDto[]
    }
    const r = await apiClient.get<StorePageDto>('/api/v1/stores', { params: { page: 0, size: 100 } })
    const lista = Array.isArray(r.data?.content) ? r.data.content : []
    return lista.map((d) => ({
      id: String(d.nit),
      nombre: 'Tienda aliada',
      categoria: 'Moda local',
      barrio: 'Bogotá',
      direccion: 'Bogotá, Colombia',
      distanciaKm: '',
      horario: '',
      lngLat: [-74.0628, 4.6433] as [number, number],
      telefono: '',
      correo: '',
      nit: String(d.nit),
      representante: '',
      aliadaDesde: '',
      verificacion: 'Verificada',
      rating: '',
      reviews: 0,
      descripcion: '',
      foto: '/img/mapa/luna.jpg',
      fotoEditorial: '/img/mapa/luna.jpg',
      fotosGaleria: [],
      colecciones: [],
      bannerNotice: '',
      prendas: [],
      categorias: [],
      coleccionDestacada: { titulo: 'Colección destacada', subtitulo: 'Selección de la temporada', descripcion: '' },
      distintivos: [],
      cifras: { prendasActivas: 0, categoriasCount: 0, playlists: 0, aliadaDesde: '' },
      ...aTiendaPublica(d, null),
    }))
  },
}
