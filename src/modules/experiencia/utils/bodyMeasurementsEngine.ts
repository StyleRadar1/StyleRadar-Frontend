import type { BodyDeformationFactors, BodyMeasurements, BodyType } from '../types/bodyMeasurements.dto'

export const SR_BODY_MEASUREMENTS_KEY = 'sr_user_body_measurements'
export const SR_BODY_SAVED_FLAG = 'sr_body_measurements_saved'

export interface BodyArchetype {
  id: string
  nombre: string
  estatura: number // cm
  peso: number // kg
  talla: string // XS, S, M, L, XL, XXL
  pecho: number
  cintura: number
  cadera: number
  hombros: number
  cuerpoBase?: BodyType
  descripcion?: string
}

/**
 * 15 Arquetipos morfológicos oficiales femeninos (StyleRadar Mujer)
 */
export const FEMALE_BODY_ARCHETYPES: BodyArchetype[] = [
  { id: 'f-muy-delgada', nombre: 'Muy Delgada', estatura: 160, peso: 45, talla: 'XS', pecho: 78, cintura: 60, cadera: 82, hombros: 36, cuerpoBase: 'femenino' },
  { id: 'f-delgada', nombre: 'Delgada', estatura: 165, peso: 50, talla: 'S', pecho: 82, cintura: 64, cadera: 86, hombros: 37, cuerpoBase: 'femenino' },
  { id: 'f-normal-s', nombre: 'Normal (S)', estatura: 165, peso: 55, talla: 'S', pecho: 86, cintura: 68, cadera: 90, hombros: 38, cuerpoBase: 'femenino' },
  { id: 'f-normal-m', nombre: 'Normal (M)', estatura: 170, peso: 62, talla: 'M', pecho: 90, cintura: 72, cadera: 95, hombros: 39, cuerpoBase: 'femenino' },
  { id: 'f-normal-l', nombre: 'Normal (L)', estatura: 175, peso: 70, talla: 'L', pecho: 96, cintura: 78, cadera: 100, hombros: 40, cuerpoBase: 'femenino' },
  { id: 'f-con-sobrepeso', nombre: 'Con Sobrepeso', estatura: 168, peso: 80, talla: 'L', pecho: 102, cintura: 88, cadera: 108, hombros: 41, cuerpoBase: 'femenino' },
  { id: 'f-muy-grande', nombre: 'Muy Grande', estatura: 170, peso: 110, talla: 'XXL', pecho: 122, cintura: 110, cadera: 124, hombros: 44, cuerpoBase: 'femenino' },
  { id: 'f-bajita-robusta', nombre: 'Bajita y Robusta', estatura: 150, peso: 70, talla: 'L', pecho: 98, cintura: 86, cadera: 104, hombros: 38, cuerpoBase: 'femenino' },
  { id: 'f-alta-delgada', nombre: 'Alta y Delgada', estatura: 180, peso: 60, talla: 'M', pecho: 88, cintura: 68, cadera: 92, hombros: 40, cuerpoBase: 'femenino' },
  { id: 'f-atletica', nombre: 'Atlética', estatura: 168, peso: 60, talla: 'M', pecho: 90, cintura: 68, cadera: 92, hombros: 40, cuerpoBase: 'femenino' },
  { id: 'f-musculosa', nombre: 'Musculosa', estatura: 170, peso: 75, talla: 'L', pecho: 98, cintura: 72, cadera: 96, hombros: 43, cuerpoBase: 'femenino' },
  { id: 'f-con-barriga', nombre: 'Con Barriga', estatura: 165, peso: 85, talla: 'XL', pecho: 104, cintura: 98, cadera: 106, hombros: 40, cuerpoBase: 'femenino' },
  { id: 'f-grande', nombre: 'Grande', estatura: 168, peso: 100, talla: 'XXL', pecho: 116, cintura: 104, cadera: 118, hombros: 43, cuerpoBase: 'femenino' },
  { id: 'f-con-curvas', nombre: 'Con Curvas', estatura: 165, peso: 88, talla: 'XL', pecho: 106, cintura: 80, cadera: 118, hombros: 40, cuerpoBase: 'femenino' },
  { id: 'f-obesa-grande', nombre: 'Obesa Grande', estatura: 165, peso: 120, talla: 'XXL', pecho: 128, cintura: 120, cadera: 130, hombros: 44, cuerpoBase: 'femenino' },
]

