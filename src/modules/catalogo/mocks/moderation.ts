import type { ModerationItemDto, ModerationHistoryItemDto } from '../types/moderation.dto'

export let MOCK_MODERATION_ITEMS: ModerationItemDto[] = [
  {
    id: 'mod-1',
    titulo: 'Chaqueta bomber vintage café',
    publicador: 'Valentina Rojas',
    tipoPublicador: 'Persona',
    tipo: 'Segunda mano',
    precio: 120000,
    fecha: 'Hoy, 10:30 a. m.',
    imagen: '/img/productos/r2c3-chaqueta-cuero.jpg',
    categoria: 'Chaqueta',
    tallas: ['M'],
    nota: 'Primera publicación de la usuaria',
  },
  {
    id: 'mod-2',
    titulo: 'Pantalón cargo ripstop beige',
    publicador: 'Luna Store',
    tipoPublicador: 'Tienda',
    tipo: 'Catálogo',
    precio: 145000,
    fecha: 'Hoy, 09:15 a. m.',
    imagen: '/img/productos/pantalon-de-pinzas.jpg',
    categoria: 'Pantalón',
    tallas: ['30', '32', '34'],
    nota: 'Nueva llegada del catálogo',
  },
  {
    id: 'mod-3',
    titulo: 'Suéter trenzado crudo lana',
    publicador: 'Valentina Rojas',
    tipoPublicador: 'Persona',
    tipo: 'Segunda mano',
    precio: 65000,
    fecha: 'Ayer, 04:45 p. m.',
    imagen: '/img/productos/sueter-de-canale-crudo.jpg',
    categoria: 'Suéter',
    tallas: ['S'],
  },
  {
    id: 'mod-4',
    titulo: 'Blazer estructurado azul marino',
    publicador: 'Nómada Studio',
    tipoPublicador: 'Tienda',
    tipo: 'Catálogo',
    precio: 210000,
    fecha: 'Ayer, 02:20 p. m.',
    imagen: '/img/productos/blazer-oversize.jpg',
    categoria: 'Saco',
    tallas: ['S', 'M', 'L'],
    nota: 'Colección sastre',
  },
  {
    id: 'mod-5',
    titulo: 'Botines chelsea en cuero negro',
    publicador: 'The Local Lab',
    tipoPublicador: 'Tienda',
    tipo: 'Catálogo',
    precio: 260000,
    fecha: 'Hace 2 días',
    imagen: '/img/productos/botas-de-plataforma.jpg',
    categoria: 'Calzado',
    tallas: ['38', '39', '40'],
  },
]

export let MOCK_MODERATION_HISTORY: ModerationHistoryItemDto[] = [
  {
    id: 'hist-1',
    itemId: 'p8',
    titulo: 'Suéter de canalé crudo',
    publicador: 'Luna Store',
    aprobado: true,
    fecha: 'Ayer',
  },
  {
    id: 'hist-2',
    itemId: 'old-1',
    titulo: 'Gafas de sol réplica',
    publicador: 'Carlos Pérez',
    aprobado: false,
    motivo: 'Prenda no permitida en StyleRadar',
    fecha: 'Hace 3 días',
  },
  {
    id: 'hist-3',
    itemId: 'p6',
    titulo: 'Chaqueta de cuero biker',
    publicador: 'The Local Lab',
    aprobado: true,
    fecha: 'Hace 4 días',
  },
]

export function resetMockModeration() {
  // Función auxiliar para tests
}

