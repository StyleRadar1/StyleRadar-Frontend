import { describe, expect, it, vi } from 'vitest'
import type { MapPinDto } from '../types/map.dto'
import { agruparPines, distanciaKm, RADIO_AGRUPAR_M } from '../utils/mapUtils'
import { crearListaGrupo, crearNombresGrupo, crearPinGrupo, nombreGrupo } from '../utils/clusterDom'

const pin = (id: string, name: string, lng: number, lat: number, tipo: MapPinDto['tipo'] = 'tienda'): MapPinDto => ({
  id, tipo, name, cat: tipo === 'tienda' ? 'Casual' : 'Fundación', lngLat: [lng, lat], href: `/${id}`,
})
/** Corre un punto `m` metros hacia el norte (1° de latitud ≈ 111.195 km). */
const alNorte = (p: [number, number], m: number): [number, number] => [p[0], p[1] + m / 111195]

const BASE: [number, number] = [-74.0628, 4.6433]
const QA = pin('qa', 'Almacén Pruebas QA', ...BASE)
const PAGOS = pin('pagos', 'Almacén Pruebas Pagos QA', ...BASE) // misma coordenada que la otra, como en QA
const LUNA = pin('luna', 'Luna Store', -74.08, 4.66)

describe('BUG-20 mapa: lugares en el mismo sitio se ven como un solo pin con número', () => {
  it('el radio es de 15 metros', () => {
    expect(RADIO_AGRUPAR_M).toBe(15)
  })

  it('dos tiendas con la MISMA coordenada quedan en un grupo de 2', () => {
    const g = agruparPines([QA, PAGOS])
    expect(g).toHaveLength(1)
    expect(g[0].pins.map((p) => p.id)).toEqual(['qa', 'pagos'])
    expect(g[0].id).toBe('grupo:pagos|qa') // ids ordenados: no cambia aunque cambie el orden de la lista
    expect(g[0].lngLat).toEqual(BASE)
  })

  it('los lugares lejanos quedan solos, con su mismo id y coordenada (el pin de siempre)', () => {
    const g = agruparPines([QA, LUNA])
    expect(g).toHaveLength(2)
    expect(g[0]).toMatchObject({ id: 'qa', lngLat: BASE })
    expect(g[1]).toMatchObject({ id: 'luna', lngLat: [-74.08, 4.66] })
    expect(g.every((x) => x.pins.length === 1)).toBe(true)
  })

  it('con tres en el mismo sitio, el número es 3 y el resto no se mezcla', () => {
    const tercero = pin('cuarta', 'Otra Tienda', ...BASE)
    const g = agruparPines([QA, LUNA, PAGOS, tercero])
    expect(g).toHaveLength(2)
    expect(g.find((x) => x.pins.length === 3)?.pins.map((p) => p.id)).toEqual(['qa', 'pagos', 'cuarta'])
    expect(g.find((x) => x.pins.length === 1)?.id).toBe('luna')
  })

  it('la frontera: a 10 m se juntan; a 14 m se juntan; a 20 m NO', () => {
    for (const [m, juntos] of [[10, true], [14, true], [20, false], [100, false]] as const) {
      const lejos = pin('b', 'B', ...alNorte(BASE, m))
      expect(distanciaKm({ lng: BASE[0], lat: BASE[1] }, lejos.lngLat) * 1000).toBeCloseTo(m, 0)
      expect(agruparPines([QA, lejos])).toHaveLength(juntos ? 1 : 2)
    }
  })

  it('en cadena: A cerca de B y B cerca de C quedan juntos aunque A y C estén a más de 15 m', () => {
    const b = pin('b', 'B', ...alNorte(BASE, 10))
    const c = pin('c', 'C', ...alNorte(BASE, 20))
    const g = agruparPines([QA, b, c])
    expect(g).toHaveLength(1)
    expect(g[0].pins).toHaveLength(3)
    expect(g[0].lngLat[1]).toBeCloseTo(BASE[1] + 10 / 111195, 6) // el centro de los tres
  })

  it('una tienda y una fundación en el mismo sitio también se agrupan', () => {
    const fund = pin('abrigo', 'Fundación Abrigo', ...BASE, 'fundacion')
    expect(agruparPines([QA, fund])[0].pins.map((p) => p.tipo)).toEqual(['tienda', 'fundacion'])
  })

  it('sin pines no hay grupos, y un solo pin es un grupo de 1', () => {
    expect(agruparPines([])).toEqual([])
    expect(agruparPines([QA])).toEqual([{ id: 'qa', lngLat: BASE, pins: [QA] }])
  })

  it('se puede usar otro radio', () => {
    const b = pin('b', 'B', ...alNorte(BASE, 40))
    expect(agruparPines([QA, b], 50)).toHaveLength(1)
    expect(agruparPines([QA, b], 15)).toHaveLength(2)
  })
})

