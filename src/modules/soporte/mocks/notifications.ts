import type { AlertasResumenDto, NotificacionDto } from '../types/notification.dto'

/**
 * Datos de prueba por usuario (ids de las cuentas demo). La cuenta Usuario está en el plan Radar
 * con 2 de 3 alertas activas, igual que en el prototipo, para que el límite del plan se pueda mostrar.
 */
export const seedAlerts = (): Record<string, AlertasResumenDto> => ({
  'u-1': {
    plan: 'RADAR',
    limiteAlertas: 3,
    alertas: [
      { id: 'a1', prendaId: 'r1c2-tenis-retro', prenda: 'Tenis retro gris', tienda: 'Segunda mano', activa: true, creadaEn: '2026-09-15' },
      { id: 'a2', prendaId: 'r1c3-botella', prenda: 'Botella térmica 1 L', tienda: 'Luna Store', activa: false, creadaEn: '2026-09-02' },
    ],
    busquedas: [
      { id: 's1', nombre: 'Botas negras talla 38', descripcion: 'botas · Negro · talla 38 · cerca de Chapinero', alerta: true, coincidenciasNuevas: 2, creadaEn: '2026-09-10' },
      { id: 's2', nombre: 'Chaqueta de cuero M', descripcion: 'chaqueta cuero · talla M', alerta: false, coincidenciasNuevas: 0, creadaEn: '2026-08-28' },
    ],
  },
})

export const seedNotifications = (): Record<string, NotificacionDto[]> => ({
  'u-1': [
    { id: 'n1', tipo: 'NUEVA_COINCIDENCIA', titulo: 'Nueva prenda para tu búsqueda', detalle: '«Botas negras talla 38»: Botas Chelsea de plataforma llegaron a Kicks Local.', enlace: '/catalogo?q=botas', leida: false, creadaEn: '2026-11-09T08:10:00' },
    { id: 'n2', tipo: 'MENSAJE', titulo: 'Sofía L. te respondió', detalle: 'Collar medalla dorado: «Sí, sigue disponible».', enlace: '/mensajes?c=c1', leida: false, creadaEn: '2026-11-08T19:40:00' },
    { id: 'n3', tipo: 'DISPONIBILIDAD_RESTABLECIDA', titulo: 'Volvió a estar disponible', detalle: 'Chaqueta track negra ya tiene unidades en Luna Store.', enlace: '/catalogo?q=chaqueta%20track', leida: true, creadaEn: '2026-11-06T12:00:00' },
  ],
})
