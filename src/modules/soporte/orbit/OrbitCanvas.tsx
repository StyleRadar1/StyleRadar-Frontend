import { useEffect, useRef } from 'react'
import { ORBIT_RINGS, ORBIT_TILT_RAD, type OrbitLevel } from './types'

interface Comet {
  orbitLevel: OrbitLevel
  angle: number
  speed: number
  tailLength: number
  color: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  decay: number
  color: string
}

interface Shockwave {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  lineWidth: number
  color: string
}

interface OrbitCanvasProps {
  width: number
  height: number
  impactPoint?: { x: number; y: number } | null
  shakeIntensity?: number
  prefersReducedMotion?: boolean
}

export function OrbitCanvas({
  width,
  height,
  impactPoint,
  shakeIntensity = 0,
  prefersReducedMotion = false,
}: OrbitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const shockwavesRef = useRef<Shockwave[]>([])
  const starsRef = useRef<{ x: number; y: number; r: number; alpha: number; speed: number }[]>([])
  const cometsRef = useRef<Comet[]>([])
  const pingsRef = useRef<{ r: number; maxR: number; alpha: number }[]>([])
  const lastTimeRef = useRef<number>(0)
  const animRef = useRef<number | null>(null)
  const prevImpactRef = useRef<{ x: number; y: number } | null>(null)

  // Inicializar estrellas y cometas una vez
  useEffect(() => {
    // 50 estrellas tenues
    const stars = []
    for (let i = 0; i < 50; i++) {
      stars.push({
        x: Math.random() * 2 - 1, // Normalizado -1 a 1
        y: Math.random() * 2 - 1,
        r: Math.random() * 1.3 + 0.4,
        alpha: Math.random() * 0.45 + 0.15,
        speed: (Math.random() - 0.5) * 0.0001,
      })
    }
    starsRef.current = stars

    // Cometas en cada órbita
    cometsRef.current = [
      {
        orbitLevel: 1,
        angle: 0.5,
        speed: 0.0007,
        tailLength: 0.28,
        color: '#D62F6B',
      },
      {
        orbitLevel: 2,
        angle: 2.8,
        speed: 0.00045,
        tailLength: 0.22,
        color: '#B79AF5',
      },
      {
        orbitLevel: 3,
        angle: 4.2,
        speed: 0.0003,
        tailLength: 0.18,
        color: '#E8B4CC',
      },
    ]

    pingsRef.current = [{ r: 10, maxR: 240, alpha: 0.4 }]
  }, [])

  // Detectar nuevo punto de impacto y generar partículas/ondas
  useEffect(() => {
    if (!impactPoint || prefersReducedMotion) return
    if (prevImpactRef.current?.x === impactPoint.x && prevImpactRef.current?.y === impactPoint.y) return
    prevImpactRef.current = impactPoint

    // Crear partículas de impacto
    const parts: Particle[] = []
    const palette = ['#FFFFFF', '#D62F6B', '#B79AF5', '#F7F1E4', '#4B1FA8']
    for (let i = 0; i < 26; i++) {
      const angle = (Math.PI * 2 * i) / 26 + (Math.random() - 0.5) * 0.4
      const speed = Math.random() * 3.5 + 1.2
      parts.push({
        x: impactPoint.x,
        y: impactPoint.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.2 + 1.5,
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.015,
        color: palette[i % palette.length],
      })
    }
    particlesRef.current.push(...parts)

    // Crear ondas de choque
    shockwavesRef.current.push(
      {
        x: impactPoint.x,
        y: impactPoint.y,
        radius: 4,
        maxRadius: 90,
        alpha: 0.85,
        lineWidth: 2.5,
        color: 'rgba(255, 255, 255, 0.9)',
      },
      {
        x: impactPoint.x,
        y: impactPoint.y,
        radius: 2,
        maxRadius: 130,
        alpha: 0.6,
        lineWidth: 1.5,
        color: 'rgba(214, 47, 107, 0.75)',
      },
    )
  }, [impactPoint, prefersReducedMotion])

  // Bucle de dibujo en canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // DPR limitado a 1.5 por rendimiento
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = Math.max(width * dpr, 10)
    canvas.height = Math.max(height * dpr, 10)

    let lastPing = performance.now()

    const render = (time: number) => {
      if (document.visibilityState !== 'visible') {
        animRef.current = requestAnimationFrame(render)
        return
      }

      const dt = Math.min(time - (lastTimeRef.current || time), 50)
      lastTimeRef.current = time

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      // Aplicar temblor de cámara si hay impacto activo
      if (shakeIntensity > 0 && !prefersReducedMotion) {
        const sx = (Math.random() - 0.5) * shakeIntensity * 6
        const sy = (Math.random() - 0.5) * shakeIntensity * 6
        ctx.translate(sx, sy)
      }

      const cx = width / 2
      const cy = height / 2

      // 1. Estrellas con paralaje suave
      const w2 = width / 2
      const h2 = height / 2
      for (const s of starsRef.current) {
        if (!prefersReducedMotion) {
          s.alpha = 0.2 + 0.25 * Math.sin(time * 0.0015 + s.x * 10)
        }
        ctx.beginPath()
        ctx.arc(cx + s.x * w2, cy + s.y * h2, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(235, 225, 250, ${s.alpha})`
        ctx.fill()
      }

      // 2. Radar ping central periódico
      if (!prefersReducedMotion) {
        if (time - lastPing > 3600) {
          pingsRef.current.push({ r: 12, maxR: 260, alpha: 0.35 })
          lastPing = time
        }
      }

      for (let i = pingsRef.current.length - 1; i >= 0; i--) {
        const p = pingsRef.current[i]
        p.r += 0.06 * dt
        p.alpha = Math.max(0, 0.35 * (1 - p.r / p.maxR))
        if (p.r >= p.maxR || p.alpha <= 0) {
          pingsRef.current.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.beginPath()
        ctx.ellipse(cx, cy, p.r, p.r * 0.52, ORBIT_TILT_RAD, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(183, 154, 245, ${p.alpha * 0.5})`
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      }

      // 3. Dibujo de las 3 elipses continuas (NO punteadas, degradado y brillo suave)
      const cosT = Math.cos(ORBIT_TILT_RAD)
      const sinT = Math.sin(ORBIT_TILT_RAD)

      for (const level of [3, 2, 1] as OrbitLevel[]) {
        const ring = ORBIT_RINGS[level]

        ctx.save()
        ctx.beginPath()
        ctx.ellipse(cx, cy, ring.rx, ring.ry, ORBIT_TILT_RAD, 0, Math.PI * 2)

        if (level === 1) {
          // Órbita 1: Pulso rosa/rojo suave (#D62F6B)
          const pulse = prefersReducedMotion ? 0.6 : 0.55 + 0.25 * Math.sin(time * 0.0028)
          ctx.strokeStyle = `rgba(214, 47, 107, ${pulse})`
          ctx.lineWidth = 1.6
          ctx.stroke()

          // Capa de halo sutil sin shadowBlur
          ctx.beginPath()
          ctx.ellipse(cx, cy, ring.rx, ring.ry, ORBIT_TILT_RAD, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(214, 47, 107, ${pulse * 0.35})`
          ctx.lineWidth = 4
          ctx.stroke()
        } else if (level === 2) {
          // Órbita 2: Lila suave continuo
          ctx.strokeStyle = ring.lineColor
          ctx.lineWidth = 1.3
          ctx.stroke()
        } else {
          // Órbita 3: Tenue continuo
          ctx.strokeStyle = ring.lineColor
          ctx.lineWidth = 1.1
          ctx.stroke()
        }
        ctx.restore()

        // 4. Cometas en la órbita (si movimiento no está reducido)
        if (!prefersReducedMotion) {
          const comet = cometsRef.current.find((c) => c.orbitLevel === level)
          if (comet) {
            comet.angle = (comet.angle + comet.speed * dt) % (Math.PI * 2)

            // Dibujar cola del cometa en cinta (segmentos desvanecidos)
            const steps = 14
            for (let s = steps; s >= 0; s--) {
              const segAngle = comet.angle - (s / steps) * comet.tailLength
              const x0 = ring.rx * Math.cos(segAngle)
              const y0 = ring.ry * Math.sin(segAngle)
              const px = cx + (x0 * cosT - y0 * sinT)
              const py = cy + (x0 * sinT + y0 * cosT)

              const alpha = (1 - s / steps) * 0.75
              const r = 2.2 * (1 - (s / steps) * 0.65)

              ctx.beginPath()
              ctx.arc(px, py, r, 0, Math.PI * 2)
              ctx.fillStyle = comet.color === '#D62F6B'
                ? `rgba(214, 47, 107, ${alpha})`
                : comet.color === '#B79AF5'
                  ? `rgba(183, 154, 245, ${alpha})`
                  : `rgba(232, 180, 204, ${alpha})`
              ctx.fill()
            }
          }
        }
      }

      // 5. Ondas de choque de impacto
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i]
        sw.radius += 0.12 * dt
        sw.alpha -= 0.0018 * dt

        if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
          shockwavesRef.current.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.beginPath()
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
        ctx.strokeStyle = sw.color.replace(/[\d.]+\)$/, `${Math.max(0, sw.alpha)})`)
        ctx.lineWidth = sw.lineWidth
        ctx.stroke()
        ctx.restore()
      }

      // 6. Partículas de impacto
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]
        p.x += p.vx * (dt / 16)
        p.y += p.vy * (dt / 16)
        p.vx *= 0.94 // Desaceleración
        p.vy *= 0.94
        p.alpha -= p.decay * (dt / 16)

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fill()
        ctx.restore()
      }

      ctx.restore()
      animRef.current = requestAnimationFrame(render)
    }

    animRef.current = requestAnimationFrame(render)

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    }
  }, [width, height, shakeIntensity, prefersReducedMotion])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
