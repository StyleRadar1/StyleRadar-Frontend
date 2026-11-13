/**
 * Mensajes seguros y errores por campo (plan de errores · «Antes de empezar»).
 *
 * La pantalla elige el texto según el tipo de error. Del servidor solo se toma el texto de los
 * errores de un campo; el resto del cuerpo de la respuesta (IDs, NIT, nombres de servicios,
 * si una cuenta existe) nunca llega a la pantalla.
 */

/** Tipo de error según el código HTTP, para que cada pantalla decida qué ofrecer. */
export type ErrorKind = 'sin-conexion' | 'sesion' | 'permiso' | 'no-existe' | 'conflicto' | 'limite' | 'datos' | 'servidor'

export function kindFromStatus(status: number): ErrorKind {
  if (status === 0) return 'sin-conexion'
  if (status === 401) return 'sesion'
  if (status === 403) return 'permiso'
  if (status === 404 || status === 410) return 'no-existe'
  if (status === 409) return 'conflicto'
  if (status === 429) return 'limite'
  if (status >= 400 && status < 500) return 'datos'
  return 'servidor'
}

export const MENSAJES: Record<ErrorKind, string> = {
  'sin-conexion': 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.',
  sesion: 'Tu sesión venció, vuelve a iniciar sesión.',
  permiso: 'No tienes permiso para hacer esto.',
  'no-existe': 'Lo que buscas ya no existe o fue retirado.',
  conflicto: 'El estado cambió mientras lo veías. Actualiza e intenta de nuevo.',
  limite: 'Hiciste demasiados intentos. Espera un momento e intenta de nuevo.',
  datos: 'Revisa los datos e intenta de nuevo.',
  servidor: 'El servicio no está disponible en este momento. Intenta en unos minutos.',
}

/** 403 y 404 sobre datos de otra persona: el mismo texto, para no revelar qué existe. */
export const NO_EXISTE_O_SIN_ACCESO = 'No existe o no tienes acceso.'

/** Errores por campo ya unificados: { campo: mensaje }. */
export type CamposConError = Record<string, string>

/** Nombres que usan los microservicios para los errores por campo. */
const LLAVES_CAMPOS = ['validationErrors', 'errors', 'errores', 'invalidFields', 'invalidParams', 'fieldErrors'] as const

const texto = (x: unknown): string => {
  if (typeof x === 'string') return x.trim()
  if (Array.isArray(x)) return x.length ? texto(x[0]) : ''
  return ''
}

/** «body.email» o ['body', 'email'] → «email». */
const nombreCampo = (x: unknown): string => {
  const crudo = Array.isArray(x) ? x.map(String).join('.') : typeof x === 'string' ? x : ''
  return crudo.split('.').pop()?.trim() ?? ''
}

/**
 * Une los formatos de errores por campo de los servicios en uno solo.
 * Acepta objetos ({ email: 'msg' } o { email: ['msg'] }) y listas
 * ([{ field | campo | name | param | property | path, message | mensaje | msg | reason | defaultMessage }]).
 * Si un campo llega repetido se queda el primer mensaje.
 */
export function camposDelError(data: unknown): CamposConError {
  if (!data || typeof data !== 'object') return {}
  const out: CamposConError = {}
  const poner = (campo: string, msg: string) => { if (campo && msg && !(campo in out)) out[campo] = msg }
  for (const llave of LLAVES_CAMPOS) {
    const valor = (data as Record<string, unknown>)[llave]
    if (Array.isArray(valor)) {
      for (const item of valor) {
        if (!item || typeof item !== 'object') continue
        const o = item as Record<string, unknown>
        poner(nombreCampo(o.field ?? o.campo ?? o.name ?? o.param ?? o.property ?? o.path),
          texto(o.message ?? o.mensaje ?? o.msg ?? o.reason ?? o.defaultMessage))
      }
    } else if (valor && typeof valor === 'object') {
      for (const [campo, msg] of Object.entries(valor)) poner(nombreCampo(campo), texto(msg))
    }
  }
  return out
}
