import type { AlertasResumenDto, NotificacionDto } from '../types/notification.dto'

/**
 * Datos de prueba por usuario (ids de las cuentas demo). La cuenta Usuario está en el plan Radar
 * con 2 de 3 alertas activas, igual que en el prototipo, para que el límite del plan se pueda mostrar.
 */
export const seedAlerts = (): Record<string, AlertasResumenDto> => ({
  'u-1': {
    plan: 'RADAR',
    limiteAlertas: 0,
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
    { id: 'n1', tipo: 'COINCIDENCIA_BUSQUEDA', titulo: 'Nueva prenda para tu búsqueda', detalle: '«Botas negras talla 38»: Botas Chelsea de plataforma llegaron a Kicks Local.', enlace: '/catalogo?q=botas', leida: false, creadaEn: '2026-11-09T08:10:00' },
    { id: 'n2', tipo: 'MENSAJE_NUEVO', titulo: 'Sofía L. te respondió', detalle: 'Collar medalla dorado: «Sí, sigue disponible».', enlace: '/mensajes?c=c1', leida: false, creadaEn: '2026-11-08T19:40:00' },
    { id: 'n3', tipo: 'REPOSICION_STOCK', titulo: 'Volvió a estar disponible', detalle: 'Chaqueta track negra ya tiene unidades en Luna Store.', enlace: '/catalogo?q=chaqueta%20track', leida: true, creadaEn: '2026-11-06T12:00:00' },
  ],
  // Tienda y fundación usan la misma campana: sus avisos llegan por su usuario, según el evento
  't-1': [
    { id: 'n10', tipo: 'MODERACION_PRENDA', titulo: 'Estado de moderación actualizado', detalle: 'Tu prenda «Chaqueta track negra» fue aprobada.', enlace: '/catalogo/mis-prendas/p5', leida: false, creadaEn: '2026-11-09T10:15:00' },
    { id: 'n11', tipo: 'MENSAJE_NUEVO', titulo: 'Nuevo mensaje de Mateo P.', detalle: '¿La tienen en talla L?', enlace: '/chat/conversaciones/c4', leida: false, creadaEn: '2026-11-09T09:20:00' },
    { id: 'n12', tipo: 'PAGO_CONFIRMADO', titulo: 'Pago confirmado', detalle: 'Tu suscripción de almacén aliado quedó activa.', enlace: '/planes/mi-plan', leida: true, creadaEn: '2026-11-03T14:00:00' },
  ],
  'f-1': [
    { id: 'n20', tipo: 'SOLICITUD_DONACION', titulo: 'Nueva solicitud de donación', detalle: 'Valentina R. quiere donar «Suéter trenzado crudo».', enlace: '/donaciones/d1', leida: false, creadaEn: '2026-11-09T08:00:00' },
    { id: 'n21', tipo: 'CAMBIO_DONACION', titulo: 'Actualización de tu donación', detalle: 'La donación #d1 pasó a «En recogida».', enlace: '/donaciones/d1', leida: true, creadaEn: '2026-11-06T16:30:00' },
  ],
})
