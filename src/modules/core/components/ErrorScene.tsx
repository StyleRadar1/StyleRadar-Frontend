import { motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, Clock, Lock, RefreshCw, SearchX, ServerOff } from 'lucide-react'
import type { ReactNode } from 'react'

export type SceneVariant = 'perchero' | 'tornamesa' | 'etiqueta' | 'maniqui'
export type ErrorTone = 'bad' | 'warn' | 'info' | 'ok'

const TONE_VAR: Record<ErrorTone, string> = {
  bad: 'var(--sr-bad)',
  warn: 'var(--sr-warn)',
  info: 'var(--sr-acc-tx)',
  ok: 'var(--sr-ok)',
}

const SCENE_META: Record<SceneVariant, { tl: string; tr: string; label: string }> = {
  perchero: { tl: 'StyleRadar · Perchero', tr: 'Sin prenda', label: 'Perchero con un gancho vacío' },
  tornamesa: { tl: 'StyleRadar · Tornamesa', tr: 'Sin señal', label: 'Tornamesa detenida por falla del servicio' },
  etiqueta: { tl: 'StyleRadar · Etiqueta', tr: '00:00', label: 'Etiqueta de prenda con reloj en cero' },
  maniqui: { tl: 'StyleRadar · Maniquí', tr: 'Espera', label: 'Maniquí esperando disponibilidad' },
}

