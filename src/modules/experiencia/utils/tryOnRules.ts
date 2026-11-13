import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind } from '@/modules/core/api/errors'

/**
 * Reglas de la foto del probador según ms-probador-virtual (documento del servicio, sección 4):
 * JPEG o PNG, máximo 5 MB, mínimo 300 × 400 px y vertical. Se validan antes de subir para no
 * gastar una petición; si el servidor igual responde 400, 413 o 422, se muestra el mismo texto.
 */
export const TRYON_TYPES = ['image/jpeg', 'image/png'] as const
export const TRYON_ACCEPT = TRYON_TYPES.join(',')
export const TRYON_MAX_MB = 5
export const TRYON_MIN = { width: 300, height: 400 }
/** Pruebas por mes en el plan Radar (QUOTA_EXCEEDED al pasarse). */
export const TRYON_CUOTA_MES = 10

export const TEXTO_FOTO = {
  formato: 'Usa una foto JPG o PNG.',
  peso: (mb: string) => `La foto pesa ${mb} MB. Máximo ${TRYON_MAX_MB} MB.`,
  pesoServidor: `La foto pesa más de ${TRYON_MAX_MB} MB. Máximo ${TRYON_MAX_MB} MB.`,
  dimensionesTitulo: 'Usa una foto vertical de cuerpo entero',
  dimensiones: `Mínimo ${TRYON_MIN.width} × ${TRYON_MIN.height} px, de frente, con buena luz y fondo despejado.`,
  vacia: 'El archivo está vacío. Elige otra foto.',
  ilegible: 'No pudimos abrir esa imagen. Prueba con otra foto.',
}

const mb = (bytes: number) => (bytes / 1024 / 1024).toLocaleString('es-CO', { maximumFractionDigits: 1 })

/** Tipo y peso, apenas se elige el archivo. Devuelve el texto del error o ''. */
export function validarArchivoPrueba(file: File): string {
  if (!(TRYON_TYPES as readonly string[]).includes(file.type)) return TEXTO_FOTO.formato
  if (file.size === 0) return TEXTO_FOTO.vacia
  if (file.size > TRYON_MAX_MB * 1024 * 1024) return TEXTO_FOTO.peso(mb(file.size))
  return ''
}

/** Tamaño en píxeles y orientación, una vez se puede leer la imagen. */
export function validarDimensionesPrueba(width: number, height: number): boolean {
  return width >= TRYON_MIN.width && height >= TRYON_MIN.height && height > width
}

/** Qué se le ofrece a la persona para resolver el problema. */
export type AccionPrueba = 'consentimiento' | 'planes' | 'reintentar' | 'otra-foto' | 'otra-prenda' | 'volver' | 'iniciar-sesion'

export interface ProblemaPrueba {
  titulo: string
  texto: string
  accion: AccionPrueba
}

/** Error al subir la foto: texto fijo por código, nunca el del servidor. */
export function problemaFoto(e: unknown): ProblemaPrueba {
  const status = e instanceof ApiError ? e.status : 0
  const code = e instanceof ApiError ? e.code : undefined
  if (code === 'CONSENT_REQUIRED') return CONSENTIMIENTO
  if (status === 413 || code === 'PAYLOAD_TOO_LARGE') return { titulo: 'Tu foto es muy pesada', texto: TEXTO_FOTO.pesoServidor, accion: 'otra-foto' }
  if (status === 422 || code === 'INVALID_PHOTO_DIMENSIONS') return { titulo: TEXTO_FOTO.dimensionesTitulo, texto: TEXTO_FOTO.dimensiones, accion: 'otra-foto' }
  if (status === 400) return { titulo: 'Ese formato no sirve', texto: TEXTO_FOTO.formato, accion: 'otra-foto' }
  return general(e)
}

/** Error al crear o consultar la prueba. */
export function problemaPrueba(e: unknown): ProblemaPrueba {
  const status = e instanceof ApiError ? e.status : 0
  const code = e instanceof ApiError ? e.code : undefined
  if (code === 'CONSENT_REQUIRED') return CONSENTIMIENTO
  if (code === 'QUOTA_EXCEEDED' || status === 429) {
    return { titulo: `Usaste las ${TRYON_CUOTA_MES} pruebas de este mes`, texto: 'Con Radar+ tienes más.', accion: 'planes' }
  }
  if (code === 'AI_TIMEOUT' || status === 504) {
    return { titulo: 'El probador tardó demasiado en responder', texto: 'Inténtalo de nuevo.', accion: 'reintentar' }
  }
  // 403 y 404 se ven igual: no se revela si la prueba existe ni de quién es
  if (code === 'JOB_NOT_FOUND' || status === 404 || status === 403) {
    return { titulo: 'No encontramos esa prueba', texto: 'Puede que ya la hayas borrado.', accion: 'volver' }
  }
  if (code === 'INVALID_GARMENT' || status === 400 || status === 422) {
    return { titulo: 'Esta prenda no se puede probar', texto: 'Elige otra del catálogo.', accion: 'otra-prenda' }
  }
  return general(e)
}

/**
 * Prueba que terminó en FAILED. El motivo del proveedor de IA no se muestra tal cual:
 * si fue la silueta o la ropa, se pide otra foto; si no, se ofrece reintentar.
 */
export function problemaResultado(motivo?: string): ProblemaPrueba {
  if (motivo && /silue|silhou|body|cuerpo|pose|ropa|garment/i.test(motivo)) {
    return { titulo: 'No reconocimos tu silueta', texto: 'Prueba con otra foto: de frente, cuerpo entero y fondo despejado.', accion: 'otra-foto' }
  }
  return { titulo: 'No pudimos generar tu prueba', texto: 'Puedes intentarlo otra vez; no se cobrará ni se duplicará nada.', accion: 'reintentar' }
}

const CONSENTIMIENTO: ProblemaPrueba = {
  titulo: 'Antes de probar, acepta el uso de tu foto',
  texto: 'Lo pide la Ley 1581 de protección de datos. Tu foto solo se usa para el probador.',
  accion: 'consentimiento',
}

function general(e: unknown): ProblemaPrueba {
  const kind = errorKind(e)
  if (kind === 'sesion') return { titulo: 'Tu sesión venció', texto: 'Vuelve a iniciar sesión para seguir probando.', accion: 'iniciar-sesion' }
  if (kind === 'sin-conexion') return { titulo: 'Se perdió la conexión', texto: 'Revisa tu internet e inténtalo de nuevo.', accion: 'reintentar' }
  return { titulo: 'El probador no está disponible', texto: 'Intenta en unos minutos.', accion: 'reintentar' }
}
