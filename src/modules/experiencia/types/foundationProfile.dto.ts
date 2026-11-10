/**
 * Página pública de la fundación («Mi fundación»): lo que ven las personas que quieren donar.
 * GET /api/donations/foundations/me (ms-segunda-vida-donaciones, 8093). Provisional hasta el Swagger.
 */
export interface NecesidadDto {
  nombre: string
  /** Avance hacia la meta del mes, de 0 a 100. */
  avance: number
}

export interface FoundationProfileDto {
  id: string
  nombre: string
  barrio: string
  activa: boolean
  descripcion: string
  aQuienAyudamos: string
  queHacemos: string[]
  queRecibimos: string[]
  necesidades: NecesidadDto[]
  contacto: { direccion: string; horario: string; telefono: string; correo: string; web?: string }
  fotos: { portada: string; trabajo: string; donaciones: string }
}
