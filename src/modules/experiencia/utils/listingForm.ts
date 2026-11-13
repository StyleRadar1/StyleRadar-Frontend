import {
  LISTING_RULES,
  type Conservacion,
  type GarmentType,
  type LocalidadEnum,
  type SizeEnum,
  type StyleEnum,
} from '../types/secondhand.dto'
import type { PhotoItem } from '../components/MultiPhotoInput'

export interface ListingForm {
  esDonacion: boolean
  fotos: PhotoItem[]
  conservacion: Conservacion | ''
  titulo: string
  garmentName?: string
  categoria: string
  garmentType?: GarmentType
  talla: string
  size?: SizeEnum
  style?: StyleEnum
  color?: string
  localidad?: LocalidadEnum
  marca: string
  descripcion: string
  precio: string
}

export const emptyListing = (): ListingForm => ({
  esDonacion: false,
  fotos: [],
  conservacion: '',
  titulo: '',
  garmentName: '',
  categoria: '',
  talla: '',
  color: '',
  localidad: 'CHAPINERO',
  marca: '',
  descripcion: '',
  precio: '',
})

export type ListingErrors = Partial<Record<keyof ListingForm, string>>

/** Valida un paso del asistente. Paso 0: fotos y estado; 1: detalles; 2: precio. */
export function validateListingStep(step: number, f: ListingForm): ListingErrors {
  const e: ListingErrors = {}
  const R = LISTING_RULES
  if (step === 0) {
    if (!f.fotos.length) e.fotos = 'Agrega al menos una foto de la prenda.'
    else if (f.fotos.length > R.maxFotos) e.fotos = `Máximo ${R.maxFotos} fotos por prenda.`
    if (!f.conservacion) e.conservacion = 'Elige en qué estado está la prenda.'
  }
  if (step === 1) {
    const tit = (f.garmentName || f.titulo || '').trim()
    if (!tit) e.titulo = 'Ponle un nombre a la prenda.'
    else if (tit.length > R.tituloMax) e.titulo = `Máximo ${R.tituloMax} caracteres.`
    if (!f.categoria && !f.garmentType) e.categoria = 'Elige la categoría.'
    if (!f.talla && !f.size) e.talla = 'Elige la talla.'
    if (!f.marca.trim()) e.marca = 'Escribe la marca o marca «Sin marca».'
    const d = f.descripcion.trim().length
    if (d < R.descripcionMin) e.descripcion = `Cuenta un poco más (mínimo ${R.descripcionMin} caracteres).`
    else if (d > R.descripcionMax) e.descripcion = `Máximo ${R.descripcionMax} caracteres.`
  }
  if (step === 2) {
    if (f.esDonacion) {
      // Donación benéfica: precio bloqueado a 0
      return e
    }
    const raw = f.precio.trim()
    const n = Number(raw.replace(/\./g, ''))
    if (!raw) e.precio = 'Escribe el precio en pesos.'
    else if (!/^\d[\d.]*$/.test(raw) || !Number.isInteger(n)) e.precio = 'Escribe solo números, sin decimales.'
    else if (n <= 0) e.precio = 'Ingresa un precio mayor a $0 COP.'
    else if (n < R.precioMin) e.precio = `El precio mínimo es $${R.precioMin.toLocaleString('es-CO')}.`
    else if (n > R.precioMax) e.precio = `El precio máximo es $${R.precioMax.toLocaleString('es-CO')}.`
  }
  return e
}

export const priceValue = (precio: string) => Number(precio.replace(/\./g, ''))
