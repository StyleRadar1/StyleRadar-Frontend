import type { PhotoItem } from '../components/MultiPhotoInput'
import type { FoundationDto, Modalidad } from '../types/donation.dto'
import type { Conservacion } from '../types/secondhand.dto'
import { isoDay } from './dates'

export interface DonationForm {
  fotos: PhotoItem[]
  titulo: string
  categoria: string
  talla: string
  conservacion: Conservacion | ''
  cantidad: string
  descripcion: string
  fundacionId: string
  modalidad: Modalidad | ''
  fecha: string
  franja: string
  puntoId: string
  direccion: string
}

export const emptyDonation = (): DonationForm => ({ fotos: [], titulo: '', categoria: '', talla: '', conservacion: '', cantidad: '1', descripcion: '',
  fundacionId: '', modalidad: '', fecha: '', franja: '', puntoId: '', direccion: '' })

export type DonationErrors = Partial<Record<keyof DonationForm, string>>

export const DONATION_RULES = { maxFotos: 4, minDias: 1, maxDias: 30, maxCantidad: 50 }

/** Por qué una fundación no se puede elegir para esta prenda ('' si sí se puede). */
export function foundationProblem(f: FoundationDto, categoria: string): string {
  if (!f.activa) return 'No está recibiendo donaciones'
  if (categoria && !f.categorias.includes(categoria)) return `No recibe ${categoria.toLowerCase()}`
  return ''
}

/** Valida un paso. 0: la prenda; 1: la fundación; 2: entrega. */
export function validateDonationStep(step: number, f: DonationForm, foundations: FoundationDto[] = []): DonationErrors {
  const e: DonationErrors = {}
  if (step === 0) {
    if (!f.fotos.length) e.fotos = 'Agrega al menos una foto.'
    if (!f.titulo.trim()) e.titulo = 'Cuéntanos qué prenda donas.'
    if (!f.categoria) e.categoria = 'Elige la categoría.'
    if (!f.talla.trim()) e.talla = 'Escribe la talla o el rango de tallas.'
    if (!f.conservacion) e.conservacion = 'Elige el estado de la prenda.'
    const n = Number(f.cantidad)
    if (!/^\d+$/.test(f.cantidad) || n < 1 || n > DONATION_RULES.maxCantidad) e.cantidad = `Escribe una cantidad entre 1 y ${DONATION_RULES.maxCantidad}.`
    if (f.descripcion.trim().length < 10) e.descripcion = 'Describe la prenda (mínimo 10 caracteres).'
  }
  if (step === 1) {
    const fd = foundations.find((x) => x.id === f.fundacionId)
    if (!fd) e.fundacionId = 'Elige una fundación.'
    else { const p = foundationProblem(fd, f.categoria); if (p) e.fundacionId = `${fd.nombre}: ${p.toLowerCase()}.` }
  }
  if (step === 2) {
    if (!f.modalidad) e.modalidad = 'Elige cómo la entregas.'
    if (!f.fecha) e.fecha = 'Elige el día.'
    else if (f.fecha < isoDay(DONATION_RULES.minDias) || f.fecha > isoDay(DONATION_RULES.maxDias)) e.fecha = `Elige un día entre mañana y los próximos ${DONATION_RULES.maxDias} días.`
    if (!f.franja) e.franja = 'Elige la franja horaria.'
    if (f.modalidad === 'ENTREGA_EN_PUNTO' && !f.puntoId) e.puntoId = 'Elige el punto de acopio.'
    if (f.modalidad === 'RECOGIDA' && f.direccion.trim().length < 6) e.direccion = 'Escribe la dirección de recogida.'
  }
  return e
}
