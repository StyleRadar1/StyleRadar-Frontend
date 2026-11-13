import { useEffect, useRef, useState, type RefObject } from 'react'
import './CursorHanger.css'

/* =====================================================================
   Constantes de física y animación ajustables
   ===================================================================== */
export const NUM_POINTS = 8
export const SEGMENT_LENGTH = 11
export const GRAVITY = 0.55
export const DAMPING = 0.985
export const CONSTRAINT_ITERATIONS = 8
export const CURSOR_LERP = 0.28
export const CURSOR_OFFSET_X = 10
export const CURSOR_OFFSET_Y = 14

export const STILL_DELAY_MS = 900
export const GARMENT_FADE_IN_MS = 420
export const GARMENT_FADE_OUT_MS = 160

export const PULSE_1_DELAY_MS = 450
export const PULSE_2_DELAY_MS = 1000
export const PULSE_DURATION_MS = 1100
export const PULSE_MIN_R = 14
export const PULSE_MAX_R = 100

export const HANGER_WIDTH = 60
export const GARMENT_WIDTH = 100
export const GARMENT_COLLAR_Y_OFFSET = 12

export const GARMENT_SRC = '/img/percha-sueter.png'

type Point = {
  x: number
  y: number
  oldX: number
  oldY: number
}

type ThemeColors = {
  accent: string
  accentSoft: string
  shadowColor: string
}

function readThemeColors(): ThemeColors {
  if (typeof window === 'undefined') {
    return {
      accent: '#8b5cf6',
      accentSoft: '#b9b9ca',
      shadowColor: 'rgba(0, 0, 0, 0.45)',
    }
  }
  const style = window.getComputedStyle(document.documentElement)
  const accent = style.getPropertyValue('--accent').trim() || '#8b5cf6'
  const accentSoft = style.getPropertyValue('--accent-soft').trim() || '#b9b9ca'
  const shadowColor = style.getPropertyValue('--shadow-color').trim() || 'rgba(0, 0, 0, 0.45)'
  return { accent, accentSoft, shadowColor }
}

function drawHanger(ctx: CanvasRenderingContext2D, accentColor: string) {
  ctx.save()
  ctx.strokeStyle = accentColor
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Gancho superior curvado
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.arc(0, -20, 6, -Math.PI * 0.2, Math.PI * 0.8, true)
  ctx.lineTo(0, -8)
  ctx.stroke()

  // Pequeño remate circular en el cuello del gancho
  ctx.beginPath()
  ctx.arc(0, -8, 2.2, 0, Math.PI * 2)
  ctx.fillStyle = accentColor
  ctx.fill()

  // Triángulo y hombros de la percha
  ctx.lineWidth = 2.8
  ctx.beginPath()
  ctx.moveTo(0, -8)
  ctx.lineTo(-HANGER_WIDTH / 2, 8)
  ctx.lineTo(HANGER_WIDTH / 2, 8)
  ctx.closePath()
  ctx.stroke()

  ctx.restore()
}

function drawPulseRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  alpha: number,
  accent: string,
  accentSoft: string,
) {
  if (alpha <= 0.005) return
  ctx.save()

  // Anillo exterior principal en color violeta/acento
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = accent
  ctx.globalAlpha = alpha * 0.85
  ctx.lineWidth = 2
  ctx.stroke()

  // Anillo interior secundario en lavanda
  if (r > 20) {
    ctx.beginPath()
    ctx.arc(cx, cy, Math.max(0, r - 7), 0, Math.PI * 2)
    ctx.strokeStyle = accentSoft
    ctx.globalAlpha = alpha * 0.45
    ctx.lineWidth = 1.2
    ctx.stroke()
  }

  ctx.restore()
}

interface CursorHangerProps {
  containerRef: RefObject<HTMLElement | null>
}

