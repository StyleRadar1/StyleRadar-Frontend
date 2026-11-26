import { apiClient } from '@/modules/core/api/apiClient'
import { env } from '@/configs/env'
import { FUNDACIONES } from '@/modules/mapa/mocks/mapData'
import { FOUNDATIONS } from '../mocks/secondHand'
import { FOUNDATION_PROFILES } from '../mocks/foundationProfile'
import type { NecesidadDto } from '../types/foundationProfile.dto'

export interface FoundationGalleryItem {
  id: string
  url: string
  tag: string
}

export interface FoundationPointItem {
  id: string
  nombre: string
  direccion: string
}

export interface FoundationPublicDto {
  id: string
  nombre: string
  barrio: string
  direccion: string
  horario: string
  telefono: string
  correo: string
  web?: string
  activa: boolean
  verificacion: string
  aliadaDesde: string
  descripcion: string
  aQuienAyudamos: string
  bannerNotice: string
  foto: string
  fotoEditorial: string
  fotosGaleria: FoundationGalleryItem[]
  queRecibimos: string[]
  queHacemos: string[]
  necesidades: NecesidadDto[]
  puntos: FoundationPointItem[]
  destacado: {
    titulo: string
    descripcion: string
  }
  distintivos: {
    titulo: string
    descripcion: string
    icono: 'shield' | 'pin' | 'heart'
  }[]
  cifras: {
    prendasEntregadas: number
    donacionesRecibidas: number
    voluntarios: number
    aliadaDesde: string
  }
}

const slugify = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const DEFAULT_IMAGES: Record<string, string> = {
  abrigo: '/img/fundaciones/abrigo-trabajo.jpg',
  suba: '/img/mapa/suba.jpg',
  kennedy: '/img/mapa/kennedy.jpg',
  dignidad: '/img/mapa/dignidad.jpg',
}

const FOUNDATION_GALLERY_POOL = [
  '/img/fundaciones/abrigo-voluntarios.jpg',
  '/img/fundaciones/abrigo-clasificacion.jpg',
  '/img/fundaciones/abrigo-donaciones.jpg',
  '/img/fundaciones/abrigo-impacto.png',
  '/img/fundaciones/abrigo-acopio.jpg',
  '/img/fundaciones/abrigo-trabajo.jpg',
] as const

function pickDistinctMedia(candidates: (string | undefined)[], used: Set<string>): string {
  for (const candidate of candidates) {
    const clean = candidate?.trim()
    if (clean && !used.has(clean)) {
      used.add(clean)
      return clean
    }
  }
  const fallback = FOUNDATION_GALLERY_POOL.find((url) => !used.has(url)) ?? FOUNDATION_GALLERY_POOL[0]
  used.add(fallback)
  return fallback
}

function buildDistinctGallery(
  id: string,
  used: Set<string>,
  preferred: { url?: string; tag: string }[],
): FoundationGalleryItem[] {
  const result: FoundationGalleryItem[] = []
  for (let i = 0; i < preferred.length; i++) {
    const url = pickDistinctMedia([preferred[i].url, ...FOUNDATION_GALLERY_POOL], used)
    result.push({ id: `${id}-g${i + 1}`, url, tag: preferred[i].tag })
  }
  return result
}

const DEFAULT_NECESIDADES: Record<string, NecesidadDto[]> = {
  abrigo: [
    { nombre: 'Chaquetas talla M y L', avance: 82 },
    { nombre: 'Calzado 40 a 43', avance: 55 },
    { nombre: 'Cobijas', avance: 34 },
  ],
  suba: [
    { nombre: 'Uniformes escolares', avance: 74 },
    { nombre: 'Ropa infantil de 4 a 12 años', avance: 61 },
    { nombre: 'Tenis y calzado escolar', avance: 40 },
  ],
  kennedy: [
    { nombre: 'Chaquetas y sacos de adulto', avance: 68 },
    { nombre: 'Ropa de cama y cobijas', avance: 45 },
    { nombre: 'Calzado cómodo', avance: 52 },
  ],
  dignidad: [
    { nombre: 'Blazers y sacos formales', avance: 79 },
    { nombre: 'Camisas blancas y neutras', avance: 64 },
    { nombre: 'Zapatos formales de entrevista', avance: 38 },
  ],
}

