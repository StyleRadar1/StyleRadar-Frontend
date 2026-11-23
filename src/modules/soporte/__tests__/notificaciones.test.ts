import { beforeEach, describe, expect, it } from 'vitest'
import { notificationService, resetNotificationsMock, TAM_PAGINA } from '../services/notificationService'
import { TIPOS_AVISO } from '../types/notification.dto'
import { aNotificacion, enlaceFront, fechaUtc } from '../utils/notificaciones'
import { INFO_AVISO } from '../utils/tiposAviso'
import { loginAs } from './helpers'

describe('enlaces de los avisos del servicio → rutas del front', () => {
  it.each([
    ['/chat/conversaciones/42', 'BUYER', '/mensajes?c=42'],
    ['/chat/conversaciones/42', 'STORE_ADMIN', '/mensajes?c=42'],
    ['/catalogo/prendas/abc-123', 'BUYER', '/catalogo/abc-123'],
    ['/segunda-mano/77', 'BUYER', '/segunda-mano'],
    ['/mensajes?c=c1', 'BUYER', '/mensajes?c=c1'],
  ])('%s (%s) → %s', (de, rol, a) => expect(enlaceFront(de, rol)).toBe(a))

  it('la misma ruta del back lleva a una pantalla distinta según el rol', () => {
    // Vista del dueño de la prenda
    expect(enlaceFront('/catalogo/mis-prendas/abc-123', 'STORE_ADMIN')).toBe('/tienda/inventario')
    expect(enlaceFront('/catalogo/mis-prendas/abc-123', 'BUYER')).toBe('/segunda-mano')
    // Pago confirmado: la tienda va a su suscripción; una persona, a sus pagos
    expect(enlaceFront('/planes/mi-plan', 'STORE_ADMIN')).toBe('/tienda/suscripcion')
    expect(enlaceFront('/planes/mi-plan', 'BUYER')).toBe('/perfil/pagos')
    // Donaciones: la fundación gestiona; quien dona ve la suya
    expect(enlaceFront('/donaciones/9', 'FOUNDATION_REPRESENTATIVE')).toBe('/fundacion/donaciones')
    expect(enlaceFront('/donaciones/9', 'BUYER')).toBe('/donar?donacion=9')
    expect(enlaceFront('/donaciones', 'FOUNDATION_REPRESENTATIVE')).toBe('/fundacion/donaciones')
    expect(enlaceFront('/donaciones', 'STORE_ADMIN')).toBe('/donar')
  })

  it('nunca navega a una dirección externa', () => {
    expect(enlaceFront('https://malo.example/x', 'BUYER')).toBeUndefined()
    expect(enlaceFront('//malo.example/x', 'BUYER')).toBeUndefined()
    expect(enlaceFront('javascript:alert(1)', 'BUYER')).toBeUndefined()
    expect(enlaceFront('', 'BUYER')).toBeUndefined()
  })
})

describe('aviso del servidor → aviso de la campana', () => {
  it('lee los nombres del servicio y convierte el enlace según el rol', () => {
    const n = aNotificacion({ id: 7, tipo: 'MENSAJE_NUEVO', titulo: 'Nuevo mensaje de Sofía', mensaje: 'Hola', enlace: '/chat/conversaciones/3', leida: false, fechaCreacion: '2026-11-17T10:00:00' }, 'STORE_ADMIN')
    expect(n).toMatchObject({ id: '7', tipo: 'MENSAJE_NUEVO', titulo: 'Nuevo mensaje de Sofía', detalle: 'Hola', enlace: '/mensajes?c=3', leida: false })
    expect(aNotificacion({ id: 8, tipo: 'PAGO_CONFIRMADO', enlace: '/planes/mi-plan' }, 'STORE_ADMIN').enlace).toBe('/tienda/suscripcion')
  })

  it('un tipo desconocido o un aviso incompleto no rompe la campana', () => {
    expect(aNotificacion({ id: 'x', tipo: 'OTRO' }, 'BUYER').tipo).toBe('SISTEMA')
    expect(aNotificacion(null, 'BUYER').titulo).toBe('Notificación')
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
    localStorage.clear(); loginAs('t-1', 'Luna Store', 'STORE_ADMIN')
    expect((await notificationService.page(0)).items.map((n) => n.tipo)).toEqual(expect.arrayContaining(['MODERACION_PRENDA', 'MENSAJE_NUEVO', 'PAGO_CONFIRMADO']))
    localStorage.clear(); loginAs('f-1', 'Fundación Abrigo', 'FOUNDATION_REPRESENTATIVE')
    expect((await notificationService.page(0)).items.map((n) => n.tipo)).toEqual(expect.arrayContaining(['SOLICITUD_DONACION', 'CAMBIO_DONACION']))
  })
})

describe('fechas de ms-notificaciones', () => {
  it('una fecha sin zona se lee como UTC, igual que la hora del servidor', () => {
    expect(fechaUtc('2026-11-22T03:16:00')).toBe('2026-11-22T03:16:00Z')
    // 03:16 UTC son las 10:16 p. m. del día anterior en Colombia
    expect(new Date(fechaUtc('2026-11-22T03:16:00')!).getUTCHours()).toBe(3)
  })
  it('si ya trae zona, se respeta', () => {
    expect(fechaUtc('2026-11-22T03:16:00Z')).toBe('2026-11-22T03:16:00Z')
    expect(fechaUtc('2026-11-22T03:16:00-05:00')).toBe('2026-11-22T03:16:00-05:00')
    expect(fechaUtc(undefined)).toBeUndefined()
  })
  it('el aviso entrega la fecha ya corregida', () => {
    expect(aNotificacion({ id: 1, fechaCreacion: '2026-11-22T03:16:00' }, 'BUYER').creadaEn).toBe('2026-11-22T03:16:00Z')
  })
})
