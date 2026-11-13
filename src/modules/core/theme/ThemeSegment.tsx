import { TEMAS, TEMA_LABEL } from './tema'
import { useTema } from './useTema'

/** Tema dentro del menú de cuenta: tres opciones a la vista en lugar de un select. */
export function ThemeSegment({ onPick }: { onPick?: () => void }) {
  const { tema, setTema } = useTema()
  return (
    <div role="group" aria-label="Tema" className="px-3 pb-2 pt-1">
      <p aria-hidden="true" className="pb-2 text-[0.6563rem] font-bold uppercase tracking-[.16em] text-white/60">Tema</p>
      <div className="flex rounded-lg bg-black/20 p-0.5">
        {TEMAS.map((t) => (
          <button key={t} type="button" role="menuitemradio" aria-checked={tema === t}
            onClick={() => { setTema(t); onPick?.() }}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold ${tema === t ? 'bg-arena text-grafito' : 'text-white/75 hover:bg-white/10'}`}>
            {TEMA_LABEL[t]}
          </button>
        ))}
      </div>
    </div>
  )
}
