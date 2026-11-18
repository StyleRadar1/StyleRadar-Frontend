export type BodyType = 'masculino' | 'femenino' | 'neutro'
export type MeasurementUnits = 'metric' | 'imperial'

export interface BodyMeasurements {
  cuerpoBase: BodyType
  unidades: MeasurementUnits
  estatura: number // cm (140 - 210)
  peso?: number // kg (35 - 180)
  tallaHabitual: string // XS, S, M, L, XL, XXL, etc.
  pecho: number // cm (60 - 150)
  cintura: number // cm (45 - 140)
  cadera: number // cm (65 - 160)
  hombros: number // cm (30 - 65)
  largoBrazo: number // cm (45 - 80)
  largoTorso: number // cm (35 - 65)
  largoPierna: number // cm (70 - 125)
  esAproximado?: boolean
  consentimientoGuardado: boolean
  esTemporal?: boolean
  fechaActualizacion: string
}

export interface BodyDeformationFactors {
  heightScale: number
  chestScale: number
  waistScale: number
  hipScale: number
  shoulderScale: number
  silhouetteSrc: string
}
