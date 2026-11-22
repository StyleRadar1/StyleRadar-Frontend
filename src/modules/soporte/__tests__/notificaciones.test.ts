import { beforeEach, describe, expect, it } from 'vitest'
import { notificationService, resetNotificationsMock, TAM_PAGINA } from '../services/notificationService'
import { TIPOS_AVISO } from '../types/notification.dto'
import { aNotificacion, enlaceFront } from '../utils/notificaciones'
import { INFO_AVISO } from '../utils/tiposAviso'
import { loginAs } from './helpers'

describe('enlaces de los avisos del servicio → rutas del front', () => {
  it.each([
    ['/chat/conversaciones/42', 'COMPRADOR', '/mensajes?c=42'],
    ['/chat/conversaciones/42', 'ADMIN_ALMACEN', '/mensajes?c=42'],
    ['/catalogo/prendas/abc-123', 'COMPRADOR', '/catalogo/abc-123'],
    ['/segunda-mano/77', 'COMPRADOR', '/segunda-mano'],
    ['/mensajes?c=c1', 'COMPRADOR', '/mensajes?c=c1'],
  ])('%s (%s) → %s', (de, rol, a) => expect(enlaceFront(de, rol)).toBe(a))

  it('la misma ruta del back lleva a una pantalla distinta según el rol', () => {
    // Vista del dueño de la prenda
    expect(enlaceFront('/catalogo/mis-prendas/abc-123', 'ADMIN_ALMACEN')).toBe('/tienda/inventario')
    expect(enlaceFront('/catalogo/mis-prendas/abc-123', 'COMPRADOR')).toBe('/segunda-mano')
    // Pago confirmado: la tienda va a su suscripción; una persona, a sus pagos
    expect(enlaceFront('/planes/mi-plan', 'ADMIN_ALMACEN')).toBe('/tienda/suscripcion')
    expect(enlaceFront('/planes/mi-plan', 'COMPRADOR')).toBe('/perfil/pagos')
    // Donaciones: la fundación gestiona; quien dona ve la suya
    expect(enlaceFront('/donaciones/9', 'REPRESENTANTE_FUNDACION')).toBe('/fundacion/donaciones')
    expect(enlaceFront('/donaciones/9', 'COMPRADOR')).toBe('/donar?donacion=9')
    expect(enlaceFront('/donaciones', 'REPRESENTANTE_FUNDACION')).toBe('/fundacion/donaciones')
    expect(enlaceFront('/donaciones', 'ADMIN_ALMACEN')).toBe('/donar')
  })

  it('nunca navega a una dirección externa', () => {
    expect(enlaceFront('https://malo.example/x', 'COMPRADOR')).toBeUndefined()
    expect(enlaceFront('//malo.example/x', 'COMPRADOR')).toBeUndefined()
    expect(enlaceFront('javascript:alert(1)', 'COMPRADOR')).toBeUndefined()
    expect(enlaceFront('', 'COMPRADOR')).toBeUndefined()
  })
})

describe('aviso del servidor → aviso de la campana', () => {
  it('lee los nombres del servicio y convierte el enlace según el rol', () => {
    const n = aNotificacion({ id: 7, tipo: 'MENSAJE_NUEVO', titulo: 'Nuevo mensaje de Sofía', mensaje: 'Hola', enlace: '/chat/conversaciones/3', leida: false, fechaCreacion: '2026-11-17T10:00:00' }, 'ADMIN_ALMACEN')
    expect(n).toMatchObject({ id: '7', tipo: 'MENSAJE_NUEVO', titulo: 'Nuevo mensaje de Sofía', detalle: 'Hola', enlace: '/mensajes?c=3', leida: false })
    expect(aNotificacion({ id: 8, tipo: 'PAGO_CONFIRMADO', enlace: '/planes/mi-plan' }, 'ADMIN_ALMACEN').enlace).toBe('/tienda/suscripcion')
  })

  it('un tipo desconocido o un aviso incompleto no rompe la campana', () => {
    expect(aNotificacion({ id: 'x', tipo: 'OTRO' }, 'COMPRADOR').tipo).toBe('SISTEMA')
    expect(aNotificacion(null, 'COMPRADOR').titulo).toBe('Notificación')
  })
})

describe('los 9 tipos de aviso', () => {
  it('cada uno tiene su texto y su ícono', () => {
    expect(TIPOS_AVISO).toHaveLength(9)
    for (const t of TIPOS_AVISO) {
      expect(INFO_AVISO[t].titulo.length).toBeGreaterThan(3)
      expect(INFO_AVISO[t].descripcion.length).toBeGreaterThan(10)
      expect(INFO_AVISO[t].icono).toBeTruthy()
    }
  })
})

describe('bandeja página a página', () => {
  beforeEach(() => { resetNotificationsMock(); localStorage.clear(); loginAs('u-1', 'Valentina Rojas') })

  it('la primera página trae los más recientes y dice si hay más', async () => {
    const p = await notificationService.page(0)
    expect(p.items.length).toBeLessThanOrEqual(TAM_PAGINA)
    expect(p.items[0].creadaEn >= p.items[p.items.length - 1].creadaEn).toBe(true)
    expect(p.hasNext).toBe(false) // el usuario de prueba tiene pocos avisos
  })

  it('tienda y fundación también tienen avisos de prueba', async () => {
    localStorage.clear(); loginAs('t-1', 'Luna Store', 'ADMIN_ALMACEN')
    expect((await notificationService.page(0)).items.map((n) => n.tipo)).toEqual(expect.arrayContaining(['MODERACION_PRENDA', 'MENSAJE_NUEVO', 'PAGO_CONFIRMADO']))
    localStorage.clear(); loginAs('f-1', 'Fundación Abrigo', 'REPRESENTANTE_FUNDACION')
    expect((await notificationService.page(0)).items.map((n) => n.tipo)).toEqual(expect.arrayContaining(['SOLICITUD_DONACION', 'CAMBIO_DONACION']))
  })
})
