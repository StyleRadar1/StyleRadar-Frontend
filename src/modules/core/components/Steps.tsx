/** Indicador de pasos de un asistente (wizard). */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label={`Paso ${current + 1} de ${steps.length}`}>
      {steps.map((s, i) => (
        <li key={s} aria-current={i === current ? 'step' : undefined}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${i === current ? 'border-arena bg-arena text-grafito' : i < current ? 'border-violeta-claro/60 text-white' : 'border-white/15 text-white/60'}`}>
          <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full bg-black/20 text-[11px]">{i < current ? '✓' : i + 1}</span>{s}
        </li>
      ))}
    </ol>
  )
}
