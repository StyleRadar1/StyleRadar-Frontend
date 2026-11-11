import { useEffect, useMemo, useRef, useState } from 'react'
import type { ConversacionDto } from '../types/chat.dto'
import {
  getInitials,
  ORBIT_RINGS,
  ORBIT_TILT_RAD,
  RECENT_THRESHOLD_MS,
  type OrbitItem,
  type OrbitLevel,
} from './types'

const MAX_PER_ORBIT = 8

interface UseOrbitLayoutProps {
  conversations: ConversacionDto[]
  prefersReducedMotion?: boolean
  isPaused?: boolean
}

export function useOrbitLayout({
  conversations,
  prefersReducedMotion = false,
  isPaused = false,
}: UseOrbitLayoutProps) {
  // Ángulo acumulado por órbita para la rotación suave
  const [angles, setAngles] = useState<{ 1: number; 2: number; 3: number }>({
    1: 0,
    2: Math.PI / 4,
    3: Math.PI / 2,
  })

  const animRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  // Bucle de animación para la rotación orbital
  useEffect(() => {
    if (prefersReducedMotion || isPaused) return

    const tick = (now: number) => {
      if (document.visibilityState !== 'visible') {
        lastTimeRef.current = now
        animRef.current = requestAnimationFrame(tick)
        return
      }

      if (lastTimeRef.current !== null) {
        const dt = Math.min(now - lastTimeRef.current, 50) // Limitar dt a 50ms para evitar saltos
        setAngles((prev) => ({
          1: (prev[1] + ORBIT_RINGS[1].speed * dt) % (Math.PI * 2),
          2: (prev[2] + ORBIT_RINGS[2].speed * dt) % (Math.PI * 2),
          3: (prev[3] + ORBIT_RINGS[3].speed * dt) % (Math.PI * 2),
        }))
      }
      lastTimeRef.current = now
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    }
  }, [prefersReducedMotion, isPaused])

  const [now] = useState(() => Date.now())

  // Clasificación por órbita según reglas de negocio
  const categorized = useMemo(() => {
    const orbit1: ConversacionDto[] = []
    const orbit2: ConversacionDto[] = []
    const orbit3: ConversacionDto[] = []

    for (const c of conversations) {
      if (c.noLeidos > 0) {
        orbit1.push(c)
      } else {
        const fecha = new Date(c.actualizadaEn).getTime()
        // Comparación con umbral de 48h
        if (now - fecha <= RECENT_THRESHOLD_MS) {
          orbit2.push(c)
        } else {
          orbit3.push(c)
        }
      }
    }

    return { 1: orbit1, 2: orbit2, 3: orbit3 }
  }, [conversations, now])

  // Total de no leídos
  const totalUnread = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.noLeidos || 0), 0)
  }, [conversations])

  // Cálculo de posiciones de cada ítem en la elipse inclinada con perspectiva
  const { items, overflowByLevel } = useMemo(() => {
    const allItems: OrbitItem[] = []
    const overflow: Record<OrbitLevel, ConversacionDto[]> = { 1: [], 2: [], 3: [] }

    const cosT = Math.cos(ORBIT_TILT_RAD)
    const sinT = Math.sin(ORBIT_TILT_RAD)

    for (const level of [1, 2, 3] as OrbitLevel[]) {
      const list = categorized[level]
      const visible = list.slice(0, MAX_PER_ORBIT)
      if (list.length > MAX_PER_ORBIT) {
        overflow[level] = list.slice(MAX_PER_ORBIT)
      }

      const ring = ORBIT_RINGS[level]
      const count = visible.length
      const baseOffset = angles[level]

      visible.forEach((conv, index) => {
        // Distribución angular equitativa
        const step = (Math.PI * 2) / Math.max(count, 1)
        const alpha = baseOffset + index * step

        // Punto en la elipse sin rotar
        const x0 = ring.rx * Math.cos(alpha)
        const y0 = ring.ry * Math.sin(alpha)

        // Rotar por la inclinación de la órbita
        const x = x0 * cosT - y0 * sinT
        const y = x0 * sinT + y0 * cosT

        // Profundidad en función de y0 (el hemisferio superior está más alejado)
        const depthRatio = (y0 + ring.ry) / (2 * ring.ry) // 0 (más lejano) a 1 (más cercano)
        const scale = 0.85 + depthRatio * 0.25 // 0.85 a 1.10
        const opacity = 0.78 + depthRatio * 0.22 // 0.78 a 1.00
        const zIndex = 10 + Math.round(depthRatio * 30) // 10 a 40

        allItems.push({
          id: conv.id,
          conv,
          orbitLevel: level,
          angle: alpha,
          x,
          y,
          scale,
          opacity,
          zIndex,
          unreadCount: conv.noLeidos || 0,
          initials: getInitials(conv.contacto.nombre),
        })
      })
    }

    return { items: allItems, overflowByLevel: overflow }
  }, [categorized, angles])

  return {
    items,
    totalUnread,
    categorized,
    overflowByLevel,
  }
}
