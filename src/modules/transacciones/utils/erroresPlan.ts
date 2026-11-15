import { errorKind, errorMessage } from '@/modules/core/api/errors'
import type { Tono } from '@/modules/core/components/errores'

/** Textos de error de Planes y pago (plan de errores · Cristian). Nunca muestran datos del pago. */
export const TEXTOS_PLAN = {
  /** 400 · datos inválidos al iniciar o cambiar el plan. */
  datos: { titulo: 'No pudimos procesar tu plan', texto: 'Revisa los datos e inténtalo de nuevo.' },
  /** 409 · la suscripción no permite esa acción ahora. */
  conflicto: { titulo: 'Tu plan cambió mientras lo veías', texto: 'Ya actualizamos el estado. Revísalo antes de seguir.' },
  /** 404 · no hay suscripción u orden. */
  sinSuscripcion: { titulo: 'No tienes una suscripción activa', texto: 'Mira los planes y elige el que te sirva.' },
  /** Mercado Pago no aprobó el pago. */
  rechazado: { titulo: 'Pago rechazado', texto: 'Mercado Pago no aprobó el pago. No se hizo ningún cobro.' },
} as const

export type AvisoPlan = { tono: Tono; titulo: string; texto?: string; refrescar: boolean }

/** Error al iniciar o cambiar el plan → aviso del plan. En el 409 hay que refrescar el estado del plan. */
export function avisoDePlan(e: unknown, fallback: string): AvisoPlan {
  switch (errorKind(e)) {
    case 'datos': return { tono: 'aviso', ...TEXTOS_PLAN.datos, refrescar: false }
    case 'conflicto': return { tono: 'info', ...TEXTOS_PLAN.conflicto, refrescar: true }
    default: return { tono: 'error', titulo: errorMessage(e, fallback), refrescar: false }
  }
}
