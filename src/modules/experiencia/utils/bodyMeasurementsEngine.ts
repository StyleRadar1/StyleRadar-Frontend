import type { BodyDeformationFactors, BodyMeasurements, BodyType } from '../types/bodyMeasurements.dto'

export const SR_BODY_MEASUREMENTS_KEY = 'sr_user_body_measurements'
export const SR_BODY_SAVED_FLAG = 'sr_body_measurements_saved'

export const DEFAULT_BODY_MEASUREMENTS: BodyMeasurements = {
  cuerpoBase: 'femenino',
  unidades: 'metric',
  estatura: 175,
  peso: 65,
  tallaHabitual: 'M',
  pecho: 96,
  cintura: 80,
  cadera: 98,
  hombros: 44,
  largoBrazo: 62,
  largoTorso: 48,
  largoPierna: 102,
  esAproximado: false,
  consentimientoGuardado: true,
  esTemporal: false,
  fechaActualizacion: new Date().toISOString(),
}

/**
 * Obtiene las medidas corporales guardadas del usuario o null si no las ha configurado.
 */
export function getBodyMeasurements(userId?: string): BodyMeasurements | null {
  try {
    if (userId) {
      const userKey = `${SR_BODY_MEASUREMENTS_KEY}_${userId}`
      const rawUser = localStorage.getItem(userKey) || sessionStorage.getItem(userKey)
      if (rawUser) return JSON.parse(rawUser)
    }
    const raw = localStorage.getItem(SR_BODY_MEASUREMENTS_KEY) || sessionStorage.getItem(SR_BODY_MEASUREMENTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Verifica si el usuario ya tiene medidas guardadas formalmente (no vacías).
 */
export function hasSavedBodyMeasurements(userId?: string): boolean {
  try {
    if (userId) {
      const userFlag =
        localStorage.getItem(`${SR_BODY_SAVED_FLAG}_${userId}`) ||
        sessionStorage.getItem(`${SR_BODY_SAVED_FLAG}_${userId}`)
      if (userFlag === 'true' || userFlag === 'temporary') return true
    }
    const flag = localStorage.getItem(SR_BODY_SAVED_FLAG) || sessionStorage.getItem(SR_BODY_SAVED_FLAG)
    if (flag === 'true' || flag === 'temporary') {
      const data = getBodyMeasurements(userId)
      return data !== null && Boolean(data.estatura && data.pecho && data.cintura)
    }
  } catch {
    /* ignore */
  }
  return false
}

/**
 * Guarda las medidas corporales vinculadas opcionalmente al ID del perfil de usuario.
 * Si persist es true, se almacena en localStorage con consentimiento.
 * Si es temporal, se guarda en sessionStorage sin persistencia a largo plazo.
 */
export function saveBodyMeasurements(measurements: BodyMeasurements, persist: boolean, userId?: string): void {
  try {
    const payload: BodyMeasurements = {
      ...measurements,
      esTemporal: !persist,
      consentimientoGuardado: persist,
      fechaActualizacion: new Date().toISOString(),
    }
    const json = JSON.stringify(payload)
    if (persist) {
      localStorage.setItem(SR_BODY_MEASUREMENTS_KEY, json)
      localStorage.setItem(SR_BODY_SAVED_FLAG, 'true')
      if (userId) {
        localStorage.setItem(`${SR_BODY_MEASUREMENTS_KEY}_${userId}`, json)
        localStorage.setItem(`${SR_BODY_SAVED_FLAG}_${userId}`, 'true')
      }
      // También sincroniza el formato simplificado para el recomendador de tallas
      localStorage.setItem(
        'sr_user_measurements',
        JSON.stringify({
          superior: measurements.tallaHabitual || 'M',
          inferior:
            measurements.cintura <= 76
              ? '28'
              : measurements.cintura <= 82
                ? '30'
                : measurements.cintura <= 88
                  ? '32'
                  : '34',
          calzado: '38',
        }),
      )
    } else {
      sessionStorage.setItem(SR_BODY_MEASUREMENTS_KEY, json)
      sessionStorage.setItem(SR_BODY_SAVED_FLAG, 'temporary')
      if (userId) {
        sessionStorage.setItem(`${SR_BODY_MEASUREMENTS_KEY}_${userId}`, json)
        sessionStorage.setItem(`${SR_BODY_SAVED_FLAG}_${userId}`, 'temporary')
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * Borra las medidas corporales y resetea las banderas (para pruebas o privacidad).
 */
export function clearBodyMeasurements(userId?: string): void {
  try {
    localStorage.removeItem(SR_BODY_MEASUREMENTS_KEY)
    localStorage.removeItem(SR_BODY_SAVED_FLAG)
    localStorage.removeItem('sr_user_measurements')
    sessionStorage.removeItem(SR_BODY_MEASUREMENTS_KEY)
    sessionStorage.removeItem(SR_BODY_SAVED_FLAG)
    if (userId) {
      localStorage.removeItem(`${SR_BODY_MEASUREMENTS_KEY}_${userId}`)
      localStorage.removeItem(`${SR_BODY_SAVED_FLAG}_${userId}`)
      sessionStorage.removeItem(`${SR_BODY_MEASUREMENTS_KEY}_${userId}`)
      sessionStorage.removeItem(`${SR_BODY_SAVED_FLAG}_${userId}`)
    }
  } catch {
    /* ignore */
  }
}

/**
 * Descarga los datos anatómicos en formato JSON según los derechos del usuario (Ley 1581 / Habeas Data).
 */
export function exportBodyMeasurementsJson(): void {
  const data = getBodyMeasurements()
  if (!data) return
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mis_medidas_styleradar_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Estima medidas antropométricas coherentes a partir de cuerpo base, estatura, peso y talla.
 */
export function estimateMeasurements(
  cuerpoBase: BodyType,
  estatura: number,
  peso?: number,
  talla: string = 'M',
): Partial<BodyMeasurements> {
  const h = Math.max(140, Math.min(210, estatura || 170))
  const w = peso ? Math.max(40, Math.min(150, peso)) : (cuerpoBase === 'femenino' ? (h - 105) : (h - 100))

  let factorTalla = 1.0
  if (talla === 'XS') factorTalla = 0.88
  else if (talla === 'S') factorTalla = 0.94
  else if (talla === 'M') factorTalla = 1.0
  else if (talla === 'L') factorTalla = 1.07
  else if (talla === 'XL') factorTalla = 1.15
  else if (talla === 'XXL') factorTalla = 1.24

  let pecho: number
  let cintura: number
  let cadera: number
  let hombros: number

  if (cuerpoBase === 'femenino') {
    pecho = Math.round((h * 0.53 + (w - 60) * 0.35) * factorTalla)
    cintura = Math.round((h * 0.42 + (w - 60) * 0.4) * factorTalla)
    cadera = Math.round((h * 0.56 + (w - 60) * 0.42) * factorTalla)
    hombros = Math.round(h * 0.23 * factorTalla)
  } else if (cuerpoBase === 'masculino') {
    pecho = Math.round((h * 0.56 + (w - 70) * 0.38) * factorTalla)
    cintura = Math.round((h * 0.47 + (w - 70) * 0.42) * factorTalla)
    cadera = Math.round((h * 0.54 + (w - 70) * 0.35) * factorTalla)
    hombros = Math.round(h * 0.26 * factorTalla)
  } else {
    pecho = Math.round((h * 0.54 + (w - 65) * 0.36) * factorTalla)
    cintura = Math.round((h * 0.45 + (w - 65) * 0.41) * factorTalla)
    cadera = Math.round((h * 0.55 + (w - 65) * 0.38) * factorTalla)
    hombros = Math.round(h * 0.245 * factorTalla)
  }

  const largoTorso = Math.round(h * 0.28)
  const largoPierna = Math.round(h * 0.56)
  const largoBrazo = Math.round(h * 0.35)

  return {
    pecho: Math.max(65, Math.min(145, pecho)),
    cintura: Math.max(50, Math.min(135, cintura)),
    cadera: Math.max(70, Math.min(155, cadera)),
    hombros: Math.max(34, Math.min(60, hombros)),
    largoTorso: Math.max(38, Math.min(62, largoTorso)),
    largoPierna: Math.max(75, Math.min(120, largoPierna)),
    largoBrazo: Math.max(48, Math.min(78, largoBrazo)),
    esAproximado: true,
  }
}

/**
 * Valida los rangos plausibles y la coherencia de las medidas.
 */
export function validateBodyMeasurements(m: Partial<BodyMeasurements>): {
  valid: boolean
  errors: Record<string, string>
  warnings: string[]
} {
  const errors: Record<string, string> = {}
  const warnings: string[] = []

  if (!m.estatura || m.estatura < 140 || m.estatura > 210) {
    errors.estatura = 'La estatura debe estar entre 1,40 m y 2,10 m (140 a 210 cm).'
  }

  if (m.peso && (m.peso < 35 || m.peso > 200)) {
    errors.peso = 'El peso ingresado debe estar entre 35 y 200 kg.'
  }

  if (!m.pecho || m.pecho < 60 || m.pecho > 150) {
    errors.pecho = 'El contorno de pecho/busto debe estar entre 60 y 150 cm.'
  }

  if (!m.cintura || m.cintura < 45 || m.cintura > 140) {
    errors.cintura = 'El contorno de cintura debe estar entre 45 y 140 cm.'
  }

  if (!m.cadera || m.cadera < 65 || m.cadera > 160) {
    errors.cadera = 'El contorno de cadera debe estar entre 65 y 160 cm.'
  }

  if (m.pecho && m.cintura && m.cintura > m.pecho * 1.35) {
    warnings.push('La cintura es considerablemente mayor al pecho. Revisa si tus datos son correctos.')
  }

  if (m.cadera && m.pecho && m.cadera < m.pecho * 0.65) {
    warnings.push('La cadera es muy reducida en comparación con el pecho. Revisa los centímetros.')
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
  }
}

/**
 * Calcula los factores de deformación visual para adaptar el maniquí.
 */
export function computeBodyDeformation(m: BodyMeasurements | null): BodyDeformationFactors {
  if (!m) {
    return {
      heightScale: 1.0,
      chestScale: 1.0,
      waistScale: 1.0,
      hipScale: 1.0,
      shoulderScale: 1.0,
      silhouetteSrc: '/prototipo/assets/img/general/maniqui.png',
    }
  }

  // Escala de altura anclada al suelo (175 cm como estándar base)
  const heightScale = Math.max(0.75, Math.min(1.25, Number((m.estatura / 175).toFixed(2))))

  // Escalas horizontales por zonas
  const chestScale = Math.max(0.85, Math.min(1.25, (m.pecho || 96) / 96))
  const waistScale = Math.max(0.82, Math.min(1.28, (m.cintura || 80) / 80))
  const hipScale = Math.max(0.85, Math.min(1.25, (m.cadera || 98) / 98))
  const shoulderScale = Math.max(0.88, Math.min(1.2, (m.hombros || 44) / 44))

  // Silueta base según cuerpo
  const silhouetteSrc =
    m.cuerpoBase === 'femenino'
      ? '/prototipo/assets/img/general/maniqui-f.png'
      : '/prototipo/assets/img/general/maniqui.png'

  return {
    heightScale,
    chestScale,
    waistScale,
    hipScale,
    shoulderScale,
    silhouetteSrc,
  }
}
