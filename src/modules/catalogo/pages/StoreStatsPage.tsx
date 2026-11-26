import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { guardarRetorno } from '@/modules/core/api/retorno'
import { DistributionCard, type DistributionRow } from '@/modules/soporte/components/stats/DistributionCard'
import { KpiCard } from '@/modules/soporte/components/stats/KpiCard'
import { useStoreInventoryByState } from '@/modules/soporte/hooks/useStatistics'
import {
  CATEGORY_UI_LABELS,
  type DistributionEntry,
  type InventoryCategoryCode,
} from '@/modules/soporte/types/statistics.dto'
import { StoreSuspendedBanner } from '@/modules/transacciones/components/StoreSuspendedBanner'
import '@/styles/tienda-glass.css'

const INVENTORY_ORDER: InventoryCategoryCode[] = ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK']

const INVENTORY_COLORS: Record<InventoryCategoryCode, string> = {
  AVAILABLE: 'var(--color-success, #22c55e)',
  LOW_STOCK: 'var(--color-warning, #f59e0b)',
  OUT_OF_STOCK: 'var(--color-danger, #ef4444)',
}

function normalizeInventoryEntries(
  entries: DistributionEntry<InventoryCategoryCode>[],
): DistributionEntry<InventoryCategoryCode>[] {
  const byCode = new Map(entries.map((entry) => [entry.categoryCode, entry]))
  return INVENTORY_ORDER.map(
    (categoryCode) =>
      byCode.get(categoryCode) ?? {
        categoryCode,
        count: 0,
        percentage: 0,
      },
  )
}

export default function StoreStatsPage() {
  const navigate = useNavigate()
  const { data, loading, empty, error, status, retry } = useStoreInventoryByState()

  useEffect(() => {
    if (status === 401) {
      guardarRetorno()
      navigate('/?login', { replace: true })
    }
  }, [status, navigate])

  const entries = data ? normalizeInventoryEntries(data.entries) : normalizeInventoryEntries([])
  const totalReferences = entries.reduce((sum, entry) => sum + entry.count, 0)

  const byCode = new Map(entries.map((e) => [e.categoryCode, e]))
  const available = byCode.get('AVAILABLE')!
  const lowStock = byCode.get('LOW_STOCK')!
  const outOfStock = byCode.get('OUT_OF_STOCK')!

  const distributionRows: DistributionRow[] = entries.map((entry) => ({
    key: entry.categoryCode,
    label: CATEGORY_UI_LABELS[entry.categoryCode],
    count: entry.count,
    percentage: entry.percentage,
    color: INVENTORY_COLORS[entry.categoryCode],
  }))

  return (
    <main className="sr-tienda-glass">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 text-[var(--sr-text-primary,var(--color-text))]">
        <StoreSuspendedBanner />

        <header className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--sr-accent-text,var(--color-violeta-claro))]">
            Analítica de inventario
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Estadísticas de tu tienda
          </h1>
          <p className="text-sm text-[var(--sr-text-muted,var(--color-text-muted))]">
            Estado actual de las referencias publicadas en tu inventario.
          </p>
        </header>

        <section
          aria-label="Resumen de inventario"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <KpiCard
            label="Referencias en inventario"
            value={totalReferences.toLocaleString('es-CO')}
            subtitle="Total de referencias registradas"
            loading={loading}
            empty={empty}
            emptyText="Sin referencias registradas"
            error={error}
            status={status}
            onRetry={retry}
            className="sr-glass-card"
          />
          <KpiCard
            label="Disponibles"
            value={available.count.toLocaleString('es-CO')}
            subtitle={`${available.percentage.toFixed(2)}% del inventario`}
            accentColor={INVENTORY_COLORS.AVAILABLE}
            loading={loading}
            error={error}
            status={status}
            onRetry={retry}
            className="sr-glass-card"
          />
          <KpiCard
            label="Últimas unidades"
            value={lowStock.count.toLocaleString('es-CO')}
            subtitle={`${lowStock.percentage.toFixed(2)}% del inventario`}
            accentColor={INVENTORY_COLORS.LOW_STOCK}
            loading={loading}
            error={error}
            status={status}
            onRetry={retry}
            className="sr-glass-card"
          />
          <KpiCard
            label="Agotadas"
            value={outOfStock.count.toLocaleString('es-CO')}
            subtitle={`${outOfStock.percentage.toFixed(2)}% del inventario`}
            accentColor={INVENTORY_COLORS.OUT_OF_STOCK}
            loading={loading}
            error={error}
            status={status}
            onRetry={retry}
            className="sr-glass-card"
          />
        </section>

        <DistributionCard
          title="Inventario por estado"
          subtitle="Proporción actual de disponibilidad por categoría"
          centerLabel="Referencias"
          rows={distributionRows}
          total={totalReferences}
          note="Los porcentajes corresponden a la distribución actual de tus referencias registradas."
          loading={loading}
          empty={empty}
          emptyText="Aún no tienes prendas registradas en tu inventario."
          error={error}
          status={status}
          onRetry={retry}
          className="sr-glass-card"
        />
      </div>
    </main>
  )
}
