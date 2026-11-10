import type { ItemResponseDto } from '../types/item.dto'

export const ITEMS: ItemResponseDto[] = [
  { id: 'p1', nombre: 'Blazer oversize', tienda: 'Nómada Studio', barrio: 'Usaquén', precio: 189000, estilo: 'Elegante', tipo: 'Saco', color: 'Negro', tallas: ['S', 'M', 'L'], imagen: '/img/productos/blazer-oversize.jpg', distanciaKm: 6.3 },
  { id: 'p2', nombre: 'Pantalón de pinzas', tienda: 'Nómada Studio', barrio: 'Usaquén', precio: 139000, estilo: 'Elegante', tipo: 'Pantalón', color: 'Gris', tallas: ['28', '30', '32'], imagen: '/img/productos/pantalon-de-pinzas.jpg', distanciaKm: 6.3 },
  { id: 'p3', nombre: 'Hoodie azul noche', tienda: 'Luna Store', barrio: 'Chapinero', precio: 119000, estilo: 'Streetwear', tipo: 'Buzo', color: 'Azul', tallas: ['M', 'L', 'XL'], imagen: '/img/productos/hoodie-azul-noche.jpg', distanciaKm: 1.1 },
  { id: 'p4', nombre: 'Jean ancho azul', tienda: 'Luna Store', barrio: 'Chapinero', precio: 129000, estilo: 'Streetwear', tipo: 'Pantalón', color: 'Azul', tallas: ['30', '32', '34'], imagen: '/img/productos/jean-ancho-azul.jpg', distanciaKm: 1.1 },
  { id: 'p5', nombre: 'Chaqueta de nylon', tienda: 'Kicks Local', barrio: 'Chicó', precio: 210000, estilo: 'Techwear', tipo: 'Chaqueta', color: 'Negro', tallas: ['S', 'M'], imagen: '/img/productos/chaqueta-de-nylon.jpg', distanciaKm: 3.4 },
  { id: 'p6', nombre: 'Chaqueta de cuero', tienda: 'The Local Lab', barrio: 'Zona G', precio: 320000, estilo: 'Vintage', tipo: 'Chaqueta', color: 'Negro', tallas: ['M', 'L'], imagen: '/img/productos/r2c3-chaqueta-cuero.jpg', distanciaKm: 1.0 },
  { id: 'p7', nombre: 'Botas de plataforma', tienda: 'The Local Lab', barrio: 'Zona G', precio: 240000, estilo: 'Vintage', tipo: 'Calzado', color: 'Negro', tallas: ['37', '38', '39'], imagen: '/img/productos/botas-de-plataforma.jpg', distanciaKm: 1.0 },
  { id: 'p8', nombre: 'Suéter de canalé crudo', tienda: 'Luna Store', barrio: 'Chapinero', precio: 99000, estilo: 'Casual', tipo: 'Suéter', color: 'Crudo', tallas: ['S', 'M', 'L'], imagen: '/img/productos/sueter-de-canale-crudo.jpg', distanciaKm: 1.1 },
  { id: 'p9', nombre: 'Tenis de trail', tienda: 'Luna Store', barrio: 'Chapinero', precio: 319000, estilo: 'Streetwear', tipo: 'Calzado', color: 'Blanco', tallas: ['38', '39', '40'], imagen: '/img/productos/botas-de-plataforma.jpg', distanciaKm: 1.2 },
  { id: 'p10', nombre: 'Gorra NY lavada', tienda: 'Luna Store', barrio: 'Chapinero', precio: 79000, estilo: 'Streetwear', tipo: 'Accesorio', color: 'Negro', tallas: ['Única'], imagen: '/img/productos/chaqueta-de-nylon.jpg', distanciaKm: 1.1 },
  { id: 'p11', nombre: 'Conjunto técnico negro', tienda: 'Luna Store', barrio: 'Chapinero', precio: 389000, estilo: 'Techwear', tipo: 'Buzo', color: 'Negro', tallas: ['M', 'L'], imagen: '/img/productos/hoodie-azul-noche.jpg', distanciaKm: 1.3 },
  { id: 'p12', nombre: 'Gabardina de cuero', tienda: 'Nómada Studio', barrio: 'Usaquén', precio: 570000, estilo: 'Vintage', tipo: 'Chaqueta', color: 'Café', tallas: ['M', 'L'], imagen: '/img/productos/r2c3-chaqueta-cuero.jpg', distanciaKm: 6.1 },
  { id: 'p13', nombre: 'Saco sastre vintage', tienda: 'Segunda mano', barrio: 'Chapinero', precio: 145000, estilo: 'Vintage', tipo: 'Saco', color: 'Negro', tallas: ['S', 'M'], imagen: '/img/productos/blazer-oversize.jpg', distanciaKm: 1.5 },
  { id: 'p14', nombre: 'Chaqueta bomber vintage', tienda: 'Segunda mano', barrio: 'Teusaquillo', precio: 120000, estilo: 'Vintage', tipo: 'Chaqueta', color: 'Café', tallas: ['M'], imagen: '/img/productos/r2c3-chaqueta-cuero.jpg', distanciaKm: 2.8 },
]

export const RECOMMENDED_ITEMS = [
  {
    id: 'p9',
    nombre: 'Tenis de trail',
    tienda: 'Luna Store',
    precio: 319000,
    etiqueta: 'URBANA · TALLA 38',
    imagen: '/img/productos/botas-de-plataforma.jpg',
  },
  {
    id: 'p10',
    nombre: 'Gorra NY lavada',
    tienda: 'Luna Store',
    precio: 79000,
    etiqueta: 'URBANA · SE PARECE A TU WISHLIST',
    imagen: '/img/productos/chaqueta-de-nylon.jpg',
  },
  {
    id: 'p11',
    nombre: 'Conjunto técnico negro',
    tienda: 'Luna Store',
    precio: 389000,
    etiqueta: 'URBANA · TALLA M',
    badge: 'NUEVA LLEGADA',
    imagen: '/img/productos/hoodie-azul-noche.jpg',
  },
  {
    id: 'p12',
    nombre: 'Gabardina de cuero',
    tienda: 'Nómada Studio',
    precio: 570000,
    etiqueta: 'URBANA · TALLA M',
    imagen: '/img/productos/r2c3-chaqueta-cuero.jpg',
  },
]
