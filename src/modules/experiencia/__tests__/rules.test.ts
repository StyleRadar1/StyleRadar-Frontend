import { describe, expect, it } from 'vitest'
import { validateDimensions, validatePhotoFile } from '../utils/photoRules'
import { emptyListing, validateListingStep } from '../utils/listingForm'
import { emptyDonation, foundationProblem, validateDonationStep } from '../utils/donationForm'
import { isoDay } from '../utils/dates'
import { FOUNDATIONS } from '../mocks/secondHand'
import { png } from './helpers'

describe('foto del probador (RF-23)', () => {
  it('acepta JPG, PNG y WEBP de hasta 8 MB', () => {
    expect(validatePhotoFile(png('a.png'))).toBe('')
    expect(validatePhotoFile(png('a.jpg', 100, 'image/jpeg'))).toBe('')
    expect(validatePhotoFile(png('a.webp', 100, 'image/webp'))).toBe('')
  })
  it('rechaza HEIC, GIF, PDF, archivos vacíos y fotos pesadas', () => {
    expect(validatePhotoFile(png('a.heic', 100, 'image/heic'))).toMatch(/HEIC no sirve/)
    expect(validatePhotoFile(png('a.gif', 100, 'image/gif'))).toMatch(/GIF/)
    expect(validatePhotoFile(png('a.pdf', 100, 'application/pdf'))).toMatch(/PDF/)
    expect(validatePhotoFile(png('a.png', 0))).toMatch(/vacío/)
    expect(validatePhotoFile(png('a.png', 9 * 1024 * 1024))).toMatch(/8 MB/)
  })
  it('rechaza fotos muy pequeñas', () => {
    expect(validateDimensions(300, 900)).toMatch(/muy pequeña/)
    expect(validateDimensions(800, 1200)).toBe('')
  })
})

describe('publicación de segunda mano (RF-33 a RF-35)', () => {
  it('exige fotos y conservación en el paso 1, con máximo 4 fotos', () => {
    const f = emptyListing()
    expect(validateListingStep(0, f)).toEqual({ fotos: expect.any(String), conservacion: expect.any(String) })
    const five = Array.from({ length: 5 }, (_, i) => ({ key: String(i), url: 'x' }))
    expect(validateListingStep(0, { ...f, fotos: five, conservacion: 'BUENO' }).fotos).toMatch(/Máximo 4/)
  })
  it('exige todos los detalles en el paso 2', () => {
    const e = validateListingStep(1, emptyListing())
    expect(Object.keys(e).sort()).toEqual(['categoria', 'descripcion', 'marca', 'talla', 'titulo'])
  })
  it('solo acepta precios enteros positivos en COP', () => {
    const f = emptyListing()
    for (const bad of ['', '-5', '0', '12,5', 'abc', '500', '20000000']) expect(validateListingStep(2, { ...f, precio: bad }).precio).toBeTruthy()
    for (const ok of ['85000', '85.000', '1000']) expect(validateListingStep(2, { ...f, precio: ok }).precio).toBeUndefined()
  })
})

describe('donaciones (RF-42, 44, 45 y 48)', () => {
  it('no permite fundaciones inactivas ni que no reciban la categoría', () => {
    const kennedy = FOUNDATIONS.find((f) => f.id === 'kennedy')!
    const dignidad = FOUNDATIONS.find((f) => f.id === 'dignidad')!
    expect(foundationProblem(kennedy, 'Pantalones')).toMatch(/No está recibiendo/)
    expect(foundationProblem(dignidad, 'Calzado')).toMatch(/No recibe calzado/)
    expect(foundationProblem(dignidad, 'Camisas')).toBe('')
  })
  it('no deja enviar sin modalidad, fecha, franja y punto o dirección', () => {
    const f = emptyDonation()
    expect(Object.keys(validateDonationStep(2, f)).sort()).toEqual(['fecha', 'franja', 'modalidad'])
    expect(validateDonationStep(2, { ...f, modalidad: 'ENTREGA_EN_PUNTO', fecha: isoDay(2), franja: '8:00 a 12:00' })).toEqual({ puntoId: expect.any(String) })
    expect(validateDonationStep(2, { ...f, modalidad: 'RECOGIDA', fecha: isoDay(2), franja: '8:00 a 12:00' })).toEqual({ direccion: expect.any(String) })
    expect(validateDonationStep(2, { ...f, modalidad: 'RECOGIDA', fecha: isoDay(0), franja: '8:00 a 12:00', direccion: 'Cra 7 # 54-20' }).fecha).toBeTruthy()
  })
})
