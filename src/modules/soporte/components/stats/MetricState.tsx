import { useNavigate } from 'react-router-dom'
import { guardarRetorno } from '@/modules/core/api/retorno'
import { Button } from '@/modules/core/design-system'

export function MetricSkeleton({
  lines = 2,
  tall = false,
}: {
  lines?: number
  tall?: boolean
}) {
  return (
    <div role="status" aria-label="Cargando indicador" className="space-y-3">
      <div className="h-3 w-28 animate-pulse rounded bg-[var(--color-border)] motion-reduce:animate-none" />
      <div
        className={`${tall ? 'h-40' : 'h-9 w-32'} animate-pulse rounded-lg bg-[var(--color-border)] motion-reduce:animate-none`}
      />
      {lines > 2 && (
        <div className="h-3 w-44 animate-pulse rounded bg-[var(--color-border)] motion-reduce:animate-none" />
      )}
      <span className="sr-only">Cargando...</span>
    </div>
  )
}

export function MetricError({
  error,
  status,
  onRetry,
}: {
  error: string
  status: number | null
  onRetry: () => void
}) {
  const navigate = useNavigate()
  return (
    <div role="alert" className="space-y-3">
      <p className="text-sm font-medium text-[var(--sr-text-primary,var(--color-text))]">{error}</p>
      <div className="flex flex-wrap gap-2">
        {status === 401 ? (
          <Button
            type="button"
            className="px-4 py-2 text-xs"
            onClick={() => {
              guardarRetorno()
              navigate('/?login', { replace: true })
            }}
          >
            Iniciar sesión
          </Button>
        ) : (
          <Button type="button" className="px-4 py-2 text-xs" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    </div>
  )
}
