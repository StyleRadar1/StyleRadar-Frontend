/** KPI con valor, variación porcentual y dirección. */
export interface KpiDto {
  valor: number
  variacionPct: number
  direccion: 'up' | 'down' | 'neutral'
  periodoAnterior?: number
}

/** RF-77.1 y RF-77.3: series diarias de tienda. */
export interface VisitasPorDiaDto {
  fecha: string
  visitas: number
}

export interface MensajesPorDiaDto {
  fecha: string
  mensajes: number
}

/** Periodos válidos para estadísticas de tienda (RF-76, RF-77). */
export type StatsPeriod = '7_DIAS' | '30_DIAS' | '90_DIAS'

/** Resumen de tienda (RF-76 a 81). */
export interface StoreStatsDto {
  periodo: StatsPeriod
  kpis: {
    visitas: KpiDto
    mensajes: KpiDto
  }
  visitasPorDia?: VisitasPorDiaDto[]
  mensajesPorDia?: MensajesPorDiaDto[]
  visitantesAhora?: number
  metaSemanal?: {
    visitasAcumuladas: number
    meta: number | null
    porcentajeAvance: number | null
  }
}

/** RF-81: estado individual de inventario con cantidad y porcentaje a 2 decimales. */
export interface StoreInventoryStatusItemDto {
  cantidad: number
  porcentaje: number
}

/** Inventario por estado de tienda (RF-81). */
export interface StoreInventoryDto {
  disponibles: number
  ultimasUnidades: number
  agotadas: number
  total: number
  prendasDisponibles?: StoreInventoryStatusItemDto
  prendasUltimasUnidades?: StoreInventoryStatusItemDto
  prendasAgotadas?: StoreInventoryStatusItemDto
}

/** RF-83: elemento mensual de solicitudes ("AAAA-MM"). */
export interface SolicitudMesItemDto {
  mes: string
  cantidad: number
}

/** RF-85.1: prendasPorTipo con cantidad y porcentaje a 2 decimales. */
export interface PrendaPorTipoDto {
  tipo: string
  cantidad?: number
  pct: number
  porcentaje?: number
}

/** RF-85.2: solicitudesPorEstado con cantidad y porcentaje a 2 decimales. */
export interface SolicitudPorEstadoDto {
  estado: string
  cantidad: number
  porcentaje?: number
}

/** Resumen de fundación (RF-82 a 85). */
export interface FoundationStatsDto {
  totalPrendasRecibidas: number
  donaciones: {
    total: number
    deTiendas: number
    dePersonas: number
  }
  /** RF-83: series de 6 meses del más antiguo al más reciente. */
  solicitudesPersonas?: SolicitudMesItemDto[]
  solicitudesTiendas?: SolicitudMesItemDto[]
  /** Meta de prendas del mes en curso (puede ser null si no está definida, RF-84). */
  meta?: { etiqueta: string; recibidas: number; objetivo: number } | null
  /** Tipo de ropa que llega, en porcentaje del total recibido (RF-85.1). */
  porTipo: PrendaPorTipoDto[]
  prendasPorTipo?: { tipo: string; cantidad: number; porcentaje: number }[]
  /** Solicitudes en curso por estado (RF-85.2). */
  porEstado: SolicitudPorEstadoDto[]
  solicitudesPorEstado?: { estado: string; cantidad: number; porcentaje: number }[]
}

/** Solicitudes mensuales de fundación. */
export interface FoundationMonthDto {
  mes: string
  etiqueta: string
  personas: number
  tiendas: number
  total: number
}

/** RF-87: grupo de publicaciones pendientes de moderación. */
export interface PendientePorGrupoDto {
  tipoPublicador: 'TIENDA' | 'USUARIO'
  publicadorId: string
  cantidad: number
}

export type DecisionModeracion = 'APROBAR' | 'RECHAZAR'
export type ResultadoModeracion = 'APROBADA' | 'RECHAZADA'

/** Indicadores admin (RF-86 a 91). */
export interface AdminIndicatorsDto {
  usuariosActivos: number
  variacionUsuarios: { pct: number; direccion: 'up' | 'down' | 'neutral'; vsMesAnterior?: string }
  tiendas: { verificadas: number; pendientes: number; total: number }
  fundacionesActivas: number
  ingresosMes: number
  variacionIngresos: { pct: number; direccion: 'up' | 'down' | 'neutral' }
  prendasPublicadas: number
  playlistsCreadas: number
  donacionesMes: number
  pendientesPorGrupo?: PendientePorGrupoDto[]
}

/** Ingresos admin por suscripciones (RF-89.1 y RF-89.2: solo pagos aprobados). */
export interface AdminIncomeDto {
  mesActual: {
    mes: string
    ingresosNetos: number
    meta: number | null
    porcentajeAvance: number
  }
  historico: { mes: string; usuarios: number; tiendas: number; total: number }[]
}

/** Cuentas por plan (RF-91). */
export interface AdminAccountsByPlanDto {
  compradores: { radar: number; radarPlus: number }
  almacenes: { basico: number; destacado: number }
  resumen: { plan: string; cuentas: number }[]
}

/** RF-88.1, 88.2 y 88.3: series del mes en curso con un elemento por día. */
export interface BusquedasPorDiaDto {
  fecha: string
  busquedas: number
}

export interface PublicacionesPorDiaDto {
  fecha: string
  publicaciones: number
}

export interface RegistrosPorDiaDto {
  fecha: string
  registros: number
}

/** Actividad diaria de la plataforma (RF-88): un registro por día del mes. */
export interface AdminDailyDto {
  mes: string
  dias: { etiqueta: string; fecha?: string; busquedas: number; registros: number; publicaciones: number }[]
  busquedasPorDia?: BusquedasPorDiaDto[]
  publicacionesPorDia?: PublicacionesPorDiaDto[]
  registrosPorDia?: RegistrosPorDiaDto[]
}

/** Sesiones abiertas en este momento (RF-90). */
export interface AdminLiveDto {
  sesionesAbiertas: number
  ultimaActualizacion: string
}
