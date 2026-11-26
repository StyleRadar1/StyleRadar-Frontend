import type { ItemResponseDto } from '../types/item.dto'

const INELIGIBLE_TYPES_PATTERN =
  /^(Calzado|Tenis|Zapatos|Botas|Accesorio|Cintur[oó]n|Bufanda|Bolso|Gorra|Gafas|Chaqueta|Abrigo|Gabardina)$/i

export function isGarmentTryOnEligible(
  item: Pick<ItemResponseDto, 'noDisponibleEnProbador' | 'tryOnEligible' | 'tipo' | 'retirada' | 'disponible'>,
): boolean {
  if (item.noDisponibleEnProbador === true) return false
  if (item.tryOnEligible === false) return false
  if (item.retirada === true) return false
  if (item.disponible === false) return false
  if (typeof item.tipo === 'string' && INELIGIBLE_TYPES_PATTERN.test(item.tipo.trim())) {
    return false
  }
  return true
}
