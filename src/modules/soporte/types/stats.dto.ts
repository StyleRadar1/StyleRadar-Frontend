/** KPI con valor, variación porcentual y dirección. */
export interface KpiDto {
  valor: number
  variacionPct: number
  direccion: 'up' | 'down' | 'neutral'
  periodoAnterior?: number
}

/** Resumen de tienda (RF-76 a 81). */
export interface StoreStatsDto {
  periodo: string
  kpis: {
    visitas: KpiDto
    mensajes: KpiDto
    wishlist: KpiDto
  }
}

/** Inventario por estado de tienda. */
export interface StoreInventoryDto {
  disponibles: number
  ultimasUnidades: number
  agotadas: number
  total: number
}

/** Resumen de fundación (RF-82 a 85). */
export interface FoundationStatsDto {
  totalPrendasRecibidas: number
  donaciones: {
    total: number
    deTiendas: number
    dePersonas: number
  }
}

/** Solicitudes mensuales de fundación. */
export interface FoundationMonthDto {
  mes: string
  etiqueta: string
  personas: number
  tiendas: number
  total: number
}

/** Indicadores admin (RF-86 a 91). */
export interface AdminIndicatorsDto {
  usuariosActivos: number
  variacionUsuarios: { pct: number; direccion: 'up' | 'down' | 'neutral' }
  tiendas: { verificadas: number; pendientes: number; total: number }
  fundacionesActivas: number
  ingresosMes: number
  variacionIngresos: { pct: number; direccion: 'up' | 'down' | 'neutral' }
  prendasPublicadas: number
  playlistsCreadas: number
  donacionesMes: number
}

/** Ingresos admin por suscripciones. */
export interface AdminIncomeDto {
  mesActual: {
    mes: string
    ingresosNetos: number
    reembolsosDescontados: number
    meta: number
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

export type StatsPeriod = '7d' | '30d' | '90d'
