import { useEffect, useRef, useState } from 'react'

interface Point {
  x: number
  y: number
}

interface TrailNode {
  x: number
  y: number
  time: number
  width: number
}

interface RocketProps {
  target: Point | null
  origin?: Point
  onImpact: (point: Point) => void
  prefersReducedMotion?: boolean
}

const FLIGHT_DURATION = 1250 // ms (~1.25s)
const TRAIL_LIFETIME = 550 // ms (~0.55s)

export function Rocket({
  target,
  origin,
  onImpact,
  prefersReducedMotion = false,
}: RocketProps) {
  const [pos, setPos] = useState<Point | null>(null)
  const [angle, setAngle] = useState(0)
  const [reticleScale, setReticleScale] = useState(2.4)
  const [trail, setTrail] = useState<TrailNode[]>([])

  const startTimeRef = useRef<number | null>(null)
  const animRef = useRef<number | null>(null)
  const p0Ref = useRef<Point>({ x: -240, y: 180 })
  const p1Ref = useRef<Point>({ x: -60, y: -160 })
  const p2Ref = useRef<Point>({ x: 0, y: 0 })
  const impactedRef = useRef(false)

  useEffect(() => {
    if (!target) return

    if (prefersReducedMotion) {
      onImpact(target)
      return
    }

    // Configurar puntos de la curva Bézier cuadrática
    p2Ref.current = target
    const p0 = origin || {
      x: target.x < 0 ? 260 : -260,
      y: target.y < 0 ? 220 : -180,
    }
    p0Ref.current = p0

    // Punto de control perpendicular a la cuerda
    const midX = (p0.x + target.x) / 2
    const midY = (p0.y + target.y) / 2
    const dx = target.x - p0.x
    const dy = target.y - p0.y
    const perpX = -dy * 0.45
    const perpY = dx * 0.45
    p1Ref.current = { x: midX + perpX, y: midY + perpY }

    impactedRef.current = false
    startTimeRef.current = null

    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / FLIGHT_DURATION, 1)

      const t = progress

      // B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
      const u = 1 - t
      const tt = t * t
      const uu = u * u
      const x = uu * p0Ref.current.x + 2 * u * t * p1Ref.current.x + tt * p2Ref.current.x
      const y = uu * p0Ref.current.y + 2 * u * t * p1Ref.current.y + tt * p2Ref.current.y

      // Tangente para orientación de la nave: B'(t) = 2(1-t)(P1 - P0) + 2t(P2 - P1)
      const dxTang = 2 * u * (p1Ref.current.x - p0Ref.current.x) + 2 * t * (p2Ref.current.x - p1Ref.current.x)
      const dyTang = 2 * u * (p1Ref.current.y - p0Ref.current.y) + 2 * t * (p2Ref.current.y - p1Ref.current.y)
      const rot = Math.atan2(dyTang, dxTang) * (180 / Math.PI) + 90

      setPos({ x, y })
      setAngle(rot)

      // Actualizar mira (reticle) cerrándose sobre el objetivo
      setReticleScale(Math.max(1, 2.4 - progress * 1.4))

      // Actualizar estela en cinta (nodos con vida de 550ms)
      setTrail((prev) => {
        const next = [...prev, { x, y, time: now, width: 8 * (1 - progress * 0.4) }]
        return next.filter((n) => now - n.time <= TRAIL_LIFETIME)
      })

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        // IMPACTO
        if (!impactedRef.current) {
          impactedRef.current = true
          onImpact(p2Ref.current)
          setTimeout(() => {
            setTrail([])
            setPos(null)
          }, 120)
        }
      }
    }

    animRef.current = requestAnimationFrame(tick)

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    }
  }, [target, origin, onImpact, prefersReducedMotion])

  if (!target || prefersReducedMotion) return null

  // Construir polilínea SVG para la estela en cinta
  const trailPoints = trail.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
      {/* 1. Mira de objetivo (reticle) que se cierra sobre el avatar */}
      <div
        className="absolute transition-transform ease-out"
        style={{
          transform: `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%) scale(${reticleScale})`,
        }}
      >
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="animate-spin-slow">
          <circle cx="22" cy="22" r="16" stroke="#D62F6B" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.85" />
          <line x1="22" y1="2" x2="22" y2="9" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="22" y1="35" x2="22" y2="42" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="2" y1="22" x2="9" y2="22" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="35" y1="22" x2="42" y2="22" stroke="#FFFFFF" strokeWidth="2" />
        </svg>
      </div>

      {/* 2. Estela en cinta continua (ribbon trail) */}
      {trail.length > 2 && (
        <svg className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="rocketTrailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4B1FA8" stopOpacity="0" />
              <stop offset="50%" stopColor="#B79AF5" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#D62F6B" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <polyline
            points={trailPoints}
            fill="none"
            stroke="url(#rocketTrailGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* 3. Nave (SVG estilizado espacial) */}
      {pos && (
        <div
          className="absolute"
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) rotate(${angle}deg)`,
          }}
        >
          <svg width="26" height="34" viewBox="0 0 26 34" fill="none" className="drop-shadow-[0_0_12px_#D62F6B]">
            {/* Llamarada propulsora */}
            <path
              d="M13 32 C11 28, 10 24, 13 22 C16 24, 15 28, 13 32 Z"
              fill="#D62F6B"
              className="animate-pulse"
            />
            <path
              d="M13 29 C12 26, 11.5 24, 13 23 C14.5 24, 14 26, 13 29 Z"
              fill="#FFFFFF"
            />
            {/* Cuerpo aerodinámico de la nave */}
            <path
              d="M13 2 L19 18 L16 23 L13 21 L10 23 L7 18 Z"
              fill="#F4EEE3"
              stroke="#4B1FA8"
              strokeWidth="1.2"
            />
            {/* Cabina / Visor */}
            <ellipse cx="13" cy="11" rx="2.5" ry="4" fill="#4B1FA8" />
            {/* Alerones laterales */}
            <path d="M7 18 L2 22 L7 23 Z" fill="#B79AF5" />
            <path d="M19 18 L24 22 L19 23 Z" fill="#B79AF5" />
          </svg>
        </div>
      )}
    </div>
  )
}
