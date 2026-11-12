import React, { useState } from 'react'
import type { VinylItem } from './types'

interface ConversationAvatarProps {
  item: VinylItem
  isSelected: boolean
  size: number
  onClick: () => void
}

export const ConversationAvatar: React.FC<ConversationAvatarProps> = ({
  item,
  isSelected,
  size,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false)
  const { conv, unreadCount, photoUrl, initials, contactType } = item
  const contactName = conv.contacto.nombre

  // Forma según tipo de contacto
  // PERSONA -> Círculo
  // TIENDA -> Cuadrado redondeado
  // FUNDACION -> Hexágono
  const isPersona = contactType === 'COMPRADOR' || contactType === 'VENDEDOR' || contactType === 'DONANTE' || !contactType
  const isTienda = contactType === 'TIENDA'
  const isFundacion = contactType === 'FUNDACION'

  // Satélites de no leídos (1 a 4 puntos rosados orbitando alrededor)
  const satelliteCount = Math.min(4, unreadCount)
  const satellites = Array.from({ length: satelliteCount }, (_, i) => i)

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
      style={{
        transform: `translate(calc(-50% + ${item.x}px), calc(-50% + ${item.y}px))`,
        width: `${size}px`,
        height: `${size}px`,
        transition: 'transform 0.05s linear',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Conversación con ${contactName}, ${unreadCount > 0 ? `${unreadCount} mensajes no leídos` : 'al día'}`}
        aria-pressed={isSelected}
        className={`group relative w-full h-full p-0 bg-transparent border-0 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-[#D62F6B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0615] rounded-full transition-all duration-200 ease-out hover:scale-[1.14] active:scale-[0.96] ${
          isSelected ? 'scale-[1.10]' : ''
        }`}
      >
        {/* Halo resplandeciente si está seleccionado ("sonando") */}
        {isSelected && (
          <div
            className="absolute -inset-2.5 rounded-full pointer-events-none animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(214, 47, 107, 0.45) 0%, rgba(183, 154, 245, 0.2) 60%, transparent 80%)',
            }}
          />
        )}

        {/* Doble anillo decorativo si está seleccionado */}
        {isSelected && (
          <div className="absolute -inset-1 rounded-full border-2 border-[#D62F6B] shadow-[0_0_12px_rgba(214,47,107,0.7)] pointer-events-none" />
        )}

        {/* Contenedor con la forma específica del contacto */}
        <div
          className={`relative w-full h-full overflow-hidden flex items-center justify-center transition-all duration-200 shadow-lg ${
            isPersona
              ? 'rounded-full border-[2.5px] border-[#F4EEE3]'
              : isTienda
              ? 'rounded-2xl border-[2.5px] border-[#F4EEE3]'
              : 'border-[2px] border-[#F4EEE3]'
          }`}
          style={{
            clipPath: isFundacion
              ? 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)'
              : undefined,
            backgroundColor: '#2A1A47',
          }}
        >
          {photoUrl && !imgError ? (
            <img
              src={photoUrl}
              alt=""
              aria-hidden="true"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4B1FA8] to-[#1F1433] text-[#F7F1E4] font-bold text-sm select-none">
              {initials}
            </div>
          )}

          {/* Sombra interna para relieve suave */}
          <div className="absolute inset-0 ring-1 ring-inset ring-black/25 pointer-events-none" />
        </div>

        {/* Satélites de no leídos orbitando */}
        {satellites.map((idx) => {
          const orbitAngle = (idx * Math.PI * 2) / satelliteCount
          const orbitRadius = size / 2 + 6
          const ox = Math.cos(orbitAngle) * orbitRadius
          const oy = Math.sin(orbitAngle) * orbitRadius
          return (
            <div
              key={idx}
              className="absolute w-2 h-2 rounded-full bg-[#D62F6B] shadow-[0_0_6px_#D62F6B] pointer-events-none animate-ping"
              style={{
                top: `calc(50% + ${oy}px - 4px)`,
                left: `calc(50% + ${ox}px - 4px)`,
                animationDuration: `${1.8 + idx * 0.4}s`,
              }}
            />
          )
        })}

        {/* Badge numérico con contador de no leídos */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 flex items-center justify-center">
            {/* Aro pulsante */}
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#D62F6B] opacity-75 animate-ping" />
            <span className="relative min-w-[20px] h-[20px] px-1 bg-gradient-to-r from-[#D62F6B] to-[#9C1B4B] text-[#FFFFFF] text-[10px] font-extrabold rounded-full flex items-center justify-center border border-[#FFFFFF] shadow-md">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}

        {/* Tooltip flotante al hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-[#0B0615]/95 text-[#F4EEE3] text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-30 border border-white/10">
          <p className="font-bold leading-tight">{contactName}</p>
          <p className="text-[10px] text-[#CFC6E0]">
            {contactType === 'TIENDA'
              ? 'Tienda'
              : contactType === 'FUNDACION'
              ? 'Fundación'
              : 'Usuario'}
          </p>
        </div>
      </button>
    </div>
  )
}
