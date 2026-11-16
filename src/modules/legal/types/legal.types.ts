export type CookieCategory = 'necessary' | 'functional' | 'analytics' | 'marketing'

export interface CookieConsent {
  timestamp: string
  version: string
  necessary: true
  functional: boolean
  analytics: boolean
  marketing: boolean
}

export interface FormConsentRecord {
  userId?: string
  email?: string
  timestamp: string
  terminosVersion: string
  datosVersion: string
  aceptaTerminos: boolean
  aceptaDatos: boolean
  esMayorDeEdad: boolean
  aceptaPromociones?: boolean
  aceptaReglasTienda?: boolean
  aceptaReglasFundacion?: boolean
  ipMock?: string
  origen: string
}

export type LegalDocId =
  | 'terminos'
  | 'datos-personales'
  | 'aviso-privacidad'
  | 'cookies'
  | 'devoluciones-garantias'
  | 'envios-entregas'
  | 'pagos-seguridad'
  | 'pqrs'
  | 'reglas-tiendas'
  | 'reglas-fundaciones'
  | 'segunda-vida'
  | 'normas-comunidad'
  | 'probador-virtual-datos'
  | 'propiedad-intelectual'
  | 'uso-aceptable'
  | 'promociones-descuentos'
  | 'centro-ayuda'
  | 'mapa-legal'

export interface LegalDocSection {
  id: string
  numeral: string
  title: string
  paragraphs: string[]
  subsections?: {
    id: string
    numeral: string
    title: string
    paragraphs: string[]
    bullets?: string[]
  }[]
  bullets?: string[]
  alertNote?: string
}

export interface LegalDocMeta {
  id: LegalDocId
  slug: string
  title: string
  shortTitle: string
  category: 'general' | 'consumidor' | 'privacidad' | 'aliados' | 'comunidad' | 'soporte'
  version: string
  lastUpdated: string
  summary: string
  readTimeMinutes: number
  bracketedPlaceholders: string[]
}

export interface LegalDocFull extends LegalDocMeta {
  sections: LegalDocSection[]
}

export interface PqrsRequest {
  tipo: 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA' | 'RETRACTO'
  nombreCompleto: string
  email: string
  telefono?: string
  numeroPedido?: string
  tiendaInvolucrada?: string
  descripcion: string
  autorizaTratamientoDatos: boolean
}

export interface PqrsResponse {
  radicado: string
  fechaRadicacion: string
  tiempoRespuestaDiasHabiles: number
  estado: 'RECIBIDO' | 'EN_TRAMITE'
  mensaje: string
}
