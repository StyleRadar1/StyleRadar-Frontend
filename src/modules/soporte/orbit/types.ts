import type { ConversacionDto } from '../types/chat.dto'

/** Umbral para clasificar una conversación leída como "reciente" (48 horas) */
export const RECENT_THRESHOLD_MS = 48 * 60 * 60 * 1000

export type OrbitLevel = 1 | 2 | 3

export interface OrbitItem {
  id: string
  conv: ConversacionDto
  orbitLevel: OrbitLevel
  angle: number // Radianes
  x: number // Posición relativa al centro (px)
  y: number // Posición relativa al centro (px)
  scale: number // Escala de profundidad (0.85 a 1.1)
  opacity: number // Opacidad por profundidad (0.75 a 1.0)
  zIndex: number
  unreadCount: number
  initials: string
}

export interface OrbitRingConfig {
  level: OrbitLevel
  label: string
  badgeColor: string
  lineColor: string
  glowColor: string
  rx: number
  ry: number
  speed: number // rad/ms
}

export const ORBIT_RINGS: Record<OrbitLevel, OrbitRingConfig> = {
  1: {
    level: 1,
    label: 'SIN LEER',
    badgeColor: '#D62F6B',
    lineColor: 'rgba(214, 47, 107, 0.65)',
    glowColor: 'rgba(214, 47, 107, 0.35)',
    rx: 175,
    ry: 92,
    speed: 0.00032,
  },
  2: {
    level: 2,
    label: 'RECIENTES',
    badgeColor: '#B79AF5',
    lineColor: 'rgba(183, 154, 245, 0.45)',
    glowColor: 'rgba(183, 154, 245, 0.2)',
    rx: 280,
    ry: 148,
    speed: 0.00022,
  },
  3: {
    level: 3,
    label: 'ANTIGUOS',
    badgeColor: 'rgba(185, 185, 202, 0.5)',
    lineColor: 'rgba(185, 185, 202, 0.3)',
    glowColor: 'rgba(185, 185, 202, 0.12)',
    rx: 390,
    ry: 206,
    speed: 0.00015,
  },
}

/** Inclinación en radianes de las elipses (-14 grados) */
export const ORBIT_TILT_RAD = (-14 * Math.PI) / 180

export function getInitials(nombre: string): string {
  if (!nombre) return 'SR'
  const partes = nombre.trim().split(/\s+/)
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase()
  }
  return nombre.slice(0, 2).toUpperCase()
}
