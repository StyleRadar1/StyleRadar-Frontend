import { useTheme } from '@/modules/core/theme'

export interface MarqueeTapeProps {
  className?: string
}

/**
 * MarqueeTape — Cinta adhesiva editorial inclinada a -1.6°.
 *
 * En MODO OSCURO (Noche): fondo #F4EEE3, texto #05030A.
 * En MODO CLARO (Día): fondo #1F1433, texto #F7F1E4.
 *
 * Desplazamiento horizontal continuo en bucle con texto en mayúsculas
 * "NUEVA COLECCIÓN • MODA LOCAL BOGOTÁ".
 */
export function MarqueeTape({ className = '' }: MarqueeTapeProps) {
  const { theme } = useTheme()
  const isDark = theme === 'oscuro' || theme === 'daltonico'

  const message = 'NUEVA COLECCIÓN • MODA LOCAL BOGOTÁ • '
  const repeated = Array(8).fill(message).join('')

  return (
    <div
      className={`sr-marquee-tape-wrapper overflow-hidden py-2 my-4 shadow-lg select-none transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: isDark ? '#F4EEE3' : '#1F1433',
        color: isDark ? '#05030A' : '#F7F1E4',
      }}
      aria-label="Cinta editorial: Nueva colección, moda local Bogotá"
    >
      <div className="sr-marquee-track text-xs sm:text-sm font-black tracking-[0.25em] uppercase whitespace-nowrap">
        <span>{repeated}</span>
        <span aria-hidden="true">{repeated}</span>
      </div>
    </div>
  )
}
