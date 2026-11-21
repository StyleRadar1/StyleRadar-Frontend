import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primario' | 'secundario' | 'arena' | 'morado-suave'

const styles: Record<Variant, string> = {
  primario:
    'bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] text-white border border-white/25 shadow-[0_4px_20px_-2px_rgba(139,92,246,0.45)] hover:from-[#9D6EFC] hover:via-[#8B5CF6] hover:to-[#7C3AED] hover:shadow-[0_6px_25px_-2px_rgba(139,92,246,0.6)] hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-md',
  secundario:
    'bg-[#8B5CF6]/10 text-[var(--sr-text-primary,#ffffff)] border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/20 hover:border-[#8B5CF6]/55 shadow-sm backdrop-blur-md',
  arena:
    'bg-[#8B5CF6]/15 text-[var(--sr-text-primary,#ffffff)] border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/25 hover:border-[#8B5CF6]/50 shadow-sm backdrop-blur-md',
  'morado-suave':
    'bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] text-white border border-white/30 shadow-[0_4px_18px_-2px_rgba(167,139,250,0.45)] hover:from-[#B49BFB] hover:to-[#9D6EFC] hover:shadow-[0_6px_24px_-2px_rgba(167,139,250,0.6)]',
}

export function Button({
  variant = 'primario',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}
