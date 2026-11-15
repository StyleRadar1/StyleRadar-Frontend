import { Link } from 'react-router-dom'
import { EscenaError } from './errores'

/** 404 general: el perchero con las perchas vacías. */
export function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center">
      <EscenaError
        escena="perchero"
        grande
        codigo="404"
        etiqueta="No encontrada"
        nivel="h1"
        titulo="No encontramos esta página"
        texto="Puede que el enlace esté mal escrito o que la página ya no exista."
        descripcion="Un perchero con las perchas vacías meciéndose"
        acciones={
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
    </div>
  )
}