const DEFAULT_QUE_HACEMOS: Record<string, string[]> = {
  abrigo: [
    'Jornadas nocturnas de entrega de chaquetas y cobijas',
    'Ropero abierto los sábados para familias',
    'Lavado y arreglo de prendas con voluntarios',
  ],
  suba: [
    'Ropero comunitario gratuito para familias del sector',
    'Clasificación y reparación de ropa infantil y escolar',
    'Campañas mensuales de trueque solidario',
  ],
  kennedy: [
    'Acopio y clasificación de prendas para comedores comunitarios',
    'Entrega directa a hogares vulnerables del suroccidente',
    'Jornadas de economía circular y reutilización textil',
  ],
  dignidad: [
    'Asesoría de imagen y vestuario para entrevistas laborales',
    'Préstamo y entrega de trajes formales sin costo',
    'Acompañamiento a personas en transición laboral',
  ],
}

function buildFromMock(cleanId: string): FoundationPublicDto | null {
  const mapPin = FUNDACIONES.find(
    (f) => f.id.toLowerCase() === cleanId || slugify(f.name) === cleanId,
  )
  const secondHandFound = FOUNDATIONS.find(
    (f) => f.id.toLowerCase() === cleanId || slugify(f.nombre) === cleanId,
  )
  const profile = FOUNDATION_PROFILES[mapPin?.id ?? secondHandFound?.id ?? cleanId]

  if (!mapPin && !secondHandFound && !profile) return null

  const id = profile?.id ?? mapPin?.id ?? secondHandFound?.id ?? cleanId
  const nombre = profile?.nombre ?? mapPin?.name ?? secondHandFound?.nombre ?? 'Fundación Aliada'
  const barrio = profile?.barrio ?? mapPin?.barrio ?? secondHandFound?.barrio ?? 'Bogotá'
  const direccion = profile?.contacto.direccion ?? mapPin?.dir ?? secondHandFound?.puntos?.[0]?.direccion ?? 'Bogotá D.C.'
  const horario = profile?.contacto.horario ?? mapPin?.hours ?? 'Lun a vie · 9:00 a 17:00'
  const descripcion =
    profile?.descripcion ??
    mapPin?.desc ??
    'Organización social aliada a StyleRadar comprometida con el acceso digno a prendas en buen estado.'
  const usedMedia = new Set<string>()
  const foto = pickDistinctMedia([profile?.fotos.portada, mapPin?.photo, DEFAULT_IMAGES[id]], usedMedia)
  if (foto === '/img/mapa/abrigo.jpg') usedMedia.add('/img/fundaciones/abrigo-trabajo.jpg')
  if (foto === '/img/fundaciones/abrigo-trabajo.jpg') usedMedia.add('/img/mapa/abrigo.jpg')
  const fotoEditorial = pickDistinctMedia(
    [profile?.fotos.trabajo, profile?.fotos.donaciones, mapPin?.photo],
    usedMedia,
  )
  const fotosGaleria = buildDistinctGallery(id, usedMedia, [
    { url: profile?.fotos.donaciones, tag: 'Trabajo comunitario' },
    { url: profile?.fotos.impacto, tag: 'Punto de recepción' },
  ])
  const queRecibimos = profile?.queRecibimos ?? mapPin?.accepts ?? secondHandFound?.categorias ?? ['Ropa en buen estado']
  const queHacemos = profile?.queHacemos ?? DEFAULT_QUE_HACEMOS[id] ?? [
    'Recepción y clasificación solidaria de prendas',
    'Entrega directa a comunidades priorizadas',
  ]
  const necesidades = profile?.necesidades ?? DEFAULT_NECESIDADES[id] ?? queRecibimos.slice(0, 3).map((item, idx) => ({
    nombre: item,
    avance: Math.max(25, 80 - idx * 18),
  }))
  const puntos: FoundationPointItem[] =
    secondHandFound?.puntos && secondHandFound.puntos.length > 0
      ? secondHandFound.puntos
      : [{ id: `${id}-1`, nombre: `Sede ${barrio}`, direccion }]
  const stats = mapPin?.stats ?? [950, 280, 5]
  const activa = profile?.activa ?? secondHandFound?.activa ?? true

  return {
    id,
    nombre,
    barrio,
    direccion,
    horario,
    telefono: profile?.contacto.telefono ?? '+57 601 555 0300',
    correo: profile?.contacto.correo ?? `${id}@styleradar.co`,
    web: profile?.contacto.web,
    activa,
    verificacion: activa ? 'Fundación verificada' : 'Recepción pausada temporalmente',
    aliadaDesde: '2024',
    descripcion,
    aQuienAyudamos:
      profile?.aQuienAyudamos ?? `Familias y comunidades de ${barrio} y zonas cercanas en Bogotá.`,
    bannerNotice: activa
      ? `Recepción activa en ${barrio} · ${horario}.`
      : `Esta fundación tiene la recepción temporalmente pausada · ${horario}.`,
    foto,
    fotoEditorial,
    fotosGaleria,
    queRecibimos,
    queHacemos,
    necesidades,
    puntos,
    destacado: {
      titulo: activa ? 'Recepción abierta hoy' : 'Campaña en pausa',
      descripcion: `Recibimos ${queRecibimos.slice(0, 3).join(', ').toLowerCase()} en ${barrio}. Cada donación genera comprobante de entrega.`,
    },
    distintivos: [
      {
        titulo: activa ? 'Fundación Verificada' : 'Recepción Pausada',
        descripcion: activa ? 'Certificación activa en StyleRadar' : 'Consulta fechas de reapertura',
        icono: 'shield',
      },
      {
        titulo: `Sede en ${barrio}`,
        descripcion: direccion,
        icono: 'pin',
      },
      {
        titulo: 'Impacto Trazable',
        descripcion: 'Comprobante de donación garantizado',
        icono: 'heart',
      },
    ],
    cifras: {
      prendasEntregadas: stats[0],
      donacionesRecibidas: stats[1],
      voluntarios: stats[2],
      aliadaDesde: '2024',
    },
  }
}

