import type { PqrsRequest, PqrsResponse } from '../types/legal.types'
import { consentService } from './consentService'

const PQRS_STORAGE_KEY = 'sr_pqrs_radicados_mock'

export const pqrsService = {
  /**
   * Radica una nueva Petición, Queja, Reclamo, Sugerencia o Retracto.
   * Genera número de radicado legal consecutivo y determina el tiempo de respuesta legal:
   * - Peticiones y Consultas: 10 días hábiles (Ley 1755 de 2015 / Ley 1581 de 2012).
   * - Quejas, Reclamos y Garantías: 15 días hábiles (Ley 1480 de 2011 / Ley 1755 de 2015).
   * - Solicitudes de Retracto: 5 días hábiles para confirmación de recepción (Ley 1480 de 2011).
   * - Sugerencias: 10 días hábiles.
   */
  async submitPqrs(data: PqrsRequest): Promise<PqrsResponse> {
    if (!data.autorizaTratamientoDatos) {
      throw new Error('Debes autorizar el tratamiento de datos personales para radicar la PQRS.')
    }

    if (!data.nombreCompleto.trim() || !data.email.trim() || !data.descripcion.trim()) {
      throw new Error('Todos los campos marcados como obligatorios deben ser diligenciados.')
    }

    // Registrar consentimiento de Habeas Data para la PQRS
    await consentService.recordFormConsent({
      email: data.email,
      aceptaTerminos: true,
      aceptaDatos: true,
      esMayorDeEdad: true,
      origen: `PQRS_${data.tipo}`,
    })

    const date = new Date()
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const randomHex = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0')

    const radicado = `SR-PQRS-${yyyy}${mm}${dd}-${randomHex}`

    let diasHabiles = 15
    if (data.tipo === 'PETICION' || data.tipo === 'SUGERENCIA') {
      diasHabiles = 10
    } else if (data.tipo === 'RETRACTO') {
      diasHabiles = 5
    }

    const response: PqrsResponse = {
      radicado,
      fechaRadicacion: date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      tiempoRespuestaDiasHabiles: diasHabiles,
      estado: 'RECIBIDO',
      mensaje: `Tu solicitud ha sido radicada formalmente bajo el código ${radicado}. Hemos enviado una copia al correo ${data.email}. De conformidad con la ley colombiana, recibirás respuesta de fondo en máximo ${diasHabiles} días hábiles.`,
    }

    try {
      const existing = localStorage.getItem(PQRS_STORAGE_KEY)
      const list = existing ? JSON.parse(existing) : []
      list.push({ ...data, ...response })
      localStorage.setItem(PQRS_STORAGE_KEY, JSON.stringify(list.slice(-20)))
    } catch {
      // Ignorar errores de almacenamiento local
    }

    return response
  },

  /** Obtiene radicados simulados guardados por el usuario */
  getSavedRadicados(): (PqrsRequest & PqrsResponse)[] {
    try {
      const raw = localStorage.getItem(PQRS_STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },
}
