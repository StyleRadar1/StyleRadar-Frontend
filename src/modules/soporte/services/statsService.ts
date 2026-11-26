import { apiClient } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import {
  MOCK_STORE_STATS, MOCK_STORE_INVENTORY,
  MOCK_FOUNDATION_STATS, MOCK_FOUNDATION_MONTHS,
  MOCK_ADMIN_INDICATORS, MOCK_ADMIN_INCOME, MOCK_ADMIN_ACCOUNTS, MOCK_ADMIN_DAILY, mockAdminLive,
} from '../mocks/stats'
import type {
  StoreStatsDto, StoreInventoryDto,
  FoundationStatsDto, FoundationMonthDto,
  AdminIndicatorsDto, AdminIncomeDto, AdminAccountsByPlanDto, AdminDailyDto, AdminLiveDto,
  StatsPeriod,
} from '../types/stats.dto'

export type SummaryTotalMetricCode =
  | 'FOUNDATION_GARMENTS_RECEIVED'
  | 'PLATFORM_GARMENT_PUBLICATIONS'
  | 'PLATFORM_PLAYLISTS_CREATED'
  | 'PLATFORM_MONTHLY_DONATIONS'

export type TimeSeriesMetricCode =
  | 'PLATFORM_USER_REGISTRATIONS'
  | 'PLATFORM_SUBSCRIPTION_REVENUE'

export type DistributionMetricCode =
  | 'STORE_INVENTORY_BY_STATE'
  | 'PLATFORM_BUYERS_BY_PLAN'
  | 'PLATFORM_STORES_BY_PLAN'

export interface TimeSeriesParams {
  startDate?: string
  endDate?: string
  granularity?: string
}

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function extractTotalValue(raw: any): number {
  if (typeof raw === 'number') return raw
  return num(raw?.total ?? raw?.value ?? raw?.count ?? raw?.amount ?? raw?.totalPrendasRecibidas, 0)
}

function extractSeriesPoints(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.points)) return raw.points
  if (Array.isArray(raw?.series)) return raw.series
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.items)) return raw.items
  return []
}

function extractDistributionEntries(raw: any): { key: string; count: number }[] {
  if (Array.isArray(raw)) {
    return raw.map((it: any) => ({
      key: String(it?.state ?? it?.plan ?? it?.key ?? it?.label ?? it?.name ?? ''),
      count: num(it?.count ?? it?.cantidad ?? it?.value ?? it?.total, 0),
    }))
  }
  const mapSource = raw?.distribution ?? raw?.counts ?? raw?.buckets ?? raw?.items
  if (Array.isArray(mapSource)) return extractDistributionEntries(mapSource)
  if (mapSource && typeof mapSource === 'object') {
    return Object.entries(mapSource).map(([key, count]) => ({ key, count: num(count, 0) }))
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw)
      .filter(([k]) => !['metricCode', 'total', 'scope', 'storeId', 'foundationId'].includes(k))
      .map(([key, count]) => ({ key, count: num(count, 0) }))
  }
  return []
}

