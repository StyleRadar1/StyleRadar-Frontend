import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-arena">Error 404</p>
      <h1 className="mt-3 text-4xl font-extrabold">No encontramos esta página</h1>
      <p className="mt-3 text-white/70">Puede que el enlace esté mal escrito o que la página ya no exista.</p>
      <Link to="/" className="mt-8 rounded-xl bg-violeta px-5 py-3 text-sm font-semibold">Volver al inicio</Link>
    </section>
  )
}
