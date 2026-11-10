/**
 * DTOs del módulo de administración (tiendas, fundaciones y playlists destacadas), con los mismos datos
 * del «Módulo de administración» del prototipo. Rutas provisionales del API Gateway hasta tener el Swagger.
 */

export type Verificacion = 'Verificada' | 'Pendiente' | 'Rechazada'
export type EstadoSuscripcion = 'Activa' | 'Periodo gratuito' | 'Cancelada' | 'Vencida' | 'Sin suscripción'

export interface AdminStoreDto {
  id: string
  nombre: string
  categoria: string
  barrio: string
  direccion: string
  telefono: string
  correo: string
  /** «—» cuando la tienda aún no lo envía. */
  nit: string
  representante: string
  aliadaDesde: string
  verificacion: Verificacion
  motivoRechazo?: string
  suscripcion: { estado: EstadoSuscripcion; proximo: string; inicio: string }
  /** Documentos de verificación recibidos. */
  documentos: { nombre: string; recibido: boolean }[]
  catalogo: { publicadas: number; revision: number; agotadas: number; retiradas: number }
}

export type EstadoFundacion = 'Activa' | 'Inactiva'

export interface AdminFoundationDto {
  id: string
  nombre: string
  nit: string
  correo: string
  telefono: string
  barrio: string
  direccion: string
  representante: string
  estado: EstadoFundacion
  aliadaDesde: string
  donaciones: { pendientes: number; enProceso: number; recibidas: number; rechazadas: number }
}

/** Datos editables al registrar o actualizar una fundación. */
export type FoundationFormDto = Pick<AdminFoundationDto, 'nombre' | 'nit' | 'correo' | 'telefono' | 'barrio' | 'direccion' | 'representante'>
export const FUNDACION_VACIA: FoundationFormDto = { nombre: '', nit: '', correo: '', telefono: '', barrio: '', direccion: '', representante: '' }

export interface AdminPlaylistDto {
  id: string
  nombre: string
  creador: string
  meGusta: number
  guardados: number
  prendas: number
  destacada: boolean
}

/** Máximo de playlists destacadas en el inicio. */
export const MAX_DESTACADAS = 3
/** Interacción para ordenar las playlists: me gusta + guardados × 2. */
export const interaccion = (p: Pick<AdminPlaylistDto, 'meGusta' | 'guardados'>) => p.meGusta + p.guardados * 2
/** Precio mensual del plan de tienda aliada (el mismo de Planes). */
export const PRECIO_TIENDA = 89_000
