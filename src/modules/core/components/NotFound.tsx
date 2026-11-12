import { Link } from 'react-router-dom'
import { ErrorCard } from './ErrorScene'

export function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-4 py-12">
      <ErrorCard
        variant="perchero"
        tone="warn"
        chip="No encontrada"
        code="404"
        title="Esta página se salió del perchero."
        description="Puede que el enlace esté mal escrito o que la página ya no exista."
        actions={
          <>
            <Link to="/catalogo" className="rounded-xl bg-violeta px-5 py-3 text-sm font-semibold text-white">
              Volver al catálogo
            </Link>
            <Link to="/" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-blanco">
              Volver al inicio
            </Link>
          </>
        }
      />
    </section>
  )
}
