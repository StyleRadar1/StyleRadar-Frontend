import { isoDay } from '../utils/dates'
import type { DonationDto, FoundationDto } from '../types/donation.dto'
import type { ListingDto } from '../types/secondhand.dto'

const img = (n: string) => `/img/productos/${n}.jpg`

/** Publicaciones de prueba. u-1 es la compradora demo (usuario@styleradar.co). */
export const seedListings = (): ListingDto[] => [
  { id: 'l1', titulo: 'Jean recto azul claro', categoria: 'Pantalones', talla: '30', conservacion: 'MUY_BUENO', marca: 'Levi’s', descripcion: 'Tiro alto, lo usé pocas veces. Sin rotos ni manchas.', precio: 85000, fotos: [img('jean-ancho-azul')], estado: 'DISPONIBLE', vendedor: { id: 'u-1', nombre: 'Valentina R.' }, barrio: 'Chapinero', creadaEn: isoDay(-12) },
  { id: 'l2', titulo: 'Chaqueta de cuero negra', categoria: 'Chaquetas', talla: 'M', conservacion: 'BUENO', marca: 'Sin marca', descripcion: 'Cuero real, tiene marcas de uso en los codos.', precio: 160000, fotos: [img('r2c3-chaqueta-cuero')], estado: 'VENDIDA', vendedor: { id: 'u-1', nombre: 'Valentina R.' }, barrio: 'Chapinero', creadaEn: isoDay(-30) },
  { id: 'l3', titulo: 'Blazer negro oversize', categoria: 'Chaquetas', talla: 'S', conservacion: 'COMO_NUEVO', marca: 'Zara', descripcion: 'Lo usé una vez para una entrevista. Tiene la etiqueta.', precio: 120000, fotos: [img('blazer-oversize')], estado: 'DISPONIBLE', vendedor: { id: 'u-2', nombre: 'Mateo P.' }, barrio: 'Teusaquillo', creadaEn: isoDay(-3) },
  { id: 'l4', titulo: 'Suéter de canalé', categoria: 'Suéteres', talla: 'M', conservacion: 'MUY_BUENO', marca: 'Mango', descripcion: 'Color crudo, muy abrigado, sin motas.', precio: 55000, fotos: [img('sueter-de-canale-crudo')], estado: 'DISPONIBLE', vendedor: { id: 'u-3', nombre: 'Sofía L.' }, barrio: 'Chicó', creadaEn: isoDay(-5) },
  { id: 'l5', titulo: 'Botas de plataforma', categoria: 'Calzado', talla: '38', conservacion: 'BUENO', marca: 'Bata', descripcion: 'Suela en buen estado, punta un poco gastada.', precio: 90000, fotos: [img('botas-de-plataforma')], estado: 'DISPONIBLE', vendedor: { id: 'u-4', nombre: 'Laura T.' }, barrio: 'Suba', creadaEn: isoDay(-8) },
  { id: 'l6', titulo: 'Hoodie azul', categoria: 'Suéteres', talla: 'L', conservacion: 'MUY_BUENO', marca: 'Nike', descripcion: 'Perchado por dentro, sin bolitas.', precio: 70000, fotos: [img('hoodie-azul-noche')], estado: 'RETIRADA', vendedor: { id: 'u-3', nombre: 'Sofía L.' }, barrio: 'Chicó', creadaEn: isoDay(-20) },
]

export const FOUNDATIONS: FoundationDto[] = [
  { id: 'abrigo', nombre: 'Fundación Abrigo Bogotá', barrio: 'Chapinero', distanciaKm: 1.4, categorias: ['Chaquetas', 'Suéteres', 'Calzado', 'Pantalones'], activa: true,
    puntos: [{ id: 'abrigo-1', nombre: 'Sede Chapinero', direccion: 'Cl. 45 #13-40' }, { id: 'abrigo-2', nombre: 'Punto Parque de la 93', direccion: 'Cra. 11A #93-20' }] },
  { id: 'dignidad', nombre: 'Vestir con Dignidad', barrio: 'Teusaquillo', distanciaKm: 3.2, categorias: ['Camisas', 'Pantalones', 'Chaquetas', 'Faldas', 'Vestidos'], activa: true,
    puntos: [{ id: 'dig-1', nombre: 'Sede Teusaquillo', direccion: 'Cra. 17 #39-12' }] },
  { id: 'suba', nombre: 'Ropero Comunitario Suba', barrio: 'Suba', distanciaKm: 9.8, categorias: ['Camisetas', 'Camisas', 'Pantalones', 'Calzado', 'Accesorios', 'Suéteres'], activa: true,
    puntos: [{ id: 'suba-1', nombre: 'Salón comunal', direccion: 'Cra. 91 #145-20' }] },
  { id: 'kennedy', nombre: 'Banco de Ropa Kennedy', barrio: 'Kennedy', distanciaKm: 12.1, categorias: ['Camisetas', 'Pantalones', 'Chaquetas'], activa: false, puntos: [] },
]

