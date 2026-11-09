import { useId } from 'react'
import { TEMAS, TEMA_LABEL, type Tema } from './tema'
import { useTema } from './useTema'

/** Selector de tema (P13). Es un <select> nativo: funciona con teclado y lector de pantalla. */
export function ThemeSelect({ className = '' }: { className?: string }) {
  const { tema, setTema } = useTema()
  const id = useId()
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <label htmlFor={id} className="sr-only">Tema de color</label>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-white/70" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20V2Z" /><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
      <select id={id} value={tema} onChange={(e) => setTema(e.target.value as Tema)}
        className="rounded-lg border border-white/25 bg-black/20 px-2 py-2 text-xs font-semibold text-blanco">
        {TEMAS.map((t) => <option key={t} value={t}>{TEMA_LABEL[t]}</option>)}
      </select>
    </span>
  )
}