function PercheroArt({ reduced }: { reduced: boolean }) {
  return (
    <svg viewBox="0 0 260 190" className="h-44 w-full max-w-[260px]" aria-hidden="true">
      <line x1="34" y1="30" x2="226" y2="30" stroke="var(--sr-tx-2)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="30" x2="42" y2="165" stroke="var(--sr-tx-2)" strokeOpacity="0.6" strokeWidth="2" />
      <line x1="218" y1="30" x2="218" y2="165" stroke="var(--sr-tx-2)" strokeOpacity="0.6" strokeWidth="2" />
      <line x1="28" y1="165" x2="56" y2="165" stroke="var(--sr-tx-2)" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
      <line x1="204" y1="165" x2="232" y2="165" stroke="var(--sr-tx-2)" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />

      {/* Gancho izquierdo con prenda */}
      <g>
        <path d="M74 30 C74 22 82 22 82 30 L82 40 L60 54 L104 54 L82 40" fill="none" stroke="var(--sr-tx-2)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M62 54 L53 68 L61 73 L66 66 L66 132 L98 132 L98 66 L103 73 L111 68 L102 54 Z" fill="var(--sr-bg-2)" stroke="var(--sr-tx-2)" strokeOpacity="0.7" strokeWidth="1.4" strokeLinejoin="round" />
      </g>

      {/* Gancho central vacío (oscila suavemente) */}
      <motion.g
        style={{ transformOrigin: '130px 30px' }}
        animate={reduced ? undefined : { rotate: [-4, 4, -3, 2, 0] }}
        transition={reduced ? undefined : { duration: 3.4, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
      >
        <path d="M130 30 C130 20 140 20 140 30 L130 42 L106 58 L154 58 L130 42" fill="none" stroke="var(--sr-warn)" strokeWidth="2" strokeLinejoin="round" />
        <line x1="120" y1="68" x2="114" y2="75" stroke="var(--sr-warn)" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="140" y1="68" x2="146" y2="75" stroke="var(--sr-warn)" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" />
      </motion.g>

      {/* Gancho derecho con prenda */}
      <g>
        <path d="M178 30 C178 22 186 22 186 30 L182 40 L162 54 L202 54 L182 40" fill="none" stroke="var(--sr-tx-2)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M166 54 L162 128 L202 128 L198 54 Z" fill="var(--sr-bg-2)" stroke="var(--sr-tx-2)" strokeOpacity="0.7" strokeWidth="1.4" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

function TornamesaArt({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative flex h-44 w-56 items-center justify-center rounded-2xl border border-white/15 bg-black/25 p-3" aria-hidden="true">
      <div className="relative h-32 w-32 rounded-full border border-white/15 bg-grafito p-1.5 shadow-lg">
        <motion.img
          src="/img/vinyl-record.png"
          alt=""
          className="h-full w-full rounded-full object-cover opacity-85"
          animate={reduced ? undefined : { rotate: [0, 90, 125, 132] }}
          transition={reduced ? undefined : { duration: 2.2, ease: 'easeOut' }}
        />
      </div>
      {/* Brazo de la tornamesa levantado */}
      <motion.svg
        viewBox="0 0 60 120"
        className="pointer-events-none absolute right-2 top-2 h-28 w-14 origin-top-right"
        animate={reduced ? { rotate: -18 } : { rotate: [0, -18] }}
        transition={reduced ? undefined : { duration: 1.2, delay: 0.6, ease: 'easeOut' }}
      >
        <circle cx="46" cy="14" r="9" fill="var(--sr-bg-2)" stroke="var(--sr-tx-2)" strokeWidth="2" />
        <path d="M46 14 L40 82 L22 108" fill="none" stroke="var(--sr-tx-2)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="12" y="102" width="16" height="9" rx="2" transform="rotate(-25 20 106)" fill="var(--sr-bad)" />
      </motion.svg>
      <span className="absolute bottom-2.5 left-3 flex items-center gap-1.5 font-mono text-[10px] text-[var(--sr-bad)]">
        <span className="h-2 w-2 rounded-full bg-[var(--sr-bad)]" />
        0 rpm
      </span>
    </div>
  )
}

function EtiquetaArt({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 180 200"
      className="h-44 w-40"
      style={{ transformOrigin: '90px 8px' }}
      animate={reduced ? undefined : { rotate: [-2.5, 2.5, -2.5] }}
      transition={reduced ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <circle cx="90" cy="12" r="4" fill="var(--color-arena)" />
      <path d="M90 14 C88 28 92 40 90 52" fill="none" stroke="var(--color-arena)" strokeWidth="2" />
      <path
        d="M54 52 L126 52 L148 76 L148 182 Q148 190 140 190 L40 190 Q32 190 32 182 L32 76 Z"
        fill="var(--sr-bg-2)"
        stroke="var(--color-arena)"
        strokeOpacity="0.6"
        strokeWidth="1.5"
      />
      <circle cx="90" cy="68" r="6" fill="var(--sr-bg)" stroke="var(--color-arena)" strokeOpacity="0.6" strokeWidth="1.5" />
      <text x="90" y="92" textAnchor="middle" fill="var(--sr-tx-2)" fontSize="9" letterSpacing="2">
        STYLERADAR
      </text>
      <circle cx="90" cy="128" r="24" fill="none" stroke="var(--sr-acc-tx)" strokeWidth="2.2" />
      <motion.line
        x1="90"
        y1="128"
        x2="90"
        y2="111"
        stroke="var(--sr-acc-tx)"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ transformOrigin: '90px 128px' }}
        animate={reduced ? undefined : { rotate: [0, 360] }}
        transition={reduced ? undefined : { duration: 1.4, ease: 'easeOut' }}
      />
      <circle cx="90" cy="128" r="3" fill="var(--sr-acc-tx)" />
      <text x="90" y="174" textAnchor="middle" fill="var(--sr-tx)" fontSize="12" fontWeight="700">
        00:00
      </text>
    </motion.svg>
  )
}

function ManiquiArt({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative flex h-44 w-44 items-center justify-center rounded-2xl border border-white/15 bg-black/25 p-3" aria-hidden="true">
      <motion.img
        src="/prototipo/assets/img/general/maniqui.png"
        alt=""
        className="h-36 w-auto object-contain opacity-90"
        animate={reduced ? undefined : { opacity: [0.8, 1, 0.8] }}
        transition={reduced ? undefined : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/** Escena visual animada para errores principales (404 perchero, 503 tornamesa, 401 etiqueta, 429 maniquí). */
export function ErrorScene({ variant }: { variant: SceneVariant }) {
  const reduced = !!useReducedMotion()
  const meta = SCENE_META[variant]
  return (
    <div
      role="img"
      aria-label={meta.label}
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20 px-4 py-6"
    >
      <span className="absolute left-3 top-2.5 text-[10px] font-semibold uppercase tracking-[.14em] text-white/50">
        {meta.tl}
      </span>
      <span className="absolute right-3 top-2.5 text-[10px] font-semibold uppercase tracking-[.14em] text-white/50">
        {meta.tr}
      </span>
      <div className="mt-3">
        {variant === 'perchero' && <PercheroArt reduced={reduced} />}
        {variant === 'tornamesa' && <TornamesaArt reduced={reduced} />}
        {variant === 'etiqueta' && <EtiquetaArt reduced={reduced} />}
        {variant === 'maniqui' && <ManiquiArt reduced={reduced} />}
      </div>
    </div>
  )
}

function toneIcon(tone: ErrorTone, code?: string) {
  if (code === '403') return <Lock className="h-3.5 w-3.5" aria-hidden="true" />
  if (code === '401') return <Clock className="h-3.5 w-3.5" aria-hidden="true" />
  if (code === '404') return <SearchX className="h-3.5 w-3.5" aria-hidden="true" />
  if (code === '409') return <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
  if (code === '503' || code === '504' || code === '500') return <ServerOff className="h-3.5 w-3.5" aria-hidden="true" />
  if (tone === 'warn' || tone === 'bad') return <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
  return <Clock className="h-3.5 w-3.5" aria-hidden="true" />
}

/** Tarjeta completa con escena animada + chip (ícono y texto) + código + mensaje + acciones. */
export function ErrorCard({
  variant,
  tone = 'bad',
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
  const color = TONE_VAR[tone]
  return (
    <div
      role="alert"
      className="grid gap-6 rounded-2xl border border-white/15 bg-grafito/70 p-6 md:grid-cols-[1.05fr_1fr] md:items-center"
    >
      <div className="flex flex-col items-start">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[.12em]"
          style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
        >
          {toneIcon(tone, code)}
          <span>{chip}</span>
        </span>
        {code && (
          <p className="mt-3 text-4xl font-extrabold tracking-tight" style={{ color }}>
            {code}
          </p>
        )}
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-blanco">{title}</h2>
        <p className="mt-2 text-sm text-white/75">{description}</p>
        {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
      </div>
      <ErrorScene variant={variant} />
    </div>
  )
}
