import React, { useEffect, useRef, useState } from 'react'
import type { VinylItem } from './types'

interface TonearmProps {
  size: number
  selectedItem: VinylItem | null
  onImpact: (coords: { x: number; y: number }) => void
}

interface WaveRing {
  id: number
  x: number
  y: number
  color: string
  maxR: number
  durationMs: number
  delayMs: number
}

export const Tonearm: React.FC<TonearmProps> = ({
  size,
  selectedItem,
  onImpact,
}) => {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const [waveRings, setWaveRings] = useState<WaveRing[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  // Centro del contenedor
  const cx = size / 2
  const cy = size / 2

  // Base del brazo en (+0.60, -0.56) relativo al centro y al radio R = size / 2
  const baseR = size / 2
  const baseX = cx + 0.60 * baseR
  const baseY = cy - 0.56 * baseR

  // Estado del brazo: ángulo (rad), longitud (px), elevación (0 = en reposo/en disco, 1 = viajando elevado)
  const restAngle = (105 * Math.PI) / 180
  const restLength = 0.35 * size

  const [armAngle, setArmAngle] = useState(restAngle)
  const [armLength, setArmLength] = useState(restLength)
  const [armElevation, setArmElevation] = useState(0) // 0 a 1

  const animStateRef = useRef({
    isTraveling: false,
    startTime: 0,
    durationMs: 1300,
    startAngle: restAngle,
    startLength: restLength,
    lastSelectedId: null as string | null,
    targetLandedFired: false,
  })

  // Detectar cambio de selección
  useEffect(() => {
    if (!selectedItem) {
      // Regresar a reposo
      animStateRef.current.isTraveling = true
      animStateRef.current.startTime = performance.now()
      animStateRef.current.startAngle = armAngle
      animStateRef.current.startLength = armLength
      animStateRef.current.lastSelectedId = null
      animStateRef.current.targetLandedFired = false
      return
    }

    if (selectedItem.id !== animStateRef.current.lastSelectedId) {
      animStateRef.current.lastSelectedId = selectedItem.id
      animStateRef.current.isTraveling = true
      animStateRef.current.startTime = performance.now()
      animStateRef.current.startAngle = armAngle
      animStateRef.current.startLength = armLength
      animStateRef.current.targetLandedFired = false

      if (reducedMotion) {
        // En reduced motion: salto instantáneo
        const targetX = cx + selectedItem.x
        const targetY = cy + selectedItem.y
        const targetAngle = Math.atan2(targetY - baseY, targetX - baseX)
        const targetL = Math.hypot(targetX - baseX, targetY - baseY)
        setArmAngle(targetAngle)
        setArmLength(targetL)
        setArmElevation(0)
        animStateRef.current.isTraveling = false
        onImpact({ x: targetX, y: targetY })
      }
    }
  }, [selectedItem, reducedMotion, cx, cy, baseX, baseY, armAngle, armLength, onImpact])

  // Loop de animación y tracking
  useEffect(() => {
    let frameId: number

    const tick = (now: number) => {
      const state = animStateRef.current

      if (selectedItem) {
        const targetX = cx + selectedItem.x
        const targetY = cy + selectedItem.y
        const targetAngle = Math.atan2(targetY - baseY, targetX - baseX)
        const targetL = Math.hypot(targetX - baseX, targetY - baseY)

        if (state.isTraveling && !reducedMotion) {
          const elapsed = now - state.startTime
          const progress = Math.min(1, elapsed / state.durationMs)

          // Easing cubic bezier (0.4, 0, 0.2, 1) aproximado
          const t = progress
          const easeInOut = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

          // Calcular ángulo con interpolación angular más corta
          let diffAngle = targetAngle - state.startAngle
          while (diffAngle < -Math.PI) diffAngle += Math.PI * 2
          while (diffAngle > Math.PI) diffAngle -= Math.PI * 2

          const curAngle = state.startAngle + diffAngle * easeInOut
          const curLength = state.startLength + (targetL - state.startLength) * easeInOut

          // Elevación parabólica: sube hasta 1 en la mitad, baja en el último 20%
          const elevation = progress < 0.8 ? Math.sin(progress * Math.PI) : (1 - progress) / 0.2

          setArmAngle(curAngle)
          setArmLength(curLength)
          setArmElevation(Math.max(0, elevation))

          if (progress >= 1) {
            state.isTraveling = false
            setArmElevation(0)

            if (!state.targetLandedFired) {
              state.targetLandedFired = true
              // Disparar impacto con 2 aros minimalistas
              const ringId = Date.now()
              setWaveRings([
                {
                  id: ringId,
                  x: targetX,
                  y: targetY,
                  color: 'rgba(244, 238, 227, 0.85)',
                  maxR: 58,
                  durationMs: 900,
                  delayMs: 0,
                },
                {
                  id: ringId + 1,
                  x: targetX,
                  y: targetY,
                  color: 'rgba(183, 154, 245, 0.7)',
                  maxR: 96,
                  durationMs: 1100,
                  delayMs: 120,
                },
              ])

              // Notificar impacto al padre (chat se abre 120ms después)
              setTimeout(() => {
                onImpact({ x: targetX, y: targetY })
              }, 120)
            }
          }
        } else {
          // Tracking continuo mientras el disco gira
          setArmAngle(targetAngle)
          setArmLength(targetL)
          setArmElevation(0)
        }
      } else {
        // Regreso a reposo
        if (state.isTraveling && !reducedMotion) {
          const elapsed = now - state.startTime
          const progress = Math.min(1, elapsed / (state.durationMs * 0.8))
          const easeInOut = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2

          let diffAngle = restAngle - state.startAngle
          while (diffAngle < -Math.PI) diffAngle += Math.PI * 2
          while (diffAngle > Math.PI) diffAngle -= Math.PI * 2

          const curAngle = state.startAngle + diffAngle * easeInOut
          const curLength = state.startLength + (restLength - state.startLength) * easeInOut

          setArmAngle(curAngle)
          setArmLength(curLength)
          setArmElevation(0)

          if (progress >= 1) {
            state.isTraveling = false
          }
        }
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [selectedItem, reducedMotion, cx, cy, baseX, baseY, restAngle, restLength, onImpact])

  // Limpiar aros de onda terminados
  useEffect(() => {
    if (waveRings.length > 0) {
      const timer = setTimeout(() => {
        setWaveRings([])
      }, 1400)
      return () => clearTimeout(timer)
    }
  }, [waveRings])

  // Desglose de los 3 tubos telescópicos
  // Tubo 1: desde base (0) hasta min(L, 0.42 * size)
  // Tubo 2: desde max(0, min(L, 0.42*size) - 0.12*size) hasta min(L, 0.80 * size)
  // Tubo 3: desde max(0, min(L, 0.80*size) - 0.08*size) hasta L
  const L = armLength
  const t1End = Math.min(L, 0.42 * size)
  const t2Start = Math.max(0, t1End - 0.12 * size)
  const t2End = Math.min(L, 0.80 * size)
  const t3Start = Math.max(0, t2End - 0.08 * size)
  const t3End = L

  // Ángulo en grados para transform SVG
  const angleDeg = (armAngle * 180) / Math.PI

  // Sombra dinámica: con elevación se separa (offset) y difumina
  const shadowOffsetY = 3 + armElevation * 16
  const shadowBlur = 4 + armElevation * 14
  const shadowAlpha = 0.4 - armElevation * 0.15

  // Coordenada exacta de la aguja en el espacio SVG
  const needleX = baseX + Math.cos(armAngle) * L
  const needleY = baseY + Math.sin(armAngle) * L

  return (
    <svg
      className="absolute inset-0 pointer-events-none select-none overflow-visible z-20"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <defs>
        {/* Filtro de sombra del brazo */}
        <filter id="armShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy={shadowOffsetY}
            stdDeviation={shadowBlur}
            floodColor="#0B0615"
            floodOpacity={shadowAlpha}
          />
        </filter>

        {/* Gradiente metálico de tubos */}
        <linearGradient id="metalTubeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#E9E1F5" />
          <stop offset="70%" stopColor="#C9BBE2" />
          <stop offset="100%" stopColor="#9C89BC" />
        </linearGradient>

        <linearGradient id="cartridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F44E89" />
          <stop offset="100%" stopColor="#D62F6B" />
        </linearGradient>
      </defs>

      {/* Aros de impacto minimalistas */}
      {waveRings.map((ring) => (
        <circle
          key={ring.id}
          cx={ring.x}
          cy={ring.y}
          r={ring.maxR}
          fill="none"
          stroke={ring.color}
          strokeWidth="1.8"
          style={{
            animation: `vinylWaveExpand ${ring.durationMs}ms cubic-bezier(0.1, 0.7, 0.1, 1) forwards`,
            animationDelay: `${ring.delayMs}ms`,
          }}
        />
      ))}

      {/* Retícula de enfoque sutil cuando se viaja a un objetivo */}
      {selectedItem && (
        <circle
          cx={needleX}
          cy={needleY}
          r="32"
          fill="none"
          stroke="rgba(244, 238, 227, 0.4)"
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
      )}

      {/* Brazo fonocaptor completo (rotado alrededor de baseX, baseY) */}
      <g
        transform={`rotate(${angleDeg}, ${baseX}, ${baseY})`}
        filter="url(#armShadow)"
      >
        {/* Contrapeso cilíndrico lila detrás de la base */}
        <rect
          x={baseX - 32}
          y={baseY - 7}
          width="24"
          height="14"
          rx="3"
          fill="#B79AF5"
          stroke="#1F1433"
          strokeWidth="1.5"
        />
        <rect
          x={baseX - 35}
          y={baseY - 5}
          width="3"
          height="10"
          rx="1"
          fill="#4B1FA8"
        />

        {/* Tubo 1 (Base - grueso 10px) */}
        <rect
          x={baseX}
          y={baseY - 5}
          width={Math.max(0, t1End)}
          height="10"
          rx="4"
          fill="url(#metalTubeGrad)"
          stroke="#1F1433"
          strokeWidth="1.5"
        />

        {/* Tubo 2 (Medio - 7.5px) */}
        {t2End > t2Start && (
          <rect
            x={baseX + t2Start}
            y={baseY - 3.75}
            width={Math.max(0, t2End - t2Start)}
            height="7.5"
            rx="3"
            fill="url(#metalTubeGrad)"
            stroke="#1F1433"
            strokeWidth="1.2"
          />
        )}

        {/* Tubo 3 (Punta - 5.5px) */}
        {t3End > t3Start && (
          <rect
            x={baseX + t3Start}
            y={baseY - 2.75}
            width={Math.max(0, t3End - t3Start)}
            height="5.5"
            rx="2"
            fill="url(#metalTubeGrad)"
            stroke="#1F1433"
            strokeWidth="1"
          />
        )}

        {/* Cápsula/Cabezal fonocaptor fucsia (#D62F6B) */}
        <g transform={`translate(${baseX + L - 6}, ${baseY - 7})`}>
          <polygon
            points="0,0 20,-2 22,16 0,14"
            fill="url(#cartridgeGrad)"
            stroke="#1F1433"
            strokeWidth="1.5"
          />
          {/* Detalle dorado/línea de diseño */}
          <line
            x1="4"
            y1="7"
            x2="16"
            y2="7"
            stroke="#FDF2F7"
            strokeWidth="1.2"
          />

          {/* Aguja fonocaptora en la punta */}
          <circle cx="21" cy="7" r="2.8" fill="#FFFFFF" stroke="#1F1433" strokeWidth="1" />
          <circle cx="21" cy="7" r="1.2" fill="#D62F6B" />
        </g>
      </g>

      {/* Base circular fija del brazo (#1F1433 con centro lila #B79AF5) */}
      <g>
        {/* Sombra base */}
        <circle cx={baseX} cy={baseY} r="22" fill="#0B0615" opacity="0.35" />
        {/* Anillo exterior */}
        <circle
          cx={baseX}
          cy={baseY}
          r="19"
          fill="#1F1433"
          stroke="rgba(244, 238, 227, 0.45)"
          strokeWidth="1.8"
        />
        {/* Centro metálico lila */}
        <circle
          cx={baseX}
          cy={baseY}
          r="12"
          fill="#B79AF5"
          stroke="#4B1FA8"
          strokeWidth="1.5"
        />
        {/* Eje central */}
        <circle cx={baseX} cy={baseY} r="4.5" fill="#1F1433" />
        <circle cx={baseX} cy={baseY} r="2" fill="#FDF2F7" />
      </g>
    </svg>
  )
}
