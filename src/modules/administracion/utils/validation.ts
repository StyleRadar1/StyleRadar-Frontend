import type { FoundationFormDto } from '../types/admin.dto'

/** Mismas reglas del formulario de fundaciones del prototipo. Devuelve un mensaje por campo con error. */
export function erroresFundacion(d: FoundationFormDto, otrosNits: string[] = []): Partial<Record<keyof FoundationFormDto, string>> {
  const e: Partial<Record<keyof FoundationFormDto, string>> = {}
  const v = (k: keyof FoundationFormDto) => (d[k] ?? '').trim()
  if (!v('nombre')) e.nombre = 'Escribe el nombre de la fundación.'
  else if (v('nombre').length < 4) e.nombre = 'El nombre debe tener al menos 4 caracteres.'
  if (!v('nit')) e.nit = 'Escribe el NIT.'
  else if (!/^[\d.]{9,13}-\d$/.test(v('nit'))) e.nit = 'Escribe el NIT con dígito de verificación, por ejemplo 900.215.884-1.'
  else if (otrosNits.includes(v('nit'))) e.nit = 'Ya hay una fundación registrada con ese NIT.'
  if (!v('correo')) e.correo = 'Escribe el correo.'
  else if (!/^\S+@\S+\.\S+$/.test(v('correo'))) e.correo = 'Escribe un correo válido, por ejemplo hola@fundacion.org.'
  if (!v('telefono')) e.telefono = 'Escribe un teléfono.'
  else if (!/^\+?[\d\s-]{7,16}$/.test(v('telefono')) || v('telefono').replace(/\D/g, '').length < 7) e.telefono = 'Escribe un teléfono válido, por ejemplo +57 601 555 0301.'
  if (!v('barrio')) e.barrio = 'Escribe el barrio.'
  if (!v('direccion')) e.direccion = 'Escribe la dirección.'
  if (!v('representante')) e.representante = 'Escribe el representante legal.'
  return e
}