function mapBackendFoundation(raw: Record<string, any>, fallback?: FoundationPublicDto | null): FoundationPublicDto {
  const id = String(raw.id ?? raw.nit ?? fallback?.id ?? '')
  const nombre = String(raw.name ?? raw.nombre ?? raw.tradeName ?? fallback?.nombre ?? 'Fundación Aliada')
  const barrio = String(raw.neighborhood ?? raw.barrio ?? fallback?.barrio ?? 'Bogotá')
  const direccion = String(raw.address ?? raw.direccion ?? fallback?.direccion ?? 'Bogotá D.C.')
  const horario = String(raw.hours ?? raw.horario ?? fallback?.horario ?? 'Lun a vie · 9:00 a 17:00')
  const activa = typeof raw.active === 'boolean' ? raw.active : typeof raw.activa === 'boolean' ? raw.activa : (fallback?.activa ?? true)
  const queRecibimos: string[] =
    Array.isArray(raw.acceptedCategories) && raw.acceptedCategories.length
      ? raw.acceptedCategories
      : Array.isArray(raw.categorias) && raw.categorias.length
        ? raw.categorias
        : fallback?.queRecibimos ?? ['Ropa en buen estado', 'Calzado']
  const usedMedia = new Set<string>()
  const foto = pickDistinctMedia(
    [raw.photoUrl, raw.foto, raw.photo, fallback?.foto, '/img/fundaciones/abrigo-trabajo.jpg'],
    usedMedia,
  )
  if (foto === '/img/mapa/abrigo.jpg') usedMedia.add('/img/fundaciones/abrigo-trabajo.jpg')
  if (foto === '/img/fundaciones/abrigo-trabajo.jpg') usedMedia.add('/img/mapa/abrigo.jpg')
  const fotoEditorial = pickDistinctMedia([fallback?.fotoEditorial], usedMedia)
  const fotosGaleria = buildDistinctGallery(
    id,
    usedMedia,
    fallback?.fotosGaleria?.length
      ? fallback.fotosGaleria.map((item) => ({ url: item.url, tag: item.tag }))
      : [
          { tag: 'Sede principal' },
          { tag: 'Punto de recepción' },
        ],
  )

  return {
    id,
    nombre,
    barrio,
    direccion,
    horario,
    telefono: String(raw.phone ?? raw.telefono ?? fallback?.telefono ?? '+57 601 555 0300'),
    correo: String(raw.email ?? raw.contactEmail ?? raw.correo ?? fallback?.correo ?? 'contacto@styleradar.co'),
    web: raw.website ?? raw.web ?? fallback?.web,
    activa,
    verificacion: activa ? 'Fundación verificada' : 'Recepción pausada temporalmente',
    aliadaDesde: fallback?.aliadaDesde ?? '2024',
    descripcion: String(raw.description ?? raw.descripcion ?? fallback?.descripcion ?? 'Fundación aliada a StyleRadar en Bogotá.'),
    aQuienAyudamos: String(raw.targetPopulation ?? raw.aQuienAyudamos ?? fallback?.aQuienAyudamos ?? `Comunidades vulnerables en ${barrio}.`),
    bannerNotice: activa
      ? `Recepción activa en ${barrio} · ${horario}.`
      : `Esta fundación tiene la recepción temporalmente pausada · ${horario}.`,
    foto,
    fotoEditorial,
    fotosGaleria,
    queRecibimos,
    queHacemos: Array.isArray(raw.programs) && raw.programs.length ? raw.programs : (fallback?.queHacemos ?? [
      'Acopio y clasificación solidaria de prendas',
      'Entrega directa a familias y comunidades',
    ]),
    necesidades: fallback?.necesidades ?? queRecibimos.slice(0, 3).map((item, idx) => ({
      nombre: item,
      avance: Math.max(25, 80 - idx * 18),
    })),
    puntos: Array.isArray(raw.points) && raw.points.length
      ? raw.points.map((p: any, i: number) => ({
          id: String(p.id ?? `${id}-${i}`),
          nombre: String(p.name ?? p.nombre ?? `Punto ${i + 1}`),
          direccion: String(p.address ?? p.direccion ?? direccion),
        }))
      : fallback?.puntos ?? [{ id: `${id}-1`, nombre: `Sede ${barrio}`, direccion }],
    destacado: fallback?.destacado ?? {
      titulo: activa ? 'Recepción abierta hoy' : 'Campaña en pausa',
      descripcion: `Recibimos ${queRecibimos.slice(0, 3).join(', ').toLowerCase()} en ${barrio}.`,
    },
    distintivos: [
      {
        titulo: activa ? 'Fundación Verificada' : 'Recepción Pausada',
        descripcion: activa ? 'Certificación activa en StyleRadar' : 'Consulta fechas de reapertura',
        icono: 'shield',
      },
      {
        titulo: `Sede en ${barrio}`,
        descripcion: direccion,
        icono: 'pin',
      },
      {
        titulo: 'Impacto Trazable',
        descripcion: 'Comprobante de donación garantizado',
        icono: 'heart',
      },
    ],
    cifras: fallback?.cifras ?? {
      prendasEntregadas: Number(raw.garmentsDelivered ?? 950),
      donacionesRecibidas: Number(raw.donationsCount ?? 280),
      voluntarios: Number(raw.volunteersCount ?? 5),
      aliadaDesde: '2024',
    },
  }
}

