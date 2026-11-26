import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { guardarRetorno } from '@/modules/core/api/retorno'
import { useFoundationGarmentsReceived } from '../hooks/useStatistics'
import { KpiCard } from './stats/KpiCard'

/** Estadísticas de la fundación (/fundacion/estadisticas): tarjeta hero conectada a ms-estadisticas. */
export function FoundationStatsView() {
  const navigate = useNavigate()
  const { data, loading, empty, error, status, retry } = useFoundationGarmentsReceived()

  useEffect(() => {
    if (status === 401) {
      guardarRetorno()
      navigate('/?login', { replace: true })
    }
  }, [status, navigate])

  return (
    <section className="mx-auto max-w-4xl space-y-6 text-[var(--sr-text-primary,var(--color-text))]">
      <header className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--sr-accent-text,var(--color-violeta-claro))]">
          Resumen de impacto
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Estadísticas de tu fundación
        </h1>
        <p className="text-sm text-[var(--sr-text-muted,var(--color-text-muted))]">
          Conteo acumulado de donaciones confirmadas recibidas por tu fundación.
        </p>
      </header>

      <KpiCard
        hero
        label="Prendas recibidas históricamente"
        value={(data?.total ?? 0).toLocaleString('es-CO')}
        subtitle="Total acumulado de prendas confirmadas"
        note="Dato calculado desde entregas confirmadas registradas en ms-estadisticas."
        loading={loading}
        empty={empty}
        emptyText="Aún no registras prendas recibidas confirmadas"
        error={error}
        status={status}
        onRetry={retry}
      />
    </section>
  )
}
