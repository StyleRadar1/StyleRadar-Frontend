import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  return /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|MIME type|text\/html/i.test(
    msg,
  )
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const chunkError = isChunkLoadError(error)
  const status = isRouteErrorResponse(error) ? error.status : undefined

  return (
    <main
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center bg-[#0d0c12] px-6 py-12 text-center text-[#f6f1e7]"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#171321] p-8 shadow-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-300">
          {chunkError ? 'Actualización disponible' : status ? `Error ${status}` : 'Error de navegación'}
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
          {chunkError ? 'Actualizamos StyleRadar' : 'Algo salió mal al abrir esta página'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/75">
          {chunkError
            ? 'Hay una versión más reciente disponible en este momento. Recarga la página para cargar los archivos actualizados.'
            : 'Ocurrió un inconveniente inesperado al cargar la vista. Puedes recargar o volver al inicio.'}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer rounded-full bg-[#5b1df0] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#6b2cf5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Recargar página
          </button>
          <Link
            to="/"
            className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