export const foundationPublicService = {
  getById(id: string): FoundationPublicDto | null {
    const cleanId = (id || '').trim().toLowerCase()
    if (!cleanId) return null
    return buildFromMock(cleanId)
  },

  async getByIdAsync(id: string): Promise<FoundationPublicDto | null> {
    const cleanId = decodeURIComponent(id || '').trim().toLowerCase()
    if (!cleanId) return null

    if (env.useMocks) {
      return buildFromMock(cleanId)
    }

    const base = buildFromMock(cleanId)
    const [foundationsRes, nearbyRes] = await Promise.all([
      apiClient.get<any[]>('/api/v1/foundations').catch(() => ({ data: [] as any[] })),
      apiClient
        .get<any[]>('/api/v1/foundations/nearby', { params: { lat: 4.6533, lng: -74.0836, radioKm: 30 } })
        .catch(() => ({ data: [] as any[] })),
    ])

    const all = [
      ...(Array.isArray(foundationsRes.data) ? foundationsRes.data : []),
      ...(Array.isArray(nearbyRes.data) ? nearbyRes.data : []),
    ]

    const match = all.find((f) => {
      const fId = String(f?.id ?? '').toLowerCase()
      const fNit = String(f?.nit ?? '').toLowerCase()
      const fName = slugify(String(f?.name ?? f?.nombre ?? ''))
      return fId === cleanId || (fNit && fNit === cleanId) || fName === cleanId
    })

    if (match) {
      return mapBackendFoundation(match, base)
    }

    return base
  },
}
