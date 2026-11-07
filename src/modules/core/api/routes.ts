/**
 * Rutas del API Gateway que usa el front, agrupadas por microservicio.
 * El front solo conoce estos prefijos; el Gateway decide a qué servicio y puerto va cada uno.
 * Si un equipo cambia una ruta, se cambia aquí y en la tabla «Rutas del API Gateway» del README.
 */
export const API = {
  /** ms-auth (8100) · Estación CADche */
  auth: '/api/auth',
  /** ms-item-catalogo (8220) · Estación RESTrepo */
  items: '/api/items',
  /** ms-probador-virtual (8500) · Estación Portal 8080 */
  tryOn: '/api/tryon',
  /** ms-segunda-vida-donaciones (8520) · Estación Portal 8080 */
  secondHand: '/api/second-hand',
  /** ms-segunda-vida-donaciones (8520) · Estación Portal 8080 */
  donations: '/api/donations',
} as const