export function CursorHanger({ containerRef }: CursorHangerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Solo se activa en dispositivos con puntero fino (mouse/trackpad) y sin reducción de movimiento
  const [isEligible, setIsEligible] = useState(() => {
    if (typeof window === 'undefined') return false
    const hasFinePointer = window.matchMedia?.('(pointer: fine)').matches ?? false
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    return hasFinePointer && !prefersReduced
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const fineQuery = window.matchMedia?.('(pointer: fine)')
    const reducedQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')

    const checkEligibility = () => {
      setIsEligible(Boolean(fineQuery?.matches && !reducedQuery?.matches))
    }

    fineQuery?.addEventListener?.('change', checkEligibility)
    reducedQuery?.addEventListener?.('change', checkEligibility)
    return () => {
      fineQuery?.removeEventListener?.('change', checkEligibility)
      reducedQuery?.removeEventListener?.('change', checkEligibility)
    }
  }, [])

  useEffect(() => {
    if (!isEligible) return

    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Carga previa de la imagen de la prenda
    const garmentImage = new Image()
    garmentImage.src = GARMENT_SRC
    let garmentLoaded = false
    garmentImage.onload = () => {
      garmentLoaded = true
    }

    // Colores del tema actual
    let themeColors = readThemeColors()
    const themeObserver = new MutationObserver(() => {
      themeColors = readThemeColors()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-tema', 'data-theme', 'class'],
    })
    const onCustomTheme = () => {
      themeColors = readThemeColors()
    }
    window.addEventListener('sr:tema', onCustomTheme)

    // Estado de la física de la cadena
    const points: Point[] = []
    let isInitialized = false

    const cursor = { x: 0, y: 0 }
    let lastMoveTime = performance.now()
    let isStill = false
    let stillStartTime = 0

    let garmentOpacity = 0
    let masterOpacity = 0
    let targetMasterOpacity = 0

    let rafId: number | null = null
    let isRunning = false
    let isVisibleOnScreen = true
    let isDocumentVisible = !document.hidden

    const initPoints = (startX: number, startY: number) => {
      points.length = 0
      for (let i = 0; i < NUM_POINTS; i++) {
        const y = startY + i * SEGMENT_LENGTH
        points.push({ x: startX, y, oldX: startX, oldY: y })
      }
      isInitialized = true
    }

    // Redimensionado con soporte Retina (devicePixelRatio máx. 2)
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(container)
    resizeCanvas()

    const startLoop = () => {
      if (isRunning || !isVisibleOnScreen || !isDocumentVisible) return
      isRunning = true
      let lastTime = performance.now()

      const step = (now: number) => {
        const dt = Math.min(now - lastTime, 40)
        lastTime = now

        // Suavizado de opacidad general (fade in al entrar, fade out al salir o atenuar sobre botones)
        const opacityDelta = targetMasterOpacity > masterOpacity
          ? (targetMasterOpacity - masterOpacity) * 0.16
          : (targetMasterOpacity - masterOpacity) * (dt / 150)
        masterOpacity = Math.max(0, Math.min(1, masterOpacity + opacityDelta))

        // Si se desvaneció por completo, detenemos el bucle para ahorrar recursos
        if (masterOpacity <= 0.001 && targetMasterOpacity === 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          isRunning = false
          rafId = null
          return
        }

        const rect = container.getBoundingClientRect()
        ctx.clearRect(0, 0, rect.width, rect.height)

        if (isInitialized && masterOpacity > 0.001) {
          const targetX = cursor.x + CURSOR_OFFSET_X
          const targetY = cursor.y + CURSOR_OFFSET_Y

          // 1. Integración Verlet en los eslabones
          for (let i = 1; i < NUM_POINTS; i++) {
            const p = points[i]
            const vx = (p.x - p.oldX) * DAMPING
            const vy = (p.y - p.oldY) * DAMPING
            p.oldX = p.x
            p.oldY = p.y
            p.x += vx
            p.y += vy + GRAVITY
          }

          // 2. El primer punto sigue al cursor con interpolación suave (lerp)
          points[0].oldX = points[0].x
          points[0].oldY = points[0].y
          points[0].x += (targetX - points[0].x) * CURSOR_LERP
          points[0].y += (targetY - points[0].y) * CURSOR_LERP

          // 3. Restricciones de distancia entre segmentos
          for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
            for (let i = 0; i < NUM_POINTS - 1; i++) {
              const p1 = points[i]
              const p2 = points[i + 1]
              const dx = p2.x - p1.x
              const dy = p2.y - p1.y
              const dist = Math.hypot(dx, dy) || 0.0001
              const diff = (dist - SEGMENT_LENGTH) / dist
              if (i === 0) {
                p2.x -= dx * diff
                p2.y -= dy * diff
              } else {
                p1.x += dx * diff * 0.5
                p1.y += dy * diff * 0.5
                p2.x -= dx * diff * 0.5
                p2.y -= dy * diff * 0.5
              }
            }
          }

          // 4. Estado quieto (still): comprobación de tiempo transcurrido
          if (!isStill && now - lastMoveTime >= STILL_DELAY_MS) {
            isStill = true
            stillStartTime = now
          }

          // Animación de aparición / desvanecimiento de la prenda colgada
          if (isStill) {
            garmentOpacity = Math.min(1, garmentOpacity + dt / GARMENT_FADE_IN_MS)
          } else {
            garmentOpacity = Math.max(0, garmentOpacity - dt / GARMENT_FADE_OUT_MS)
          }

          // 5. Dibujo de la cadena violeta fina
          ctx.save()
          ctx.beginPath()
          ctx.moveTo(points[0].x, points[0].y)
          for (let i = 1; i < NUM_POINTS; i++) {
            ctx.lineTo(points[i].x, points[i].y)
          }
          ctx.strokeStyle = themeColors.accent
          ctx.globalAlpha = 0.55 * masterOpacity
          ctx.lineWidth = 1.4
          ctx.stroke()
          ctx.restore()

          // 6. Orientación y balanceo de la percha
          const pPrev = points[NUM_POINTS - 2]
          const pLast = points[NUM_POINTS - 1]
          const rawAngle = Math.atan2(pLast.x - pPrev.x, pLast.y - pPrev.y)
          const angle = Math.max(-0.85, Math.min(0.85, rawAngle))

          ctx.save()
          ctx.translate(pLast.x, pLast.y)
          ctx.rotate(angle)

          const garmentH = garmentLoaded
            ? GARMENT_WIDTH * (garmentImage.naturalHeight / garmentImage.naturalWidth)
            : GARMENT_WIDTH * 1.33
          const pulseCenterY = GARMENT_COLLAR_Y_OFFSET + garmentH * 0.42

          // 7. Pulsos de radar si está quieto
          if (isStill && stillStartTime > 0 && garmentOpacity > 0.05) {
            const stillDuration = now - stillStartTime

            // Pulso 1: 450 ms después de quedarse quieto
            const p1Elapsed = stillDuration - PULSE_1_DELAY_MS
            if (p1Elapsed >= 0 && p1Elapsed <= PULSE_DURATION_MS) {
              const t1 = p1Elapsed / PULSE_DURATION_MS
              const ease1 = 1 - Math.pow(1 - t1, 3)
              const r1 = PULSE_MIN_R + (PULSE_MAX_R - PULSE_MIN_R) * ease1
              const alpha1 = (1 - ease1) * garmentOpacity * masterOpacity
              drawPulseRing(ctx, 0, pulseCenterY, r1, alpha1, themeColors.accent, themeColors.accentSoft)
            }

            // Pulso 2: 1000 ms después de quedarse quieto
            const p2Elapsed = stillDuration - PULSE_2_DELAY_MS
            if (p2Elapsed >= 0 && p2Elapsed <= PULSE_DURATION_MS) {
              const t2 = p2Elapsed / PULSE_DURATION_MS
              const ease2 = 1 - Math.pow(1 - t2, 3)
              const r2 = PULSE_MIN_R + (PULSE_MAX_R - PULSE_MIN_R) * ease2
              const alpha2 = (1 - ease2) * garmentOpacity * masterOpacity
              drawPulseRing(ctx, 0, pulseCenterY, r2, alpha2, themeColors.accent, themeColors.accentSoft)
            }
          }

          // 8. Dibujo de la prenda con sombra suave (antes de la percha para que la percha quede encima)
          if (garmentLoaded && garmentOpacity > 0.005) {
            ctx.save()
            const currentGarmentAlpha = garmentOpacity * masterOpacity

            // Sombra suave proyectada bajo la prenda
            ctx.save()
            ctx.globalAlpha = currentGarmentAlpha * 0.7
            ctx.shadowColor = themeColors.shadowColor
            ctx.shadowBlur = 18
            ctx.shadowOffsetY = 10
            ctx.drawImage(
              garmentImage,
              -GARMENT_WIDTH / 2,
              GARMENT_COLLAR_Y_OFFSET,
              GARMENT_WIDTH,
              garmentH,
            )
            ctx.restore()

            // Prenda nítida
            ctx.globalAlpha = currentGarmentAlpha
            ctx.drawImage(
              garmentImage,
              -GARMENT_WIDTH / 2,
              GARMENT_COLLAR_Y_OFFSET,
              GARMENT_WIDTH,
              garmentH,
            )
            ctx.restore()
          }

          // 9. Dibujo de la percha visible siempre sobre la prenda
          ctx.save()
          ctx.globalAlpha = masterOpacity
          drawHanger(ctx, themeColors.accent)
          ctx.restore()

          ctx.restore()
        }

        rafId = requestAnimationFrame(step)
      }

      rafId = requestAnimationFrame(step)
    }

    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      isRunning = false
    }

    // Eventos de puntero en el hero
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const dist = Math.hypot(x - cursor.x, y - cursor.y)
      if (dist > 2) {
        lastMoveTime = performance.now()
        isStill = false
      }

      cursor.x = x
      cursor.y = y

      if (!isInitialized) {
        initPoints(x + CURSOR_OFFSET_X, y + CURSOR_OFFSET_Y)
      }

      // Si el cursor está sobre un elemento interactivo, atenuamos el efecto a 0.35
      const target = e.target as HTMLElement | null
      const isInteractive = Boolean(
        target?.closest('button, a, input, select, textarea, [role="button"]'),
      )
      targetMasterOpacity = isInteractive ? 0.35 : 1.0

      startLoop()
    }

    const handlePointerEnter = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      cursor.x = x
      cursor.y = y
      targetMasterOpacity = 1.0
      lastMoveTime = performance.now()
      isStill = false
      if (!isInitialized) {
        initPoints(x + CURSOR_OFFSET_X, y + CURSOR_OFFSET_Y)
      }
      startLoop()
    }

    const handlePointerLeave = () => {
      targetMasterOpacity = 0.0
      isStill = false
    }

    container.addEventListener('pointermove', handlePointerMove, { passive: true })
    container.addEventListener('pointerenter', handlePointerEnter, { passive: true })
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true })

    // Pausa cuando el hero sale de la pantalla o la pestaña se oculta
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisibleOnScreen = entry.isIntersecting
      if (isVisibleOnScreen && isDocumentVisible && masterOpacity > 0.001) {
        startLoop()
      } else {
        stopLoop()
      }
    })
    intersectionObserver.observe(container)

    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden
      if (isDocumentVisible && isVisibleOnScreen && masterOpacity > 0.001) {
        startLoop()
      } else {
        stopLoop()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopLoop()
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerenter', handlePointerEnter)
      container.removeEventListener('pointerleave', handlePointerLeave)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      themeObserver.disconnect()
      window.removeEventListener('sr:tema', onCustomTheme)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isEligible, containerRef])

  if (!isEligible) return null

  return (
    <canvas
      ref={canvasRef}
      className="cursor-hanger-canvas"
      aria-hidden="true"
    />
  )
}
export default CursorHanger

