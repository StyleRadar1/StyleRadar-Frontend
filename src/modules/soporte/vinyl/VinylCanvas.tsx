import React, { useEffect, useRef } from 'react'

interface VinylCanvasProps {
  size: number
  rotationRad: number
  totalUnread: number
}

interface DustParticle {
  r: number // radio normalizado (0.22 a 0.49)
  angle: number // ángulo base
  length: number // longitud del arquito
  alpha: number
}

// 32 motas de polvo y micro-rasguños precalculados determinísticamente para pureza de render
const STATIC_DUST_PARTICLES: DustParticle[] = [
  { r: 0.24, angle: 0.32, length: 0.024, alpha: 0.07 },
  { r: 0.38, angle: 1.15, length: 0.018, alpha: 0.06 },
  { r: 0.46, angle: 2.05, length: 0.031, alpha: 0.09 },
  { r: 0.29, angle: 2.88, length: 0.015, alpha: 0.05 },
  { r: 0.33, angle: 3.65, length: 0.022, alpha: 0.08 },
  { r: 0.42, angle: 4.42, length: 0.028, alpha: 0.07 },
  { r: 0.27, angle: 5.12, length: 0.019, alpha: 0.06 },
  { r: 0.48, angle: 5.95, length: 0.033, alpha: 0.10 },
  { r: 0.23, angle: 0.82, length: 0.017, alpha: 0.05 },
  { r: 0.36, angle: 1.62, length: 0.025, alpha: 0.08 },
  { r: 0.44, angle: 2.45, length: 0.021, alpha: 0.07 },
  { r: 0.31, angle: 3.18, length: 0.016, alpha: 0.06 },
  { r: 0.26, angle: 3.98, length: 0.027, alpha: 0.09 },
  { r: 0.40, angle: 4.75, length: 0.023, alpha: 0.07 },
  { r: 0.35, angle: 5.52, length: 0.018, alpha: 0.05 },
  { r: 0.47, angle: 6.18, length: 0.029, alpha: 0.08 },
  { r: 0.25, angle: 0.55, length: 0.020, alpha: 0.06 },
  { r: 0.39, angle: 1.38, length: 0.026, alpha: 0.07 },
  { r: 0.43, angle: 2.22, length: 0.019, alpha: 0.06 },
  { r: 0.28, angle: 3.01, length: 0.024, alpha: 0.08 },
  { r: 0.34, angle: 3.82, length: 0.021, alpha: 0.07 },
  { r: 0.41, angle: 4.58, length: 0.030, alpha: 0.09 },
  { r: 0.30, angle: 5.35, length: 0.016, alpha: 0.05 },
  { r: 0.45, angle: 0.15, length: 0.028, alpha: 0.08 },
  { r: 0.22, angle: 0.98, length: 0.018, alpha: 0.06 },
  { r: 0.37, angle: 1.85, length: 0.022, alpha: 0.07 },
  { r: 0.49, angle: 2.68, length: 0.032, alpha: 0.10 },
  { r: 0.32, angle: 3.42, length: 0.017, alpha: 0.05 },
  { r: 0.24, angle: 4.21, length: 0.025, alpha: 0.07 },
  { r: 0.38, angle: 4.98, length: 0.020, alpha: 0.06 },
  { r: 0.46, angle: 5.75, length: 0.029, alpha: 0.08 },
  { r: 0.29, angle: 0.45, length: 0.023, alpha: 0.07 },
]

