import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[.04] p-5 backdrop-blur ${className}`} {...props} />
}
