import type { ReactNode } from 'react'
import { EscenaError } from './errores/EscenaError'
import { Etiqueta, Maniqui, Perchero, Tornamesa } from './errores/Escenas'
import './errores/errores.css'

export type SceneVariant = 'perchero' | 'tornamesa' | 'etiqueta' | 'maniqui'
export type ErrorTone = 'bad' | 'warn' | 'info' | 'ok'

const ACENTO: Record<SceneVariant, string> = {
  perchero: 'var(--sr-e404)',
  tornamesa: 'var(--sr-e500)',
  maniqui: 'var(--sr-e403)',
  etiqueta: 'var(--sr-enet)',
}

const SCENE_META: Record<SceneVariant, { label: string }> = {
  perchero: { label: 'Perchero con las perchas vacías meciéndose' },
  tornamesa: { label: 'Tornamesa detenida por falla del servicio' },
  etiqueta: { label: 'Etiqueta de prenda con reloj en cero' },
  maniqui: { label: 'Maniquí esperando disponibilidad' },
}

/** Escena visual animada grande para errores principales (404 perchero, 503 tornamesa, 401 etiqueta, 429 maniquí). */
export function ErrorScene({ variant }: { variant: SceneVariant }) {
  const meta = SCENE_META[variant]
  return (
    <div
      role="img"
      aria-label={meta.label}
      className="sr-escena relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--sr-tx)_8%,transparent)]"
      style={{ ['--k' as string]: ACENTO[variant] }}
    >
      {variant === 'perchero' && <Perchero />}
      {variant === 'tornamesa' && <Tornamesa />}
      {variant === 'etiqueta' && <Etiqueta />}
      {variant === 'maniqui' && <Maniqui restante={30} total={30} />}
    </div>
  )
}

/** Tarjeta completa con la escena grande animada + código + mensaje + acciones. */
export function ErrorCard({
  variant,
  chip,
  code,
  title,
  description,
  actions,
}: {
  variant: SceneVariant
  tone?: ErrorTone
  chip: string
  code?: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div role="alert" className="rounded-2xl border border-white/15 bg-grafito/70">
      <EscenaError
        escena={variant}
        codigo={code}
        etiqueta={chip}
        titulo={title}
        texto={description}
        descripcion={SCENE_META[variant].label}
        acciones={actions}
      />
    </div>
  )
}