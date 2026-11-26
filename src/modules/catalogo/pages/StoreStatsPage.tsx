import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { guardarRetorno } from '@/modules/core/api/retorno'
import { Button, Card } from '@/modules/core/design-system'
import { useStoreInventoryByState } from '@/modules/soporte/hooks/useStatistics'
import {
  CATEGORY_UI_LABELS,
  type DistributionEntry,
  type InventoryCategoryCode,
} from '@/modules/soporte/types/statistics.dto'
import { StoreSuspendedBanner } from '@/modules/transacciones/components/StoreSuspendedBanner'

const INVENTORY_ORDER: InventoryCategoryCode[] = ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK']

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

  const entries = data ? normalizeInventoryEntries(data.entries) : []
  const totalReferences = entries.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-[var(--color-text)]">
      <StoreSuspendedBanner />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Estadísticas de tu tienda</h1>
      </header>

      <Card>
        <h2 className="text-lg font-bold text-[var(--color-text)]">Inventario por estado</h2>

        {loading && (
          <p role="status" className="mt-4 text-sm text-[var(--color-text-muted)]">
            Cargando...
          </p>
        )}

        {!loading && error && (
          <div role="alert" className="mt-4 space-y-3">
            <p className="text-sm text-[var(--color-text)]">{error}</p>
            <div className="flex flex-wrap gap-2">
              {status === 401 ? (
                <Button
                  type="button"
                  onClick={() => {
                    guardarRetorno()
                    navigate('/?login', { replace: true })
                  }}
                >
                  Iniciar sesión
                </Button>
              ) : (
                <Button type="button" onClick={retry}>
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Total de referencias:{' '}
              <strong className="text-[var(--color-text)] tabular-nums">
                {totalReferences.toLocaleString('es-CO')}
              </strong>
            </p>

            {empty && (
              <p role="status" className="text-sm text-[var(--color-text-muted)]">
                Aún no tienes prendas registradas en tu inventario.
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                    <th className="py-2 pr-4 font-semibold">Estado</th>
                    <th className="py-2 px-4 text-right font-semibold">Cantidad</th>
                    <th className="py-2 pl-4 text-right font-semibold">Porcentaje</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.categoryCode}
                      className="border-b border-[var(--color-border)]/50 last:border-b-0"
                    >
                      <td className="py-2.5 pr-4 text-[var(--color-text)]">
                        {CATEGORY_UI_LABELS[entry.categoryCode]}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-[var(--color-text)]">
                        {entry.count.toLocaleString('es-CO')}
                      </td>
                      <td className="py-2.5 pl-4 text-right tabular-nums text-[var(--color-text)]">
                        {entry.percentage.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </main>
  )
}