export const VinylCanvas: React.FC<VinylCanvasProps> = ({
  size,
  rotationRad,
  totalUnread,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const discRadius = size * 0.505
    const labelRadius = size * 0.2

    ctx.clearRect(0, 0, size, size)

    // 1. Sombra exterior difusa del vinilo
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, discRadius, 0, Math.PI * 2)
    ctx.shadowColor = 'rgba(11, 6, 21, 0.45)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 12
    ctx.fillStyle = '#0B0615'
    ctx.fill()
    ctx.restore()

    // 2. Base del disco con degradado radial
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, discRadius, 0, Math.PI * 2)
    const discGrad = ctx.createRadialGradient(cx, cy, labelRadius, cx, cy, discRadius)
    discGrad.addColorStop(0, '#2A1A47')
    discGrad.addColorStop(0.35, '#1E1236')
    discGrad.addColorStop(0.7, '#150E27')
    discGrad.addColorStop(1, '#0B0615')
    ctx.fillStyle = discGrad
    ctx.fill()

    // Borde fino claro
    ctx.strokeStyle = 'rgba(244, 238, 227, 0.35)'
    ctx.lineWidth = 1.2
    ctx.stroke()
    ctx.restore()

    // 3. Surcos concéntricos finos cada ~3px
    ctx.save()
    ctx.beginPath()
    const grooveStart = labelRadius + 8
    const grooveEnd = discRadius - 4
    for (let r = grooveStart; r < grooveEnd; r += 3.2) {
      ctx.moveTo(cx + r, cy)
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
    }
    // Variación sutil de opacidad
    ctx.strokeStyle = 'rgba(244, 238, 227, 0.045)'
    ctx.lineWidth = 0.75
    ctx.stroke()

    // 3 hendiduras divisorias de los tracks
    const dividerRadii = [size * 0.255, size * 0.36, size * 0.455]
    dividerRadii.forEach((r, idx) => {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = idx === 0
        ? 'rgba(214, 47, 107, 0.25)'
        : idx === 1
        ? 'rgba(183, 154, 245, 0.22)'
        : 'rgba(244, 238, 227, 0.16)'
      ctx.lineWidth = 1.6
      ctx.stroke()
    })
    ctx.restore()

    // 4. Reflejo cónico fijo (Sheen angular) que simula el reflejo de la luz sobre los microsurcos
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, discRadius - 1, 0, Math.PI * 2)
    ctx.clip()

    try {
      if (typeof ctx.createConicGradient === 'function') {
        const sheen = ctx.createConicGradient(Math.PI / 4, cx, cy)
        sheen.addColorStop(0, 'rgba(255, 255, 255, 0.0)')
        sheen.addColorStop(0.12, 'rgba(255, 255, 255, 0.07)')
        sheen.addColorStop(0.25, 'rgba(255, 255, 255, 0.0)')
        sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)')
        sheen.addColorStop(0.62, 'rgba(255, 255, 255, 0.07)')
        sheen.addColorStop(0.75, 'rgba(255, 255, 255, 0.0)')
        sheen.addColorStop(1, 'rgba(255, 255, 255, 0.0)')
        ctx.fillStyle = sheen
        ctx.fill()
      }
    } catch {
      // Fallback
    }
    ctx.restore()

    // 5. Motas de polvo y micro-rasguños girando con el disco
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rotationRad)
    STATIC_DUST_PARTICLES.forEach((p) => {
      const pr = p.r * size
      ctx.beginPath()
      ctx.arc(0, 0, pr, p.angle, p.angle + p.length)
      ctx.strokeStyle = `rgba(244, 238, 227, ${p.alpha})`
      ctx.lineWidth = 0.8
      ctx.stroke()
    })
    ctx.restore()

    // 6. Etiqueta central ("galleta" / Center Label)
    ctx.save()
    ctx.translate(cx, cy)

    // Base de galleta con degradado rosa pálido a crema
    ctx.beginPath()
    ctx.arc(0, 0, labelRadius, 0, Math.PI * 2)
    const labelGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, labelRadius)
    labelGrad.addColorStop(0, '#FDF2F7')
    labelGrad.addColorStop(0.6, '#F6D3E3')
    labelGrad.addColorStop(1, '#E8B4CC')
    ctx.fillStyle = labelGrad
    ctx.fill()

    // Borde exterior de galleta
    ctx.strokeStyle = '#1F1433'
    ctx.lineWidth = 2
    ctx.stroke()

    // Anillo interno decorativo de micropuntos girando
    ctx.save()
    ctx.rotate(rotationRad)
    ctx.beginPath()
    ctx.arc(0, 0, labelRadius * 0.82, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(31, 20, 51, 0.35)'
    ctx.setLineDash([2, 5])
    ctx.lineWidth = 1.2
    ctx.stroke()

    // 3 puntos morados equidistantes girando con el disco
    for (let i = 0; i < 3; i++) {
      const ptAngle = (i * Math.PI * 2) / 3
      const px = Math.cos(ptAngle) * (labelRadius * 0.65)
      const py = Math.sin(ptAngle) * (labelRadius * 0.65)
      ctx.beginPath()
      ctx.arc(px, py, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = '#6A3FD1'
      ctx.fill()
    }
    ctx.restore()

    // 7. Textos centrales (fijos para lectura óptima, sin girar)
    // Título: "Tus" (font 400) y "Mensajes" (font 800)
    ctx.fillStyle = '#1F1433'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const fontSizeTitle = Math.max(12, Math.round(labelRadius * 0.22))
    ctx.font = `400 ${fontSizeTitle * 0.85}px "Plus Jakarta Sans", sans-serif`
    ctx.fillText('TUS', 0, -labelRadius * 0.32)

    ctx.font = `800 ${fontSizeTitle * 1.15}px "Plus Jakarta Sans", sans-serif`
    ctx.fillText('MENSAJES', 0, -labelRadius * 0.12)

    // Pill de estado ("N sin leer" o "Al día")
    const pillW = labelRadius * 1.2
    const pillH = labelRadius * 0.32
    const pillX = -pillW / 2
    const pillY = labelRadius * 0.16
    const pillR = pillH / 2

    ctx.beginPath()
    ctx.roundRect(pillX, pillY, pillW, pillH, pillR)
    if (totalUnread > 0) {
      const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY)
      pillGrad.addColorStop(0, '#D62F6B')
      pillGrad.addColorStop(1, '#9C1B4B')
      ctx.fillStyle = pillGrad
    } else {
      const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY)
      pillGrad.addColorStop(0, '#4B1FA8')
      pillGrad.addColorStop(1, '#2E0E68')
      ctx.fillStyle = pillGrad
    }
    ctx.fill()

    ctx.fillStyle = '#F7F1E4'
    const pillFontSize = Math.max(9, Math.round(pillH * 0.44))
    ctx.font = `700 ${pillFontSize}px "Plus Jakarta Sans", sans-serif`
    const pillText = totalUnread > 0 ? `${totalUnread} sin leer` : '✓ Al día'
    ctx.fillText(pillText, 0, pillY + pillH / 2)

    // 8. Agujero central (Spindle Hole)
    const spindleRadius = Math.max(5, Math.round(labelRadius * 0.11))
    ctx.beginPath()
    ctx.arc(0, 0, spindleRadius, 0, Math.PI * 2)
    ctx.fillStyle = '#05030A'
    ctx.fill()
    ctx.strokeStyle = 'rgba(244, 238, 227, 0.75)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.restore()
  }, [size, rotationRad, totalUnread])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      className="pointer-events-none select-none block"
      aria-hidden="true"
    />
  )
}
