import { Link } from 'react-router-dom'
import { Perchero } from './errores/Escenas'

/** 404 general: experiencia inmersiva limpia con el perchero y perchas vacías meciéndose. */
export function NotFound() {
  return (
    <div className="flex min-h-[85vh] w-full items-center justify-center px-4 py-12 select-none">
      <section
        data-tamano="grande"
        className="relative flex w-full max-w-2xl flex-col items-center justify-center text-center"
      >
        {/* Ilustración del perchero con halo sutil centrado */}
        <div className="relative mb-6 flex aspect-[5/4] w-full max-w-[420px] items-center justify-center overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_center,rgba(183,154,245,0.14)_0%,transparent_75%)]">
          <div
            role="img"
            aria-label="Un perchero con las perchas vacías meciéndose"
            className="relative h-full w-full"
          >
            <Perchero />
          </div>
          {/* Badge de código flotante estilizado */}
          <span
            className="pointer-events-none absolute right-4 top-4 font-mono text-2xl font-black tracking-tight text-[#b79af5]/40 sm:text-3xl"
            data-testid="codigo-error"
          >
            404
          </span>
        </div>

        {/* Chip superior */}
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#b79af5] sm:text-xs">
          <span className="h-2 w-2 rounded-full bg-[#b79af5] shadow-[0_0_0_4px_rgba(183,154,245,0.25)]" />
          NO ENCONTRADA · 404
        </span>

        {/* Título en una sola línea en pantallas medianas/grandes */}
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#f6f1e7] sm:text-4xl md:text-5xl">
          No encontramos esta página
        </h1>

        {/* Texto explicativo */}
        <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-[#d8d0e5]/85 sm:text-base">
          Puede que el enlace esté mal escrito o que la página ya no exista.
        </p>

        {/* Botones de acción estilo píldora */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/catalogo"
            className="cursor-pointer rounded-full bg-[#5b1df0] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(91,29,240,0.45)] transition hover:bg-[#6b2cf5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Volver al catálogo
          </Link>
          <Link
            to="/"
            className="cursor-pointer rounded-full border border-white/30 bg-black/20 px-6 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </div>
  )
}
