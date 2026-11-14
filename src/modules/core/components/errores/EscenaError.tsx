import type { ReactNode } from 'react'
import { useCuentaRegresiva } from './hooks'
import './errores.css'
import { Etiqueta, Maniqui, Perchero, Radar, Tornamesa } from './Escenas'

export type Escena = 'perchero' | 'tornamesa' | 'maniqui' | 'etiqueta' | 'radar'

/** Color de acento de cada escena (paleta del líder). */
const ACENTO: Record<Escena, string> = {
  perchero: 'var(--sr-e404)',
  tornamesa: 'var(--sr-e500)',
  maniqui: 'var(--sr-e403)',
  etiqueta: 'var(--sr-enet)',
  radar: 'var(--sr-info)',
}

type Props = {
  escena: Escena
  /** Código del plan (404, 503, 429, 401…). Si el plan no le pone número, se deja vacío. */
  codigo?: string
  /** Texto corto del chip, por ejemplo «No encontrada». */
  etiqueta: string
  titulo: string
  texto: ReactNode
  /** Botones. Si es una función recibe los segundos que faltan (para el 429). */
  acciones?: ReactNode | ((restante: number) => ReactNode)
  /** Solo para el maniquí (429): segundos de espera. */
  segundos?: number
  /** Para la tornamesa: súbelo en cada Reintentar y la animación vuelve a empezar. */
  intento?: number
  /** h1 cuando la escena es toda la página; h2 si va dentro de otra. */
  nivel?: 'h1' | 'h2'
  /** Texto para lectores de pantalla que describe la animación. */
  descripcion?: string
  /** Escena más grande, para cuando el error ocupa toda la página (404, sin acceso, sin conexión). */
  grande?: boolean
}

/**
 * Pantalla de error con escena animada a la izquierda y el mensaje a la derecha.
 * El código va arriba a la derecha de la escena, en tamaño mediano, sin tapar la animación.
 */
export function EscenaError({ escena, codigo, etiqueta, titulo, texto, acciones, segundos, intento = 0, nivel = 'h2', descripcion, grande = false }: Props) {
  const restante = useCuentaRegresiva(segundos)
  const Titulo = nivel
  const k = ACENTO[escena]
  return (
    <section
      className={`mx-auto grid w-full items-center px-4 py-10 ${grande ? 'max-w-7xl gap-10 md:grid-cols-[1.6fr_1fr]' : 'max-w-5xl gap-7 md:grid-cols-[1.2fr_1fr]'}`}
      data-tamano={grande ? 'grande' : 'normal'}
      style={{ ['--k' as string]: k }}>
      <div
        role="img"
        aria-label={descripcion ?? `Ilustración: ${etiqueta}`}
        className="sr-escena relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--sr-tx)_8%,transparent)]"
      >
        {escena === 'perchero' && <Perchero />}
        {escena === 'tornamesa' && <Tornamesa intento={intento} />}
        {escena === 'maniqui' && <Maniqui restante={restante} total={segundos ?? 0} />}
        {escena === 'etiqueta' && <Etiqueta />}
        {escena === 'radar' && <Radar />}
        {codigo && (
          <span className="absolute right-[4.5%] top-[3.5%] grid justify-items-end gap-1 font-mono font-extrabold leading-[.9] tracking-tight text-[var(--k)] [font-size:clamp(28px,6vw,56px)]" data-testid="codigo-error">
            <small className="text-[9px] font-bold uppercase tracking-[.18em] text-[var(--sr-tx-2)]">código</small>
            {codigo}
          </span>
        )}
      </div>
      <div className="grid content-start gap-4">
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--k)]">
          <i aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--k)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--k)_22%,transparent)]" />
          {etiqueta}
        </span>
        <Titulo className={`font-extrabold leading-tight text-[var(--sr-tx)] ${grande ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}>{titulo}</Titulo>
        <div className={`max-w-[46ch] leading-relaxed text-[var(--sr-tx-2)] ${grande ? 'text-base' : 'text-sm'}`}>{texto}</div>
        {acciones && <div className="flex flex-wrap gap-2">{typeof acciones === 'function' ? acciones(restante) : acciones}</div>}
      </div>
    </section>
  )
}
