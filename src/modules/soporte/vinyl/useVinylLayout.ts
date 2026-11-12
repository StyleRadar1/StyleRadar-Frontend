import { useState, useEffect, useRef, useMemo } from 'react'
import type { ConversacionDto, TipoContacto } from '../types/chat.dto'
import {
  TRACK_CONFIGS,
  RECENT_THRESHOLD_MS,
  getContactPhoto,
  getInitials,
  type VinylTrackLevel,
  type VinylItem,
} from './types'

export interface UseVinylLayoutOptions {
  conversaciones: ConversacionDto[]
  selectedId: string | null
  containerSize: number
  isHovered?: boolean
  hasActiveChat?: boolean
}

export interface VinylLayoutState {
  items: VinylItem[]
  overflowMap: Record<VinylTrackLevel, ConversacionDto[]>
  selectedItem: VinylItem | null
  rotationRad: number
  avatarSize: number
}

// Velocidad base: ~9 grados por segundo = (9 * Math.PI / 180) rad/s ≈ 0.157 rad/s
const BASE_SPEED_RAD_PER_SEC = (9 * Math.PI) / 180
const SLOWDOWN_FACTOR = 0.3

export function useVinylLayout({
  conversaciones,
  selectedId,
  containerSize,
  isHovered = false,
  hasActiveChat = false,
}: UseVinylLayoutOptions): VinylLayoutState {
  const [rotationRad, setRotationRad] = useState(0)
  const lastTimeRef = useRef<number | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Detección pura de prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  // Clasificación de conversaciones en los 3 surcos
  const { track1, track2, track3, overflowMap } = useMemo(() => {
    const t1: ConversacionDto[] = []
    const t2: ConversacionDto[] = []
    const t3: ConversacionDto[] = []

    for (const c of conversaciones) {
      if (c.noLeidos > 0) {
        t1.push(c)
      } else {
        const lastMsgTime = c.actualizadaEn
          ? new Date(c.actualizadaEn).getTime()
          : 0
        // Umbral fijo de 48h desde la fecha del mensaje
        if (Date.now() - lastMsgTime < RECENT_THRESHOLD_MS) {
          t2.push(c)
        } else {
          t3.push(c)
        }
      }
    }

    // Regla de desborde: máx 12 contactos por surco. Primeros 11 visibles, resto a overflow
    const handleOverflow = (list: ConversacionDto[]) => {
      if (list.length <= 12) {
        return { visible: list, overflow: [] }
      }
      return {
        visible: list.slice(0, 11),
        overflow: list.slice(11),
      }
    }

    const res1 = handleOverflow(t1)
    const res2 = handleOverflow(t2)
    const res3 = handleOverflow(t3)

    return {
      track1: res1.visible,
      track2: res2.visible,
      track3: res3.visible,
      overflowMap: {
        1: res1.overflow,
        2: res2.overflow,
        3: res3.overflow,
      } as Record<VinylTrackLevel, ConversacionDto[]>,
    }
  }, [conversaciones])

  // Ajuste dinámico del tamaño de avatars
  const avatarSize = useMemo(() => {
    const baseSize = containerSize < 500 ? 46 : 60
    const maxDensity = Math.max(track1.length, track2.length, track3.length)
    if (maxDensity > 8) {
      return Math.max(40, Math.round(baseSize * 0.85))
    }
    return baseSize
  }, [containerSize, track1.length, track2.length, track3.length])

  // Asignación de ángulos estáticos equidistantes en cada surco
  const staticItems = useMemo(() => {
    const buildTrackItems = (
      list: ConversacionDto[],
      level: VinylTrackLevel,
      angularOffsetRad: number
    ): Omit<VinylItem, 'x' | 'y'>[] => {
      const count = list.length
      if (count === 0) return []
      const step = (Math.PI * 2) / count

      return list.map((c, i) => {
        const angle = angularOffsetRad + i * step
        const cfg = TRACK_CONFIGS[level]
        return {
          id: c.id,
          conv: c,
          trackLevel: level,
          angle,
          radiusRatio: cfg.radiusRatio,
          unreadCount: c.noLeidos,
          initials: getInitials(c.contacto.nombre),
          photoUrl: getContactPhoto(c.contacto),
          contactType: c.contacto.tipo as TipoContacto,
        }
      })
    }

    // Offsets angulares para aspecto orgánico escalonado
    const items1 = buildTrackItems(track1, 1, 0)
    const items2 = buildTrackItems(track2, 2, Math.PI / 6) // 30 deg offset
    const items3 = buildTrackItems(track3, 3, Math.PI / 4) // 45 deg offset

    return [...items1, ...items2, ...items3]
  }, [track1, track2, track3])

  // Loop de rotación física continua
  const isSlowed = isHovered || hasActiveChat || !!selectedId
  const loopParamsRef = useRef({ reducedMotion, isSlowed })
  loopParamsRef.current = { reducedMotion, isSlowed }

  useEffect(() => {
    lastTimeRef.current = null

    const tick = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp
      }
      const deltaSec = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      const { reducedMotion: rm, isSlowed: slowed } = loopParamsRef.current

      if (!rm) {
        const currentSpeed = slowed
          ? BASE_SPEED_RAD_PER_SEC * SLOWDOWN_FACTOR
          : BASE_SPEED_RAD_PER_SEC
        setRotationRad((prev) => (prev + currentSpeed * deltaSec) % (Math.PI * 2))
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [])

  // Cálculo de coordenadas dinámicas (x, y) relativas al centro
  const items = useMemo(() => {
    return staticItems.map((item) => {
      const radiusPx = item.radiusRatio * containerSize
      const currentAngle = (item.angle + rotationRad) % (Math.PI * 2)
      return {
        ...item,
        x: radiusPx * Math.cos(currentAngle),
        y: radiusPx * Math.sin(currentAngle),
      }
    })
  }, [staticItems, containerSize, rotationRad])

  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    return items.find((it) => it.id === selectedId) || null
  }, [items, selectedId])

  return {
    items,
    overflowMap,
    selectedItem,
    rotationRad,
    avatarSize,
  }
}