/**
 * 15 Arquetipos morfológicos oficiales masculinos (StyleRadar Hombre)
 */
export const MALE_BODY_ARCHETYPES: BodyArchetype[] = [
  { id: 'm-muy-delgado', nombre: 'Muy Delgado', estatura: 160, peso: 50, talla: 'XS', pecho: 80, cintura: 66, cadera: 82, hombros: 38, cuerpoBase: 'masculino' },
  { id: 'm-delgado', nombre: 'Delgado', estatura: 165, peso: 55, talla: 'S', pecho: 86, cintura: 72, cadera: 88, hombros: 40, cuerpoBase: 'masculino' },
  { id: 'm-normal-s', nombre: 'Normal (S)', estatura: 170, peso: 60, talla: 'S', pecho: 92, cintura: 76, cadera: 92, hombros: 42, cuerpoBase: 'masculino' },
  { id: 'm-normal-m', nombre: 'Normal (M)', estatura: 175, peso: 68, talla: 'M', pecho: 96, cintura: 80, cadera: 98, hombros: 44, cuerpoBase: 'masculino' },
  { id: 'm-normal-l', nombre: 'Normal (L)', estatura: 180, peso: 75, talla: 'L', pecho: 102, cintura: 84, cadera: 102, hombros: 46, cuerpoBase: 'masculino' },
  { id: 'm-con-sobrepeso', nombre: 'Con Sobrepeso', estatura: 175, peso: 85, talla: 'L', pecho: 108, cintura: 96, cadera: 106, hombros: 45, cuerpoBase: 'masculino' },
  { id: 'm-muy-grande', nombre: 'Muy Grande', estatura: 175, peso: 120, talla: 'XXL', pecho: 126, cintura: 122, cadera: 126, hombros: 48, cuerpoBase: 'masculino' },
  { id: 'm-bajito-robusto', nombre: 'Bajito y Robusto', estatura: 160, peso: 80, talla: 'L', pecho: 106, cintura: 96, cadera: 104, hombros: 43, cuerpoBase: 'masculino' },
  { id: 'm-alto-delgado', nombre: 'Alto y Delgado', estatura: 190, peso: 70, talla: 'M', pecho: 94, cintura: 76, cadera: 94, hombros: 45, cuerpoBase: 'masculino' },
  { id: 'm-atletico', nombre: 'Atlético', estatura: 175, peso: 70, talla: 'M', pecho: 102, cintura: 78, cadera: 96, hombros: 48, cuerpoBase: 'masculino' },
  { id: 'm-musculoso', nombre: 'Musculoso', estatura: 180, peso: 90, talla: 'XL', pecho: 114, cintura: 84, cadera: 102, hombros: 52, cuerpoBase: 'masculino' },
  { id: 'm-barrigon', nombre: 'Barrigón', estatura: 175, peso: 90, talla: 'XL', pecho: 106, cintura: 108, cadera: 104, hombros: 45, cuerpoBase: 'masculino' },
  { id: 'm-grande', nombre: 'Grande', estatura: 175, peso: 110, talla: 'XXL', pecho: 122, cintura: 114, cadera: 120, hombros: 48, cuerpoBase: 'masculino' },
  { id: 'm-con-curvas', nombre: 'Con Curvas', estatura: 170, peso: 95, talla: 'XL', pecho: 112, cintura: 88, cadera: 122, hombros: 43, cuerpoBase: 'masculino' },
  { id: 'm-obeso-grande', nombre: 'Obeso Grande', estatura: 170, peso: 130, talla: 'XXL', pecho: 134, cintura: 130, cadera: 132, hombros: 48, cuerpoBase: 'masculino' },
]

/**
 * Obtiene la lista de 15 arquetipos correspondiente a la silueta (femenina o masculina/neutra)
 */
export function getBodyArchetypes(cuerpoBase?: BodyType): BodyArchetype[] {
  return cuerpoBase === 'femenino' ? FEMALE_BODY_ARCHETYPES : MALE_BODY_ARCHETYPES
}

