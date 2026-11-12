import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useTema } from '@/modules/core/theme/useTema'
import type { ConversacionDto, MensajeDto, TipoContacto } from '../types/chat.dto'
import { ORB_CONFIGS, getContactPhoto, getInitials } from './types'
import { ChatGlass } from './ChatGlass'
import './VinylStyles.css'

const TAU = Math.PI * 2
const TH_REST = Math.PI / 2 // Reposo: apuntando hacia abajo fuera del disco

interface MessagesVinylProps {
  conversations: ConversacionDto[]
  selectedId: string | null
  currentUserId: string
  onSelect: (id: string | null) => void
  onRead: (id: string) => void
  onSent: (m: MensajeDto) => void
}

interface SignalInternal {
  id: string
  conv: ConversacionDto
  orbit: 1 | 2 | 3
  ang: number // en grados
  px: number // coordenadas relativas al centro del contenedor S0 (px)
  py: number
  unread: number
  name: string
  tag: string
  type: TipoContacto
  photoUrl: string | null
  initials: string
}

interface ExpandingRing {
  x: number
  y: number
  life: number
  max: number
  r0: number
  r1: number
  c: string
  lw: number
}

// 34 partículas de polvo y micro-rasguños deterministas
const DUST_PARTICLES = Array.from({ length: 34 }, (_, i) => ({
  r: 0.22 + ((i * 17) % 78) / 100,
  a: (i * 360) / 34,
  l: 0.05 + ((i * 7) % 22) / 100,
  al: 0.05 + ((i * 11) % 16) / 100,
}))

