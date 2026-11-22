import type {
  StoreStatsDto, StoreInventoryDto,
  FoundationStatsDto, FoundationMonthDto,
  AdminIndicatorsDto, AdminIncomeDto, AdminAccountsByPlanDto, AdminDailyDto, AdminLiveDto,
  StatsPeriod,
} from '../types/stats.dto'

/* ─── Tienda (RF-76 a 81) ─── */

function buildStoreSeries(days: number) {
  const start = new Date(Date.UTC(2026, 10, 10 - (days - 1)))
  const visitsPorDia = Array.from({ length: days }, (_, idx) => {
    const fecha = new Date(start.getTime() + idx * 86_400_000).toISOString().slice(0, 10)
    return { fecha, visitas: 38 + ((idx * 7) % 35) }
  })
  const mensajesPorDia = Array.from({ length: days }, (_, idx) => {
    const fecha = new Date(start.getTime() + idx * 86_400_000).toISOString().slice(0, 10)
    return { fecha, mensajes: 1 + (idx % 3) }
  })
  return { visitasPorDia: visitsPorDia, mensajesPorDia }
}

export const MOCK_STORE_STATS: Record<StatsPeriod, StoreStatsDto> = {
  '7_DIAS': {
    periodo: '7_DIAS',
    kpis: {
      visitas: { valor: 312, variacionPct: 8.1, direccion: 'up', periodoAnterior: 288 },
      mensajes: { valor: 24, variacionPct: -3.0, direccion: 'down', periodoAnterior: 25 },
    },
    ...buildStoreSeries(7),
    visitantesAhora: 12,
    metaSemanal: { visitasAcumuladas: 445, meta: 500, porcentajeAvance: 89 },
  },
  '30_DIAS': {
    periodo: '30_DIAS',
    kpis: {
      visitas: { valor: 1284, variacionPct: 12.4, direccion: 'up', periodoAnterior: 1142 },
      mensajes: { valor: 94, variacionPct: 4.1, direccion: 'up', periodoAnterior: 90 },
    },
    ...buildStoreSeries(30),
    visitantesAhora: 12,
    metaSemanal: { visitasAcumuladas: 445, meta: 500, porcentajeAvance: 89 },
  },
  '90_DIAS': {
    periodo: '90_DIAS',
    kpis: {
      visitas: { valor: 3650, variacionPct: 15.0, direccion: 'up', periodoAnterior: 3174 },
      mensajes: { valor: 280, variacionPct: 6.2, direccion: 'up', periodoAnterior: 264 },
    },
    ...buildStoreSeries(90),
    visitantesAhora: 12,
    metaSemanal: { visitasAcumuladas: 445, meta: 500, porcentajeAvance: 89 },
  },
}

export const MOCK_STORE_INVENTORY: StoreInventoryDto = {
  disponibles: 34,
  ultimasUnidades: 8,
  agotadas: 5,
  total: 47,
  prendasDisponibles: { cantidad: 34, porcentaje: 72.34 },
  prendasUltimasUnidades: { cantidad: 8, porcentaje: 17.02 },
  prendasAgotadas: { cantidad: 5, porcentaje: 10.64 },
}

/* ─── Fundación (RF-82 a 85) ─── */

