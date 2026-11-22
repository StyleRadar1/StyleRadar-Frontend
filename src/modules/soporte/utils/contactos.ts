import type { ContactoDto } from '../types/chat.dto'

/**
 * Mapeo de fotos reales existentes en el proyecto según el tipo e identidad del contacto
 */
export function getContactPhoto(contacto: ContactoDto): string | null {
  const nombre = contacto.nombre.toLowerCase()

  // 1. Tiendas: fotos de fachada o local
  if (contacto.tipo === 'TIENDA') {
    if (nombre.includes('luna')) return '/img/mapa/luna.jpg'
    if (nombre.includes('nomada') || nombre.includes('nómada')) return '/img/mapa/nomada.jpg'
    if (nombre.includes('retro') || nombre.includes('kicks')) return '/img/mapa/kicks.jpg'
    if (nombre.includes('lab')) return '/img/mapa/lab.jpg'
    if (nombre.includes('kennedy')) return '/img/mapa/kennedy.jpg'
    if (nombre.includes('dignidad')) return '/img/mapa/dignidad.jpg'
    return '/img/mapa/luna.jpg'
  }

  // 2. Fundaciones: logo, sede o equipo
  if (contacto.tipo === 'FUNDACION') {
    if (nombre.includes('abrigo')) return '/img/fundaciones/abrigo-trabajo.jpg'
    return '/img/fundaciones/abrigo-donaciones.jpg'
  }

  // 3. Personas (vendedor, comprador, donante): fotos de perfil reales
  if (nombre.includes('sofía') || nombre.includes('sofia')) {
    return '/img/landing/slide-3.jpg'
  }
  if (nombre.includes('valentina')) {
    return '/img/landing/slide-2.jpg'
  }
  if (nombre.includes('mateo')) {
    return '/img/landing/slide-4.jpg'
  }
  if (nombre.includes('camila')) {
    return '/img/landing/slide-5.jpg'
  }

  return '/img/landing/slide-1.jpg'
}

export function getInitials(nombre: string): string {
  if (!nombre) return 'SR'
  const partes = nombre.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, '').trim().split(/\s+/)
  if (partes.length >= 2) {
    return (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase()
  }
  return nombre.slice(0, 2).toUpperCase()
}

const hora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' })
const diaCorto = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })
const diaSemana = new Intl.DateTimeFormat('es-CO', { weekday: 'short' })
const diaLargo = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
const inicioDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const DIA = 86_400_000

/** Hora de un mensaje: «3:05 p. m.». */
export const horaMensaje = (iso: string) => hora.format(new Date(iso))

/** Etiqueta corta para la lista: hora si es de hoy, «Ayer», el día de la semana o la fecha. */
export function etiquetaLista(iso: string, ahora = new Date()): string {
  const d = new Date(iso)
  const dif = Math.round((inicioDia(ahora) - inicioDia(d)) / DIA)
  if (dif <= 0) return hora.format(d)
  if (dif === 1) return 'Ayer'
  if (dif < 7) return diaSemana.format(d).replace('.', '')
  return diaCorto.format(d).replace('.', '')
}

/** Separador entre días dentro de la conversación: «Hoy», «Ayer» o «viernes 7 de noviembre». */
export function etiquetaDia(iso: string, ahora = new Date()): string {
  const d = new Date(iso)
  const dif = Math.round((inicioDia(ahora) - inicioDia(d)) / DIA)
  if (dif <= 0) return 'Hoy'
  if (dif === 1) return 'Ayer'
  return diaLargo.format(d)
}

/** Clave para agrupar mensajes por día. */
export const claveDia = (iso: string) => String(inicioDia(new Date(iso)))
