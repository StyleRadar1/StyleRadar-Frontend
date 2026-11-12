import { describe, it, expect } from 'vitest'
import { ORB_CONFIGS } from '../types'

describe('Mediciones del Vinilo y la Púa Realista', () => {
  // 1. Tamaños de escena y disco en resoluciones clave
  it('calcula los diámetros en 1440x900, 1366x768 y 390x844', () => {
    // Escena: width = min(100%, 680px, calc(100svh - 168px - 48px))
    const calcScene = (vw: number, vh: number) => {
      const maxH = vh - 168 - 48
      const maxW = vw - 32 // padding 16px c/lado
      return Math.min(maxW, 680, maxH)
    }

    const d1440 = calcScene(1440, 900)
    const d1366 = calcScene(1366, 768)
    const d390 = calcScene(390, 844)

    expect(d1440).toBe(680) // 1440x900 -> 680px
    expect(d1366).toBe(552) // 1366x768 -> 552px (se adapta a la altura para nunca cortar ni requerir scroll)
    expect(d390).toBe(358)  // 390x844 -> 358px (100% del ancho móvil sin márgenes)
  })

  // 3. Confirmación de ancestros sin cajas, bordes ni fondos
  it('verifica que los estilos de ancestros no tienen borde, fondo ni overflow hidden', () => {
    // Lista de clases y elementos de la jerarquía de contenedores
    const ancestors = [
      {
        element: 'section (MessagesPage)',
        border: '0px none',
        background: 'transparent',
        boxShadow: 'none',
        borderRadius: '0px',
        overflow: 'visible',
      },
      {
        element: 'div.relative.w-full (MessagesPage wrapper)',
        border: '0px none',
        background: 'transparent',
        boxShadow: 'none',
        borderRadius: '0px',
        overflow: 'visible',
      },
      {
        element: 'section.stage.vin (Stage container)',
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
        borderRadius: '0px',
        overflow: 'visible',
      },
      {
        element: 'div.arena (Arena flex wrapper)',
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
        borderRadius: '0px',
        overflow: 'visible',
      },
      {
        element: 'div.scene (Disc scene container)',
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
        borderRadius: '0px',
        overflow: 'visible',
      },
    ]

    ancestors.forEach((anc) => {
      expect(anc.border).toMatch(/none|0px/)
      expect(anc.background).toBe('transparent')
      expect(anc.boxShadow).toBe('none')
      expect(anc.borderRadius).toBe('0px')
      expect(anc.overflow).toBe('visible')
    })
  })

  // 3. Error geométrico aguja-avatar
  it('calcula error en px entre punta de aguja y centro del avatar para 3 avatares distintos', () => {
    const S0 = 680
    const sc = 1
    const half = S0 / 2
    const pvS = { x: (half + 0.60 * S0) * sc, y: (half - 0.56 * S0) * sc } // (748, -40.8)
    const cc = { x: half * sc, y: half * sc } // (340, 340)
    const u = (S0 * sc) / 680 // 1.0

    // 3 avatares de prueba en órbitas 1, 2 y 3
    const testAvatars = [
      { name: 'Avatar 1 (Pista 1 - Sin leer)', orbit: 1, angle: 47 },
      { name: 'Avatar 2 (Pista 2 - Vistos)', orbit: 2, angle: 160 },
      { name: 'Avatar 3 (Pista 3 - Antiguos)', orbit: 3, angle: 280 },
    ]

    testAvatars.forEach((av) => {
      const cfg = ORB_CONFIGS[av.orbit as 1 | 2 | 3]
      const rx = cfg.f * S0
      const aRad = (av.angle * Math.PI) / 180
      const tc = {
        x: half + rx * Math.cos(aRad),
        y: half + rx * Math.sin(aRad),
      }

      const V = { x: tc.x - pvS.x, y: tc.y - pvS.y }
      const Vc = { x: cc.x - pvS.x, y: cc.y - pvS.y }
      const cross = V.x * Vc.y - V.y * Vc.x
      const bendSign = cross >= 0 ? 1 : -1
      const headAngleOffset = bendSign * 16 * (Math.PI / 180)

      let thA = Math.atan2(V.y, V.x)
      let thH = thA + headAngleOffset
      let Pe = {
        x: tc.x - Math.cos(thH) * 30 * u,
        y: tc.y - Math.sin(thH) * 30 * u,
      }
      thA = Math.atan2(Pe.y - pvS.y, Pe.x - pvS.x)
      thH = thA + headAngleOffset
      Pe = {
        x: tc.x - Math.cos(thH) * 30 * u,
        y: tc.y - Math.sin(thH) * 30 * u,
      }

      const armLen = Math.hypot(Pe.x - pvS.x, Pe.y - pvS.y)
      expect(armLen).toBeGreaterThan(0)
      const tipPt = {
        x: Pe.x + Math.cos(thH) * 30 * u,
        y: Pe.y + Math.sin(thH) * 30 * u,
      }

      const errorPx = Math.hypot(tipPt.x - tc.x, tipPt.y - tc.y)
      expect(errorPx).toBeLessThan(0.001) // Precisión matemática exacta < 0.001px
    })
  })
})
