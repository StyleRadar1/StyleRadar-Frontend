import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { errorKind, errorMessage } from '@/modules/core/api/errors'

/** Estado de carga accesible: los lectores de pantalla lo anuncian. */
export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-8 text-white/70">
      <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-violeta-claro motion-reduce:animate-none" />
      <span>{label}</span>
    </div>
  )
}

/** Error controlado con acción de recuperación. Si la sesión venció, ofrece volver a entrar. */
export function ErrorState({ error, onRetry, title = 'Algo salió mal' }: { error: unknown; onRetry?: () => void; title?: string }) {
  const kind = errorKind(error)
  return (
    <div role="alert" className="rounded-2xl border border-[#ff8a8a]/40 bg-[#ff8a8a]/10 p-5">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-white/80">{errorMessage(error)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {kind === 'sesion' ? (
          <Link to="/login" className="rounded-xl bg-violeta px-4 py-2 text-sm font-semibold">Iniciar sesión</Link>
        ) : onRetry && kind !== 'permiso' ? (
          <button type="button" onClick={onRetry} className="rounded-xl bg-violeta px-4 py-2 text-sm font-semibold">Reintentar</button>
        ) : null}
      </div>
    </div>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-white/70">{children}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

/** Aviso fijo cuando la app usa datos simulados, para no confundir mocks con integración real. */
export function MockBanner() {
  return (
    <div className="border-b border-arena/30 bg-arena/10 px-4 py-2 text-center text-xs text-arena">
      Modo demostración: los datos son simulados (VITE_USE_MOCKS=true). Nada se envía al API Gateway.
    </div>
  )
}
