/**
 * Sin conexión: cualquier petición que no llega al servidor avisa con este evento y la app
 * muestra una sola pantalla completa (SinConexion), igual en todas las pantallas.
 */
export const EVENTO_SIN_CONEXION = 'sr:sin-conexion'

export function avisarSinConexion() {
  window.dispatchEvent(new Event(EVENTO_SIN_CONEXION))
}
