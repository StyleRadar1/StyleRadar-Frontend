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

/**
 * Mensajes por código de negocio (`ProblemDetail.code`) definidos en el análisis de requerimientos (19/11/2026).
 * El backend envía `code` en MAYÚSCULAS_CON_GUION_BAJO; el front elige el mensaje seguro según este valor.
 */
export const MENSAJES_POR_CODIGO: Record<string, string> = {
  PARAMETRO_INVALIDO: 'Falta un dato o tiene un formato inválido.',
  DATOS_INVALIDOS: 'La solicitud tiene campos inválidos. Revisa los datos marcados.',
  RANGO_PRECIO_INVALIDO: 'El precio mínimo no puede ser mayor que el precio máximo.',
  UBICACION_REQUERIDA: 'Para ordenar por distancia se debe indicar la ubicación (lat y lng).',
  PRENDA_NO_ENCONTRADA: 'La prenda que buscas ya no existe o no está disponible.',
  ALMACEN_NO_ENCONTRADO: 'El almacén consultado no existe o ya no está disponible.',
  COORDENADA_FUERA_DE_RANGO: 'La coordenada está fuera de rango (latitud entre -90 y 90, longitud entre -180 y 180).',
  RADIO_INVALIDO: 'La distancia del radio de búsqueda no puede ser negativa ni salir del rango permitido.',
  INVENTARIO_NO_ENCONTRADO: 'Esta prenda todavía no tiene tallas disponibles.',
  ALMACEN_SUSPENDIDO: 'El almacén está suspendido y no puede publicar prendas.',
  FOTOGRAFIAS_EXCEDIDAS: 'La prenda puede tener máximo 5 fotografías.',
  TALLA_INVALIDA: 'La talla seleccionada no corresponde al tipo de prenda.',
  CANTIDAD_INVALIDA: 'La cantidad de unidades no puede ser negativa.',
  INVENTARIO_SUSPENDIDO: 'El inventario de la sede está suspendido por mora.',
  ACCESO_DENEGADO: 'No tienes permisos para modificar este recurso.',
  PRENDA_RETIRADA: 'No se puede editar una prenda retirada.',
  TALLA_NO_REGISTRADA: 'La talla indicada no está registrada para esta prenda en la sede.',
  PRENDA_YA_RETIRADA: 'La prenda ya está retirada.',
  PRENDA_NO_PENDIENTE: 'Solo se pueden moderar prendas pendientes.',
  MOTIVO_REQUERIDO: 'El rechazo debe tener un motivo.',
  PLAYLIST_SIN_PRENDAS: 'La playlist debe tener al menos una prenda.',
  USUARIO_NO_AUTENTICADO: 'Inicia sesión para continuar con esta acción.',
  PLAYLIST_NO_ENCONTRADA: 'Esta playlist no existe o no está disponible.',
  DESCRIPCION_MUY_LARGA: 'La descripción no puede superar los 300 caracteres.',
  LIMITE_PRENDAS_PLAYLIST: 'La playlist no admite más de 15 prendas.',
  PRENDA_YA_EN_PLAYLIST: 'La prenda ya se encuentra asociada a esta playlist.',
  PRENDA_NO_ESTA_EN_PLAYLIST: 'La prenda no pertenece a la playlist.',
  PLAYLIST_PRIVADA: 'No tienes permisos para consultar esta playlist privada.',
  LIMITE_DESTACADAS: 'Límite máximo de 3 playlists destacadas alcanzado.',
  ERROR_INTERNO: 'Ocurrió un error inesperado. Intenta de nuevo en unos minutos.',

  // Códigos en inglés acordados con ms-auth, ms-usuarios y ms-tiendas (hoja Contrato · F-25 y F-29).
  // Los de la cuenta nunca dicen si el correo existe ni si la cuenta está bloqueada.
  INVALID_DATA: 'Revisa los datos marcados.',
  INVALID_CREDENTIALS: 'El correo o la contraseña son incorrectos.',
  ACCOUNT_NOT_ACTIVE: 'No pudimos iniciar sesión. Si sigue pasando, escribe a soporte.',
  ACCESS_DENIED: 'No tienes permiso para hacer esto.',
  UNAUTHENTICATED: 'Tu sesión venció, vuelve a iniciar sesión.',
  INVALID_TOKEN: 'Tu sesión venció, vuelve a iniciar sesión.',
  RATE_LIMIT_EXCEEDED: 'Hiciste demasiados intentos. Espera un momento para volver a intentarlo.',
  SERVICE_UNAVAILABLE: 'El servicio no está disponible en este momento. Intenta en unos minutos.',
  INTERNAL_ERROR: 'Ocurrió un error inesperado. Intenta de nuevo en unos minutos.',
  OTP_INCORRECT: 'El código no es correcto. Revísalo e intenta de nuevo.',
  OTP_EXPIRED: 'El código venció. Pide uno nuevo.',
  OTP_ATTEMPTS_EXHAUSTED: 'Fallaste el código 3 veces. Espera un momento y pide otro.',
  OTP_RESEND_BLOCKED: 'Espera un momento para pedir un código nuevo.',
  OTP_SESSION_NOT_FOUND: 'Tu verificación venció. Inicia sesión de nuevo para recibir otro código.',
  RESENDS_EXHAUSTED: 'Ya pediste el código muchas veces. Inicia sesión de nuevo para recibir otro.',
  FILE_TOO_LARGE: 'El archivo es muy grande. Elige uno más liviano.',
  BUSINESS_RULE_VIOLATION: 'No se pudo completar la acción. Revisa los datos e intenta de nuevo.',
  // Códigos RFC 7807 de PT8080-VirtualTryOn-Service
  INVALID_PHOTO: 'La fotografía no cumple los requisitos (JPG o PNG, máx. 5 MB, vertical de cuerpo completo).',
  PAYLOAD_TOO_LARGE: 'La foto pesa más de 5 MB. Máximo 5 MB.',
  AI_PROVIDER_TIMEOUT: 'El probador tardó demasiado en responder. Inténtalo de nuevo.',
  AI_INFERENCE_PERMANENT_ERROR: 'No pudimos procesar esa combinación de foto y prenda. Prueba con otra.',
  GARMENT_NOT_ELIGIBLE: 'Esta prenda no está disponible o no admite prueba virtual.',
  TRYON_SELECTION_INCOMPLETE: 'Selecciona una talla disponible antes de continuar.',
  TRYON_SIZE_UNAVAILABLE: 'La talla seleccionada no está disponible para esta prenda.',
  BIOMETRIC_PHOTO_NOT_FOUND: 'No encontramos una fotografía frontal activa. Sube tu foto para continuar.',
  CONSENT_REQUIRED: 'Antes de probar, acepta el uso de tu foto conforme a la Ley 1581.',
  QUOTA_EXCEEDED: 'Agotaste las pruebas disponibles en tu plan este mes.',
  MISSING_REQUEST_PART: 'Falta adjuntar el archivo de la fotografía.',
  JOB_NOT_FOUND: 'No encontramos esa prueba.',
}

/** Devuelve el mensaje amigable asociado a un `code` del backend, si existe en el catálogo. */
export function mensajePorCodigo(code?: string): string | undefined {
  if (!code) return undefined
  return MENSAJES_POR_CODIGO[code.trim().toUpperCase()]
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
