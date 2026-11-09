import { ITEMS } from './items'
import type { PlaylistDto } from '../types/playlist.dto'

export let MOCK_PLAYLISTS: PlaylistDto[] = [
  {
    id: 'pl-1',
    nombre: 'Monocromático Chapinero',
    descripcion: 'Looks en capas y tonos oscuros para recorrer la carrera 13 y la zona G.',
    creador: { id: 'u-1', nombre: 'Valentina Rojas' },
    visibilidad: 'PUBLICA',
    prendas: [ITEMS[0], ITEMS[1], ITEMS[5]],
    likes: 142,
    guardados: 48,
    destacada: true,
    fechaCreacion: '2026-10-15',
  },
  {
    id: 'pl-2',
    nombre: 'Streetwear Bogotá Lluvia',
    descripcion: 'Prendas repelentes al agua y hoodies pesados con actitud urbana.',
    creador: { id: 'u-2', nombre: 'Mateo Calle' },
    visibilidad: 'PUBLICA',
    prendas: [ITEMS[2], ITEMS[3], ITEMS[4]],
    likes: 215,
    guardados: 89,
    destacada: true,
    fechaCreacion: '2026-10-22',
  },
  {
    id: 'pl-3',
    nombre: 'Sastrería contemporánea',
    descripcion: 'De la oficina al café: blazers amplios combinados con zapatillas.',
    creador: { id: 'u-3', nombre: 'Antonia Sastre' },
    visibilidad: 'PUBLICA',
    prendas: [ITEMS[0], ITEMS[7]],
    likes: 98,
    guardados: 31,
    fechaCreacion: '2026-11-01',
  },
]

