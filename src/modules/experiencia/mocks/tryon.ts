import type { TryOnGarmentDto } from '../types/tryon.dto'

export const TRYON_GARMENTS: TryOnGarmentDto[] = [
  { id: 'remanence-state', nombre: 'Chaqueta State Negra', tienda: 'Remanence · Medellín', imagen: 'https://remanence.co/cdn/shop/files/CHAQUETA-STATE-NEGRA-HOMBRE_01.jpg?v=1791578052&width=1000', zona: 'SUPERIOR', tallas: ['S', 'M', 'L', 'XL'], disponible: true },
  { id: 'p1', nombre: 'Blazer oversize', tienda: 'Nómada Studio', imagen: '/img/productos/blazer-oversize.jpg', zona: 'SUPERIOR', tallas: ['S', 'M', 'L'], disponible: true },
  { id: 'p3', nombre: 'Hoodie azul noche', tienda: 'Luna Store', imagen: '/img/productos/hoodie-azul-noche.jpg', zona: 'SUPERIOR', tallas: ['M', 'L', 'XL'], disponible: true },
  { id: 'p5', nombre: 'Chaqueta de nylon', tienda: 'Kicks Local', imagen: '/img/productos/chaqueta-de-nylon.jpg', zona: 'SUPERIOR', tallas: ['S', 'M'], disponible: false },
  { id: 'p6', nombre: 'Chaqueta de cuero', tienda: 'The Local Lab', imagen: '/img/productos/r2c3-chaqueta-cuero.jpg', zona: 'SUPERIOR', tallas: ['M', 'L'], disponible: true },
  { id: 'p8', nombre: 'Suéter de canalé crudo', tienda: 'Luna Store', imagen: '/img/productos/sueter-de-canale-crudo.jpg', zona: 'SUPERIOR', tallas: ['S', 'M', 'L'], disponible: true },
  { id: 'p2', nombre: 'Pantalón de pinzas', tienda: 'Nómada Studio', imagen: '/img/productos/pantalon-de-pinzas.jpg', zona: 'INFERIOR', tallas: ['28', '30', '32'], disponible: true },
  { id: 'p4', nombre: 'Jean ancho azul', tienda: 'Luna Store', imagen: '/img/productos/jean-ancho-azul.jpg', zona: 'INFERIOR', tallas: ['30', '32', '34'], disponible: true },
  { id: 'p7', nombre: 'Botas de plataforma', tienda: 'The Local Lab', imagen: '/img/productos/botas-de-plataforma.jpg', zona: 'NO_COMPATIBLE', tallas: ['37', '38', '39'], disponible: true },
]

/** Tiempos del job simulado (ms). */
export const MOCK_JOB_TIMES = { pending: 1200, done: 4500 }
