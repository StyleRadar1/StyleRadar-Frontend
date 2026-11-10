import type {
  StoreStatsDto, StoreInventoryDto,
  FoundationStatsDto, FoundationMonthDto,
  AdminIndicatorsDto, AdminIncomeDto, AdminAccountsByPlanDto, AdminDailyDto, AdminLiveDto,
  StatsPeriod,
} from '../types/stats.dto'

/* ─── Tienda (RF-76 a 81) ─── */

export const MOCK_STORE_STATS: Record<StatsPeriod, StoreStatsDto> = {
  '7d': { periodo: '7d', kpis: { visitas: { valor: 312, variacionPct: 8.1, direccion: 'up' }, mensajes: { valor: 24, variacionPct: -3.0, direccion: 'down' }, wishlist: { valor: 98, variacionPct: 5.5, direccion: 'up' } } },
  '30d': { periodo: '30d', kpis: { visitas: { valor: 1284, variacionPct: 12.4, direccion: 'up' }, mensajes: { valor: 94, variacionPct: 4.1, direccion: 'up' }, wishlist: { valor: 412, variacionPct: -2.3, direccion: 'down' } } },
  '90d': { periodo: '90d', kpis: { visitas: { valor: 3650, variacionPct: 15.0, direccion: 'up' }, mensajes: { valor: 280, variacionPct: 6.2, direccion: 'up' }, wishlist: { valor: 1120, variacionPct: 1.8, direccion: 'up' } } },
}

export const MOCK_STORE_INVENTORY: StoreInventoryDto = {
  disponibles: 34, ultimasUnidades: 8, agotadas: 5, total: 47,
}

/* ─── Fundación (RF-82 a 85) ─── */

export const MOCK_FOUNDATION_STATS: FoundationStatsDto = {
  totalPrendasRecibidas: 420,
  donaciones: { total: 55, deTiendas: 21, dePersonas: 34 },
  meta: { etiqueta: 'septiembre 2026', recibidas: 99, objetivo: 180 },
  porTipo: [{ tipo: 'Chaquetas', pct: 44 }, { tipo: 'Calzado', pct: 26 }, { tipo: 'Suéteres', pct: 17 }, { tipo: 'Pantalones', pct: 13 }],
  porEstado: [{ estado: 'Pendiente', cantidad: 5 }, { estado: 'Aceptada', cantidad: 7 }, { estado: 'Recogida', cantidad: 3 }, { estado: 'Recibida', cantidad: 31 }],
}

/** Mismos datos del prototipo (vista «Ver como tabla» de Solicitudes por mes). */
export const MOCK_FOUNDATION_MONTHS: FoundationMonthDto[] = [
  { mes: 'abr', etiqueta: 'abr 2026', personas: 17, tiendas: 3, total: 20 },
  { mes: 'may', etiqueta: 'may 2026', personas: 19, tiendas: 6, total: 25 },
  { mes: 'jun', etiqueta: 'jun 2026', personas: 21, tiendas: 4, total: 25 },
  { mes: 'jul', etiqueta: 'jul 2026', personas: 17, tiendas: 5, total: 22 },
  { mes: 'ago', etiqueta: 'ago 2026', personas: 18, tiendas: 7, total: 25 },
  { mes: 'sep', etiqueta: 'sep 2026', personas: 15, tiendas: 7, total: 22 },
]

/* ─── Administrador (RF-86 a 91) ─── */

/* Mismos datos del módulo de administración del prototipo (septiembre 2026). */
export const MOCK_ADMIN_INDICATORS: AdminIndicatorsDto = {
  usuariosActivos: 1859,
  variacionUsuarios: { pct: 11.2, direccion: 'up', vsMesAnterior: 'agosto' },
  tiendas: { verificadas: 5, pendientes: 1, total: 6 },
  fundacionesActivas: 4,
  ingresosMes: 222_700,
  variacionIngresos: { pct: 8.5, direccion: 'up' },
  prendasPublicadas: 67,
  playlistsCreadas: 422,
  donacionesMes: 95,
}

const DIAS: [number, number, number][] = [
  [890, 32, 30], [760, 32, 32], [760, 24, 43], [730, 16, 50], [1050, 24, 56], [1020, 24, 63], [770, 20, 32], [930, 20, 51],
  [810, 20, 45], [800, 32, 47], [730, 20, 43], [980, 52, 57], [1220, 44, 74], [810, 28, 46], [850, 36, 45], [850, 24, 41],
  [950, 24, 42], [960, 40, 58], [1370, 52, 73], [1270, 44, 82], [860, 32, 44], [880, 36, 56], [850, 44, 62], [890, 36, 50],
]
export const MOCK_ADMIN_DAILY: AdminDailyDto = {
  mes: 'septiembre 2026',
  dias: DIAS.map(([busquedas, registros, publicaciones], i) => ({ etiqueta: `${i + 1} sep`, busquedas, registros, publicaciones })),
}

export const MOCK_ADMIN_INCOME: AdminIncomeDto = {
  mesActual: { mes: 'sep', ingresosNetos: 222_700, reembolsosDescontados: 29_800, meta: 1_000_000, porcentajeAvance: 22 },
  historico: [
    { mes: 'jun', usuarios: 89_400, tiendas: 356_000, total: 445_400 },
    { mes: 'jul', usuarios: 74_500, tiendas: 356_000, total: 430_500 },
    { mes: 'ago', usuarios: 89_400, tiendas: 356_000, total: 445_400 },
    { mes: 'sep', usuarios: 44_700, tiendas: 178_000, total: 222_700 },
  ],
}

export const MOCK_ADMIN_ACCOUNTS: AdminAccountsByPlanDto = {
  compradores: { radar: 840, radarPlus: 300 },
  almacenes: { basico: 18, destacado: 11 },
  resumen: [
    { plan: 'Radar (gratis)', cuentas: 840 },
    { plan: 'Radar+', cuentas: 300 },
    { plan: 'Tiendas aliadas', cuentas: 63 },
  ],
}

/** Sesiones abiertas simuladas: se mueven un poco en cada consulta, como en el prototipo. */
let sesiones = 230
export const mockAdminLive = (): AdminLiveDto => {
  sesiones = Math.max(180, Math.min(290, sesiones + Math.round((Math.random() - 0.45) * 16)))
  return { sesionesAbiertas: sesiones, ultimaActualizacion: new Date().toISOString() }
}