export const statsService = {
  /* ─── Endpoints canónicos ms-estadisticas (9 métricas core + health) ─── */
  getSummaryTotal(metricCode: SummaryTotalMetricCode): Promise<any> {
    return apiClient.get<any>(`/api/v1/statistics/summary/totals/${metricCode}`).then((r) => r.data)
  },

  getTimeSeries(metricCode: TimeSeriesMetricCode, params?: TimeSeriesParams): Promise<any> {
    return apiClient
      .get<any>(`/api/v1/statistics/time-series/${metricCode}`, { params })
      .then((r) => r.data)
  },

  getDistribution(metricCode: DistributionMetricCode): Promise<any> {
    return apiClient.get<any>(`/api/v1/statistics/distributions/${metricCode}`).then((r) => r.data)
  },

  getHealth(): Promise<any> {
    return apiClient.get<any>('/api/v1/health').then((r) => r.data)
  },

  /* ─── Tienda ─── */
  async getStoreStats(periodo: StatsPeriod): Promise<StoreStatsDto> {
    if (env.useMocks) return mockDelay(MOCK_STORE_STATS[periodo])
    // Valida permisos contra ms-estadisticas usando la métrica vigente de tienda sin llamar rutas eliminadas.
    const raw = await this.getDistribution('STORE_INVENTORY_BY_STATE').catch(() => null)
    const visitasActual = num(raw?.visitas?.valor ?? raw?.visitasActual ?? raw?.visits, 0)
    const visitasPrev = num(raw?.visitas?.periodoAnterior ?? raw?.visitasAnterior, 0)
    const mensajesActual = num(raw?.mensajes?.valor ?? raw?.mensajesActual ?? raw?.messages, 0)
    const mensajesPrev = num(raw?.mensajes?.periodoAnterior ?? raw?.mensajesAnterior, 0)
    const calcPct = (act: number, prev: number) =>
      prev > 0 ? Number((((act - prev) / prev) * 100).toFixed(1)) : 0
    const dir = (act: number, prev: number): 'up' | 'down' | 'neutral' =>
      act > prev ? 'up' : act < prev ? 'down' : 'neutral'

    return {
      periodo,
      kpis: {
        visitas: {
          valor: visitasActual,
          variacionPct: calcPct(visitasActual, visitasPrev),
          direccion: dir(visitasActual, visitasPrev),
          periodoAnterior: visitasPrev,
        },
        mensajes: {
          valor: mensajesActual,
          variacionPct: calcPct(mensajesActual, mensajesPrev),
          direccion: dir(mensajesActual, mensajesPrev),
          periodoAnterior: mensajesPrev,
        },
      },
      visitasPorDia: Array.isArray(raw?.visitasPorDia) ? raw.visitasPorDia : [],
      mensajesPorDia: Array.isArray(raw?.mensajesPorDia) ? raw.mensajesPorDia : [],
    }
  },

  async getStoreInventory(): Promise<StoreInventoryDto> {
    if (env.useMocks) return mockDelay(MOCK_STORE_INVENTORY)
    const raw = await this.getDistribution('STORE_INVENTORY_BY_STATE')
    const entries = extractDistributionEntries(raw)
    const findCount = (keys: string[]) =>
      entries
        .filter((e) => keys.some((k) => e.key.toUpperCase().includes(k)))
        .reduce((acc, e) => acc + e.count, 0)

    const disponibles = num(raw?.disponibles ?? raw?.available, findCount(['DISPONIBLE', 'AVAILABLE']))
    const ultimasUnidades = num(
      raw?.ultimasUnidades ?? raw?.lowStock,
      findCount(['ULTIMAS', 'LOW_STOCK', 'LOW']),
    )
    const agotadas = num(raw?.agotadas ?? raw?.outOfStock, findCount(['AGOTAD', 'OUT_OF_STOCK', 'EMPTY']))
    const total = num(raw?.total, disponibles + ultimasUnidades + agotadas)

    return {
      disponibles,
      ultimasUnidades,
      agotadas,
      total,
      prendasDisponibles: raw?.prendasDisponibles,
      prendasUltimasUnidades: raw?.prendasUltimasUnidades,
      prendasAgotadas: raw?.prendasAgotadas,
    }
  },

  /* ─── Fundación ─── */
  async getFoundationStats(): Promise<FoundationStatsDto> {
    if (env.useMocks) return mockDelay(MOCK_FOUNDATION_STATS)
    const raw = await this.getSummaryTotal('FOUNDATION_GARMENTS_RECEIVED')
    const totalPrendasRecibidas = extractTotalValue(raw)
    return {
      totalPrendasRecibidas,
      donaciones: raw?.donaciones ?? {
        total: totalPrendasRecibidas,
        deTiendas: num(raw?.deTiendas, 0),
        dePersonas: num(raw?.dePersonas, totalPrendasRecibidas),
      },
      meta: raw?.meta ?? null,
      porTipo: Array.isArray(raw?.porTipo) ? raw.porTipo : [],
      porEstado: Array.isArray(raw?.porEstado) ? raw.porEstado : [],
    }
  },

  async getFoundationMonths(): Promise<FoundationMonthDto[]> {
    if (env.useMocks) return mockDelay(MOCK_FOUNDATION_MONTHS)
    const raw = await this.getSummaryTotal('FOUNDATION_GARMENTS_RECEIVED').catch(() => null)
    const points = extractSeriesPoints(raw)
    return points.map((p: any) => {
      const personas = num(p?.personas, 0)
      const tiendas = num(p?.tiendas, 0)
      const total = num(p?.total ?? p?.value ?? p?.count, personas + tiendas)
      const mes = String(p?.mes ?? p?.period ?? p?.date ?? '')
      return {
        mes,
        etiqueta: String(p?.etiqueta ?? mes),
        personas,
        tiendas,
        total,
      }
    })
  },

  /* ─── Admin ─── */
  async getAdminIndicators(): Promise<AdminIndicatorsDto> {
    if (env.useMocks) return mockDelay(MOCK_ADMIN_INDICATORS)
    const [garmentsRaw, playlistsRaw, donationsRaw, usersRaw, revenueRaw, storesByPlanRaw, storesVerifRaw, foundationsRaw] =
      await Promise.all([
        this.getSummaryTotal('PLATFORM_GARMENT_PUBLICATIONS').catch(() => 0),
        this.getSummaryTotal('PLATFORM_PLAYLISTS_CREATED').catch(() => 0),
        this.getSummaryTotal('PLATFORM_MONTHLY_DONATIONS').catch(() => 0),
        this.getTimeSeries('PLATFORM_USER_REGISTRATIONS').catch(() => []),
        this.getTimeSeries('PLATFORM_SUBSCRIPTION_REVENUE').catch(() => []),
        this.getDistribution('PLATFORM_STORES_BY_PLAN').catch(() => null),
        apiClient.get<any>('/api/v1/admin/stores/verifications', { params: { page: 0, size: 100 } }).then((r) => r.data).catch(() => null),
        apiClient.get<any>('/api/v1/admin/foundations').then((r) => r.data).catch(() => null),
      ])

    const userPoints = extractSeriesPoints(usersRaw)
    const usuariosActivos =
      usersRaw && typeof usersRaw === 'object' && !Array.isArray(usersRaw) && usersRaw.total != null
        ? num(usersRaw.total, 0)
        : userPoints.reduce((acc, p) => acc + num(p?.value ?? p?.count ?? p?.registros, 0), 0)

    const revPoints = extractSeriesPoints(revenueRaw)
    const ingresosMes =
      revenueRaw && typeof revenueRaw === 'object' && !Array.isArray(revenueRaw) && revenueRaw.total != null
        ? num(revenueRaw.total, 0)
        : revPoints.reduce((acc, p) => acc + num(p?.value ?? p?.amount ?? p?.total, 0), 0)

    const storeRows: any[] = Array.isArray(storesVerifRaw)
      ? storesVerifRaw
      : Array.isArray(storesVerifRaw?.content)
        ? storesVerifRaw.content
        : []
    const verificadas = storeRows.filter((s) => s?.verificationStatus === 'APPROVED').length
    const pendientes = storeRows.filter((s) => s?.verificationStatus === 'PENDING').length
    const storesPlanTotal = extractDistributionEntries(storesByPlanRaw).reduce((acc, e) => acc + e.count, 0)
    const totalTiendas =
      typeof storesVerifRaw?.totalElements === 'number'
        ? storesVerifRaw.totalElements
        : storeRows.length || storesPlanTotal

    const foundationRows: any[] = Array.isArray(foundationsRaw)
      ? foundationsRaw
      : Array.isArray(foundationsRaw?.content)
        ? foundationsRaw.content
        : []
    const fundacionesActivas = foundationRows.filter((f) => f?.active !== false).length

    return {
      usuariosActivos,
      variacionUsuarios: { pct: 0, direccion: 'neutral' },
      tiendas: { verificadas, pendientes, total: totalTiendas },
      fundacionesActivas,
      ingresosMes,
      variacionIngresos: { pct: 0, direccion: 'neutral' },
      prendasPublicadas: extractTotalValue(garmentsRaw),
      playlistsCreadas: extractTotalValue(playlistsRaw),
      donacionesMes: extractTotalValue(donationsRaw),
    }
  },

  async getAdminIncome(): Promise<AdminIncomeDto> {
    if (env.useMocks) return mockDelay(MOCK_ADMIN_INCOME)
    const raw = await this.getTimeSeries('PLATFORM_SUBSCRIPTION_REVENUE')
    const points = extractSeriesPoints(raw)
    const historico = points.map((p: any) => {
      const usuarios = num(p?.usuarios ?? p?.buyers, 0)
      const tiendas = num(p?.tiendas ?? p?.stores, 0)
      const total = num(p?.total ?? p?.value ?? p?.amount, usuarios + tiendas)
      return {
        mes: String(p?.mes ?? p?.period ?? p?.date ?? p?.label ?? ''),
        usuarios,
        tiendas,
        total,
      }
    })
    const last = historico[historico.length - 1]
    const totalMes = last?.total ?? extractTotalValue(raw)
    return {
      mesActual: {
        mes: last?.mes || new Date().toISOString().slice(0, 7),
        ingresosNetos: totalMes,
        meta: raw?.meta ?? null,
        porcentajeAvance: num(raw?.porcentajeAvance, 0),
      },
      historico,
    }
  },

  /** Serie temporal de registros de usuario (`PLATFORM_USER_REGISTRATIONS`). */
  async getAdminDaily(params?: TimeSeriesParams): Promise<AdminDailyDto> {
    if (env.useMocks) return mockDelay(MOCK_ADMIN_DAILY)
    const raw = await this.getTimeSeries('PLATFORM_USER_REGISTRATIONS', params)
    const points = extractSeriesPoints(raw)
    const dias = points.map((p: any) => {
      const fecha = String(p?.fecha ?? p?.date ?? p?.period ?? p?.label ?? '')
      const registros = num(p?.registros ?? p?.value ?? p?.count, 0)
      return {
        etiqueta: String(p?.etiqueta ?? fecha),
        fecha,
        busquedas: num(p?.busquedas, 0),
        registros,
        publicaciones: num(p?.publicaciones, 0),
      }
    })
    return {
      mes: String(raw?.mes ?? new Date().toISOString().slice(0, 7)),
      dias,
      registrosPorDia: dias.map((d) => ({ fecha: d.fecha || d.etiqueta, registros: d.registros })),
    }
  },

  /** El endpoint /statistics/realtime fue retirado en el refactor a 9 métricas core. */
  getAdminLive(): Promise<AdminLiveDto> {
    if (env.useMocks) return mockDelay(mockAdminLive(), 150)
    return Promise.resolve({
      sesionesAbiertas: 0,
      ultimaActualizacion: new Date().toISOString(),
    })
  },

  async getAdminAccounts(): Promise<AdminAccountsByPlanDto> {
    if (env.useMocks) return mockDelay(MOCK_ADMIN_ACCOUNTS)
    const [buyersRaw, storesRaw] = await Promise.all([
      this.getDistribution('PLATFORM_BUYERS_BY_PLAN').catch(() => ({})),
      this.getDistribution('PLATFORM_STORES_BY_PLAN').catch(() => ({})),
    ])
    const buyerEntries = extractDistributionEntries(buyersRaw)
    const storeEntries = extractDistributionEntries(storesRaw)

    const sumMatching = (entries: { key: string; count: number }[], kw: string) =>
      entries
        .filter((e) => e.key.toUpperCase().includes(kw))
        .reduce((acc, e) => acc + e.count, 0)

    const radarPlus = sumMatching(buyerEntries, 'PLUS')
    const radar = sumMatching(buyerEntries, 'RADAR') - radarPlus || sumMatching(buyerEntries, 'FREE') || sumMatching(buyerEntries, 'BASIC')
    const destacado = sumMatching(storeEntries, 'DESTAC') || sumMatching(storeEntries, 'PREMIUM') || sumMatching(storeEntries, 'PRO')
    const basico = sumMatching(storeEntries, 'BASIC')

    return {
      compradores: { radar: Math.max(0, radar), radarPlus },
      almacenes: { basico, destacado },
      resumen: [...buyerEntries, ...storeEntries].map((e) => ({
        plan: e.key,
        cuentas: e.count,
      })),
    }
  },
}
