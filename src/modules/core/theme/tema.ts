/** P13 · Temas de StyleRadar. La elección se guarda con la misma clave del prototipo HTML. */
export const TEMAS = ['oscuro', 'claro', 'daltonico'] as const
export type Tema = (typeof TEMAS)[number]
export const TEMA_LABEL: Record<Tema, string> = { oscuro: 'Oscuro', claro: 'Claro', daltonico: 'Daltónico' }

const KEY = 'sr:tema'
const esTema = (v: unknown): v is Tema => typeof v === 'string' && (TEMAS as readonly string[]).includes(v)

export function leerTema(): Tema {
  try { const v = localStorage.getItem(KEY); return esTema(v) ? v : 'oscuro' } catch { return 'oscuro' }
}

/** Aplica el tema en <html data-tema> y lo guarda. */
export function aplicarTema(tema: Tema) {
  document.documentElement.dataset.tema = tema
  try { localStorage.setItem(KEY, tema) } catch { /* sin almacenamiento: dura lo que dure la pestaña */ }
  window.dispatchEvent(new CustomEvent('sr:tema', { detail: tema }))
}