export function MessagesVinyl({
  conversations,
  selectedId,
  currentUserId,
  onSelect,
  onRead,
  onSent,
}: MessagesVinylProps) {
  const { tema } = useTema()
  const isDark = tema === 'oscuro'
  const mode = isDark ? 'noche' : 'dia'

  const stageRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const fxCanvasRef = useRef<HTMLCanvasElement>(null)
  const signalElsRef = useRef<Map<string, HTMLButtonElement>>(new Map())

  const [stageSize, setStageSize] = useState({ w: 640, h: 640, s0: 640, sc: 1 })
  const [isHovered, setIsHovered] = useState(false)
  const [impactPt, setImpactPt] = useState<{ x: number; y: number } | null>(null)
  const isChatOpen = Boolean(selectedId)

  const { s0, sc, w: stageW, h: stageH } = stageSize
  const half = s0 / 2
  const selectedConv = conversations.find((c) => c.id === selectedId)
  const totalUnread = conversations.reduce((acc, c) => acc + (c.noLeidos || 0), 0)

  // Generación síncrona y reactiva de señales para las órbitas del vinilo
  const [now] = useState(() => Date.now())
  const signals = useMemo<SignalInternal[]>(() => {
    const list: SignalInternal[] = conversations.map((c) => {
      const orbit: 1 | 2 | 3 =
        c.noLeidos > 0
          ? 1
          : now - (c.actualizadaEn ? new Date(c.actualizadaEn).getTime() : 0) < 48 * 3600 * 1000
          ? 2
          : 3

      return {
        id: c.id,
        conv: c,
        orbit,
        ang: 0,
        px: half,
        py: half,
        unread: c.noLeidos,
        name: c.contacto.nombre,
        tag: `${c.contacto.tipo === 'TIENDA' ? 'Tienda' : c.contacto.tipo === 'FUNDACION' ? 'Fundación' : 'Vende'} · ${c.asunto}`,
        type: c.contacto.tipo as TipoContacto,
        photoUrl: getContactPhoto(c.contacto),
        initials: getInitials(c.contacto.nombre),
      }
    })

    // Distribuir ángulos equidistantes para las señales en cada órbita
    ;([1, 2, 3] as const).forEach((o) => {
      const group = list.filter((s) => s.orbit === o)
      group.forEach((s, idx) => {
        s.ang = o * 47 + (idx * 360) / (group.length || 1)
        const cfg = ORB_CONFIGS[o]
        const rx = cfg.f * s0
        const aRad = (s.ang * Math.PI) / 180
        s.px = half + rx * Math.cos(aRad)
        s.py = half + rx * Math.sin(aRad)
      })
    })

    return list
  }, [conversations, half, s0, now])

  // Estado mutable del motor de física y animación continua
  const signalsPhysicsRef = useRef<SignalInternal[]>([])
  useEffect(() => {
    // Sincronizar conservando ángulos actuales para que no salten
    const existingMap = new Map(signalsPhysicsRef.current.map((s) => [s.id, s.ang]))
    signals.forEach((s) => {
      if (existingMap.has(s.id)) {
        s.ang = existingMap.get(s.id)!
      }
    })
    signalsPhysicsRef.current = signals
  }, [signals])

  const discAngleRef = useRef(0)
  const speedFactorRef = useRef(1)
  const rtRef = useRef(0)
  const lastTimeRef = useRef<number | null>(null)

  // Brazo fonocaptor
  const armThRef = useRef(TH_REST)
  const armLenRef = useRef<number | null>(null)
  const armLiftRef = useRef(1) // 1 = elevado/viajando, 0 = apoyado
  const ringsRef = useRef<ExpandingRing[]>([])

  // Detección de resize del contenedor
  useEffect(() => {
    const el = stageRef.current
    if (!el) return

    const updateDimensions = () => {
      const rect = el.getBoundingClientRect()
      const w = rect.width || 640
      const h = rect.height || 640
      const s0Val = Math.min(w, 640)
      const scVal = s0Val / 640
      setStageSize({ w, h, s0: s0Val, sc: scVal })
    }

    updateDimensions()
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateDimensions)
      ro.observe(el)
      return () => ro.disconnect()
    }
  }, [])


  // Diferencia angular más corta
  const angDiff = (a: number, b: number) => {
    let d = (b - a) % TAU
    if (d > Math.PI) d -= TAU
    if (d < -Math.PI) d += TAU
    return d
  }

  // Bucle principal de animación idéntico a la referencia
  const loop = useCallback(
    (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now
      }
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000)
      lastTimeRef.current = now
      rtRef.current += dt

      const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      const k = reduced ? 0 : 1

      // Desaceleración suave al seleccionar, interactuar o hover
      const targetTs = selectedId ? 0.3 : isHovered ? 0.12 : 1.0
      speedFactorRef.current += (targetTs - speedFactorRef.current) * Math.min(1, dt * 4)
      const ts = speedFactorRef.current

      // Posiciones de los centros
      const sceneEl = sceneRef.current
      const stageEl = stageRef.current

      let ox = 0
      let oy = 0
      if (sceneEl && stageEl) {
        const sr = sceneEl.getBoundingClientRect()
        const sg = stageEl.getBoundingClientRect()
        ox = sr.left - sg.left
        oy = sr.top - sg.top
      }

      const cc = { x: ox + half, y: oy + half }

      // 1. Giro del disco (9 grados por segundo como cuerpo rígido)
      discAngleRef.current += 9 * ts * dt * k

      // 2. Actualizar posiciones de contactos
      const physSignals = signalsPhysicsRef.current
      physSignals.forEach((s) => {
        const cfg = ORB_CONFIGS[s.orbit]
        if (s.id !== selectedId) {
          s.ang += cfg.w * ts * dt * k
        }
        const rx = cfg.f * s0
        const ry = rx * cfg.k
        const aRad = (s.ang * Math.PI) / 180
        s.px = half + rx * Math.cos(aRad)
        s.py = half + ry * Math.sin(aRad)

        // Actualizar posición en el DOM directamente
        const btn = signalElsRef.current.get(s.id)
        if (btn) {
          btn.style.left = `${s.px.toFixed(1)}px`
          btn.style.top = `${s.py.toFixed(1)}px`
        }
      })

      // 3. Renderizar Canvas de Fondo (Vinyl Record, Grooves, Sheen, Center Label)
      const bgCanvas = bgCanvasRef.current
      if (bgCanvas) {
        const bx = bgCanvas.getContext('2d')
        if (bx) {
          const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1
          if (bgCanvas.width !== Math.round(stageW * dpr) || bgCanvas.height !== Math.round(stageH * dpr)) {
            bgCanvas.width = Math.round(stageW * dpr)
            bgCanvas.height = Math.round(stageH * dpr)
            bgCanvas.style.width = `${stageW}px`
            bgCanvas.style.height = `${stageH}px`
          }
          bx.setTransform(dpr, 0, 0, dpr, 0, 0)
          bx.clearRect(0, 0, stageW, stageH)

          const VR = 0.505 * s0
          const LR = 0.20 * s0

          // Sombra exterior difusa debajo del disco
          const gShadow = bx.createRadialGradient(cc.x, cc.y + 18 * sc, VR * 0.92, cc.x, cc.y + 18 * sc, VR * 1.14)
          gShadow.addColorStop(0, 'rgba(20,8,40,.38)')
          gShadow.addColorStop(1, 'rgba(20,8,40,0)')
          bx.fillStyle = gShadow
          bx.beginPath()
          bx.arc(cc.x, cc.y + 18 * sc, VR * 1.14, 0, TAU)
          bx.fill()

          // Cuerpo de vinilo con degradado radial profundo
          const gBase = bx.createRadialGradient(cc.x, cc.y, LR, cc.x, cc.y, VR)
          gBase.addColorStop(0, '#2a1a47')
          gBase.addColorStop(0.6, '#150e27')
          gBase.addColorStop(1, '#0b0615')
          bx.fillStyle = gBase
          bx.beginPath()
          bx.arc(cc.x, cc.y, VR, 0, TAU)
          bx.fill()

          // Microsurcos concéntricos finos cada 3.1px
          bx.lineWidth = 0.7
          for (let gr = LR + 6 * sc, gi = 0; gr < VR - 5 * sc; gr += 3.1 * sc, gi++) {
            bx.beginPath()
            bx.arc(cc.x, cc.y, gr, 0, TAU)
            bx.strokeStyle = `rgba(244,238,227,${(0.035 + 0.05 * Math.abs(Math.sin(gi * 1.7))).toFixed(3)})`
            bx.stroke()
          }

          // Pistas principales
          const hotColor = mode === 'dia' ? '214,47,107' : '255,106,160'
          const ringColor = mode === 'dia' ? '31,20,51' : '244,238,227'
          const pl = 0.5 + 0.5 * Math.sin(rtRef.current * 2.4)

          ;([1, 2, 3] as const).forEach((o) => {
            const rr = ORB_CONFIGS[o].f * s0
            const isHot = o === 1
            const col = isHot ? hotColor : ringColor

            bx.beginPath()
            bx.arc(cc.x, cc.y, rr, 0, TAU)
            bx.strokeStyle = `rgba(${col},${isHot ? 0.14 + 0.1 * pl : 0.07})`
            bx.lineWidth = (isHot ? 26 : 18) * sc
            bx.stroke()

            bx.beginPath()
            bx.arc(cc.x, cc.y, rr, 0, TAU)
            bx.strokeStyle = `rgba(${col},${isHot ? 0.55 + 0.3 * pl : 0.28})`
            bx.lineWidth = (isHot ? 2.4 : 1.4) * sc
            bx.stroke()
          })

          // Líneas divisorias sutiles entre surcos
          ;[(0.255 + 0.36) / 2, (0.36 + 0.455) / 2, 0.485].forEach((fr) => {
            bx.beginPath()
            bx.arc(cc.x, cc.y, fr * s0, 0, TAU)
            bx.strokeStyle = 'rgba(244,238,227,.2)'
            bx.lineWidth = 1.2 * sc
            bx.stroke()
          })

          // Motas de polvo y micro-rasguños girando con el disco
          DUST_PARTICLES.forEach((d) => {
            bx.beginPath()
            const a0 = ((d.a + discAngleRef.current) * Math.PI) / 180
            bx.arc(cc.x, cc.y, LR + d.r * (VR - LR - 6 * sc), a0, a0 + d.l)
            bx.strokeStyle = `rgba(255,255,255,${d.al})`
            bx.lineWidth = 1 * sc
            bx.stroke()
          })

          // Reflejo de luz cónica fija (Sheen angular)
          try {
            if (bx.createConicGradient) {
              const cg = bx.createConicGradient(-0.9 + 0.05 * Math.sin(rtRef.current * 0.4), cc.x, cc.y)
              cg.addColorStop(0, 'rgba(255,255,255,0)')
              cg.addColorStop(0.05, 'rgba(255,255,255,.2)')
              cg.addColorStop(0.11, 'rgba(255,255,255,0)')
              cg.addColorStop(0.5, 'rgba(255,255,255,0)')
              cg.addColorStop(0.55, 'rgba(255,220,240,.16)')
              cg.addColorStop(0.61, 'rgba(255,255,255,0)')
              cg.addColorStop(1, 'rgba(255,255,255,0)')

              bx.beginPath()
              bx.arc(cc.x, cc.y, VR, 0, TAU)
              bx.arc(cc.x, cc.y, LR, 0, TAU, true)
              bx.fillStyle = cg
              bx.fill('evenodd')
            }
          } catch {
            // fallback si el navegador no soporta conic
          }

          // Filo perimetral exterior
          bx.beginPath()
          bx.arc(cc.x, cc.y, VR, 0, TAU)
          bx.strokeStyle = 'rgba(244,238,227,.35)'
          bx.lineWidth = 2 * sc
          bx.stroke()

          // ETIQUETA CENTRAL ROSA (SIN HUECO NEGRO NI NINGÚN AGUJERO)
          const gLabel = bx.createRadialGradient(cc.x - LR * 0.3, cc.y - LR * 0.3, 0, cc.x, cc.y, LR)
          gLabel.addColorStop(0, '#f6d3e3')
          gLabel.addColorStop(1, '#e8b4cc')
          bx.fillStyle = gLabel
          bx.beginPath()
          bx.arc(cc.x, cc.y, LR, 0, TAU)
          bx.fill()

          bx.strokeStyle = '#1f1433'
          bx.lineWidth = 2 * sc
          bx.stroke()

          // 3 puntos morados girando con el disco
          for (let m = 0; m < 3; m++) {
            const am = ((discAngleRef.current * 1.0 + m * 120) * Math.PI) / 180
            bx.beginPath()
            bx.arc(cc.x + Math.cos(am) * LR * 0.86, cc.y + Math.sin(am) * LR * 0.86, 3.2 * sc, 0, TAU)
            bx.fillStyle = '#4b1fa8'
            bx.fill()
          }

          // Anillo interior de micro-puntos
          bx.beginPath()
          bx.arc(cc.x, cc.y, LR * 0.93, 0, TAU)
          bx.strokeStyle = 'rgba(31,20,51,.35)'
          bx.lineWidth = 1 * sc
          bx.setLineDash([2 * sc, 5 * sc])
          bx.stroke()
          bx.setLineDash([])
        }
      }

      // 4. Renderizar Canvas Superior de Efectos y Brazo Fonocaptor
      const fxCanvas = fxCanvasRef.current
      if (fxCanvas) {
        const ctx = fxCanvas.getContext('2d')
        if (ctx) {
          const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1
          if (fxCanvas.width !== Math.round(stageW * dpr) || fxCanvas.height !== Math.round(stageH * dpr)) {
            fxCanvas.width = Math.round(stageW * dpr)
            fxCanvas.height = Math.round(stageH * dpr)
            fxCanvas.style.width = `${stageW}px`
            fxCanvas.style.height = `${stageH}px`
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          ctx.clearRect(0, 0, stageW, stageH)

          // Lunitas orbitando alrededor de avatares con mensajes no leídos
          const hotColor = mode === 'dia' ? '214,47,107' : '255,106,160'
          physSignals.forEach((s) => {
            if (s.unread < 1) return
            const n = Math.min(s.unread, 4)
            const R = 33 * sc
            const sx = ox + s.px
            const sy = oy + s.py

            ctx.beginPath()
            ctx.arc(sx, sy, R, 0, TAU)
            ctx.strokeStyle = `rgba(${hotColor},.28)`
            ctx.lineWidth = 1
            ctx.stroke()

            for (let i = 0; i < n; i++) {
              const an = rtRef.current * 2.4 + (i * TAU) / n
              const mx = sx + Math.cos(an) * R
              const my = sy + Math.sin(an) * R

              ctx.beginPath()
              ctx.arc(mx, my, 7 * sc, 0, TAU)
              ctx.fillStyle = `rgba(${hotColor},.25)`
              ctx.fill()

              ctx.beginPath()
              ctx.arc(mx, my, 3.4 * sc, 0, TAU)
              ctx.fillStyle = `rgb(${hotColor})`
              ctx.fill()
            }
          })

          // Brazo Fonocaptor Telescópico
          const pv = { x: ox + half + 0.60 * s0, y: oy + half - 0.56 * s0 }
          const S0s = s0

          if (armLenRef.current === null) {
            armLenRef.current = 0.70 * S0s
          }

          const targetSignal = physSignals.find((s) => s.id === selectedId) || null
          let thTarget = TH_REST
          let lenTarget = 0.70 * S0s

          if (targetSignal) {
            const tx = ox + targetSignal.px
            const ty = oy + targetSignal.py
            thTarget = Math.atan2(ty - pv.y, tx - pv.x)
            lenTarget = Math.hypot(tx - pv.x, ty - pv.y)
          }

          const kk = Math.min(1, dt * (targetSignal ? 9 : 3.2))
          armThRef.current += angDiff(armThRef.current, thTarget) * kk
          armLenRef.current += (lenTarget - armLenRef.current) * kk

          // Elevación: 1 = levantado/en reposo, 0 = aterrizado en el disco
          const liftTarget = targetSignal ? 0 : 1
          armLiftRef.current += (liftTarget - armLiftRef.current) * Math.min(1, dt * 9)

          const armTh = armThRef.current
          const armLen = armLenRef.current
          const armLift = armLiftRef.current

          const ca = Math.cos(armTh)
          const sa = Math.sin(armTh)
          const D = armLen
          const tx2 = pv.x + ca * D
          const ty2 = pv.y + sa * D

          const ap = (d: number) => ({ x: pv.x + ca * d, y: pv.y + sa * d })

          ctx.save()
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          // Sombra del brazo: se acorta y une al posar sobre el disco
          const so = 12 * sc * armLift
          ctx.globalAlpha = 0.18 + 0.1 * armLift
          ctx.strokeStyle = '#14081f'
          ctx.lineWidth = 8 * sc
          ctx.beginPath()
          ctx.moveTo(pv.x + so, pv.y + so * 1.4)
          ctx.lineTo(tx2 + so, ty2 + so * 1.4)
          ctx.stroke()
          ctx.globalAlpha = 1

          // Contrapeso cilíndrico lila detrás de la base
          const bax = pv.x - ca * 34 * sc
          const bay = pv.y - sa * 34 * sc
          ctx.strokeStyle = '#1f1433'
          ctx.lineWidth = 17 * sc
          ctx.beginPath()
          ctx.moveTo(pv.x, pv.y)
          ctx.lineTo(bax, bay)
          ctx.stroke()

          ctx.strokeStyle = '#b79af5'
          ctx.lineWidth = 12 * sc
          ctx.beginPath()
          ctx.moveTo(pv.x, pv.y)
          ctx.lineTo(bax, bay)
          ctx.stroke()

          // Brazo telescópico: tres tubos concéntricos deslizantes
          const e1 = Math.min(D, 0.42 * S0s)
          const e2 = Math.min(D, 0.80 * S0s)
          const ov = 0.12 * S0s
          const tubes: [number, number, number][] = []

          if (D > 0.80 * S0s) tubes.push([Math.max(0, e2 - ov), D, 5.5])
          if (D > e1) tubes.push([Math.max(0, e1 - ov), e2, 7.5])
          tubes.push([0, e1, 10])

          tubes.forEach((t) => {
            const A = ap(t[0])
            const B = ap(t[1])
            ctx.strokeStyle = '#1f1433'
            ctx.lineWidth = (t[2] + 3.2) * sc
            ctx.beginPath()
            ctx.moveTo(A.x, A.y)
            ctx.lineTo(B.x, B.y)
            ctx.stroke()

            ctx.strokeStyle = '#e9e1f5'
            ctx.lineWidth = t[2] * sc
            ctx.beginPath()
            ctx.moveTo(A.x, A.y)
            ctx.lineTo(B.x, B.y)
            ctx.stroke()
          })

          // Base circular metálica exterior
          ctx.beginPath()
          ctx.arc(pv.x, pv.y, 24 * sc, 0, TAU)
          ctx.fillStyle = '#1f1433'
          ctx.fill()

          ctx.beginPath()
          ctx.arc(pv.x, pv.y, 15 * sc, 0, TAU)
          ctx.fillStyle = '#b79af5'
          ctx.fill()

          ctx.beginPath()
          ctx.arc(pv.x, pv.y, 5 * sc, 0, TAU)
          ctx.fillStyle = '#1f1433'
          ctx.fill()

          // Cabezal / Cartridge fonocaptor rosa
          ctx.save()
          ctx.translate(tx2, ty2)
          ctx.rotate(armTh)

          ctx.fillStyle = '#1f1433'
          ctx.beginPath()
          if (ctx.roundRect) {
            ctx.roundRect(-14 * sc, -8 * sc, 24 * sc, 16 * sc, 4 * sc)
          } else {
            ctx.rect(-14 * sc, -8 * sc, 24 * sc, 16 * sc)
          }
          ctx.fill()

          ctx.fillStyle = '#d62f6b'
          ctx.beginPath()
          if (ctx.roundRect) {
            ctx.roundRect(-11 * sc, -5 * sc, 18 * sc, 10 * sc, 3 * sc)
          } else {
            ctx.rect(-11 * sc, -5 * sc, 18 * sc, 10 * sc)
          }
          ctx.fill()
          ctx.restore()

          // Punta de aguja blanca
          ctx.beginPath()
          ctx.arc(tx2, ty2, 2.6 * sc, 0, TAU)
          ctx.fillStyle = '#fff'
          ctx.fill()
          ctx.restore()

          // Aros de impacto en el punto de contacto
          const rings = ringsRef.current
          for (let j = rings.length - 1; j >= 0; j--) {
            const ring = rings[j]
            ring.life += dt
            if (ring.life >= ring.max) {
              rings.splice(j, 1)
              continue
            }
            if (ring.life < 0) continue

            const tt = ring.life / ring.max
            const rr = ring.r0 + (ring.r1 - ring.r0) * (1 - Math.pow(1 - tt, 3))
            ctx.beginPath()
            ctx.arc(ring.x, ring.y, rr, 0, TAU)
            ctx.lineWidth = (ring.lw || 3) * (1 - tt) + 0.5
            ctx.strokeStyle = `rgba(${ring.c},${(0.85 * (1 - tt)).toFixed(3)})`
            ctx.stroke()
          }
        }
      }
    },
    [selectedId, isHovered, mode, half, s0, sc, stageW, stageH]
  )

  useEffect(() => {
    let animId: number
    lastTimeRef.current = null
    const tick = (t: number) => {
      loop(t)
      animId = requestAnimationFrame(tick)
    }
    animId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(animId)
    }
  }, [loop])

  // Selección de avatar
  const handleSelect = (c: ConversacionDto) => {
    if (selectedId === c.id) return

    // Coordenadas para el impacto
    const sig = signalsPhysicsRef.current.find((s) => s.id === c.id)
    const sceneEl = sceneRef.current
    const stageEl = stageRef.current
    let ox = 0
    let oy = 0
    if (sceneEl && stageEl) {
      const sr = sceneEl.getBoundingClientRect()
      const sg = stageEl.getBoundingClientRect()
      ox = sr.left - sg.left
      oy = sr.top - sg.top
    }

    const impactX = ox + (sig ? sig.px : half)
    const impactY = oy + (sig ? sig.py : half)

    // Disparar aros de impacto
    ringsRef.current.push({
      x: impactX,
      y: impactY,
      life: 0,
      max: 0.9,
      r0: 10,
      r1: 58,
      c: '244,238,227',
      lw: 1.6,
    })
    ringsRef.current.push({
      x: impactX,
      y: impactY,
      life: -0.12,
      max: 1.1,
      r0: 10,
      r1: 96,
      c: '183,154,245',
      lw: 1.2,
    })

    setImpactPt({ x: impactX, y: impactY })
    onSelect(c.id)
  }

  const handleCloseChat = () => {
    setImpactPt(null)
    onSelect(null)
  }

  // Posiciones de chips de pista a -90 grados
  const labelPositions = useMemo(() => {
    return {
      1: { left: half, top: half - ORB_CONFIGS[1].f * s0 },
      2: { left: half, top: half - ORB_CONFIGS[2].f * s0 },
      3: { left: half, top: half - ORB_CONFIGS[3].f * s0 },
    }
  }, [half, s0])

  return (
    <section
      ref={stageRef}
      className={`stage vin ${isChatOpen ? 'chat-open' : ''}`}
      data-mode={mode}
      data-glass="claro"
    >
      {/* 1. Canvas de fondo (Vinilo, microsurcos, luz cónica y etiqueta central) */}
      <canvas
        id="bg"
        ref={bgCanvasRef}
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      />

      {/* 2. Canvas superior (Brazo fonocaptor, aguja, contrapeso y lunitas) */}
      <canvas
        id="fx"
        ref={fxCanvasRef}
        className="pointer-events-none absolute inset-0 z-[6]"
        aria-hidden="true"
      />

      <div className="arena" id="arena">
        {/* ESCENA DEL VINILO (gira y se desplaza en desktop) */}
        <div
          ref={sceneRef}
          className="scene"
          id="scene"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* HUB CENTRAL (Tus Mensajes - con etiqueta rosa sin agujero) */}
          <div className="hub" id="hub">
            <p className="h1">Tus</p>
            <p className="h2">Mensajes</p>
            <span className="hpill" id="hp">
              {totalUnread > 0 ? `${totalUnread} sin leer` : 'Todo al día'}
            </span>
          </div>

          {/* ETIQUETAS DE PISTAS A -90 GRADOS */}
          {([1, 2, 3] as const).map((o) => (
            <span
              key={`label-${o}`}
              className={`ol ${o === 1 ? 'hot' : ''}`}
              style={{
                left: `${labelPositions[o].left}px`,
                top: `${labelPositions[o].top}px`,
              }}
            >
              {ORB_CONFIGS[o].label}
            </span>
          ))}

          {/* LISTA ACCESIBLE DE SEÑALES (AVATARES DE CONTACTO) */}
          <aside
            role="complementary"
            aria-label="Conversaciones"
            className="contents"
          >
            <ul role="list" className="contents">
              {signals.map((s) => {
                const isSelected = s.id === selectedId
                const isUnread = s.unread > 0
                const isPersona = s.type === 'COMPRADOR' || s.type === 'VENDEDOR' || s.type === 'DONANTE' || !s.type
                const isTienda = s.type === 'TIENDA'
                const shapeClass = isPersona ? 'persona' : isTienda ? 'tienda' : 'fundacion'

                return (
                  <li key={s.id} role="listitem" className="contents">
                    <button
                      ref={(el) => {
                        if (el) signalElsRef.current.set(s.id, el)
                        else signalElsRef.current.delete(s.id)
                      }}
                      type="button"
                      className={`sig ${isUnread ? 'unread' : ''} ${isSelected ? 'sel' : ''}`}
                      style={{
                        left: `${s.px}px`,
                        top: `${s.py}px`,
                      }}
                      onClick={() => handleSelect(s.conv)}
                      aria-label={`${s.name}${isUnread ? `, ${s.unread} sin leer` : ', visto'}`}
                    >
                      <span className={`av ${shapeClass}`}>
                        {s.photoUrl ? (
                          <img
                            src={s.photoUrl}
                            alt=""
                            draggable={false}
                          />
                        ) : (
                          <span className="av-fallback flex h-full w-full items-center justify-center bg-[#4B1FA8] font-bold text-sm text-[#F4EEE3]">
                            {s.initials}
                          </span>
                        )}
                      </span>

                      {/* Badge numérico de no leídos */}
                      <span className="bd">{s.unread}</span>

                      {/* Chip con nombre visible debajo del avatar */}
                      <span className="nm">{s.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>
        </div>

        {/* 3. VENTANA DE CHAT TRANSLÚCIDA (VIDRIO CON BACKDROP-FILTER) */}
        {selectedConv && (
          <ChatGlass
            key={`chat-${selectedConv.id}`}
            conv={selectedConv}
            me={currentUserId}
            isOpen={isChatOpen}
            impactPos={impactPt}
            onClose={handleCloseChat}
            onRead={onRead}
            onSent={onSent}
          />
        )}
      </div>
    </section>
  )
}