describe('pin agrupado: el número, los nombres al pasar el cursor y la lista al hacer clic', () => {
  const [grupo] = agruparPines([QA, PAGOS])

  it('el pin muestra el número sin tener que hacer clic y se anuncia con los nombres', () => {
    const el = crearPinGrupo(grupo)
    expect(el.tagName).toBe('BUTTON')
    expect(el.textContent).toBe('2')
    expect(el.classList.contains('sr-mb-pin')).toBe(true)
    expect(el.classList.contains('sr-mb-cluster')).toBe(true)
    expect(el.getAttribute('aria-label')).toBe('2 lugares en este sitio: Almacén Pruebas QA, Almacén Pruebas Pagos QA')
    expect(nombreGrupo(grupo)).toBe(el.getAttribute('aria-label'))
    expect(el.querySelector('.sr-pin-shape.store')).not.toBeNull()
  })

  it('el pin de solo fundaciones usa la forma de fundación', () => {
    const solo = agruparPines([pin('f1', 'F1', ...BASE, 'fundacion'), pin('f2', 'F2', ...BASE, 'fundacion')])[0]
    const el = crearPinGrupo(solo)
    expect(el.classList.contains('found')).toBe(true)
    expect(el.querySelector('.sr-pin-shape.found')).not.toBeNull()
  })

  it('con tres, el número es 3', () => {
    const tres = agruparPines([QA, PAGOS, pin('c', 'C', ...BASE)])[0]
    expect(crearPinGrupo(tres).textContent).toBe('3')
  })

  it('al pasar el cursor salen los nombres de todos', () => {
    const card = crearNombresGrupo(grupo)
    expect(card.textContent).toContain('2 lugares aquí')
    expect([...card.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['Almacén Pruebas QA', 'Almacén Pruebas Pagos QA'])
    expect(card.textContent).toContain('Clic para elegir')
  })

  it('al hacer clic sale una lista con un botón por lugar, y elegir uno lo entrega', () => {
    const elegir = vi.fn()
    const lista = crearListaGrupo(grupo, elegir)
    const botones = [...lista.querySelectorAll<HTMLButtonElement>('button.sr-cluster-item')]
    expect(botones.map((b) => b.querySelector('.sr-cluster-item-name')?.textContent)).toEqual(['Almacén Pruebas QA', 'Almacén Pruebas Pagos QA'])
    expect(botones[0].querySelector('.sr-cluster-item-type')?.textContent).toBe('Tienda · Casual')
    expect(lista.getAttribute('role')).toBe('dialog')
    botones[1].click()
    expect(elegir).toHaveBeenCalledTimes(1)
    expect(elegir).toHaveBeenCalledWith(PAGOS)
  })

  it('un nombre con etiquetas HTML se muestra como texto, no se interpreta', () => {
    const raro = agruparPines([pin('x', '<img src=x onerror=alert(1)>', ...BASE), PAGOS])[0]
    const lista = crearListaGrupo(raro, () => undefined)
    expect(lista.querySelector('img')).toBeNull()
    expect(lista.textContent).toContain('<img src=x onerror=alert(1)>')
    expect(crearNombresGrupo(raro).querySelector('img')).toBeNull()
  })
})
