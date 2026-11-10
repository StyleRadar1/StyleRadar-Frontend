import type {
  StoreStatsDto, StoreInventoryDto,
  FoundationStatsDto, FoundationMonthDto,
  AdminIndicatorsDto, AdminIncomeDto, AdminAccountsByPlanDto,
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
  donaciones: { total: 48, deTiendas: 18, dePersonas: 30 },
}

export const MOCK_FOUNDATION_MONTHS: FoundationMonthDto[] = [
  { mes: 'abr', etiqueta: 'Abril 2026', personas: 12, tiendas: 4, total: 16 },
  { mes: 'may', etiqueta: 'Mayo 2026', personas: 18, tiendas: 6, total: 24 },
  { mes: 'jun', etiqueta: 'Junio 2026', personas: 15, tiendas: 5, total: 20 },
  { mes: 'jul', etiqueta: 'Julio 2026', personas: 20, tiendas: 7, total: 27 },
  { mes: 'ago', etiqueta: 'Agosto 2026', personas: 22, tiendas: 8, total: 30 },
  { mes: 'sep', etiqueta: 'Septiembre 2026', personas: 25, tiendas: 9, total: 34 },
]

/* ─── Administrador (RF-86 a 91) ─── */

export const MOCK_ADMIN_INDICATORS: AdminIndicatorsDto = {
  usuariosActivos: 1892,
  variacionUsuarios: { pct: 11.2, direccion: 'up' },
  tiendas: { verificadas: 24, pendientes: 5, total: 29 },
  fundacionesActivas: 8,
  ingresosMes: 820_000,
  variacionIngresos: { pct: 8.5, direccion: 'up' },
  prendasPublicadas: 312,
  playlistsCreadas: 428,
  donacionesMes: 94,
}

export const MOCK_ADMIN_INCOME: AdminIncomeDto = {
  mesActual: { mes: 'sep', ingresosNetos: 820_000, reembolsosDescontados: 29_800, meta: 1_000_000, porcentajeAvance: 82 },
  historico: [
    { mes: 'jun', usuarios: 280_000, tiendas: 350_000, total: 630_000 },
    { mes: 'jul', usuarios: 320_000, tiendas: 380_000, total: 700_000 },
    { mes: 'ago', usuarios: 360_000, tiendas: 410_000, total: 770_000 },
    { mes: 'sep', usuarios: 390_000, tiendas: 430_000, total: 820_000 },
  ],
}

export const MOCK_ADMIN_ACCOUNTS: AdminAccountsByPlanDto = {
  compradores: { radar: 1420, radarPlus: 472 },
  almacenes: { basico: 18, destacado: 11 },
  resumen: [
    { plan: 'Radar (gratis)', cuentas: 1420 },
    { plan: 'Radar+', cuentas: 472 },
    { plan: 'Tiendas aliadas', cuentas: 29 },
  ],
}
