import type { ContactoDto, ConversacionDto, TipoContacto } from '../types/chat.dto'

export interface TrackOrbitConfig {
  f: number // Factor de radio respecto al ancho del escenario
  k: number // Factor elíptico (1 para circular en vinilo)
  tilt: number // Inclinación en grados (0 para vinilo plano)
  w: number // Velocidad angular en grados/segundo
  label: string
}

export const ORB_CONFIGS: Record<1 | 2 | 3, TrackOrbitConfig> = {
  1: { f: 0.255, k: 1, tilt: 0, w: 9, label: 'Sin leer' },
  2: { f: 0.36, k: 1, tilt: 0, w: 9, label: 'Vistos' },
  3: { f: 0.455, k: 1, tilt: 0, w: 9, label: 'Antiguos' },
}

export interface VinylSignal {
  id: string
  conv: ConversacionDto
  orbit: 1 | 2 | 3
  ang: number // Ángulo en grados
  r: number
  k: number
  tl: number
  px: number // Posición x en px relativa al centro de la escena
  py: number // Posición y en px relativa al centro de la escena
  s: number
  unread: number
  name: string
  tag: string
  type: TipoContacto
  photoUrl: string | null
  initials: string
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
    if (nombre.includes('retro') || nombre.includes('kicks')) return '/img/mapa/kicks.jpg'
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

  return '/img/landing/slide-1.jpg'
}

export function getInitials(nombre: string): string {
  if (!nombre) return 'SR'
  const partes = nombre.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, '').trim().split(/\s+/)
  if (partes.length >= 2) {
    return (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase()
  }
  return nombre.slice(0, 2).toUpperCase()
}
