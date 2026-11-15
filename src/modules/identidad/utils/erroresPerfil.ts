import type { CamposConError } from '@/modules/core/api/errors'

export type CampoPerfil = 'nombre' | 'celular' | 'barrio' | 'superior' | 'inferior' | 'calzado' | 'estilos'
export type Errores = Partial<Record<CampoPerfil, string>>

/** Orden de los campos en pantalla: el cursor va al primero que tenga error. */
export const ORDEN: CampoPerfil[] = ['nombre', 'celular', 'barrio', 'superior', 'inferior', 'calzado', 'estilos']

/** Nombres que puede usar el servidor para cada campo → los del formulario. */
const CAMPOS_SERVIDOR: Record<string, CampoPerfil> = {
  nombre: 'nombre', name: 'nombre', fullName: 'nombre',
  celular: 'celular', telefono: 'celular', phone: 'celular',
  barrio: 'barrio', neighborhood: 'barrio',
  superior: 'superior', tallaSuperior: 'superior',
  inferior: 'inferior', tallaInferior: 'inferior',
  calzado: 'calzado', tallaCalzado: 'calzado',
  estilos: 'estilos', styles: 'estilos',
}

/** Mensajes del 400 al guardar (plan de errores · Cristian). */
export const TEXTOS_PERFIL = {
  campos: 'Revisa los datos marcados. Tus cambios siguen aquí.',
  general: 'Revisa los datos e intenta de nuevo. Tus cambios siguen aquí.',
} as const

export function erroresDelServidor(campos: CamposConError): Errores {
  const out: Errores = {}
  for (const [k, v] of Object.entries(campos)) { const c = CAMPOS_SERVIDOR[k]; if (c && !out[c]) out[c] = v }
  return out
}

