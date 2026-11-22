import type { ItemResponseDto } from '@/modules/catalogo/types/item.dto'
import type { FitEvaluation, LookSlot, LookState, TryOnPlaylistResult, UserMeasurements, WornItem } from '../types/look.dto'

export const DEFAULT_USER_MEASUREMENTS: UserMeasurements = {
  superior: 'M',
  inferior: '30',
  calzado: '38',
}

const STORAGE_LOOK_KEY = 'sr_active_look'
const STORAGE_MEASUREMENTS_KEY = 'sr_user_measurements'

const SIZES_LETTER = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const SIZES_PANTS = ['26', '28', '30', '32', '34', '36']
const SIZES_SHOES = ['36', '37', '38', '39', '40', '41', '42', '43']

/**
 * Determina el espacio anatómico de una prenda del catálogo.
 * Regla: 1 prenda por espacio (superior, inferior, abrigo, calzado, accesorios).
 */
export function getSlotForGarment(item: ItemResponseDto): LookSlot {
  const tipo = (item.tipo || '').toLowerCase()
  const nom = (item.nombre || '').toLowerCase()

  if (/calzado|zapato|tenis|bota|oxford|sneaker/i.test(tipo) || /calzado|zapato|tenis|bota|oxford/i.test(nom)) {
    return 'calzado'
  }
  if (/accesorio|gorra|bufanda|cintur|corbata|guante/i.test(tipo) || /gorra|bufanda|cintur|corbata|guante/i.test(nom)) {
    return 'accesorios'
  }
  if (/abrigo|chaqueta|saco|blazer|gabardina|bomber|poncho/i.test(tipo) || /abrigo|chaqueta|saco|blazer|gabardina|bomber|poncho/i.test(nom)) {
    return 'abrigo'
  }
  if (/pantal|jean|short|falda|denim/i.test(tipo) || /pantal|jean|short|falda|denim/i.test(nom)) {
    return 'inferior'
  }
  return 'superior'
}

/**
 * Mapea la prenda a su capa gráfica en el maniquí.
 */
export function getLayerForGarment(item: ItemResponseDto, slot: LookSlot): string {
  const nom = (item.nombre || '').toLowerCase()
  const tip = (item.tipo || '').toLowerCase()

  if (slot === 'superior') return 'camisa'
  if (slot === 'inferior') return 'pantalon'
  if (slot === 'abrigo') {
    if (/cuero/i.test(nom) || /cuero/i.test(tip)) return 'cuero'
    if (/abrigo|gabardina/i.test(nom) || /abrigo|gabardina/i.test(tip)) return 'abrigo'
    return 'saco'
  }
  if (slot === 'calzado') {
    if (/tenis/i.test(nom) || /tenis/i.test(tip)) return 'tenis'
    return 'zapatos'
  }
  if (slot === 'accesorios') {
    if (/cintur/i.test(nom) || /cintur/i.test(tip)) return 'cinturon'
    if (/corbata/i.test(nom) || /corbata/i.test(tip)) return 'corbata'
    if (/bufanda/i.test(nom) || /bufanda/i.test(tip)) return 'bufanda'
    if (/guante/i.test(nom) || /guante/i.test(tip)) return 'guantes'
    return 'bufanda'
  }
  return 'camisa'
}

/**
 * Verifica si la prenda tiene tabla de medidas disponible para el probador.
 * Las prendas sin tabla de medidas se marcan como "No disponible en el probador" y no se pueden seleccionar.
 */
export function isGarmentFittable(item: ItemResponseDto): boolean {
  if (item.sinTablaMedidas || item.noDisponibleEnProbador) return false
  if (item.retirada) return false
  if (!item.tallas || item.tallas.length === 0) return false
  return true
}

/**
 * Obtiene las medidas guardadas del usuario desde localStorage o perfil de sesión.
 */
