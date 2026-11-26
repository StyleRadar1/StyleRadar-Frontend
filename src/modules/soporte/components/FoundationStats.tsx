import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { guardarRetorno } from '@/modules/core/api/retorno'
import { Button, Card } from '@/modules/core/design-system'
import { useFoundationGarmentsReceived } from '../hooks/useStatistics'

/** Estadísticas de la fundación (/fundacion/estadisticas): vista minimalista conectada a ms-estadisticas. */
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
    <section className="mx-auto max-w-4xl text-[var(--color-text)]">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Estadísticas de tu fundación</h1>
      </header>

      <Card>
        <h2 className="text-lg font-bold text-[var(--color-text)]">Prendas recibidas</h2>

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
          <div className="mt-4 space-y-2">
            <p className="text-4xl font-extrabold tabular-nums text-[var(--color-text)]">
              {data.total.toLocaleString('es-CO')}
            </p>
            {empty && (
              <p role="status" className="text-sm text-[var(--color-text-muted)]">
                Aún no registras prendas recibidas confirmadas
              </p>
            )}
          </div>
        )}
      </Card>
    </section>
  )
}
