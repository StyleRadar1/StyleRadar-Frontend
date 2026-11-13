import { TIENDAS } from '@/modules/mapa/mocks/mapData'
import { seedStores, seedPlaylists } from '@/modules/administracion/mocks/admin'
import { ITEMS } from '../mocks/items'
import type { ItemResponseDto } from '../types/item.dto'
import type { MapPinDto } from '@/modules/mapa/types/map.dto'

export interface StoreCategoryItem {
  nombre: string
  tipo: string
  imagen: string
  cantidad: number
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
  bannerNotice: string
  prendas: ItemResponseDto[]
  categorias: StoreCategoryItem[]
  coleccionDestacada: {
    titulo: string
    subtitulo: string
    descripcion: string
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
    const prendas = ITEMS.filter((item) => item.tienda.toLowerCase() === nombre.toLowerCase())

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

    const categorias: StoreCategoryItem[] = Array.from(catMap.entries()).map(([tipo, val]) => ({
      nombre: tipo === 'Buzo' ? 'Buzos & Hoodies' : tipo === 'Saco' ? 'Sacos & Blazers' : tipo === 'Pantalón' ? 'Pantalones' : tipo,
      tipo,
      imagen: val.imagen,
      cantidad: val.cantidad,
    }))

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
      telefono: adminStore?.telefono || '+57 601 555 0123',
      correo: adminStore?.correo || `${cleanId}@styleradar.co`,
      nit: adminStore?.nit || '901.482.337-1',
      representante: adminStore?.representante || 'Administrador de tienda',
      aliadaDesde: aliada,
      verificacion: adminStore?.verificacion || 'Verificada',
      rating: mapPin?.rating || '4,8',
      reviews: mapPin?.reviews || 150,
      descripcion:
        mapPin?.desc ||
        'Tienda local de Bogotá comprometida con la moda contemporánea, diseño independiente y producción ética.',
      foto: mapPin?.photo || '/img/sesion/rol-tienda.jpg',
      bannerNotice: mapPin?.hours
        ? `Abierto hoy · Horario ${mapPin.hours} · ${mapPin.dir}`
        : `Tienda local verificada en ${mapPin?.barrio || 'Bogotá'}`,
      prendas,
      categorias,
      coleccionDestacada: {
        titulo: `Colección ${mapPin?.cat || 'Urbana'} 2026`,
        subtitulo: `${prendas.length} prendas seleccionadas`,
        descripcion: 'Prendas con disponibilidad inmediata en tienda física para probador virtual y entrega en Bogotá.',
      },
      distintivos: [
        {
          titulo: 'Tienda verificada',
          descripcion: 'Documentos e identidad comprobada por StyleRadar.',
          icono: '🛡️',
        },
        {
          titulo: 'Moda local Bogotá',
          descripcion: `Punto físico activo en ${mapPin?.barrio || 'la ciudad'}.`,
          icono: '📍',
        },
        {
          titulo: 'Stock en tiempo real',
          descripcion: 'Inventario sincronizado para probarte o reservar.',
          icono: '⚡',
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
