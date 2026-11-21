import { describe, expect, it } from 'vitest'
import { aNotificacion, enlaceFront } from '../utils/notificaciones'

describe('enlaces de los avisos del servicio → rutas del front', () => {
  it.each([
    ['/chat/conversaciones/42', '/mensajes?c=42'],
    ['/catalogo/prendas/abc-123', '/catalogo/abc-123'],
    ['/catalogo/mis-prendas/abc-123', '/tienda/inventario'],
    ['/segunda-mano/77', '/segunda-mano'],
    ['/donaciones/9', '/donar?donacion=9'],
    ['/donaciones', '/donar'],
    ['/planes/mi-plan', '/perfil/pagos'],
    ['/mensajes?c=c1', '/mensajes?c=c1'],
  ])('%s → %s', (de, a) => expect(enlaceFront(de)).toBe(a))

  it('nunca navega a una dirección externa', () => {
    expect(enlaceFront('https://malo.example/x')).toBeUndefined()
    expect(enlaceFront('//malo.example/x')).toBeUndefined()
    expect(enlaceFront('javascript:alert(1)')).toBeUndefined()
    expect(enlaceFront('')).toBeUndefined()
  })
})

describe('aviso del servidor → aviso de la campana', () => {
  it('lee los nombres del servicio y convierte el enlace', () => {
    const n = aNotificacion({ id: 7, tipo: 'MENSAJE_NUEVO', titulo: 'Nuevo mensaje de Sofía', mensaje: 'Hola', enlace: '/chat/conversaciones/3', leida: false, fechaCreacion: '2026-11-17T10:00:00' })
    expect(n).toMatchObject({ id: '7', tipo: 'MENSAJE_NUEVO', titulo: 'Nuevo mensaje de Sofía', detalle: 'Hola', enlace: '/mensajes?c=3', leida: false })
  })

  it('un tipo desconocido o un aviso incompleto no rompe la campana', () => {
    expect(aNotificacion({ id: 'x', tipo: 'OTRO' }).tipo).toBe('SISTEMA')
    expect(aNotificacion(null).titulo).toBe('Notificación')
  })
})
