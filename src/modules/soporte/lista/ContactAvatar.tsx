import { useState } from 'react'
import type { ContactoDto } from '../types/chat.dto'
import { getContactPhoto, getInitials } from '../utils/contactos'

/** Foto del contacto: redonda para personas, con esquinas suaves para tiendas y fundaciones. Sin foto, sus iniciales. */
export function ContactAvatar({ contacto, size = 'md' }: { contacto: ContactoDto; size?: 'md' | 'lg' }) {
  const [fallo, setFallo] = useState(false)
  const foto = getContactPhoto(contacto)
  const forma = contacto.tipo === 'TIENDA' || contacto.tipo === 'FUNDACION' ? 'rounded-2xl' : 'rounded-full'
  const medida = size === 'lg' ? 'h-12 w-12 text-sm' : 'h-12 w-12 text-sm'
  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center overflow-hidden bg-violeta font-bold text-white ring-1 ring-[var(--sr-border-subtle)] ${forma} ${medida}`}
    >
      {foto && !fallo ? (
        <img src={foto} alt="" draggable={false} onError={() => setFallo(true)} className="h-full w-full object-cover" />
      ) : (
        getInitials(contacto.nombre)
      )}
    </span>
  )
}
