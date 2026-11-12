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

  const [stageSize, setStageSize] = useState({ w: 680, h: 680, s0: 680, sc: 1 })
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

    // Distribuir ángulos equidistantes para las señales en cada órbita y separar ángulos si se solapan
    ;([1, 2, 3] as const).forEach((o) => {
      const group = list.filter((s) => s.orbit === o)
      const count = group.length
      group.forEach((s, idx) => {
        s.ang = o * 47 + (idx * 360) / (count || 1)
      })

      // Separación de ángulos para evitar cualquier solapamiento
      const minSep = o === 1 ? 34 : o === 2 ? 26 : 20
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          let diff = Math.abs(group[i].ang - group[j].ang) % 360
          if (diff > 180) diff = 360 - diff
          if (diff < minSep) {
            group[j].ang = (group[j].ang + (minSep - diff)) % 360
          }
        }
      }

      group.forEach((s) => {
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

  // Brazo fonocaptor realista
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
      const w = rect.width || 680
      const h = rect.height || 680
      const sceneW = sceneRef.current?.offsetWidth || w
      const s0Val = Math.min(sceneW, 680)
      const scVal = s0Val / 680
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

      // Geometría real de la escena y el escenario
      const sceneEl = sceneRef.current
      const stageEl = stageRef.current

      const S0 = sceneEl?.offsetWidth || s0 || 640
      const halfVal = S0 / 2
      let sr = { left: 0, top: 0, width: S0, height: S0 }
      let sg = { left: 0, top: 0, width: stageW, height: stageH }
      if (sceneEl && stageEl) {
        sr = sceneEl.getBoundingClientRect()
        sg = stageEl.getBoundingClientRect()
      }

      const scCurrent = sr.width ? sr.width / S0 : sc
      const oxCurrent = sr.left - sg.left
      const oyCurrent = sr.top - sg.top

      const cc = { x: oxCurrent + halfVal * scCurrent, y: oyCurrent + halfVal * scCurrent }

      // 1. Giro del disco (9 grados por segundo como cuerpo rígido)
      discAngleRef.current += 9 * ts * dt * k

      // 2. Actualizar posiciones de contactos
      const physSignals = signalsPhysicsRef.current
      physSignals.forEach((s) => {
        const cfg = ORB_CONFIGS[s.orbit]
        if (s.id !== selectedId) {
          s.ang += cfg.w * ts * dt * k
        }
        const rx = cfg.f * S0
        const ry = rx * cfg.k
        const aRad = (s.ang * Math.PI) / 180
        s.px = halfVal + rx * Math.cos(aRad)
        s.py = halfVal + ry * Math.sin(aRad)

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

          const VR = 0.50 * S0 * scCurrent
          const LR = 0.20 * S0 * scCurrent

          // Sombra exterior difusa debajo del disco (disco flotando directamente sobre el fondo)
          const gShadow = bx.createRadialGradient(
            cc.x,
            cc.y + 24 * scCurrent,
            VR * 0.85,
            cc.x,
            cc.y + 24 * scCurrent,
            VR * 1.18
          )
          gShadow.addColorStop(0, 'rgba(15,6,30,0.40)')
          gShadow.addColorStop(0.5, 'rgba(15,6,30,0.18)')
          gShadow.addColorStop(1, 'rgba(15,6,30,0)')
          bx.fillStyle = gShadow
          bx.beginPath()
          bx.arc(cc.x, cc.y + 24 * scCurrent, VR * 1.18, 0, TAU)
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
          for (let gr = LR + 6 * scCurrent, gi = 0; gr < VR - 5 * scCurrent; gr += 3.1 * scCurrent, gi++) {
            bx.beginPath()
            bx.arc(cc.x, cc.y, gr, 0, TAU)
            bx.strokeStyle = `rgba(244,238,227,${(0.035 + 0.05 * Math.abs(Math.sin(gi * 1.7))).toFixed(3)})`
            bx.stroke()
          }

          // Pistas principales (repartidas entre 26% y 46% del disco)
          const hotColor = mode === 'dia' ? '214,47,107' : '255,106,160'
          const ringColor = mode === 'dia' ? '31,20,51' : '244,238,227'
          const pl = 0.5 + 0.5 * Math.sin(rtRef.current * 2.4)

          ;([1, 2, 3] as const).forEach((o) => {
            const rr = ORB_CONFIGS[o].f * S0 * scCurrent
            const isHot = o === 1
            const col = isHot ? hotColor : ringColor

            bx.beginPath()
            bx.arc(cc.x, cc.y, rr, 0, TAU)
            bx.strokeStyle = `rgba(${col},${isHot ? 0.14 + 0.1 * pl : 0.07})`
            bx.lineWidth = (isHot ? 26 : 18) * scCurrent
            bx.stroke()

            bx.beginPath()
            bx.arc(cc.x, cc.y, rr, 0, TAU)
            bx.strokeStyle = `rgba(${col},${isHot ? 0.55 + 0.3 * pl : 0.28})`
            bx.lineWidth = (isHot ? 2.4 : 1.4) * scCurrent
            bx.stroke()
          })

          // Líneas divisorias sutiles entre surcos
          ;[(0.26 + 0.36) / 2, (0.36 + 0.46) / 2, 0.485].forEach((fr) => {
            bx.beginPath()
            bx.arc(cc.x, cc.y, fr * S0 * scCurrent, 0, TAU)
            bx.strokeStyle = 'rgba(244,238,227,.2)'
            bx.lineWidth = 1.2 * scCurrent
            bx.stroke()
          })

          // Motas de polvo y micro-rasguños girando con el disco
          DUST_PARTICLES.forEach((d) => {
            bx.beginPath()
            const a0 = ((d.a + discAngleRef.current) * Math.PI) / 180
            bx.arc(cc.x, cc.y, LR + d.r * (VR - LR - 6 * scCurrent), a0, a0 + d.l)
            bx.strokeStyle = `rgba(255,255,255,${d.al})`
            bx.lineWidth = 1 * scCurrent
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
          bx.lineWidth = 2 * scCurrent
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
          bx.lineWidth = 2 * scCurrent
          bx.stroke()

          // 3 puntos morados girando con el disco
          for (let m = 0; m < 3; m++) {
            const am = ((discAngleRef.current * 1.0 + m * 120) * Math.PI) / 180
            bx.beginPath()
            bx.arc(cc.x + Math.cos(am) * LR * 0.86, cc.y + Math.sin(am) * LR * 0.86, 3.2 * scCurrent, 0, TAU)
            bx.fillStyle = '#4b1fa8'
            bx.fill()
          }

          // Anillo interior de micro-puntos
          bx.beginPath()
          bx.arc(cc.x, cc.y, LR * 0.93, 0, TAU)
          bx.strokeStyle = 'rgba(31,20,51,.35)'
          bx.lineWidth = 1 * scCurrent
          bx.setLineDash([2 * scCurrent, 5 * scCurrent])
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
            const R = 33 * scCurrent
            const sx = oxCurrent + s.px * scCurrent
            const sy = oyCurrent + s.py * scCurrent

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
              ctx.arc(mx, my, 7 * scCurrent, 0, TAU)
              ctx.fillStyle = `rgba(${hotColor},.25)`
              ctx.fill()

              ctx.beginPath()
              ctx.arc(mx, my, 3.4 * scCurrent, 0, TAU)
              ctx.fillStyle = `rgb(${hotColor})`
              ctx.fill()
            }
          })

          // Brazo Fonocaptor Realista (Basado en tocadiscos real visto desde arriba)
          const pv = { x: halfVal + 0.60 * S0, y: halfVal - 0.56 * S0 }
          const pvS = {
            x: oxCurrent + pv.x * scCurrent,
            y: oyCurrent + pv.y * scCurrent,
          }
          const u = (S0 * scCurrent) / 680

          if (armLenRef.current === null) {
            armLenRef.current = 0.70 * (S0 * scCurrent) - 30 * u
          }

          let targetArmTh = TH_REST
          let targetArmLen = 0.70 * (S0 * scCurrent) - 30 * u
          let headAngleOffset = 16 * (Math.PI / 180)

          const targetBtn = selectedId ? signalElsRef.current.get(selectedId) : null
          const targetAv = targetBtn?.querySelector<HTMLElement>('.av') || null

          if (targetAv && stageEl) {
            const avRect = targetAv.getBoundingClientRect()
            const tc = {
              x: avRect.left + avRect.width / 2 - sg.left,
              y: avRect.top + avRect.height / 2 - sg.top,
            }
            const V = { x: tc.x - pvS.x, y: tc.y - pvS.y }
            const Vc = { x: cc.x - pvS.x, y: cc.y - pvS.y }
            const cross = V.x * Vc.y - V.y * Vc.x
            const bendSign = cross >= 0 ? 1 : -1
            headAngleOffset = bendSign * 16 * (Math.PI / 180)

            let thA = Math.atan2(V.y, V.x)
            let thH = thA + headAngleOffset
            let PeTarget = {
              x: tc.x - Math.cos(thH) * 30 * u,
              y: tc.y - Math.sin(thH) * 30 * u,
            }
            thA = Math.atan2(PeTarget.y - pvS.y, PeTarget.x - pvS.x)
            thH = thA + headAngleOffset
            PeTarget = {
              x: tc.x - Math.cos(thH) * 30 * u,
              y: tc.y - Math.sin(thH) * 30 * u,
            }

            targetArmTh = thA
            targetArmLen = Math.hypot(PeTarget.x - pvS.x, PeTarget.y - pvS.y)
          } else if (selectedId) {
            const targetSignal = physSignals.find((s) => s.id === selectedId)
            if (targetSignal) {
              const tx = oxCurrent + targetSignal.px * scCurrent
              const ty = oyCurrent + targetSignal.py * scCurrent
              const V = { x: tx - pvS.x, y: ty - pvS.y }
              const Vc = { x: cc.x - pvS.x, y: cc.y - pvS.y }
              const cross = V.x * Vc.y - V.y * Vc.x
              const bendSign = cross >= 0 ? 1 : -1
              headAngleOffset = bendSign * 16 * (Math.PI / 180)

              let thA = Math.atan2(V.y, V.x)
              let thH = thA + headAngleOffset
              let PeTarget = {
                x: tx - Math.cos(thH) * 30 * u,
                y: ty - Math.sin(thH) * 30 * u,
              }
              thA = Math.atan2(PeTarget.y - pvS.y, PeTarget.x - pvS.x)
              thH = thA + headAngleOffset
              PeTarget = {
                x: tx - Math.cos(thH) * 30 * u,
                y: ty - Math.sin(thH) * 30 * u,
              }

              targetArmTh = thA
              targetArmLen = Math.hypot(PeTarget.x - pvS.x, PeTarget.y - pvS.y)
            }
          }

          // Animación suave cuadrática de rotación y elongación (~700ms)
          const animSpeed = selectedId ? 7.5 : 4.0
          const kk = Math.min(1, dt * animSpeed)
          armThRef.current += angDiff(armThRef.current, targetArmTh) * kk
          armLenRef.current += (targetArmLen - armLenRef.current) * kk

          // Detección de aterrizaje: cuando el brazo llega a la posición objetivo
          const angDiffVal = Math.abs(angDiff(armThRef.current, targetArmTh))
          const lenDiffVal = Math.abs(targetArmLen - armLenRef.current)
          const isLanded = Boolean(selectedId && angDiffVal < 0.05 && lenDiffVal < 6 * u)
          const targetLift = isLanded ? 0 : 1
          armLiftRef.current += (targetLift - armLiftRef.current) * Math.min(1, dt * 7.5)

          const armTh = armThRef.current
          const armLen = armLenRef.current
          const armLift = armLiftRef.current
          const thHead = armTh + headAngleOffset

          // Punto de unión del tubo con el cabezal (Pe)
          const Pe = {
            x: pvS.x + Math.cos(armTh) * armLen,
            y: pvS.y + Math.sin(armTh) * armLen,
          }
          // Punto de la punta de la aguja
          const tipPt = {
            x: Pe.x + Math.cos(thHead) * 30 * u,
            y: Pe.y + Math.sin(thHead) * 30 * u,
          }

          ctx.save()

          // 1. Sombra de la base del pivote (elipse difusa desplazada (6u, 9u), negra al 28%)
          ctx.save()
          ctx.beginPath()
          ctx.ellipse(pvS.x + 6 * u, pvS.y + 9 * u, 34 * u, 30 * u, 0, 0, TAU)
          const gBaseShadow = ctx.createRadialGradient(
            pvS.x + 6 * u,
            pvS.y + 9 * u,
            10 * u,
            pvS.x + 6 * u,
            pvS.y + 9 * u,
            34 * u
          )
          gBaseShadow.addColorStop(0, 'rgba(0, 0, 0, 0.28)')
          gBaseShadow.addColorStop(1, 'rgba(0, 0, 0, 0)')
          ctx.fillStyle = gBaseShadow
          ctx.fill()
          ctx.restore()

          // 2. Sombra proyectada del brazo completo (se aleja/difumina al levantar y se pega/afina al posar)
          ctx.save()
          const shDist = (4 + 14 * armLift) * u
          const shX = shDist * 0.65
          const shY = shDist * 0.95
          ctx.globalAlpha = 0.26 - 0.08 * armLift
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 6 * u + 4 * u * armLift
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          ctx.moveTo(pvS.x + shX, pvS.y + shY)
          ctx.lineTo(Pe.x + shX, Pe.y + shY)
          ctx.lineTo(tipPt.x + shX, tipPt.y + shY)
          ctx.stroke()
          ctx.restore()

          // 3. Tubo del brazo: aluminio grafito, ligeramente cónico (8u en base, 5.5u en punta)
          ctx.save()
          ctx.translate(pvS.x, pvS.y)
          ctx.rotate(armTh)

          const wBase = 4 * u
          const wTip = 2.75 * u

          // Cuerpo del tubo
          ctx.beginPath()
          ctx.moveTo(0, -wBase)
          ctx.lineTo(armLen, -wTip)
          ctx.lineTo(armLen, wTip)
          ctx.lineTo(0, wBase)
          ctx.closePath()
          ctx.fillStyle = '#3a3d45'
          ctx.fill()
          ctx.strokeStyle = '#0f1014'
          ctx.lineWidth = 1 * u
          ctx.stroke()

          // Sombra propia del lado opuesto a la luz (+y)
          ctx.beginPath()
          ctx.moveTo(0, wBase * 0.45)
          ctx.lineTo(armLen, wTip * 0.45)
          ctx.strokeStyle = '#1b1c21'
          ctx.lineWidth = 2.2 * u
          ctx.stroke()

          // Franja de brillo desplazada hacia el lado de la luz (-y)
          ctx.beginPath()
          ctx.moveTo(0, -wBase * 0.45)
          ctx.lineTo(armLen, -wTip * 0.45)
          ctx.strokeStyle = '#aab0bb'
          ctx.lineWidth = 1.6 * u
          ctx.stroke()

          // Línea blanca de 1px al 60% encima del brillo
          ctx.beginPath()
          ctx.moveTo(0, -wBase * 0.45)
          ctx.lineTo(armLen, -wTip * 0.45)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.60)'
          ctx.lineWidth = 1
          ctx.stroke()

          // Collar fino de 3.5u gris oscuro (#4b4e58) a un tercio del recorrido
          const xCollar = armLen / 3
          const wCollar = wBase + (wTip - wBase) * (1 / 3) + 0.8 * u
          ctx.fillStyle = '#4b4e58'
          ctx.fillRect(xCollar - 1.75 * u, -wCollar, 3.5 * u, wCollar * 2)
          ctx.strokeStyle = '#0f1014'
          ctx.lineWidth = 0.8 * u
          ctx.strokeRect(xCollar - 1.75 * u, -wCollar, 3.5 * u, wCollar * 2)

          // Destello blanco de 1px en el collar
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
          ctx.fillRect(xCollar - 1.2 * u, -wCollar, 2.4 * u, 1)

          ctx.restore()

          // 4. Contrapeso: cilíndrico en grafito con degradado transversal, anillo plata y varilla
          ctx.save()
          ctx.translate(pvS.x, pvS.y)
          ctx.rotate(armTh)

          // Varilla delgada de 10u de largo y 8u de ancho, plateada, con tope redondeado
          ctx.fillStyle = '#eceff4'
          ctx.fillRect(-34 * u, -4 * u, 10 * u, 8 * u)
          ctx.beginPath()
          ctx.arc(-34 * u, 0, 4 * u, 0, TAU)
          ctx.fill()
          ctx.strokeStyle = '#6d727d'
          ctx.lineWidth = 0.8 * u
          ctx.stroke()

          // Cilindro de 34u de ancho y 26u de largo, color grafito con degradado transversal
          const gCw = ctx.createLinearGradient(0, -17 * u, 0, 17 * u)
          gCw.addColorStop(0, '#0b0b0e')
          gCw.addColorStop(0.5, '#50535d')
          gCw.addColorStop(1, '#0b0b0e')
          ctx.fillStyle = gCw
          ctx.fillRect(-24 * u, -17 * u, 22 * u, 34 * u)
          ctx.strokeStyle = '#0b0b0e'
          ctx.lineWidth = 1 * u
          ctx.strokeRect(-24 * u, -17 * u, 22 * u, 34 * u)

          // Anillo plateado de 3u en la unión con la base
          ctx.fillStyle = '#eceff4'
          ctx.fillRect(-5 * u, -17 * u, 3 * u, 34 * u)
          ctx.strokeStyle = '#6d727d'
          ctx.lineWidth = 0.8 * u
          ctx.strokeRect(-5 * u, -17 * u, 3 * u, 34 * u)

          // Reflejo blanco fino al 35%
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
          ctx.lineWidth = 1.2 * u
          ctx.beginPath()
          ctx.moveTo(-23 * u, -7 * u)
          ctx.lineTo(-6 * u, -7 * u)
          ctx.stroke()

          ctx.restore()

          // 5. Base del pivote (disco negro radio 32u, anillo plata torneado radio 24u, tapa cepillada 15u)
          ctx.save()
          const gPivotBase = ctx.createRadialGradient(
            pvS.x - 4 * u,
            pvS.y - 4 * u,
            2 * u,
            pvS.x,
            pvS.y,
            32 * u
          )
          gPivotBase.addColorStop(0, '#2b2b32')
          gPivotBase.addColorStop(1, '#0b0b0e')
          ctx.fillStyle = gPivotBase
          ctx.beginPath()
          ctx.arc(pvS.x, pvS.y, 32 * u, 0, TAU)
          ctx.fill()
          ctx.strokeStyle = '#050508'
          ctx.lineWidth = 1.5 * u
          ctx.stroke()

          // Anillo plateado de 3u de grosor a 24u de radio con degradado cónico
          ctx.beginPath()
          ctx.arc(pvS.x, pvS.y, 24 * u, 0, TAU)
          ctx.lineWidth = 3 * u
          try {
            if (ctx.createConicGradient) {
              const gConic = ctx.createConicGradient(0, pvS.x, pvS.y)
              gConic.addColorStop(0, '#8d929c')
              gConic.addColorStop(0.25, '#eceff4')
              gConic.addColorStop(0.5, '#6d727d')
              gConic.addColorStop(0.75, '#d3d7df')
              gConic.addColorStop(1, '#8d929c')
              ctx.strokeStyle = gConic
            } else {
              ctx.strokeStyle = '#d3d7df'
            }
          } catch {
            ctx.strokeStyle = '#d3d7df'
          }
          ctx.stroke()

          // Tapa central de 15u en aluminio cepillado
          const gCap = ctx.createRadialGradient(
            pvS.x - 3 * u,
            pvS.y - 3 * u,
            0,
            pvS.x,
            pvS.y,
            15 * u
          )
          gCap.addColorStop(0, '#f1f3f7')
          gCap.addColorStop(1, '#8c919c')
          ctx.fillStyle = gCap
          ctx.beginPath()
          ctx.arc(pvS.x, pvS.y, 15 * u, 0, TAU)
          ctx.fill()

          // 3 anillos concéntricos finos (1px, negro al 18%)
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)'
          ctx.lineWidth = 1
          ;[5 * u, 9 * u, 13 * u].forEach((r) => {
            ctx.beginPath()
            ctx.arc(pvS.x, pvS.y, r, 0, TAU)
            ctx.stroke()
          })

          // Reflejo blanco de 2px arriba a la izquierda
          ctx.fillStyle = 'rgba(255, 255, 255, 0.90)'
          ctx.beginPath()
          ctx.arc(pvS.x - 5 * u, pvS.y - 5 * u, 2 * u, 0, TAU)
          ctx.fill()
          ctx.restore()

          // 6. Cabezal (portacápsula) y aguja: girado 16° hacia el centro del disco
          ctx.save()
          ctx.translate(Pe.x, Pe.y)
          ctx.rotate(thHead)

          // Placa del cabezal: rectángulo 30u x 16u con esquinas 4u, degradado vertical plata
          const gHeadPlate = ctx.createLinearGradient(0, -8 * u, 0, 8 * u)
          gHeadPlate.addColorStop(0, '#f4f6fa')
          gHeadPlate.addColorStop(1, '#9096a3')
          ctx.fillStyle = gHeadPlate
          ctx.beginPath()
          if (ctx.roundRect) {
            ctx.roundRect(0, -8 * u, 30 * u, 16 * u, 4 * u)
          } else {
            ctx.rect(0, -8 * u, 30 * u, 16 * u)
          }
          ctx.fill()
          ctx.strokeStyle = '#2d2f36'
          ctx.lineWidth = 1
          ctx.stroke()

          // Cápsula: bloque negro mate 17u x 12u
          ctx.fillStyle = '#17171b'
          ctx.beginPath()
          if (ctx.roundRect) {
            ctx.roundRect(5 * u, -6 * u, 17 * u, 12 * u, 2 * u)
          } else {
            ctx.rect(5 * u, -6 * u, 17 * u, 12 * u)
          }
          ctx.fill()

          // Borde superior brillante al 25%
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(5 * u, -6 * u)
          ctx.lineTo(22 * u, -6 * u)
          ctx.stroke()

          // Dos tornillos plateados de 2.4u
          ctx.fillStyle = '#eceff4'
          ctx.beginPath()
          ctx.arc(9 * u, -3.2 * u, 1.2 * u, 0, TAU)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(9 * u, 3.2 * u, 1.2 * u, 0, TAU)
          ctx.fill()

          // Pequeño punto lila #B79AF5 de 3u como acento de marca
          ctx.fillStyle = '#b79af5'
          ctx.beginPath()
          ctx.arc(16 * u, 0, 1.5 * u, 0, TAU)
          ctx.fill()

          // Dedal (finger lift): varilla fina plateada de 1.5u saliendo hacia el lado exterior del disco
          const extSign = headAngleOffset >= 0 ? -1 : 1
          ctx.strokeStyle = '#c9cdd6'
          ctx.lineWidth = 1.5 * u
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(18 * u, extSign * 8 * u)
          ctx.lineTo(22 * u, extSign * 18 * u)
          ctx.arc(22 * u, extSign * 20 * u, 2.5 * u, -Math.PI / 2, Math.PI / 2, extSign < 0)
          ctx.stroke()

          // Aguja: cantilever plateado de 1.3u hacia delante
          ctx.strokeStyle = '#eceff4'
          ctx.lineWidth = 1.3 * u
          ctx.beginPath()
          ctx.moveTo(22 * u, 0)
          ctx.lineTo(30 * u, 0)
          ctx.stroke()

          // Diamante de 1.1u en la punta exacta (30 * u, 0)
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.moveTo(30 * u - 1.1 * u, 0)
          ctx.lineTo(30 * u, -1.1 * u)
          ctx.lineTo(30 * u + 1.1 * u, 0)
          ctx.lineTo(30 * u, 1.1 * u)
          ctx.closePath()
          ctx.fill()

          ctx.restore()

          // Anillos finos concéntricos al apoyar en la punta de la aguja (r 6u y 10u, se desvanecen al levantar)
          if (armLift < 0.6) {
            const ringOpacity = 1 - armLift / 0.6
            ctx.strokeStyle = `rgba(255, 255, 255, ${(0.32 * ringOpacity).toFixed(3)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(tipPt.x, tipPt.y, 6 * u, 0, TAU)
            ctx.stroke()

            ctx.strokeStyle = `rgba(255, 255, 255, ${(0.15 * ringOpacity).toFixed(3)})`
            ctx.beginPath()
            ctx.arc(tipPt.x, tipPt.y, 10 * u, 0, TAU)
            ctx.stroke()
          }

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
    [selectedId, isHovered, mode, s0, sc, stageW, stageH]
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

    // Coordenadas reales para el impacto obtenidas del elemento del avatar
    const targetBtn = signalElsRef.current.get(c.id)
    const targetAv = targetBtn?.querySelector<HTMLElement>('.av')
    const stageEl = stageRef.current
    let impactX = half
    let impactY = half

    if (targetAv && stageEl) {
      const ar = targetAv.getBoundingClientRect()
      const sr = stageEl.getBoundingClientRect()
      impactX = ar.left + ar.width / 2 - sr.left
      impactY = ar.top + ar.height / 2 - sr.top
    } else {
      const sig = signalsPhysicsRef.current.find((s) => s.id === c.id)
      impactX = sig ? sig.px : half
      impactY = sig ? sig.py : half
    }

    // Disparar aros de impacto minimalistas en el centro exacto
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
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      {/* 2. Canvas superior (Brazo fonocaptor, aguja, contrapeso y lunitas) */}
      <canvas
        id="fx"
        ref={fxCanvasRef}
        className="pointer-events-none absolute inset-0"
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
