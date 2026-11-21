import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] text-[var(--sr-text-primary,var(--color-text))] p-5 backdrop-blur-xl shadow-lg transition-all duration-200 ${className}`}
      {...props}
    />
  )
}
