import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`sr-glass-card rounded-2xl border text-[var(--sr-text-primary,var(--color-text))] p-5 transition-all duration-200 ${className}`}
      {...props}
    />
  )
}
