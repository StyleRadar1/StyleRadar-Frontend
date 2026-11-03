/**
 * Reglas de la foto del probador (RF-23). Son las del prototipo y deben confirmarse con
 * ms-probador-virtual: si el backend cambia formatos o límites, se ajustan solo aquí.
 */
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const PHOTO_ACCEPT = PHOTO_TYPES.join(',')
export const PHOTO_MAX_MB = 8
export const PHOTO_MIN_SIDE = 400

const ext = (name: string) => (name.split('.').pop() ?? '').toUpperCase()

/** Validación inmediata (tipo y peso). Devuelve el mensaje de error o '' si es válida. */
export function validatePhotoFile(file: File): string {
  if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return `El formato ${ext(file.name) || 'del archivo'} no sirve para el probador. Usa una foto JPG, PNG o WEBP.`
  }
  if (file.size > PHOTO_MAX_MB * 1024 * 1024) return `La foto pesa más de ${PHOTO_MAX_MB} MB. Súbela en menor calidad o recórtala.`
  if (file.size === 0) return 'El archivo está vacío. Elige otra foto.'
  return ''
}

/** Validación de tamaño en píxeles, una vez se puede leer la imagen. */
export function validateDimensions(width: number, height: number): string {
  if (Math.min(width, height) < PHOTO_MIN_SIDE) return `La foto es muy pequeña. Usa una de al menos ${PHOTO_MIN_SIDE} píxeles por lado.`
  return ''
}

export function readDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('No pudimos abrir esa imagen.'))
    img.src = url
  })
}
