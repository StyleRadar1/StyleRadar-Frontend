import { Link } from 'react-router-dom'
import { Logo } from '@/modules/core/design-system'

/** Landing de bienvenida: atrae y explica; para usar la app se entra con un botón. */
export default function LandingPage() {
  return (
    <>
      <section className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden">
        <img src="/img/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_35%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e0a16]/70 via-[#0e0a16]/35 to-[#120826]/95" />
        <div className="relative px-4 text-center">
          <h1 className="flex items-center justify-center gap-3 text-6xl font-extrabold tracking-[-.045em] md:text-8xl">
            <Logo className="h-20 w-auto md:h-28" />StyleRadar
          </h1>
          <p className="mx-auto mt-6 inline-block rounded-full bg-[#1e1a28]/60 px-6 py-3 text-xs font-bold uppercase tracking-[.22em] md:text-sm">Descubre tu estilo. En tu ciudad.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/catalogo" className="rounded-xl bg-violeta px-6 py-3 text-sm font-semibold shadow-[0_8px_24px_rgba(72,17,154,.45)]">Entrar a StyleRadar</Link>
            <Link to="/login?jurado" className="rounded-xl border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold">Acceso para jurados</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-3">
        {[
          ['Encuentra tu talla', 'Busca una prenda y mira en el mapa qué tienda de Bogotá la tiene en tu talla.'],
          ['Pruébatela antes de salir', 'Mírala en el maniquí virtual o sobre tu propia foto.'],
          ['Dale una segunda vida', 'Vende lo que ya no usas o dónalo a una fundación cercana.'],
        ].map(([t, d], i) => (
          <article key={t} className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-violeta text-xs font-bold">0{i + 1}</span>
            <h2 className="mt-4 text-lg font-bold">{t}</h2>
            <p className="mt-2 text-sm text-white/70">{d}</p>
          </article>
        ))}
        <p className="text-sm text-white/55 md:col-span-3">
          ¿Quieres ver el diseño completo? Mira el <a href="/prototipo/index.html" className="font-semibold text-arena underline underline-offset-4">prototipo navegable</a>.
        </p>
      </section>
    </>
  )
}