/** Solicitudes de prueba para la fundación demo (f-1 → abrigo). */
export const seedDonations = (): DonationDto[] => {
  const abrigo = { id: 'abrigo', nombre: 'Fundación Abrigo Bogotá' }
  return [
    { id: 'd1', fundacion: abrigo, donante: { id: 'u-1', nombre: 'Valentina Rojas' }, prenda: { titulo: 'Suéter trenzado crudo', categoria: 'Suéteres', talla: 'M', conservacion: 'MUY_BUENO', cantidad: 1, descripcion: 'Lana, muy abrigado.' },
      fotos: [img('sueter-de-canale-crudo')], logistica: { modalidad: 'RECOGIDA', fecha: isoDay(3), franja: '8:00 a 12:00', direccion: 'Cra. 7 #54-20, Chapinero' }, estado: 'PENDIENTE', creadaEn: isoDay(-1) },
    { id: 'd2', fundacion: abrigo, donante: { id: 't-1', nombre: 'Luna Store' }, prenda: { titulo: 'Chaquetas track de temporada pasada', categoria: 'Chaquetas', talla: 'S a XL', conservacion: 'COMO_NUEVO', cantidad: 8, descripcion: 'Ocho chaquetas nuevas con etiqueta.' },
      fotos: [img('chaqueta-de-nylon')], logistica: { modalidad: 'ENTREGA_EN_PUNTO', fecha: isoDay(2), franja: '12:00 a 15:00', puntoId: 'abrigo-1', puntoNombre: 'Sede Chapinero' }, estado: 'PENDIENTE', creadaEn: isoDay(-2) },
    { id: 'd3', fundacion: abrigo, donante: { id: 'u-2', nombre: 'Mateo Pérez' }, prenda: { titulo: 'Chaqueta biker de cuero', categoria: 'Chaquetas', talla: 'L', conservacion: 'BUENO', cantidad: 1, descripcion: 'Le falta un botón del bolsillo.' },
      fotos: [img('r2c3-chaqueta-cuero')], logistica: { modalidad: 'ENTREGA_EN_PUNTO', fecha: isoDay(5), franja: '15:00 a 18:00', puntoId: 'abrigo-2', puntoNombre: 'Punto Parque de la 93' }, estado: 'APROBADA', creadaEn: isoDay(-4) },
    { id: 'd4', fundacion: abrigo, donante: { id: 'u-5', nombre: 'Laura Torres' }, prenda: { titulo: 'Botas Chelsea negras', categoria: 'Calzado', talla: '40', conservacion: 'MUY_BUENO', cantidad: 1, descripcion: 'Suela nueva.' },
      fotos: [img('botas-de-plataforma')], logistica: { modalidad: 'RECOGIDA', fecha: isoDay(0), franja: '8:00 a 12:00', direccion: 'Cl. 100 #15-30, Chicó' }, estado: 'EN_RECOGIDA', creadaEn: isoDay(-6) },
    { id: 'd5', fundacion: abrigo, donante: { id: 'u-6', nombre: 'Andrés Mora' }, prenda: { titulo: 'Pantalón de pinzas gris', categoria: 'Pantalones', talla: '32', conservacion: 'BUENO', cantidad: 1, descripcion: 'Algo largo de bota.' },
      fotos: [img('pantalon-de-pinzas')], logistica: { modalidad: 'RECOGIDA', fecha: isoDay(6), franja: '12:00 a 15:00', direccion: 'Cra. 50 #26-10' }, estado: 'EN_RECOGIDA', creadaEn: isoDay(-3) },
    { id: 'd6', fundacion: abrigo, donante: { id: 'u-7', nombre: 'Daniela Ortiz' }, prenda: { titulo: 'Hoodie azul', categoria: 'Suéteres', talla: 'L', conservacion: 'MUY_BUENO', cantidad: 1, descripcion: 'Sin detalles.' },
      fotos: [img('hoodie-azul-noche')], logistica: { modalidad: 'ENTREGA_EN_PUNTO', fecha: isoDay(-5), franja: '8:00 a 12:00', puntoId: 'abrigo-1', puntoNombre: 'Sede Chapinero' }, estado: 'ENTREGADA', comprobante: { codigo: 'SR-DON-0006', emitidoEn: isoDay(-5) }, creadaEn: isoDay(-9) },
  ]
}
