import type { ReactNode } from 'react'

export function Badge({ children, tone = 'violeta' }: { children: ReactNode; tone?: 'violeta' | 'arena' | 'lavanda' }) {
  const t = { violeta: 'bg-violeta text-blanco', arena: 'bg-arena text-grafito', lavanda: 'bg-lavanda text-grafito' }[tone]
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[.16em] ${t}`}>{children}</span>
}