export const MOCK_FOUNDATION_STATS: FoundationStatsDto = {
  totalPrendasRecibidas: 420,
  donaciones: { total: 55, deTiendas: 21, dePersonas: 34 },
  solicitudesPersonas: [
    { mes: '2026-04', cantidad: 17 },
    { mes: '2026-05', cantidad: 19 },
    { mes: '2026-06', cantidad: 21 },
    { mes: '2026-07', cantidad: 17 },
    { mes: '2026-08', cantidad: 18 },
    { mes: '2026-09', cantidad: 15 },
  ],
  solicitudesTiendas: [
    { mes: '2026-04', cantidad: 3 },
    { mes: '2026-05', cantidad: 6 },
    { mes: '2026-06', cantidad: 4 },
    { mes: '2026-07', cantidad: 5 },
    { mes: '2026-08', cantidad: 7 },
    { mes: '2026-09', cantidad: 7 },
  ],
  meta: { etiqueta: 'septiembre 2026', recibidas: 99, objetivo: 180 },
  porTipo: [
    { tipo: 'Chaquetas', cantidad: 185, pct: 44, porcentaje: 44.05 },
    { tipo: 'Calzado', cantidad: 109, pct: 26, porcentaje: 25.95 },
    { tipo: 'Suéteres', cantidad: 71, pct: 17, porcentaje: 16.90 },
    { tipo: 'Pantalones', cantidad: 55, pct: 13, porcentaje: 13.10 },
  ],
  prendasPorTipo: [
    { tipo: 'Chaquetas', cantidad: 185, porcentaje: 44.05 },
    { tipo: 'Calzado', cantidad: 109, porcentaje: 25.95 },
    { tipo: 'Suéteres', cantidad: 71, porcentaje: 16.90 },
    { tipo: 'Pantalones', cantidad: 55, porcentaje: 13.10 },
  ],
  porEstado: [
    { estado: 'Pendiente', cantidad: 5, porcentaje: 10.87 },
    { estado: 'Aceptada', cantidad: 7, porcentaje: 15.22 },
    { estado: 'Recogida', cantidad: 3, porcentaje: 6.52 },
    { estado: 'Recibida', cantidad: 31, porcentaje: 67.39 },
  ],
  solicitudesPorEstado: [
    { estado: 'Pendiente', cantidad: 5, porcentaje: 10.87 },
    { estado: 'Aceptada', cantidad: 7, porcentaje: 15.22 },
    { estado: 'Recogida', cantidad: 3, porcentaje: 6.52 },
    { estado: 'Recibida', cantidad: 31, porcentaje: 67.39 },
  ],
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
  pendientesPorGrupo: [
    { tipoPublicador: 'TIENDA', publicadorId: 'alm-1', cantidad: 3 },
    { tipoPublicador: 'USUARIO', publicadorId: 'usr-2', cantidad: 2 },
  ],
}

const DIAS: [number, number, number][] = [
  [890, 32, 30], [760, 32, 32], [760, 24, 43], [730, 16, 50], [1050, 24, 56], [1020, 24, 63], [770, 20, 32], [930, 20, 51],
  [810, 20, 45], [800, 32, 47], [730, 20, 43], [980, 52, 57], [1220, 44, 74], [810, 28, 46], [850, 36, 45], [850, 24, 41],
  [950, 24, 42], [960, 40, 58], [1370, 52, 73], [1270, 44, 82], [860, 32, 44], [880, 36, 56], [850, 44, 62], [890, 36, 50],
]
export const MOCK_ADMIN_DAILY: AdminDailyDto = {
  mes: 'septiembre 2026',
  dias: DIAS.map(([busquedas, registros, publicaciones], i) => ({
    etiqueta: `${i + 1} sep`,
    fecha: `2026-09-${String(i + 1).padStart(2, '0')}`,
    busquedas,
    registros,
    publicaciones,
  })),
  busquedasPorDia: DIAS.map(([busquedas], i) => ({
    fecha: `2026-09-${String(i + 1).padStart(2, '0')}`,
    busquedas,
  })),
  publicacionesPorDia: DIAS.map(([, , publicaciones], i) => ({
    fecha: `2026-09-${String(i + 1).padStart(2, '0')}`,
    publicaciones,
  })),
  registrosPorDia: DIAS.map(([, registros], i) => ({
    fecha: `2026-09-${String(i + 1).padStart(2, '0')}`,
    registros,
  })),
}

export const MOCK_ADMIN_INCOME: AdminIncomeDto = {
  mesActual: { mes: 'sep', ingresosNetos: 222_700, meta: 1_000_000, porcentajeAvance: 22 },
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
