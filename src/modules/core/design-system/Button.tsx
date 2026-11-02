import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primario' | 'secundario' | 'arena'

const styles: Record<Variant, string> = {
  primario: 'bg-violeta text-blanco hover:bg-[#5a16c0] shadow-[0_6px_18px_rgba(72,17,154,.35)]',
  secundario: 'bg-white/5 text-blanco border border-white/20 hover:bg-white/10',
  arena: 'bg-arena text-grafito hover:bg-[#efe5d8]',
}

export function Button({ variant = 'primario', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}
