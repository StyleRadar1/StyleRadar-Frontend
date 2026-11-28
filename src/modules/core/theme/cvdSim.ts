/**
 * Simulador de visión de color (daltonismo).
 *
 * Es una herramienta de REVISIÓN DE DISEÑO: aplica un filtro a toda la página para ver cómo la percibiría
 * una persona con cada tipo de daltonismo. Como el filtro va sobre <html>, afecta a TODO lo que se pinta
 * (tokens, colores escritos a mano, fotos, mapa), así que cualquier color nuevo que agregue el equipo queda
 * cubierto sin hacer nada. No es la ayuda para la persona usuaria: eso es el tema «Daltónico» y el diseño
 * que no depende solo del color.
 *
 * Matrices de Machado, Oliveira y Fernandes (2009) para RGB lineal; la acromatopsia usa la luminancia Rec. 709.
 */
export const MODOS_CVD = [
  'normal',
  'protanomalia',
  'protanopia',
  'deuteranomalia',
  'deuteranopia',
  'tritanomalia',
  'tritanopia',
  'acromatopsia',
] as const
export type ModoCvd = (typeof MODOS_CVD)[number]
export type ModoCvdActivo = Exclude<ModoCvd, 'normal'>

export const CVD_INFO: Record<ModoCvd, { etiqueta: string; detalle: string }> = {
  normal: { etiqueta: 'Visión normal', detalle: 'Sin filtro' },
  protanomalia: { etiqueta: 'Protanomalía', detalle: 'Rojo débil (leve)' },
  protanopia: { etiqueta: 'Protanopia', detalle: 'Sin rojo' },
  deuteranomalia: { etiqueta: 'Deuteranomalía', detalle: 'Verde débil (el más común)' },
  deuteranopia: { etiqueta: 'Deuteranopia', detalle: 'Sin verde' },
  tritanomalia: { etiqueta: 'Tritanomalía', detalle: 'Azul débil (leve)' },
  tritanopia: { etiqueta: 'Tritanopia', detalle: 'Sin azul' },
  acromatopsia: { etiqueta: 'Acromatopsia', detalle: 'Solo grises' },
}

/** Matriz 3×3 por fila (R', G', B'). Cada fila suma 1: los grises quedan igual. */
export const CVD_MATRIZ: Record<ModoCvdActivo, readonly number[]> = {
  protanomalia: [0.458064, 0.679578, -0.137642, 0.092785, 0.846313, 0.060902, -0.007494, -0.016807, 1.024301],
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deuteranomalia: [0.547494, 0.607765, -0.155259, 0.181692, 0.781742, 0.036566, -0.01041, 0.027275, 0.983136],
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritanomalia: [1.017277, 0.027029, -0.044306, -0.006113, 0.958479, 0.047634, 0.006379, 0.248708, 0.744913],
  tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
  acromatopsia: [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722],
}

/** Valores para <feColorMatrix type="matrix"> (4×5: sin cambio en alfa). */
export const matrizSvg = (m: readonly number[]) =>
  `${m[0]} ${m[1]} ${m[2]} 0 0  ${m[3]} ${m[4]} ${m[5]} 0 0  ${m[6]} ${m[7]} ${m[8]} 0 0  0 0 0 1 0`

export const idFiltroCvd = (modo: ModoCvdActivo) => `sr-cvd-${modo}`

const KEY = 'sr:cvd-sim'
export const esModoCvd = (v: unknown): v is ModoCvd =>
  typeof v === 'string' && (MODOS_CVD as readonly string[]).includes(v)

/** El enlace puede traer ?cvd=deuteranopia para compartir una vista con el equipo. */
export function leerCvdSim(): ModoCvd {
  try {
    const url = new URLSearchParams(window.location.search).get('cvd')
    if (esModoCvd(url)) return url
    const v = localStorage.getItem(KEY)
    return esModoCvd(v) ? v : 'normal'
  } catch {
    return 'normal'
  }
}

/** Aplica el simulador en <html data-cvd-sim> (la hoja cvdSim.css le asocia el filtro) y lo recuerda. */
export function aplicarCvdSim(modo: ModoCvd) {
  const raiz = document.documentElement
  if (modo === 'normal') raiz.removeAttribute('data-cvd-sim')
  else raiz.setAttribute('data-cvd-sim', modo)
  try {
    if (modo === 'normal') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, modo)
  } catch { /* sin almacenamiento: dura lo que dure la pestaña */ }
  window.dispatchEvent(new CustomEvent('sr:cvd-sim', { detail: modo }))
}