export function getUserMeasurements(): UserMeasurements {
  try {
    const raw = localStorage.getItem(STORAGE_MEASUREMENTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fallback */
  }
  try {
    const user = JSON.parse(localStorage.getItem('sr_user') || 'null')
    if (user?.tallas) return user.tallas
  } catch {
    /* fallback */
  }
  return DEFAULT_USER_MEASUREMENTS
}

/**
 * Guarda las medidas del usuario.
 */
export function saveUserMeasurements(measurements: UserMeasurements): void {
  try {
    localStorage.setItem(STORAGE_MEASUREMENTS_KEY, JSON.stringify(measurements))
  } catch {
    /* ignore */
  }
}

/**
 * Obtiene la talla recomendada para el usuario en una prenda específica.
 */
export function getRecommendedSize(item: ItemResponseDto, measurements?: UserMeasurements): string {
  const m = measurements || getUserMeasurements()
  const slot = getSlotForGarment(item)
  const available = item.tallas || []
  if (available.length === 0) return ''

  let targetSize = m.superior
  if (slot === 'inferior') targetSize = m.inferior
  if (slot === 'calzado') targetSize = m.calzado
  if (slot === 'accesorios') targetSize = 'Única'

  // Si la talla objetivo está disponible directamente
  if (available.includes(targetSize)) {
    return targetSize
  }

  // Si la prenda solo tiene 'Única'
  if (available.includes('Única')) return 'Única'

  // Busca la talla disponible más cercana
  const scale = SIZES_LETTER.includes(available[0])
    ? SIZES_LETTER
    : SIZES_PANTS.includes(available[0])
      ? SIZES_PANTS
      : SIZES_SHOES

  const targetIdx = scale.indexOf(targetSize)
  if (targetIdx >= 0) {
    let closest = available[0]
    let minDiff = 999
    for (const s of available) {
      const idx = scale.indexOf(s)
      if (idx >= 0) {
        const diff = Math.abs(idx - targetIdx)
        if (diff < minDiff) {
          minDiff = diff
          closest = s
        }
      }
    }
    return closest
  }

  return available[0]
}

/**
 * Motor de ajuste: evalúa la compatibilidad de una prenda en la talla especificada.
 */
export function evaluateGarmentFit(
  item: ItemResponseDto,
  talla: string,
  measurements?: UserMeasurements,
): FitEvaluation {
  if (item.retirada) {
    return { apta: false, veredicto: 'Retirada', motivo: 'Ya no está disponible' }
  }
  if (item.sinTablaMedidas || item.noDisponibleEnProbador) {
    return { apta: false, veredicto: 'No disponible', motivo: 'Sin tabla de medidas disponible' }
  }

  const m = measurements || getUserMeasurements()
  const slot = getSlotForGarment(item)

  let userSize = m.superior
  let scale = SIZES_LETTER
  if (slot === 'inferior') {
    userSize = m.inferior
    scale = SIZES_PANTS
  } else if (slot === 'calzado') {
    userSize = m.calzado
    scale = SIZES_SHOES
  }

  if (talla === 'Única') {
    return { apta: true, veredicto: 'Ajuste estándar (Talla única)' }
  }

  const userIdx = scale.indexOf(userSize)
  const itemIdx = scale.indexOf(talla)

  // Si no están en la misma escala, asumimos ajuste regular si es válida
  if (userIdx === -1 || itemIdx === -1) {
    return { apta: true, veredicto: 'Ajuste regular' }
  }

  const diff = itemIdx - userIdx

  // Si la talla es 2 o más posiciones menor, es demasiado pequeña
  if (diff <= -2) {
    // Busca la talla recomendada o una más adecuada
    const recommended = getRecommendedSize(item, m)
    return {
      apta: false,
      veredicto: 'Demasiado pequeña',
      motivo: `La talla ${talla} es demasiado pequeña para tus medidas`,
      tallaSugerida: recommended !== talla ? recommended : (scale[userIdx] || scale[itemIdx + 1] || 'M'),
    }
  }

  if (diff === -1) {
    return { apta: true, veredicto: 'Ligeramente ajustado' }
  }
  if (diff === 0) {
    return { apta: true, veredicto: 'Ajuste perfecto' }
  }
  if (diff === 1) {
    return { apta: true, veredicto: 'Corte holgado' }
  }
  return { apta: true, veredicto: 'Corte oversize' }
}

/**
 * Evalúa un outfit completo de playlist para cargarlo en el probador.
 */
export function evaluatePlaylistOutfit(
  items: { item: ItemResponseDto; talla?: string; color?: string }[],
  measurements?: UserMeasurements,
): TryOnPlaylistResult {
  const m = measurements || getUserMeasurements()
  const puestas: WornItem[] = []
  const fallidas: TryOnPlaylistResult['fallidas'] = []

  for (const entry of items) {
    const item = entry.item
    if (!item || item.retirada) {
      fallidas.push({
        item: item || ({ id: 'unknown', nombre: 'Prenda retirada' } as ItemResponseDto),
        motivo: 'Ya no está disponible',
        esRetirada: true,
      })
      continue
    }

    const slot = getSlotForGarment(item)
    const talla = entry.talla || getRecommendedSize(item, m)
    const color = entry.color || item.color || 'default'

    const fit = evaluateGarmentFit(item, talla, m)
    if (!fit.apta) {
      fallidas.push({
        item,
        motivo: fit.motivo || 'No se puede probar con esta talla',
        tallaSugerida: fit.tallaSugerida || getRecommendedSize(item, m),
      })
    } else {
      const layer = getLayerForGarment(item, slot)
      puestas.push({
        item,
        slot,
        layer,
        talla,
        color,
        veredicto: fit.veredicto,
      })
    }
  }

  const total = items.length
  const exitosas = puestas.length
  let resumen = `${exitosas} de ${total} prendas se pudieron probar.`
  if (fallidas.length > 0) {
    const primeraFallida = fallidas[0]
    if (primeraFallida.tallaSugerida) {
      resumen += ` ${primeraFallida.item.nombre} no se puede probar; prueba la ${primeraFallida.tallaSugerida}.`
    } else if (primeraFallida.esRetirada) {
      resumen += ` ${primeraFallida.item.nombre} ya no está disponible.`
    }
  }

  return { puestas, fallidas, resumen }
}

/**
 * Almacenamiento y persistencia del look compartido entre páginas.
 */
export function loadLookFromStorage(): LookState {
  try {
    const raw = localStorage.getItem(STORAGE_LOOK_KEY) || sessionStorage.getItem(STORAGE_LOOK_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fallback */
  }
  return {}
}

export function saveLookToStorage(look: LookState): void {
  try {
    const json = JSON.stringify(look)
    localStorage.setItem(STORAGE_LOOK_KEY, json)
    sessionStorage.setItem(STORAGE_LOOK_KEY, json)
  } catch {
    /* fallback */
  }
}

export function clearLookFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_LOOK_KEY)
    sessionStorage.removeItem(STORAGE_LOOK_KEY)
  } catch {
    /* fallback */
  }
}
