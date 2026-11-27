import { describe, expect, it } from 'vitest'
import { aConversacion, aMensaje, filasDe, idDelOtro, necesitaNombre } from '../services/chatMapper'

const ctx = (me: string, rol: string | null, nombres: [string, string][] = []) => ({ me, rol, nombres: new Map(nombres) })

describe('listas paginadas de ms-chat', () => {
  it('lee { content, totalPages } y también un arreglo suelto', () => {
    expect(filasDe({ content: [{ id: 1 }, { id: 2 }], page: 0, size: 20, totalElements: 45, totalPages: 3 })).toEqual({ filas: [{ id: 1 }, { id: 2 }], totalPages: 3 })
    expect(filasDe([{ id: 1 }])).toEqual({ filas: [{ id: 1 }], totalPages: 1 })
    expect(filasDe(null)).toEqual({ filas: [], totalPages: 1 })
  })
})

describe('conversación de segunda mano', () => {
  // La cuenta de comprador de QA (id 2) vende; la persona 1 pregunta
  const raw = { id: 2, type: 'SEGUNDA_MANO', publicationId: 1, garmentName: 'Chaqueta Denim Vintage QA', buyerId: 1, sellerId: 2, status: 'ABIERTA', createdAt: '2026-11-21T10:00:00Z' }

  it('el otro es quien compra cuando yo vendo, y se le llama «Comprador»', () => {
    expect(idDelOtro(raw, '2')).toBe('1')
    const c = aConversacion(raw, ctx('2', 'BUYER'))
    expect(c).toMatchObject({ id: '2', asunto: 'Chaqueta Denim Vintage QA', referenciaId: '1', actualizadaEn: '2026-11-21T10:00:00Z', noLeidos: 0 })
    expect(c.contacto).toEqual({ id: '1', nombre: 'Comprador interesado', tipo: 'COMPRADOR' })
  })

  it('usa el nombre que ms-usuarios devolvió y, si el usuario compra, el otro es quien vende', () => {
    const c = aConversacion(raw, ctx('1', 'BUYER', [['2', 'Sofía L.']]))
    expect(c.contacto).toEqual({ id: '2', nombre: 'Sofía L.', tipo: 'VENDEDOR' })
  })

  it('el contador de no leídos viene de los avisos de ms-notificaciones', () => {
    expect(aConversacion(raw, ctx('2', 'BUYER'), 4).noLeidos).toBe(4)
  })
})

describe('conversación con una tienda', () => {
  const raw = { id: 7, type: 'ALMACEN', buyerId: 1, sellerId: null, storeNit: '900123456-1', storeName: 'Atelier Urbano Chapinero', status: 'ABIERTA', createdAt: '2026-11-01T15:00:00Z' }

  it('quien compra ve a la tienda con su nombre y su NIT, sin pedir nombres', () => {
    expect(necesitaNombre(raw, { me: '1', rol: 'BUYER' })).toBe(false)
    expect(aConversacion(raw, ctx('1', 'BUYER')).contacto).toEqual({ id: '900123456-1', nombre: 'Atelier Urbano Chapinero', tipo: 'TIENDA' })
  })

  it('la tienda ve a la persona que le escribió', () => {
    expect(necesitaNombre(raw, { me: '3', rol: 'STORE_ADMIN' })).toBe(true)
    const c = aConversacion(raw, ctx('3', 'STORE_ADMIN', [['1', 'Valentina R.']]))
    expect(c.contacto).toEqual({ id: '1', nombre: 'Valentina R.', tipo: 'COMPRADOR' })
  })

  it('acepta el nombre en inglés del tipo', () => {
    expect(aConversacion({ ...raw, type: 'STORE' }, ctx('1', 'BUYER')).contacto.tipo).toBe('TIENDA')
  })
})

describe('conversación de una donación', () => {
  const raw = { id: 9, type: 'DONACION', donationId: 5, buyerId: 1, sellerId: 5, status: 'ABIERTA', createdAt: '2026-11-03T08:00:00Z' }
  it('quien dona ve a la fundación y la fundación ve a quien dona', () => {
    expect(aConversacion(raw, ctx('1', 'BUYER')).contacto.tipo).toBe('FUNDACION')
    expect(aConversacion(raw, ctx('5', 'FOUNDATION_REPRESENTATIVE')).contacto.tipo).toBe('DONANTE')
    expect(aConversacion(raw, ctx('1', 'BUYER')).asunto).toBe('Donación #5')
  })
})

describe('sin ids a la vista', () => {
  const base = { id: 2, type: 'SEGUNDA_MANO', garmentName: 'Chaqueta', buyerId: 1, sellerId: 2, createdAt: '2026-11-21T10:00:00Z' }
  it('ignora «Usuario #N» que manda ms-chat y usa el papel de la persona', () => {
    const vende = aConversacion({ ...base, participantDisplayName: 'Usuario #2' }, ctx('2', 'BUYER'))
    expect(vende.contacto.nombre).toBe('Comprador interesado')
    const compra = aConversacion({ ...base, participantDisplayName: 'Usuario #2' }, ctx('1', 'BUYER'))
    expect(compra.contacto.nombre).toBe('Vendedor')
  })
  it('si ms-chat manda un nombre real, lo muestra', () => {
    expect(aConversacion({ ...base, participantDisplayName: 'Sofía L.' }, ctx('1', 'BUYER')).contacto.nombre).toBe('Sofía L.')
  })
  it('en donaciones usa «Persona que dona» y no «Donación #N»', () => {
    const c = aConversacion({ id: 9, type: 'DONACION', donationId: 5, buyerId: 1, sellerId: 5, participantDisplayName: 'Donación #5' }, ctx('5', 'FOUNDATION_REPRESENTATIVE'))
    expect(c.contacto.nombre).toBe('Persona que dona')
  })
  it('ninguna etiqueta lleva un número de usuario', () => {
    const c = aConversacion(base, ctx('2', 'BUYER'))
    expect(JSON.stringify(c.contacto)).not.toMatch(/#\d/)
  })
})

describe('mensajes de ms-chat', () => {
  it('lee los nombres en inglés', () => {
    expect(aMensaje({ id: 20, conversationId: 7, authorId: 1, text: 'Hola', sentAt: '2026-11-01T15:05:00Z' })).toEqual({
      id: '20', conversacionId: '7', autorId: '1', texto: 'Hola', enviadoEn: '2026-11-01T15:05:00Z',
    })
  })
  it('y también los alias en español', () => {
    expect(aMensaje({ id: 21, conversacionId: 7, autorId: 2, texto: 'Disponible', fechaEnvio: '2026-11-01T15:06:00Z' })).toMatchObject({ autorId: '2', texto: 'Disponible', enviadoEn: '2026-11-01T15:06:00Z' })
  })
  it('el id del autor numérico se compara como texto con el de la sesión', () => {
    expect(aMensaje({ authorId: 2 }).autorId === String(2)).toBe(true)
  })
})
