import { LISTING_RULES, type Conservacion } from '../types/secondhand.dto'
import type { PhotoItem } from '../components/MultiPhotoInput'

export interface ListingForm {
  fotos: PhotoItem[]
  conservacion: Conservacion | ''
  titulo: string
  categoria: string
  talla: string
  marca: string
  descripcion: string
  precio: string
}

export const emptyListing = (): ListingForm => ({ fotos: [], conservacion: '', titulo: '', categoria: '', talla: '', marca: '', descripcion: '', precio: '' })

export type ListingErrors = Partial<Record<keyof ListingForm, string>>

/** Valida un paso del asistente. Paso 0: fotos y estado; 1: detalles; 2: precio. */
export function validateListingStep(step: number, f: ListingForm): ListingErrors {
  const e: ListingErrors = {}
  const R = LISTING_RULES
  if (step === 0) {
    if (!f.fotos.length) e.fotos = 'Agrega al menos una foto de la prenda.'
    else if (f.fotos.length > R.maxFotos) e.fotos = `Máximo ${R.maxFotos} fotos.`
    if (!f.conservacion) e.conservacion = 'Elige en qué estado está la prenda.'
  }
  if (step === 1) {
    if (!f.titulo.trim()) e.titulo = 'Ponle un nombre a la prenda.'
    else if (f.titulo.trim().length > R.tituloMax) e.titulo = `Máximo ${R.tituloMax} caracteres.`
    if (!f.categoria) e.categoria = 'Elige la categoría.'
    if (!f.talla) e.talla = 'Elige la talla.'
    if (!f.marca.trim()) e.marca = 'Escribe la marca o marca «Sin marca».'
    const d = f.descripcion.trim().length
    if (d < R.descripcionMin) e.descripcion = `Cuenta un poco más (mínimo ${R.descripcionMin} caracteres).`
    else if (d > R.descripcionMax) e.descripcion = `Máximo ${R.descripcionMax} caracteres.`
  }
  if (step === 2) {
    const raw = f.precio.trim()
    const n = Number(raw.replace(/\./g, ''))
    if (!raw) e.precio = 'Escribe el precio en pesos.'
    else if (!/^\d[\d.]*$/.test(raw) || !Number.isInteger(n)) e.precio = 'Escribe solo números, sin decimales.'
    else if (n < R.precioMin) e.precio = `El precio mínimo es $${R.precioMin.toLocaleString('es-CO')}.`
    else if (n > R.precioMax) e.precio = `El precio máximo es $${R.precioMax.toLocaleString('es-CO')}.`
  }
  return e
}

export const priceValue = (precio: string) => Number(precio.replace(/\./g, ''))
