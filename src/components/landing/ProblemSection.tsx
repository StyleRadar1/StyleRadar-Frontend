import { urbanProblems } from '@/data/landingData'

export function ProblemSection() {
  const audiences = [
    { image: '/img/representantes/Q1.png', label: 'Personas' },
    { image: '/img/representantes/Q2.png', label: 'Tiendas locales' },
    { image: '/img/representantes/Q3.png', label: 'Fundaciones' },
  ]

  return (
    <section
      id="pe-que-es"
      className="relative py-24 md:py-32 px-6 md:px-12 bg-[#15121b] text-white border-t border-white/5"
      aria-labelledby="peQueTitle"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Cabecera de la sección */}
        <div className="max-w-3xl space-y-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a98be0]">
            Bogotá · el problema
          </p>
          <h2
            id="peQueTitle"
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]"
          >
            Comprar moda local todavía implica{' '}
            <span className="text-[#e8dccb] underline decoration-[#48119a] decoration-4 underline-offset-8">
              adivinar.
            </span>
          </h2>
          <p className="text-base md:text-lg text-[#d1ced7] leading-relaxed pt-2">
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
              className="p-8 rounded-2xl bg-[#1f1b26]/60 border border-white/10 hover:border-[#48119a]/70 hover:bg-[#1f1b26] transition-all group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <span className="inline-block text-sm font-black tracking-widest text-[#a98be0] group-hover:text-white transition-colors">
                  {problem.number}
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {problem.title}
                </h3>
                <p className="text-sm text-[#b9b9ca] leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Respuesta / Propuesta de valor de StyleRadar */}
        <div className="p-8 md:p-10 rounded-2xl bg-gradient-to-r from-[#211736] via-[#1b1528] to-[#161220] border border-[#48119a]/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="text-lg md:text-xl font-medium text-white/95 leading-relaxed">
            <strong className="text-white font-extrabold font-sans">StyleRadar</strong> junta el
            inventario de las marcas y tiendas independientes en un solo mapa:{' '}
            <span className="text-[#e8dccb]">lo que hay hoy, en tu talla y cerca de tu barrio.</span>
          </p>
        </div>

        <div className="space-y-6 pt-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a98be0]">StyleRadar conecta</p>
            <h3 className="mt-2 text-2xl md:text-3xl font-extrabold text-white">Personas, tiendas y fundaciones</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {audiences.map(({ image, label }) => (
              <figure key={label} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[#211d29]">
                <img src={image} alt={label} loading="lazy" className="h-full w-full object-cover" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-4 pt-12 text-sm font-bold text-white">{label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

