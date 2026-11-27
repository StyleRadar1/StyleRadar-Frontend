import { urbanProblems } from '@/data/landingData'

export function ProblemSection() {
  const audiences = [
    { image: '/img/representantes/Q1.webp', label: 'Personas' },
    { image: '/img/representantes/Q2.webp', label: 'Tiendas locales' },
    { image: '/img/representantes/Q3.webp', label: 'Fundaciones' },
  ]

  return (
    <section
      id="pe-que-es"
      className="relative py-24 md:py-32 px-6 md:px-12 bg-transparent text-[var(--sr-hero-text)] border-t border-[var(--sr-border-subtle)]"
      aria-labelledby="peQueTitle"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Cabecera de la sección */}
        <div className="max-w-3xl space-y-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--sr-accent)]">
            Bogotá · el problema
          </p>
          <h2
            id="peQueTitle"
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-[var(--sr-hero-text)]"
          >
            Comprar moda local todavía implica{' '}
            <span className="text-[var(--sr-accent-text)] underline decoration-[var(--sr-accent)] decoration-4 underline-offset-8">
              adivinar.
            </span>
          </h2>
          <p className="text-base md:text-lg text-[var(--sr-hero-text-muted)] leading-relaxed pt-2">
            La prenda que buscas probablemente ya está en alguna tienda o boutique de la ciudad.
            Lo difícil es saber en cuál, si todavía queda tu talla y cómo te queda puesta, antes de
            cruzar Bogotá a ciegas.
          </p>
        </div>

        {/* Grid de los 4 retos urbanos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {urbanProblems.map((problem) => (
            <div
              key={problem.number}
              className="p-8 rounded-2xl bg-white/85 dark:bg-purple-950/25 backdrop-blur-xl border border-black/10 dark:border-purple-400/25 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.37),0_0_20px_-4px_rgba(139,92,246,0.15)] hover:border-purple-400/60 hover:bg-purple-50/90 dark:hover:bg-purple-500/15 hover:shadow-[0_12px_40px_rgba(139,92,246,0.22)] transition-all group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <span className="inline-block text-sm font-black tracking-widest text-[var(--sr-accent)] group-hover:text-[var(--sr-hero-text)] transition-colors">
                  {problem.number}
                </span>
                <h3 className="text-xl font-bold text-[var(--sr-hero-text)] tracking-tight">
                  {problem.title}
                </h3>
                <p className="text-sm text-[var(--sr-hero-text-muted)] leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Respuesta / Propuesta de valor de StyleRadar */}
        <div className="p-8 md:p-10 rounded-2xl bg-[#F8F7FC]/90 dark:bg-gradient-to-r dark:from-purple-950/40 dark:via-violet-900/30 dark:to-purple-950/50 backdrop-blur-2xl border border-purple-300/60 dark:border-purple-400/30 shadow-md dark:shadow-[0_12px_40px_rgba(139,92,246,0.25)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="text-lg md:text-xl font-medium text-[var(--sr-hero-text)] leading-relaxed">
            <strong className="text-[var(--sr-hero-text)] font-extrabold font-sans">StyleRadar</strong> junta el
            inventario de las marcas y tiendas independientes en un solo mapa:{' '}
            <span className="text-[#3b0764] font-bold">lo que hay hoy, en tu talla y cerca de tu barrio.</span>
          </p>
        </div>

        <div className="space-y-6 pt-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--sr-accent)]">StyleRadar conecta</p>
            <h3 className="mt-2 text-2xl md:text-3xl font-extrabold text-[var(--sr-hero-text)]">Personas, tiendas y fundaciones</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {audiences.map(({ image, label }) => (
              <figure key={label} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-black/10 dark:border-purple-400/25 bg-white/85 dark:bg-white/[0.04] backdrop-blur-xl shadow-lg">
                <img
                  src={image}
                  alt={label}
                  loading="lazy"
                  className="h-full w-full object-cover object-center"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-4 pt-12 text-sm font-bold text-[#ffffff]">{label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

