import { describe, it, expect } from 'vitest'
import { filterPins, calcBounds, findPin, sortByDistance } from '../utils/mapUtils'
import type { MapPinDto } from '../types/map.dto'

const tienda: MapPinDto = {
  id: 'luna',
  tipo: 'tienda',
  name: 'Luna Store',
  cat: 'Sport',
  barrio: 'Chapinero',
  dir: 'Cra. 13 #57-22',
  d: '1,2 km',
  hours: 'Lun a sáb',
  lngLat: [-74.0628, 4.6433],
  href: '/tiendas/luna',
}

const fundacion: MapPinDto = {
  id: 'abrigo',
  tipo: 'fundacion',
  name: 'Fundación Abrigo',
  cat: 'Fundación',
  barrio: 'Chapinero',
  dir: 'Cl. 45 #13-40',
  d: '1,5 km',
  hours: 'Lun a vie',
  lngLat: [-74.0673, 4.6322],
  href: '/fundaciones/abrigo',
}

const tienda2: MapPinDto = {
  id: 'kicks',
  tipo: 'tienda',
  name: 'Kicks Local',
  cat: 'Confort',
  barrio: 'Chicó',
  dir: 'Cra. 11 #93-15',
  d: '4,0 km',
  hours: 'Lun a sáb',
  lngLat: [-74.0504, 4.6766],
  href: '/tiendas/kicks',
}

const allPins = [tienda, fundacion, tienda2]

describe('filterPins', () => {
  it('devuelve todos los pines con filtro "todos"', () => {
    expect(filterPins(allPins, 'todos')).toHaveLength(3)
  })

  it('filtra solo tiendas', () => {
    const result = filterPins(allPins, 'tiendas')
    expect(result).toHaveLength(2)
    expect(result.every((p) => p.tipo === 'tienda')).toBe(true)
  })

  it('filtra solo fundaciones', () => {
    const result = filterPins(allPins, 'fundaciones')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('abrigo')
  })
})

describe('calcBounds', () => {
  it('devuelve Bogotá por defecto si no hay pines', () => {
    const bounds = calcBounds([])
    expect(bounds).toEqual([[-74.16, 4.53], [-74.0, 4.77]])
  })

  it('encuadra los puntos dados', () => {
    const bounds = calcBounds(allPins) as [[number, number], [number, number]]
    // minLng = -74.0673, maxLng = -74.0504
    // minLat = 4.6322,   maxLat = 4.6766
    expect(bounds[0][0]).toBeCloseTo(-74.0673, 3)
    expect(bounds[0][1]).toBeCloseTo(4.6322, 3)
    expect(bounds[1][0]).toBeCloseTo(-74.0504, 3)
    expect(bounds[1][1]).toBeCloseTo(4.6766, 3)
  })

  it('funciona con un solo punto', () => {
    const bounds = calcBounds([tienda]) as [[number, number], [number, number]]
    expect(bounds[0][0]).toBeCloseTo(-74.0628, 3)
    expect(bounds[1][0]).toBeCloseTo(-74.0628, 3)
  })
})

describe('findPin', () => {
  it('encuentra un pin por id', () => {
    expect(findPin(allPins, 'luna')).toBe(tienda)
  })

  it('devuelve undefined si no existe', () => {
    expect(findPin(allPins, 'noexiste')).toBeUndefined()
  })
})

describe('sortByDistance', () => {
  it('ordena por distancia ascendente', () => {
    const result = sortByDistance(allPins)
    expect(result.map((p) => p.id)).toEqual(['luna', 'abrigo', 'kicks'])
  })

  it('no muta el array original', () => {
    const original = [...allPins]
    sortByDistance(allPins)
    expect(allPins).toEqual(original)
  })

  it('pines sin distancia van al final', () => {
    const sinDist = { ...tienda, id: 'x', d: '' }
    const result = sortByDistance([sinDist, fundacion])
    expect(result[0].id).toBe('abrigo')
    expect(result[1].id).toBe('x')
  })
})
