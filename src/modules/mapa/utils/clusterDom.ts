import type { GrupoPines } from './mapUtils'
import type { MapPinDto } from '../types/map.dto'

/** Texto de cada lugar de un pin agrupado: «Tienda · Casual» o «Fundación». */
export const etiquetaPin = (p: MapPinDto): string => (p.tipo === 'fundacion' ? 'Fundación' : `Tienda${p.cat ? ` · ${p.cat}` : ''}`)

/** Cuántos lugares junta el pin, dicho en palabras: «2 lugares aquí». */
export const tituloGrupo = (g: GrupoPines): string => `${g.pins.length} lugares aquí`

/** Nombre accesible del pin agrupado (lo lee el lector de pantalla): «2 lugares en este sitio: A, B». */
export const nombreGrupo = (g: GrupoPines): string => `${g.pins.length} lugares en este sitio: ${g.pins.map((p) => p.name).join(', ')}`

/** Pin agrupado: el mismo pin de siempre, pero con el número adentro. Tiene forma de círculo de fundación solo si todos lo son. */
export function crearPinGrupo(g: GrupoPines): HTMLButtonElement {
  const soloFundaciones = g.pins.every((p) => p.tipo === 'fundacion')
  const el = document.createElement('button')
  el.type = 'button'
  el.className = `sr-mb-pin sr-mb-cluster${soloFundaciones ? ' found' : ''}`
  el.setAttribute('aria-label', nombreGrupo(g))
  el.setAttribute('aria-haspopup', 'dialog')
  el.setAttribute('data-id', g.id)
  el.setAttribute('data-count', String(g.pins.length))

  const forma = document.createElement('i')
  forma.className = `sr-pin-shape ${soloFundaciones ? 'found' : 'store'}`
  const ico = document.createElement('span')
  ico.className = 'sr-pin-ico'
  const num = document.createElement('b')
  num.className = 'sr-pin-count'
  num.textContent = String(g.pins.length)
  ico.appendChild(num)
  forma.appendChild(ico)
  el.appendChild(forma)
  return el
}

/** Al pasar el cursor: los nombres, sin tener que hacer clic. Solo texto (nada de HTML armado a mano). */
export function crearNombresGrupo(g: GrupoPines): HTMLElement {
  const card = document.createElement('div')
  card.className = 'sr-mini-card sr-cluster-card'
  card.setAttribute('role', 'tooltip')
  const h = document.createElement('h4')
  h.className = 'sr-mc-title'
  h.textContent = tituloGrupo(g)
  const ul = document.createElement('ul')
  ul.className = 'sr-cluster-names'
  for (const p of g.pins) {
    const li = document.createElement('li')
    li.textContent = p.name
    ul.appendChild(li)
  }
  const hint = document.createElement('div')
  hint.className = 'sr-mc-hint'
  hint.textContent = 'Clic para elegir'
  card.append(h, ul, hint)
  return card
}

/** Al hacer clic: la lista para elegir uno. Cada lugar es un botón (se alcanza con Tab y se elige con Enter). */
export function crearListaGrupo(g: GrupoPines, alElegir: (p: MapPinDto) => void): HTMLElement {
  const box = document.createElement('div')
  box.className = 'sr-mini-card sr-cluster-list'
  box.setAttribute('role', 'dialog')
  box.setAttribute('aria-label', `Elige uno de los ${g.pins.length} lugares`)
  const h = document.createElement('h4')
  h.className = 'sr-mc-title'
  h.textContent = `Elige uno de los ${g.pins.length} lugares`
  const ul = document.createElement('ul')
  ul.className = 'sr-cluster-items'
  for (const p of g.pins) {
    const li = document.createElement('li')
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'sr-cluster-item'
    b.setAttribute('data-pin-id', p.id)
    const nombre = document.createElement('span')
    nombre.className = 'sr-cluster-item-name'
    nombre.textContent = p.name
    const tipo = document.createElement('span')
    tipo.className = 'sr-cluster-item-type'
    tipo.textContent = etiquetaPin(p)
    b.append(nombre, tipo)
    b.addEventListener('click', (e) => {
      e.stopPropagation()
      alElegir(p)
    })
    li.appendChild(b)
    ul.appendChild(li)
  }
  box.append(h, ul)
  return box
}
