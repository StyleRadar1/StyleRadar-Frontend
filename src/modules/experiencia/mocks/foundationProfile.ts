import type { FoundationProfileDto } from '../types/foundationProfile.dto'

/** Página de la fundación demo (f-1 → abrigo), con los mismos textos y fotos del prototipo. */
export const FOUNDATION_PROFILES: Record<string, FoundationProfileDto> = {
  abrigo: {
    id: 'abrigo',
    nombre: 'Fundación Abrigo Bogotá',
    barrio: 'Chapinero',
    activa: true,
    descripcion: 'Llevamos ropa de abrigo a personas en situación de calle en Bogotá. Cada chaqueta que recibimos sale a la calle en menos de dos semanas.',
    aQuienAyudamos: 'Personas en situación de calle y familias recién llegadas a Chapinero.',
    queHacemos: ['Jornadas nocturnas de entrega de chaquetas y cobijas', 'Ropero abierto los sábados para familias', 'Lavado y arreglo de prendas con voluntarios'],
    queRecibimos: ['Chaquetas y abrigos', 'Suéteres y buzos', 'Calzado cerrado', 'Cobijas'],
    necesidades: [{ nombre: 'Chaquetas talla M y L', avance: 82 }, { nombre: 'Calzado 40 a 43', avance: 55 }, { nombre: 'Cobijas', avance: 34 }],
    contacto: { direccion: 'Cl. 45 #13-40, Chapinero', horario: 'Lun a vie · 8:00 a 17:00', telefono: '+57 601 555 0301', correo: 'abrigo@styleradar.co', web: 'abrigobogota.org' },
    fotos: { portada: '/img/fundaciones/abrigo-trabajo.jpg', trabajo: '/img/fundaciones/abrigo-trabajo.jpg', donaciones: '/img/fundaciones/abrigo-donaciones.jpg' },
  },
}
