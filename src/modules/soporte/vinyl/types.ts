import type { ContactoDto, ConversacionDto, TipoContacto } from '../types/chat.dto'

/** Umbral para clasificar conversación como reciente (48 horas) */
export const RECENT_THRESHOLD_MS = 48 * 60 * 60 * 1000

export type VinylTrackLevel = 1 | 2 | 3

export interface TrackConfig {
  level: VinylTrackLevel
  label: string
  /** Radio proporcional al tamaño del contenedor (width) */
  radiusRatio: number
  glowColor: string
  badgeColor: string
}

export const TRACK_CONFIGS: Record<VinylTrackLevel, TrackConfig> = {
  1: {
    level: 1,
    label: 'SIN LEER',
    radiusRatio: 0.255,
    glowColor: 'rgba(214, 47, 107, 0.65)',
    badgeColor: '#D62F6B',
  },
  2: {
    level: 2,
    label: 'VISTOS',
    radiusRatio: 0.36,
    glowColor: 'rgba(183, 154, 245, 0.45)',
    badgeColor: '#B79AF5',
  },
  3: {
    level: 3,
    label: 'ANTIGUOS',
    radiusRatio: 0.455,
    glowColor: 'rgba(244, 238, 227, 0.25)',
    badgeColor: '#CFC6E0',
  },
}

export interface VinylItem {
  id: string
  conv: ConversacionDto
  trackLevel: VinylTrackLevel
  angle: number // Radianes
  radiusRatio: number
  x: number // Coordenadas relativas al centro (px)
  y: number // Coordenadas relativas al centro (px)
  unreadCount: number
  initials: string
  photoUrl: string | null
  contactType: TipoContacto
}

/**
 * Mapeo de fotos reales existentes en el proyecto según el tipo e identidad del contacto
 */
export function getContactPhoto(contacto: ContactoDto): string | null {
  const nombre = contacto.nombre.toLowerCase()

  // 1. Tiendas: fotos de fachada o local
  if (contacto.tipo === 'TIENDA') {
    if (nombre.includes('luna')) return '/img/mapa/luna.jpg'
    if (nombre.includes('nomada') || nombre.includes('nómada')) return '/img/mapa/nomada.jpg'
    if (nombre.includes('kicks')) return '/img/mapa/kicks.jpg'
    if (nombre.includes('lab')) return '/img/mapa/lab.jpg'
    if (nombre.includes('kennedy')) return '/img/mapa/kennedy.jpg'
    if (nombre.includes('dignidad')) return '/img/mapa/dignidad.jpg'
    return '/img/mapa/luna.jpg'
  }

  // 2. Fundaciones: logo, sede o equipo
  if (contacto.tipo === 'FUNDACION') {
    if (nombre.includes('abrigo')) return '/img/fundaciones/abrigo-trabajo.jpg'
    return '/img/fundaciones/abrigo-donaciones.jpg'
  }

  // 3. Personas (vendedor, comprador, donante): fotos de perfil reales
  if (nombre.includes('sofía') || nombre.includes('sofia')) {
    return '/img/landing/slide-3.jpg'
  }
  if (nombre.includes('valentina')) {
    return '/img/landing/slide-2.jpg'
  }
  if (nombre.includes('mateo')) {
    return '/img/landing/slide-4.jpg'
  }
  if (nombre.includes('camila')) {
    return '/img/landing/slide-5.jpg'
  }

  // Fallback con imagen de persona editorial
  return '/img/landing/slide-1.jpg'
}

export function getInitials(nombre: string): string {
  if (!nombre) return 'SR'
  const partes = nombre.trim().split(/\s+/)
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase()
  }
  return nombre.slice(0, 2).toUpperCase()
}