export const BODY_ARCHETYPES: BodyArchetype[] = [
  ...FEMALE_BODY_ARCHETYPES,
  ...MALE_BODY_ARCHETYPES,
]

/**
 * Detecta el arquetipo más afín o el IMC del usuario según silueta base
 */
export function detectBodyArchetype(m?: Partial<BodyMeasurements> | null): {
  id: string
  nombre: string
  bmi: number
} {
  const isFemale = m?.cuerpoBase === 'femenino'
  const archetypes = isFemale ? FEMALE_BODY_ARCHETYPES : MALE_BODY_ARCHETYPES

  const defaultH = isFemale ? 165 : 175
  const defaultW = isFemale ? 58 : 68

  const h = (m?.estatura || defaultH) / 100
  const w = m?.peso || defaultW
  const bmi = Number((w / (h * h)).toFixed(1))

  if (m?.contextura) {
    const found = BODY_ARCHETYPES.find(
      (a) =>
        a.id === m.contextura ||
        a.nombre.toLowerCase() === m.contextura?.toLowerCase(),
    )
    if (found) {
      return { id: found.id, nombre: found.nombre, bmi }
    }
  }

  // Encuentra el arquetipo por distancia mínima ponderada
  let best = archetypes[3] // Normal (M)
  let bestDist = Infinity

  const est = m?.estatura || defaultH
  const p = m?.peso || defaultW
  const pe = m?.pecho || (isFemale ? 90 : 96)
  const ci = m?.cintura || (isFemale ? 72 : 80)

  for (const arch of archetypes) {
    const dist =
      Math.pow((est - arch.estatura) / 15, 2) +
      Math.pow((p - arch.peso) / 12, 2) +
      Math.pow((pe - arch.pecho) / 10, 2) +
      Math.pow((ci - arch.cintura) / 10, 2)

    if (dist < bestDist) {
      bestDist = dist
      best = arch
    }
  }

  return { id: best.id, nombre: best.nombre, bmi }
}

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
      silhouetteSrc: '/prototipo/assets/img/general/maniqui-f.png',
      complexion: 'Normal (M)',
      bmi: 21.3,
    }
  }

  const isFemale = m.cuerpoBase === 'femenino'

  // Escala de altura anclada al suelo (175 cm como estándar base)
  const heightScale = Math.max(0.75, Math.min(1.25, Number((m.estatura / 175).toFixed(2))))

  // Detección de arquetipo e IMC según silueta
  const { nombre: complexion, bmi } = detectBodyArchetype(m)

  // Medidas y proporciones corporales base según género
  const basePecho = isFemale ? 90 : 96
  const baseCintura = isFemale ? 72 : 80
  const baseCadera = isFemale ? 95 : 98
  const baseHombros = isFemale ? 39 : 44
  const basePeso = isFemale ? 58 : 68
  const baseBmi = isFemale ? 21.3 : 22.2

  const pe = m.pecho || basePecho
  const ci = m.cintura || baseCintura
  const ca = m.cadera || baseCadera
  const ho = m.hombros || baseHombros

  const measFactor = (pe / basePecho) * 0.40 + (ci / baseCintura) * 0.35 + (ca / baseCadera) * 0.25
  const hM = (m.estatura || (isFemale ? 165 : 175)) / 100
  const w = m.peso || basePeso
  const userBmi = w / (hM * hM)
  const bmiFactor = Math.sqrt(userBmi / baseBmi)

  // Factor de escala horizontal anatómica adaptativo (delgada ~0.78 hasta obesa grande ~1.48)
  const rawWidth = measFactor * 0.6 + bmiFactor * 0.4
  const chestScale = Math.max(0.78, Math.min(1.52, Number(rawWidth.toFixed(2))))

  // Escalas horizontales por zonas anatómicas
  const waistScale = Math.max(0.75, Math.min(1.50, Number((ci / baseCintura).toFixed(2))))
  const hipScale = Math.max(0.75, Math.min(1.50, Number((ca / baseCadera).toFixed(2))))
  const shoulderScale = Math.max(0.80, Math.min(1.35, Number((ho / baseHombros).toFixed(2))))

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
    complexion,
    bmi,
  }
}
