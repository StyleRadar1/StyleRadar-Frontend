import type { ReactNode } from 'react'

export type StatusType =
  | 'disponible'
  | 'pocas_unidades'
  | 'agotado'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'

interface StatusBadgeProps {
  status: StatusType
  label?: string
  children?: ReactNode
  className?: string
  size?: 'sm' | 'md'
}

const STATUS_CONFIG: Record<
  StatusType,
  {
    defaultLabel: string
    icon: (cls: string) => ReactNode
    bgVar: string
    textVar: string
    borderVar: string
  }
> = {
  disponible: {
    defaultLabel: 'Disponible',
    icon: (cls) => (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
    bgVar: 'var(--color-success-bg, rgba(30, 107, 58, 0.12))',
    textVar: 'var(--color-success-text, #144a27)',
    borderVar: 'var(--color-success, #1e6b3a)',
  },
  success: {
    defaultLabel: 'Completado',
    icon: (cls) => (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
    bgVar: 'var(--color-success-bg, rgba(30, 107, 58, 0.12))',
    textVar: 'var(--color-success-text, #144a27)',
    borderVar: 'var(--color-success, #1e6b3a)',
  },
  pocas_unidades: {
    defaultLabel: 'Pocas unidades',
    icon: (cls) => (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
    bgVar: 'var(--color-warning-bg, rgba(138, 88, 0, 0.12))',
    textVar: 'var(--color-warning-text, #5c3b00)',
    borderVar: 'var(--color-warning, #8a5800)',
  },
  warning: {
    defaultLabel: 'Atención',
    icon: (cls) => (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
    bgVar: 'var(--color-warning-bg, rgba(138, 88, 0, 0.12))',
    textVar: 'var(--color-warning-text, #5c3b00)',
    borderVar: 'var(--color-warning, #8a5800)',
  },
  agotado: {
    defaultLabel: 'Agotado',
    icon: (cls) => (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>
    ),
    bgVar: 'var(--color-danger-bg, rgba(179, 29, 29, 0.12))',
    textVar: 'var(--color-danger-text, #7a1212)',
    borderVar: 'var(--color-danger, #b31d1d)',
  },
  danger: {
    defaultLabel: 'Error',
    icon: (cls) => (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>
    ),
    bgVar: 'var(--color-danger-bg, rgba(179, 29, 29, 0.12))',
    textVar: 'var(--color-danger-text, #7a1212)',
    borderVar: 'var(--color-danger, #b31d1d)',
  },
  info: {
    defaultLabel: 'Información',
    icon: (cls) => (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={cls}>
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    bgVar: 'var(--color-info-bg, rgba(0, 102, 153, 0.12))',
    textVar: 'var(--color-info-text, #004466)',
    borderVar: 'var(--color-info, #006699)',
  },
}

/**
 * Píldora de estado accesible (WCAG 1.4.1: No usar únicamente color para transmitir significado).
 * Siempre acompaña el color con un icono explícito y texto descriptivo.
 */
export function StatusBadge({
  status,
  label,
  children,
  className = '',
  size = 'md',
}: StatusBadgeProps) {
  const conf = STATUS_CONFIG[status] ?? STATUS_CONFIG.info
  const content = children ?? label ?? conf.defaultLabel
  const isSm = size === 'sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${
        isSm ? 'px-2 py-0.5 text-[0.625rem]' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      style={{
        backgroundColor: conf.bgVar,
        color: conf.textVar,
        borderColor: `color-mix(in srgb, ${conf.borderVar} 35%, transparent)`,
      }}
    >
      {conf.icon(isSm ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0')}
      <span>{content}</span>
    </span>
  )
}
