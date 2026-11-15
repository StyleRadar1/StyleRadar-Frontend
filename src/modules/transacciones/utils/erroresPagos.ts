import { errorKind, errorMessage, fieldErrors } from '@/modules/core/api/errors'

/** Textos de error de Admin · Pagos (plan de errores · Cristian). */
export const TEXTOS_PAGOS = {
  /** 400 · reembolso sin motivo. */
  motivo: 'Escribe el motivo para poder reembolsar.',
  /** 403 · no es administrador. */
  sinPermiso: { titulo: 'No tienes permiso para hacer esto', texto: 'Si crees que es un error, escribe a soporte.' },
} as const

/** Nombres que puede usar el servidor para el campo del motivo. */
const CAMPOS_MOTIVO = ['reason', 'motivo', 'refundReason']

export type ErrorReembolso =
  | { tipo: 'motivo'; texto: string }
  | { tipo: 'permiso' }
  | { tipo: 'otro'; texto: string }

/** Error al reembolsar → qué mostrar: debajo del motivo (400), aviso de permiso (403) u otro mensaje. */
export function errorDeReembolso(e: unknown): ErrorReembolso {
  const kind = errorKind(e)
  if (kind === 'permiso') return { tipo: 'permiso' }
  if (kind === 'datos') {
    const campos = fieldErrors(e)
    const delMotivo = CAMPOS_MOTIVO.map((k) => campos[k]).find(Boolean)
    return { tipo: 'motivo', texto: delMotivo ?? TEXTOS_PAGOS.motivo }
  }
  return { tipo: 'otro', texto: errorMessage(e, 'No se pudo hacer el reembolso. Intenta de nuevo.') }
}
