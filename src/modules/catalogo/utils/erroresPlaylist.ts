import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind, errorMessage, fieldErrors } from '@/modules/core/api/errors'
import { MAX_PLAYLIST_ITEMS } from '../types/playlist.dto'

/** Textos de error de Playlists (plan de errores · Cristian). */
export const TEXTOS_PLAYLIST = {
  /** 400 · nombre vacío. */
  nombre: 'Ponle un nombre a tu playlist.',
  /** 422 · nombre muy largo. */
  nombreLargo: 'El nombre puede tener hasta 40 caracteres.',
  /** 422 · más de 15 prendas. */
  limite: `La playlist ya tiene ${MAX_PLAYLIST_ITEMS} prendas. Quita una para agregar esta.`,
  /** 422 · prenda repetida. */
  repetida: 'Esa prenda ya está en la playlist.',
  /** 403 y 404 · el mismo texto, para no revelar si existe. */
  noDisponible: 'Esta playlist no existe o no está disponible.',
} as const

export const MAX_NOMBRE_PLAYLIST = 40

const CAMPOS_NOMBRE = ['nombre', 'name', 'titulo', 'title']

/** Error al crear la playlist → mensaje debajo del nombre (400 y 422) o mensaje general. */
export function errorDeCrear(e: unknown): { campo?: string; general?: string } {
  const kind = errorKind(e)
  if (kind === 'datos') {
    const campos = fieldErrors(e)
    const delNombre = CAMPOS_NOMBRE.map((k) => campos[k]).find(Boolean)
    // 422 es «datos» igual que 400; sin detalle del servidor se usa el texto del plan.
    if (delNombre) return { campo: delNombre }
    return { campo: e instanceof ApiError && e.status === 422 ? TEXTOS_PLAYLIST.nombreLargo : TEXTOS_PLAYLIST.nombre }
  }
  return { general: errorMessage(e, 'No se pudo crear la playlist.') }
}

/**
 * Error al agregar una prenda → mensaje junto a la acción.
 * 422: si la prenda ya estaba es «repetida»; si no, es el límite de 15 prendas.
 */
export function errorDeAgregar(e: unknown, yaEstaba: boolean): { texto: string; limite: boolean } {
  if (e instanceof ApiError && e.status === 422) {
    return yaEstaba ? { texto: TEXTOS_PLAYLIST.repetida, limite: false } : { texto: TEXTOS_PLAYLIST.limite, limite: true }
  }
  return { texto: errorMessage(e, 'No se pudo agregar la prenda.'), limite: false }
}
