import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, Lock, RefreshCw, SearchX, ServerOff, WifiOff } from 'lucide-react'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind, errorMessage, type ErrorKind } from '@/modules/core/api/errors'
import { clearMockScenarios, mockScenarios, type MockScenario } from '@/modules/core/api/mockScenario'
import { ErrorScene, type SceneVariant } from './ErrorScene'

/** Estado de carga accesible: los lectores de pantalla lo anuncian. */
export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-8 text-[var(--sr-text-secondary)]">
      <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--sr-border-subtle)] border-t-[var(--sr-accent)] motion-reduce:animate-none" />
      <span>{label}</span>
    </div>
  )
}

function kindMeta(kind: ErrorKind): {
  color: string
  chip: string
  code?: string
  scene?: SceneVariant
  Icon: typeof AlertTriangle
} {
  switch (kind) {
    case 'servidor':
      return { color: 'var(--sr-bad)', chip: 'Falla del servidor', scene: 'tornamesa', Icon: ServerOff }
    case 'sin-conexion':
      return { color: 'var(--sr-bad)', chip: 'Sin conexión', scene: 'tornamesa', Icon: WifiOff }
    case 'sesion':
      return { color: 'var(--sr-acc-tx)', chip: 'Sesión vencida', code: '401', scene: 'etiqueta', Icon: Clock }
    case 'permiso':
      return { color: 'var(--sr-warn)', chip: 'Acceso restringido', code: '403', Icon: Lock }
    case 'no-existe':
      return { color: 'var(--sr-warn)', chip: 'No disponible', code: '404', scene: 'perchero', Icon: SearchX }
    case 'limite':
      return { color: 'var(--sr-warn)', chip: 'Demasiados intentos', code: '429', scene: 'maniqui', Icon: Clock }
    case 'conflicto':
      return { color: 'var(--sr-warn)', chip: 'Estado actualizado', code: '409', Icon: RefreshCw }
    case 'datos':
    default:
      return { color: 'var(--sr-bad)', chip: 'Revisa los datos', Icon: AlertTriangle }
  }
}

/** Error controlado con escena grande (503/401/404/429), ícono accesible y acción de recuperación. */
export function ErrorState({
  error,
  onRetry,
  title = 'Algo salió mal',
  compact = false,
}: {
  error: unknown
  onRetry?: () => void
  title?: string
  compact?: boolean
}) {
  const kind = errorKind(error)
  const meta = kindMeta(kind)
  const detectedCode = error instanceof ApiError && error.status > 0 ? String(error.status) : meta.code
  const Icon = meta.Icon
  const showScene = !compact && !!meta.scene

  return (
    <div
      role="alert"
      className="rounded-2xl border p-5 md:p-6"
      style={{
        borderColor: `color-mix(in srgb, ${meta.color} 45%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
      }}
    >
      <div className={showScene ? 'grid gap-6 md:grid-cols-[1.15fr_1fr] md:items-center' : ''}>
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[.12em]"
            style={{
              color: meta.color,
              borderColor: `color-mix(in srgb, ${meta.color} 45%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
            }}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{meta.chip}{detectedCode ? ` · ${detectedCode}` : ''}</span>
          </span>
          <p className="mt-3 text-lg font-bold text-[var(--sr-text-primary)]">{title}</p>
          <p className="mt-1 text-sm text-[var(--sr-text-secondary)]">{errorMessage(error)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {kind === 'sesion' ? (
              <Link to="/?login" className="rounded-xl bg-[var(--sr-accent)] px-4 py-2 text-sm font-semibold text-[var(--sr-text-on-accent)]">Iniciar sesión</Link>
            ) : onRetry && kind !== 'permiso' ? (
              <button type="button" onClick={onRetry} className="rounded-xl bg-[var(--sr-accent)] px-4 py-2 text-sm font-semibold text-[var(--sr-text-on-accent)]">Reintentar</button>
            ) : null}
          </div>
        </div>
        {showScene && meta.scene && <ErrorScene variant={meta.scene} />}
      </div>
    </div>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--sr-border-control)] bg-[var(--sr-surface)]/60 p-8 text-center text-[var(--sr-text-primary)]">
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-[var(--sr-text-secondary)]">{children}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

/** Aviso fijo cuando la app usa datos simulados, para no confundir mocks con integración real. */
export function MockBanner() {
  const [active, setActive] = useState<MockScenario[]>(() => mockScenarios())

  useEffect(() => {
    const sync = () => setActive(mockScenarios())
    window.addEventListener('sr:mock-changed', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('sr:mock-changed', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  const clear = () => {
    clearMockScenarios()
    setActive([])
    if (import.meta.env.MODE !== 'test') window.location.reload()
  }

  return (
    <div className="relative z-20 flex flex-wrap items-center justify-center gap-2 border-b border-arena/30 bg-arena/10 px-4 py-2 text-center text-xs text-arena">
      <span>Modo demostración: los datos son simulados (VITE_USE_MOCKS=true). Nada se envía al API Gateway.</span>
      {active.length > 0 && (
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--sr-warn)]/40 bg-[var(--sr-warn)]/15 px-2.5 py-0.5 font-semibold text-[var(--sr-warn)]">
          <span>Simulación activa: ?mock={active.join(',')}</span>
          <button
            type="button"
            onClick={clear}
            className="rounded-full border border-[var(--sr-warn)]/45 px-2 py-0.5 text-[11px] font-bold hover:bg-[var(--sr-warn)]/20"
          >
            Quitar simulación
          </button>
        </span>
      )}
    </div>
  )
}

/** Hace visible QA para evitar confundir sus datos con los de producción. */
export function EnvironmentBanner({ environment }: { environment: 'qa' | 'production' }) {
  if (environment === 'production') return null
  return (
    <div role="status" className="relative z-20 border-b border-[var(--sr-warn)]/35 bg-[var(--sr-warn)]/10 px-4 py-2 text-center text-xs text-[var(--sr-warn)]">
      Ambiente de QA: esta versión es de pruebas; confirma el aviso de datos simulados antes de validar una integración.
    </div>
  )
}