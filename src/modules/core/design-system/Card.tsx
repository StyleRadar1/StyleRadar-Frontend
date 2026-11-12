import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] p-5 backdrop-blur ${className}`} {...props} />
}
